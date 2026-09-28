import { Event, Booking, BookingStatus } from '../types';
import { supabase, DbBooking, DbFreeBooking, DbSeatReservation } from './supabaseClient';
import { EVENTS } from '../constants';

// --- Hybrid Event Loader ---
const getEvents = async (): Promise<Event[]> => {
  try {
    const { data: dbEvents, error } = await supabase.from('events').select('*');
    if (!error && dbEvents && dbEvents.length > 0) {
      const formattedDbEvents: Event[] = dbEvents.map(e => ({
        ...e,
        venueMapLink: e.venueMapLink || undefined,
        price: e.price ?? undefined,
        remarks: e.remarks || undefined,
        upiId: e.upiId || undefined,
        upiLink: e.upiLink || undefined,
        qrCodeImage: e.qrCodeImage || undefined,
        allowedEmailDomain: e.allowedEmailDomain || undefined,
        seatingConfig: e.seatingConfig || undefined,
      }));
      const dbEventIds = new Set(formattedDbEvents.map(e => e.id));
      const fallbackEvents = EVENTS.filter(e => !dbEventIds.has(e.id));
      return [...formattedDbEvents, ...fallbackEvents];
    }
  } catch (err) {
    console.warn('Could not load events from Supabase, using local constants:', err);
  }
  return Promise.resolve(EVENTS);
};

const getEventById = async (id: string): Promise<Event | undefined> => {
  try {
    const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
    if (!error && data) {
      return {
        ...data,
        venueMapLink: data.venueMapLink || undefined,
        price: data.price ?? undefined,
        remarks: data.remarks || undefined,
        upiId: data.upiId || undefined,
        upiLink: data.upiLink || undefined,
        qrCodeImage: data.qrCodeImage || undefined,
        allowedEmailDomain: data.allowedEmailDomain || undefined,
        seatingConfig: data.seatingConfig || undefined,
      };
    }
  } catch (err) {
    console.warn('Could not fetch event from Supabase, falling back to local constants:', err);
  }
  return Promise.resolve(EVENTS.find(e => e.id === id));
};

// --- Booking Management Logic ---

const getAllBookings = async (): Promise<Booking[]> => {
  const [paidRes, freeRes, seatRes] = await Promise.all([
    supabase.from('bookings').select('*'),
    supabase.from('free_bookings').select('*'),
    supabase.from('seat_reservations').select('bookingId, seatId').neq('status', BookingStatus.Rejected),
  ]);

  if (paidRes.error) {
    if (paidRes.error.message.includes('security policy')) throw new Error('Failed to load bookings due to database security rules on bookings table.');
    throw new Error('Failed to load paid bookings. ' + paidRes.error.message);
  }
  if (freeRes.error) {
    if (freeRes.error.message.includes('security policy')) throw new Error('Failed to load bookings due to database security rules on free_bookings table.');
    throw new Error('Failed to load free bookings. ' + freeRes.error.message);
  }

  // Map reservations by bookingId
  const seatsByBooking = new Map<string, string[]>();
  if (seatRes.data) {
    for (const item of seatRes.data) {
      const list = seatsByBooking.get(item.bookingId) || [];
      list.push(item.seatId);
      seatsByBooking.set(item.bookingId, list);
    }
  }

  const formattedPaidBookings: Booking[] = (paidRes.data || []).map(b => {
    const seats = seatsByBooking.get(b.id);
    return {
      ...b,
      entryNumber: null,
      selectedSeats: seats && seats.length > 0 ? JSON.stringify(seats) : null,
    };
  });

  const formattedFreeBookings: Booking[] = (freeRes.data || []).map(b => {
    const seats = seatsByBooking.get(b.id);
    return {
      ...b,
      transactionId: null,
      paymentProof: null,
      selectedSeats: seats && seats.length > 0 ? JSON.stringify(seats) : null,
    };
  });

  return [...formattedPaidBookings, ...formattedFreeBookings];
};

