import { Event, Booking, BookingStatus } from '../types';
import { supabase, DbBookingInsert, DbFreeBookingInsert, DbBookingUpdate, DbFreeBookingUpdate } from './supabaseClient';
import { EVENTS } from '../constants';

// --- Data Mapping Functions ---
// The app uses camelCase properties. The Supabase table schema was created with
// quoted camelCase identifiers (e.g., "eventId"), so no case mapping is needed.
// With DbBooking (in supabaseClient) and Booking (in types.ts) being structurally identical,
// a dedicated mapping function is no longer needed.

// --- Event Functions ---
// Event data is now managed locally for simplicity, speed, and reliability.

const getEvents = async (): Promise<Event[]> => {
  console.log("Fetching events from local constants...");
  // Return local data, simulating an async call for API consistency
  return Promise.resolve(EVENTS);
};

const getEventById = async (id: string): Promise<Event | undefined> => {
  console.log(`Fetching event by ID from local constants: ${id}`);
  const event = EVENTS.find(e => e.id === id);
  // Return local data, simulating an async call for API consistency
  return Promise.resolve(event);
};

// --- Booking Management Logic ---

const getAllBookings = async (): Promise<Booking[]> => {
  console.log("Fetching all bookings from Supabase (paid and free)...");
  
  const { data: paidBookings, error: paidError } = await supabase.from('bookings').select('*');
  if (paidError) {
    console.error("Error fetching paid bookings:", paidError.message, paidError);
    if (paidError.message.includes('security policy')) {
        throw new Error('Failed to load bookings due to database security rules on "bookings" table.');
    }
    throw new Error(`Failed to load paid bookings. ${paidError.message}`);
  }

  const { data: freeBookings, error: freeError } = await supabase.from('free_bookings').select('*');
  if (freeError) {
    console.error("Error fetching free bookings:", freeError.message, freeError);
    if (freeError.message.includes('security policy')) {
        throw new Error('Failed to load bookings due to database security rules on "free_bookings" table.');
    }
    throw new Error(`Failed to load free bookings. ${freeError.message}`);
  }

  const formattedPaidBookings: Booking[] = (paidBookings || []).map(b => ({
      ...b,
      entryNumber: null // Add missing property to conform to Booking type
  }));

  const formattedFreeBookings: Booking[] = (freeBookings || []).map(b => ({
      ...b,
      transactionId: null, // Add missing properties to conform to Booking type
      paymentProof: null
  }));

  return [...formattedPaidBookings, ...formattedFreeBookings];
};


