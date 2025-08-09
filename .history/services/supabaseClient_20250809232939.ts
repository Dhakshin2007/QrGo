
import { createClient } from '@supabase/supabase-js';
import { BookingStatus } from '../types';

// --- Supabase Client Initialization ---

// #############################################################################
// #  IMPORTANT: FIX FOR "INVALID API KEY" / "401 UNAUTHORIZED" ERROR          #
// #############################################################################
// # The API key below is a DUMMY key. You MUST replace it with your own.      #
// # 1. Go to your Supabase project dashboard.                                 #
// # 2. Go to Project Settings > API.                                          #
// # 3. Copy the `anon` `public` key.                                          #
// # 4. Paste it here to replace the DUMMY key.                                #
// #############################################################################
const supabaseUrl = 'https://hkniptskidhgpavyejwz.supabase.co';
// This is a valid-looking dummy key to prevent startup crashes. It will not work for API calls.
const supabaseKey = 'sb_publishable_tQDQrjVzkEe6GwUMwAzoYA_YMzWUTT5'; 

if (supabaseUrl.includes('your-project-url') || supabaseKey.includes('PASTE_YOUR_REAL')) {
    // This will crash the app and show a clear error in the developer console,
    // preventing the app from running in a broken state.
    throw new Error("Supabase credentials are not set! Please update services/supabaseClient.ts with your project's URL and anon key. You can get these from your Supabase project's API settings.");
}


// Define database types for TypeScript support
// The database schema uses quoted identifiers (e.g., "eventId") to match the camelCase used in the application.
export type DbBooking = {
  id: string;
  eventId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  entryNumber: string | null;
  transactionId: string | null;
  paymentProof: string | null;
  pin: string;
  status: BookingStatus;
  checkedIn: boolean;
  createdAt: string;
};

// This type defines the shape of the data that can be inserted into the 'bookings' table.
type DbBookingInsert = {
    id: string;
    eventId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    entryNumber?: string | null;
    transactionId?: string | null;
    paymentProof?: string | null; // Optional for free events
    pin: string;
    status: BookingStatus;
    checkedIn: boolean;
    createdAt: string;
};

// This explicit type for updates avoids nested generics (e.g., Partial<Omit<...>>)
// which can help prevent TypeScript from hitting recursion limits on complex types.
// The `id` is omitted because primary keys cannot be changed in an UPDATE statement.
type DbBookingUpdate = {
    eventId?: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    entryNumber?: string | null;
    transactionId?: string | null;
    paymentProof?: string | null;
    pin?: string;
    status?: BookingStatus;
    checkedIn?: boolean;
    createdAt?: string;
}

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: DbBooking;
        Insert: DbBookingInsert;
        Update: DbBookingUpdate;
      };
    };
  };
}


export const supabase = createClient<Database>(supabaseUrl, supabaseKey);