// --- Real-time Seat Occupancy ---
// Queries the dedicated `seat_reservations` table (which has database-level unique locking).
const getSeatOccupancy = async (eventId: string): Promise<Map<string, BookingStatus>> => {
  const occupancy = new Map<string, BookingStatus>();

  try {
    const { data: reservations, error } = await supabase
      .from('seat_reservations')
      .select('seatId, status')
      .eq('eventId', eventId)
      .neq('status', BookingStatus.Rejected);

    if (!error && reservations) {
      for (const res of reservations) {
        if (!occupancy.has(res.seatId) || occupancy.get(res.seatId) !== BookingStatus.Confirmed) {
          occupancy.set(res.seatId, res.status as BookingStatus);
        }
      }
    }
  } catch (err) {
    console.warn('Could not query seat_reservations:', err);
  }

  return occupancy;
};

const addBooking = async (
  bookingData: Omit<Booking, 'id' | 'status' | 'checkedIn' | 'createdAt' | 'paymentProof'>,
  paymentProofFile: File | null
): Promise<Booking> => {
  const event = await getEventById(bookingData.eventId);
  if (!event) throw new Error('Event with ID ' + bookingData.eventId + ' not found.');
  const isPaidEvent = !!event.upiId;
  const lowerCaseEmail = bookingData.userEmail.toLowerCase().trim();

  // ── SEAT MAP ANTI-COLLISION & RACE-CONDITION LOCK ──────────────────────────
  let seatIdsToReserve: string[] = [];
  if (bookingData.selectedSeats) {
    try {
      seatIdsToReserve = JSON.parse(bookingData.selectedSeats);
    } catch {
      seatIdsToReserve = [];
    }
  }

  const newBookingId = isPaidEvent
    ? 'paid-booking-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    : 'free-booking-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  let insertedReservationIds: string[] = [];

  if (seatIdsToReserve.length > 0) {
    // 1. Check if any of these seats are already reserved
    const { data: existingReservations } = await supabase
      .from('seat_reservations')
      .select('seatId')
      .eq('eventId', bookingData.eventId)
      .in('seatId', seatIdsToReserve)
      .neq('status', BookingStatus.Rejected);

    if (existingReservations && existingReservations.length > 0) {
      const taken = existingReservations.map(r => r.seatId).join(', ');
      throw new Error(`Seat(s) ${taken} have already been reserved by another user. Please select other seats.`);
    }

    // 2. Insert reservations into dedicated seat_reservations table
    const reservationRows = seatIdsToReserve.map(seatId => ({
      id: `res-${bookingData.eventId}-${seatId}-${Date.now()}`,
      eventId: bookingData.eventId,
      seatId: seatId,
      bookingId: newBookingId,
      userEmail: lowerCaseEmail,
      status: isPaidEvent ? BookingStatus.Pending : BookingStatus.Confirmed,
      createdAt: new Date().toISOString(),
    }));

    const { data: inserted, error: resError } = await supabase
      .from('seat_reservations')
      .insert(reservationRows)
      .select();

    if (resError) {
      if (resError.code === '23505' || resError.message.includes('unique')) {
        throw new Error('One or more of your selected seats were just taken by another user. Please choose different seats.');
      }
      console.warn('seat_reservations insert warning:', resError.message);
    } else if (inserted) {
      insertedReservationIds = inserted.map(r => r.id);
    }
  }

  const rollbackSeatReservations = async () => {
    if (insertedReservationIds.length > 0) {
      await supabase.from('seat_reservations').delete().in('id', insertedReservationIds);
    }
  };

  if (isPaidEvent) {
    if (!paymentProofFile) {
      await rollbackSeatReservations();
      throw new Error('Payment proof is required for paid events.');
    }
    let paymentProofUrl: string | null = null;

    if (bookingData.transactionId && bookingData.transactionId.trim()) {
      const { data: existingTxn, error: findError } = await supabase.from('bookings').select('id').eq('transactionId', bookingData.transactionId.trim()).single();
      if (findError && findError.code !== 'PGRST116') {
        await rollbackSeatReservations();
        throw new Error('Could not verify transaction ID. Please try again.');
      }
      if (existingTxn) {
        await rollbackSeatReservations();
        throw new Error('This Transaction ID has already been used.');
      }
    }

    const { data: existingEmail1, error: emailCheck1 } = await supabase.from('bookings').select('id').eq('eventId', bookingData.eventId).eq('userEmail', lowerCaseEmail).single();
    if (emailCheck1 && emailCheck1.code !== 'PGRST116') {
      await rollbackSeatReservations();
      throw new Error('Could not verify your booking details. Please try again.');
    }
    if (existingEmail1) {
      await rollbackSeatReservations();
      throw new Error('This email address has already been used to book this event.');
    }

    const filePath = 'public/' + Date.now() + '-' + paymentProofFile.name;
    const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(filePath, paymentProofFile);
    if (uploadError) {
      await rollbackSeatReservations();
      if (uploadError.message.includes('security policy')) throw new Error('Upload failed: security policy denied. Check payment-proofs bucket RLS policies.');
      throw new Error('Failed to upload payment proof. ' + uploadError.message);
    }
    const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(filePath);
    if (!urlData?.publicUrl) {
      await rollbackSeatReservations();
      throw new Error('Could not get public URL for the uploaded file.');
    }
    paymentProofUrl = urlData.publicUrl;

    // NOTE: bookings table is NOT modified — selectedSeats is NOT sent here
    const newPaidPayload: DbBooking = {
      id: newBookingId,
      eventId: bookingData.eventId, userName: bookingData.userName, userEmail: lowerCaseEmail,
      userPhone: bookingData.userPhone, transactionId: bookingData.transactionId || null,
      pin: bookingData.pin, paymentProof: paymentProofUrl, status: BookingStatus.Pending,
      checkedIn: false, createdAt: new Date().toISOString(),
    };
    const { data: newBooking, error: insertError } = await supabase.from('bookings').insert(newPaidPayload).select().single();
    if (insertError) {
      await rollbackSeatReservations();
      if (insertError.message.includes('security policy')) throw new Error('Booking failed: security policy denied on bookings table.');
      throw new Error('Could not submit your booking. ' + insertError.message);
    }
    if (!newBooking) {
      await rollbackSeatReservations();
      throw new Error('Paid booking could not be created in the database.');
    }
    return { ...newBooking, entryNumber: null, selectedSeats: bookingData.selectedSeats ?? null };
  } else {
    const { data: existingEmail2, error: emailCheck2 } = await supabase.from('free_bookings').select('id').eq('eventId', bookingData.eventId).eq('userEmail', lowerCaseEmail).single();
    if (emailCheck2 && emailCheck2.code !== 'PGRST116') {
      await rollbackSeatReservations();
      throw new Error('Could not verify your booking details. Please try again.');
    }
    if (existingEmail2) {
      await rollbackSeatReservations();
      throw new Error('This email address has already been used to book this event.');
    }

    // NOTE: free_bookings table is NOT modified — selectedSeats is NOT sent here
    const newFreePayload: DbFreeBooking = {
      id: newBookingId,
      eventId: bookingData.eventId, userName: bookingData.userName, userEmail: lowerCaseEmail,
      userPhone: bookingData.userPhone, entryNumber: bookingData.entryNumber || null,
      pin: bookingData.pin, status: BookingStatus.Confirmed, checkedIn: false,
      createdAt: new Date().toISOString(),
    };
    const { data: newBooking, error: insertError } = await supabase.from('free_bookings').insert(newFreePayload).select().single();
    if (insertError) {
      await rollbackSeatReservations();
      if (insertError.message.includes('security policy')) throw new Error('Booking failed: security policy denied on free_bookings table.');
      throw new Error('Could not submit your booking. ' + insertError.message);
    }
    if (!newBooking) {
      await rollbackSeatReservations();
      throw new Error('Free booking could not be created in the database.');
    }
    return { ...newBooking, transactionId: null, paymentProof: null, selectedSeats: bookingData.selectedSeats ?? null };
  }
};