const addBooking = async (
    bookingData: Omit<Booking, 'id' | 'status' | 'checkedIn' | 'createdAt' | 'paymentProof'>, 
    paymentProofFile: File | null
): Promise<Booking> => {
    console.log("Adding booking to Supabase...", bookingData);
    
    const isPaidBooking = !!(paymentProofFile && bookingData.transactionId);
    const lowerCaseEmail = bookingData.userEmail.toLowerCase().trim();

    if (isPaidBooking) {
        // PAID BOOKING LOGIC -> 'bookings' table
        let paymentProofUrl: string | null = null;
        
        // 1. Check for duplicate transaction ID
        const { data: existingTxn, error: findError } = await supabase
            .from('bookings')
            .select('id')
            .eq('transactionId', bookingData.transactionId!.trim())
            .single();
        
        if (findError && findError.code !== 'PGRST116') { // Ignore "not found" error
            console.error('Error checking for duplicate transaction ID:', findError.message, findError);
            throw new Error('Could not verify transaction ID. Please try again.');
        }
        if (existingTxn) {
            throw new Error('This Transaction ID has already been used.');
        }

        // 2. Check for existing booking with the same email for this event
        const { data: existingEmailForEvent, error: emailCheckError } = await supabase
            .from('bookings')
            .select('id')
            .eq('eventId', bookingData.eventId)
            .eq('userEmail', lowerCaseEmail)
            .single();
        
        if (emailCheckError && emailCheckError.code !== 'PGRST116') { // Ignore "not found" error
            console.error('Error checking for duplicate email for event:', emailCheckError.message, emailCheckError);
            throw new Error('Could not verify your booking details. Please try again.');
        }
        if (existingEmailForEvent) {
            throw new Error('This email address has already been used to book this event.');
        }


        // 3. Upload payment proof to Supabase Storage
        const filePath = `public/${Date.now()}-${paymentProofFile!.name}`;
        const { error: uploadError } = await supabase.storage
            .from('payment-proofs')
            .upload(filePath, paymentProofFile!);

        if (uploadError) {
            console.error('Error uploading file:', uploadError.message, uploadError);
            if (uploadError.message.includes('security policy')) {
                throw new Error('Upload failed: The database security policy denied the request. Please ensure the "payment-proofs" storage bucket has the correct RLS policies for uploads.');
            }
            throw new Error(`Failed to upload payment proof. ${uploadError.message}`);
        }

        // 4. Get the public URL for the uploaded file
        const { data: urlData } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(filePath);

        if (!urlData || !urlData.publicUrl) {
             throw new Error('Could not get public URL for the uploaded file.');
        }
        paymentProofUrl = urlData.publicUrl;

        // 5. Create the new paid booking record
        const newBookingPayload: DbBookingInsert = {
            id: `paid-booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            eventId: bookingData.eventId,
            userName: bookingData.userName,
            userEmail: lowerCaseEmail,
            userPhone: bookingData.userPhone,
            transactionId: bookingData.transactionId || null,
            pin: bookingData.pin,
            paymentProof: paymentProofUrl,
            status: BookingStatus.Pending,
            checkedIn: false,
            createdAt: new Date().toISOString(),
        };

        const { data: newBooking, error: insertError } = await supabase
            .from('bookings')
            .insert(newBookingPayload)
            .select()
            .single();
    
        if (insertError) {
            console.error('Error creating paid booking:', insertError.message, insertError);
            if (insertError.message.includes('security policy')) {
                throw new Error('Booking failed: The database security policy denied the request. Please ensure the "bookings" table has the correct RLS policies for inserts.');
            }
            throw new Error(`Could not submit your booking. ${insertError.message}`);
        }
    
        if (!newBooking) {
          throw new Error("Paid booking could not be created in the database.");
        }

        return { ...newBooking, entryNumber: null };
    } else {
        // FREE BOOKING LOGIC -> 'free_bookings' table

        // 1. Check for existing booking with the same email for this event
        const { data: existingEmailForEvent, error: emailCheckError } = await supabase
            .from('free_bookings')
            .select('id')
            .eq('eventId', bookingData.eventId)
            .eq('userEmail', lowerCaseEmail)
            .single();

        if (emailCheckError && emailCheckError.code !== 'PGRST116') { // Ignore "not found" error
            console.error('Error checking for duplicate email for event:', emailCheckError.message, emailCheckError);
            throw new Error('Could not verify your booking details. Please try again.');
        }
        if (existingEmailForEvent) {
            throw new Error('This email address has already been used to book this event.');
        }

        const newBookingPayload: DbFreeBookingInsert = {
            id: `free-booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            eventId: bookingData.eventId,
            userName: bookingData.userName,
            userEmail: lowerCaseEmail,
            userPhone: bookingData.userPhone,
            entryNumber: bookingData.entryNumber || null,
            pin: bookingData.pin,
            status: BookingStatus.Confirmed,
            checkedIn: false,
            createdAt: new Date().toISOString(),
        };

        const { data: newBooking, error: insertError } = await supabase
            .from('free_bookings')
            .insert(newBookingPayload)
            .select()
            .single();
        
        if (insertError) {
            console.error('Error creating free booking:', insertError.message, insertError);
            if (insertError.message.includes('security policy')) {
                throw new Error('Booking failed: The database security policy denied the request. Please ensure the "free_bookings" table has the correct RLS policies for inserts.');
            }
            throw new Error(`Could not submit your booking. ${insertError.message}`);
        }
    
        if (!newBooking) {
            throw new Error("Free booking could not be created in the database.");
        }
        
        return { ...newBooking, transactionId: null, paymentProof: null };
    }
};


