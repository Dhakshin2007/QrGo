import { createClient } from '@supabase/supabase-js';
import { BookingStatus } from '../types';


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
  transactionId: string | null;
  paymentProof: string | null;
  pin: string;
  status: BookingStatus;
  checkedIn: boolean;
  createdAt: string;
};

// New types for the `free_bookings` table
export type DbFreeBooking = {
  id: string;
  eventId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  entryNumber: string | null;
  pin: string;
  status: BookingStatus;
  checkedIn: boolean;
  createdAt: string;
};


// FIX: Removed intermediate type aliases and defined Insert/Update types directly
// in the interface. This ensures the Supabase client correctly infers the types for
// its methods (select, insert, update), fixing numerous downstream errors.
export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: DbBooking;
        Insert: DbBooking;
        Update: Partial<DbBooking>;
      };
      free_bookings: {
        Row: DbFreeBooking;
        Insert: DbFreeBooking;
        Update: Partial<DbFreeBooking>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}


export const supabase = createClient<Database>(supabaseUrl, supabaseKey);