const findBookingsByEmailAndPin = async (email: string, pin: string): Promise<Booking[]> => {
  const lowerEmail = email.toLowerCase();
  const [paidRes, freeRes, seatRes] = await Promise.all([
    supabase.from('bookings').select('*').eq('userEmail', lowerEmail).eq('pin', pin),
    supabase.from('free_bookings').select('*').eq('userEmail', lowerEmail).eq('pin', pin),
    supabase.from('seat_reservations').select('bookingId, seatId').eq('userEmail', lowerEmail).neq('status', BookingStatus.Rejected),
  ]);

  if (paidRes.error) throw new Error('Failed to search for paid tickets. ' + paidRes.error.message);
  if (freeRes.error) throw new Error('Failed to search for free tickets. ' + freeRes.error.message);

  const seatsByBooking = new Map<string, string[]>();
  if (seatRes.data) {
    for (const item of seatRes.data) {
      const list = seatsByBooking.get(item.bookingId) || [];
      list.push(item.seatId);
      seatsByBooking.set(item.bookingId, list);
    }
  }

  const formattedPaid: Booking[] = (paidRes.data || []).map(b => {
    const seats = seatsByBooking.get(b.id);
    return {
      ...b,
      entryNumber: null,
      selectedSeats: seats && seats.length > 0 ? JSON.stringify(seats) : null,
    };
  });

  const formattedFree: Booking[] = (freeRes.data || []).map(b => {
    const seats = seatsByBooking.get(b.id);
    return {
      ...b,
      transactionId: null,
      paymentProof: null,
      selectedSeats: seats && seats.length > 0 ? JSON.stringify(seats) : null,
    };
  });

  return [...formattedPaid, ...formattedFree];
};