const findBookingsByEmailAndPin = async (email: string, pin: string): Promise<Booking[]> => {
    console.log(`Finding bookings for email: ${email}`);
    const lowerEmail = email.toLowerCase();
    
    const { data: paidBookings, error: paidError } = await supabase
        .from('bookings')
        .select('*')
        .eq('userEmail', lowerEmail)
        .eq('pin', pin);
        
    if (paidError) {
        console.error('Error finding paid bookings:', paidError.message, paidError);
        throw new Error(`Failed to search for paid tickets. ${paidError.message}`);
    }

    const { data: freeBookings, error: freeError } = await supabase
        .from('free_bookings')
        .select('*')
        .eq('userEmail', lowerEmail)
        .eq('pin', pin);

    if (freeError) {
        console.error('Error finding free bookings:', freeError.message, freeError);
        throw new Error(`Failed to search for free tickets. ${freeError.message}`);
    }

    const formattedPaidBookings: Booking[] = (paidBookings || []).map(b => ({
        ...b,
        entryNumber: null
    }));

    const formattedFreeBookings: Booking[] = (freeBookings || []).map(b => ({
        ...b,
        transactionId: null,
        paymentProof: null
    }));
    
    return [...formattedPaidBookings, ...formattedFreeBookings];
};

const findBookingById = async (id: string): Promise<Booking | undefined> => {
    console.log(`Finding booking by ID: ${id}`);
    
    if (id.startsWith('free-')) {
        const { data, error } = await supabase.from('free_bookings').select('*').eq('id', id).single();
        if (error) {
            if (error.code === 'PGRST116') return undefined; // Not found is not an error
            console.error('Error finding free booking by ID:', error.message, error);
            throw error;
        }
        if (data) {
            return { ...data, transactionId: null, paymentProof: null };
        }
        return undefined;

    } else { // Assumes paid booking (or legacy if prefix is 'booking-')
        const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();
        if (error) {
            if (error.code === 'PGRST116') return undefined; // Not found is not an error
            console.error('Error finding paid booking by ID:', error.message, error);
            throw error;
        }
        if (data) {
            return { ...data, entryNumber: null };
        }
        return undefined;
    }
};

const updateBooking = async (updatedBooking: Booking): Promise<Booking> => {
    console.log("Updating booking in Supabase...", updatedBooking);
    const { id } = updatedBooking;

    if (id.startsWith('free-')) {
        const freeUpdatePayload: DbFreeBookingUpdate = {
            eventId: updatedBooking.eventId,
            userName: updatedBooking.userName,
            userEmail: updatedBooking.userEmail,
            userPhone: updatedBooking.userPhone,
            entryNumber: updatedBooking.entryNumber,
            pin: updatedBooking.pin,
            status: updatedBooking.status,
            checkedIn: updatedBooking.checkedIn,
            createdAt: updatedBooking.createdAt,
        };

        const { data, error } = await supabase
            .from('free_bookings')
            .update(freeUpdatePayload)
            .eq('id', id)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating free booking:', error.message, error);
            if (error.message.includes('security policy')) {
                throw new Error('Update failed: The database security policy denied the request. Please check RLS policies for updates on the "free_bookings" table.');
            }
            throw new Error(`Could not update booking. ${error.message}`);
        }
        if (!data) {
            throw new Error(`Booking with ID ${id} not found for update in free_bookings.`);
        }
        
        return { ...data, transactionId: null, paymentProof: null };

    } else { // Assumes paid booking
        const paidUpdatePayload: DbBookingUpdate = {
            eventId: updatedBooking.eventId,
            userName: updatedBooking.userName,
            userEmail: updatedBooking.userEmail,
            userPhone: updatedBooking.userPhone,
            transactionId: updatedBooking.transactionId,
            paymentProof: updatedBooking.paymentProof,
            pin: updatedBooking.pin,
            status: updatedBooking.status,
            checkedIn: updatedBooking.checkedIn,
            createdAt: updatedBooking.createdAt,
        };

        const { data, error } = await supabase
            .from('bookings')
            .update(paidUpdatePayload)
            .eq('id', id)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating paid booking:', error.message, error);
            if (error.message.includes('security policy')) {
                throw new Error('Update failed: The database security policy denied the request. Please check RLS policies for updates on the "bookings" table.');
            }
            throw new Error(`Could not update booking. ${error.message}`);
        }
        if (!data) {
            throw new Error(`Booking with ID ${id} not found for update in bookings.`);
        }

        return { ...data, entryNumber: null };
    }
};


export const db = {
  getEvents,
  getEventById,
  getAllBookings,
  addBooking,
  findBookingsByEmailAndPin,
  findBookingById,
  updateBooking,
};