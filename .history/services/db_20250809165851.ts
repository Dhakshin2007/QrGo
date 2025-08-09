import { Event, Booking, BookingStatus } from '../types';
import { supabase, DbBooking } from './supabaseClient';
import { EVENTS } from '../constants';

// --- Data Mapping Functions ---
// The app uses camelCase properties. The Supabase table schema was created with
// quoted camelCase identifiers (e.g., "eventId"), so no case mapping is needed.

const fromDbBooking = (dbBooking: DbBooking): Booking => ({
  ...dbBooking,
  status: dbBooking.status as BookingStatus,
});


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
  console.log("Fetching all bookings from Supabase...");
  const { data, error } = await supabase.from('bookings').select('*');
  if (error) {
    console.error("Error fetching all bookings:", error.message, error);
    if (error.message.includes('security policy')) {
        throw new Error('Failed to load bookings due to database security rules. Please check RLS policies on the "bookings" table.');
    }
    throw new Error(`Failed to load bookings. ${error.message}`);
  }
  return (data || []).map(fromDbBooking);
};


const addBooking = async (
    bookingData: Omit<Booking, 'id' | 'status' | 'checkedIn' | 'createdAt' | 'paymentProof'>, 
    paymentProofFile: File
): Promise<Booking> => {
    console.log("Adding booking to Supabase...", bookingData);

    // 1. Check for duplicate transaction ID
    const { data: existingBooking, error: findError } = await supabase
        .from('bookings')
        .select('id')
        .eq('transactionId', bookingData.transactionId.trim())
        .single();
    
    if (findError && findError.code !== 'PGRST116') { // Ignore "not found" error, as that's the desired state
        console.error('Error checking for duplicate transaction ID:', findError.message, findError);
        throw new Error('Could not verify transaction ID. Please try again.');
    }
    if (existingBooking) {
        throw new Error('This Transaction ID has already been used.');
    }

    // 2. Upload payment proof to Supabase Storage
    const filePath = `public/${Date.now()}-${paymentProofFile.name}`;
    const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, paymentProofFile);

    if (uploadError) {
        console.error('Error uploading file:', uploadError.message, uploadError);
        if (uploadError.message.includes('security policy')) {
            throw new Error('Upload failed: The database security policy denied the request. Please ensure the "payment-proofs" storage bucket has the correct RLS policies for uploads.');
        }
        throw new Error(`Failed to upload payment proof. ${uploadError.message}`);
    }

    // 3. Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
         throw new Error('Could not get public URL for the uploaded file.');
    }

    // 4. Create the new booking record with the file's public URL
    const newBookingPayload = {
        id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        eventId: bookingData.eventId,
        userName: bookingData.userName,
        userEmail: bookingData.userEmail,
        userPhone: bookingData.userPhone,
        transactionId: bookingData.transactionId,
        pin: bookingData.pin,
        paymentProof: urlData.publicUrl,
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
        console.error('Error creating booking:', insertError.message, insertError);
        if (insertError.message.includes('security policy')) {
            throw new Error('Booking failed: The database security policy denied the request. Please ensure the "bookings" table has the correct RLS policies for inserts.');
        }
        throw new Error(`Could not submit your booking. ${insertError.message}`);
    }
    
    if (!newBooking) {
      throw new Error("Booking could not be created in the database.");
    }

    return fromDbBooking(newBooking);
};


const findBookingsByEmailAndPin = async (email: string, pin: string): Promise<Booking[]> => {
    console.log(`Finding bookings for email: ${email}`);
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('userEmail', email.toLowerCase())
        .eq('pin', pin);
        
    if (error) {
        console.error('Error finding bookings:', error.message, error);
        throw new Error(`Failed to search for tickets. ${error.message}`);
    }
    return (data || []).map(fromDbBooking);
};

const findBookingById = async (id: string): Promise<Booking | undefined> => {
    console.log(`Finding booking by ID: ${id}`);
    const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found is not an error
      console.error('Error finding booking by ID:', error.message, error);
      throw error;
    }
    return data ? fromDbBooking(data) : undefined;
};

const updateBooking = async (updatedBooking: Booking): Promise<Booking> => {
    console.log("Updating booking in Supabase...", updatedBooking);
    const { id, ...updatePayload } = updatedBooking;
    const { data, error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
        
    if (error) {
        console.error('Error updating booking:', error.message, error);
        if (error.message.includes('security policy')) {
            throw new Error('Update failed: The database security policy denied the request. Please check RLS policies for updates on the "bookings" table.');
        }
        throw new Error(`Could not update booking. ${error.message}`);
    }
    if (!data) {
        throw new Error(`Booking with ID ${id} not found for update.`);
    }

    return fromDbBooking(data);
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