const findBookingById = async (id: string): Promise<Booking | undefined> => {
  let booking: Booking | undefined;
  if (id.startsWith('free-')) {
    const { data, error } = await supabase.from('free_bookings').select('*').eq('id', id).single();
    if (error) { if (error.code === 'PGRST116') return undefined; throw error; }
    if (data) booking = { ...data, transactionId: null, paymentProof: null, selectedSeats: null };
  } else {
    const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();
    if (error) { if (error.code === 'PGRST116') return undefined; throw error; }
    if (data) booking = { ...data, entryNumber: null, selectedSeats: null };
  }

  if (booking) {
    const { data: seatRows } = await supabase
      .from('seat_reservations')
      .select('seatId')
      .eq('bookingId', id)
      .neq('status', BookingStatus.Rejected);
    if (seatRows && seatRows.length > 0) {
      booking.selectedSeats = JSON.stringify(seatRows.map(r => r.seatId));
    }
  }

  return booking;
};

const updateBooking = async (updatedBooking: Booking): Promise<Booking> => {
  const { id } = updatedBooking;

  // Sync seat_reservations status (Confirmed on approve, Rejected on reject which frees seats)
  try {
    await supabase
      .from('seat_reservations')
      .update({ status: updatedBooking.status })
      .eq('bookingId', id);
  } catch (err) {
    console.warn('Could not sync seat_reservations status on updateBooking:', err);
  }

  if (id.startsWith('free-')) {
    const payload: Partial<DbFreeBooking> = {
      eventId: updatedBooking.eventId, userName: updatedBooking.userName, userEmail: updatedBooking.userEmail,
      userPhone: updatedBooking.userPhone, entryNumber: updatedBooking.entryNumber, pin: updatedBooking.pin,
      status: updatedBooking.status, checkedIn: updatedBooking.checkedIn, createdAt: updatedBooking.createdAt,
    };
    const { data, error } = await supabase.from('free_bookings').update(payload).eq('id', id).select().single();
    if (error) {
      if (error.message.includes('security policy')) throw new Error('Update failed: security policy denied on free_bookings table.');
      throw new Error('Could not update booking. ' + error.message);
    }
    if (!data) throw new Error('Booking with ID ' + id + ' not found for update in free_bookings.');
    return { ...data, transactionId: null, paymentProof: null, selectedSeats: updatedBooking.selectedSeats };
  } else {
    const payload: Partial<DbBooking> = {
      eventId: updatedBooking.eventId, userName: updatedBooking.userName, userEmail: updatedBooking.userEmail,
      userPhone: updatedBooking.userPhone, transactionId: updatedBooking.transactionId, paymentProof: updatedBooking.paymentProof,
      pin: updatedBooking.pin, status: updatedBooking.status, checkedIn: updatedBooking.checkedIn,
      createdAt: updatedBooking.createdAt,
    };
    const { data, error } = await supabase.from('bookings').update(payload).eq('id', id).select().single();
    if (error) {
      if (error.message.includes('security policy')) throw new Error('Update failed: security policy denied on bookings table.');
      throw new Error('Could not update booking. ' + error.message);
    }
    if (!data) throw new Error('Booking with ID ' + id + ' not found for update in bookings.');
    return { ...data, entryNumber: null, selectedSeats: updatedBooking.selectedSeats };
  }
};

export const db = {
  getEvents, getEventById, getAllBookings, getSeatOccupancy,
  addBooking, findBookingsByEmailAndPin, findBookingById, updateBooking,
};
