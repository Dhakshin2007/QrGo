import { createClient } from '@supabase/supabase-js';
import { BookingStatus } from '../types';

// --- Supabase Client Initialization ---

// IMPORTANT: Replace with your own Supabase project URL and anon key from your project's API settings.
// It is highly recommended to use environment variables for these in a real-world application.
// const supabaseUrl = 'https://hkniptskidhgpavyejwz.supabase.co'; // <-- PASTE YOUR SUPABASE URL HERE
const supabaseUrl = process.env.supabaseUrl;
const supabaseKey = process.env.supabaseKey; // <-- PASTE YOUR SUPABASE ANON KEY HERE

if (supabaseUrl.includes('your-project-url') || supabaseKey.includes('your-anon-public-key')) {
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
  transactionId: string;
  paymentProof: string;
  pin: string;
  status: string;
  checkedIn: boolean;
  createdAt: string;
};

// This type represents the object we pass to the .insert() or .update() methods.
// It uses the BookingStatus enum for type safety in our application code.
export type DbBookingUpsert = Omit<DbBooking, 'status'> & {
  status: BookingStatus;
};


export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: DbBooking;
        Insert: DbBookingUpsert;
        Update: Partial<DbBookingUpsert>;
        Relationships: [];
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