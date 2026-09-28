import { createClient } from '@supabase/supabase-js';
import { BookingStatus, EventStatus } from '../types';

const supabaseUrl = 'https://hkniptskidhgpavyejwz.supabase.co';
const supabaseKey = 'sb_publishable_tQDQrjVzkEe6GwUMwAzoYA_YMzWUTT5'; 

if (supabaseUrl.includes('your-project-url') || supabaseKey.includes('PASTE_YOUR_REAL')) {
    throw new Error("Supabase credentials are not set! Please update services/supabaseClient.ts with your project's URL and anon key.");
}

// bookings and free_bookings remain 100% UNCHANGED in the database.
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

export type DbSeatReservation = {
  id: string;
  eventId: string;
  seatId: string;
  bookingId: string;
  userEmail: string;
  status: BookingStatus;
  createdAt: string;
};

export type DbEvent = {
  id: string;
  organizerId: string;
  name: string;
  date: string;
  venue: string;
  venueMapLink: string | null;
  description: string;
  image: string;
  status: EventStatus;
  price: number | null;
  remarks: string | null;
  requiresEntryNumber: boolean;
  upiId: string | null;
  upiLink: string | null;
  qrCodeImage: string | null;
  requiresTransactionId: boolean;
  allowedEmailDomain: string | null;
  seatingConfig: any | null;
  createdAt: string;
};

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: {
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
        Insert: {
          id: string;
          eventId: string;
          userName: string;
          userEmail: string;
          userPhone: string;
          transactionId?: string | null;
          paymentProof?: string | null;
          pin: string;
          status?: BookingStatus;
          checkedIn?: boolean;
          createdAt?: string;
        };
        Update: {
          id?: string;
          eventId?: string;
          userName?: string;
          userEmail?: string;
          userPhone?: string;
          transactionId?: string | null;
          paymentProof?: string | null;
          pin?: string;
          status?: BookingStatus;
          checkedIn?: boolean;
          createdAt?: string;
        };
      };
      free_bookings: {
        Row: {
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
        Insert: {
          id: string;
          eventId: string;
          userName: string;
          userEmail: string;
          userPhone: string;
          entryNumber?: string | null;
          pin: string;
          status?: BookingStatus;
          checkedIn?: boolean;
          createdAt?: string;
        };
        Update: {
          id?: string;
          eventId?: string;
          userName?: string;
          userEmail?: string;
          userPhone?: string;
          entryNumber?: string | null;
          pin?: string;
          status?: BookingStatus;
          checkedIn?: boolean;
          createdAt?: string;
        };
      };
      seat_reservations: {
        Row: {
          id: string;
          eventId: string;
          seatId: string;
          bookingId: string;
          userEmail: string;
          status: BookingStatus;
          createdAt: string;
        };
        Insert: {
          id: string;
          eventId: string;
          seatId: string;
          bookingId: string;
          userEmail: string;
          status?: BookingStatus;
          createdAt?: string;
        };
        Update: {
          id?: string;
          eventId?: string;
          seatId?: string;
          bookingId?: string;
          userEmail?: string;
          status?: BookingStatus;
          createdAt?: string;
        };
      };
      events: {
        Row: {
          id: string;
          organizerId: string;
          name: string;
          date: string;
          venue: string;
          venueMapLink: string | null;
          description: string;
          image: string;
          status: EventStatus;
          price: number | null;
          remarks: string | null;
          requiresEntryNumber: boolean;
          upiId: string | null;
          upiLink: string | null;
          qrCodeImage: string | null;
          requiresTransactionId: boolean;
          allowedEmailDomain: string | null;
          seatingConfig: any | null;
          createdAt: string;
        };
        Insert: {
          id: string;
          organizerId: string;
          name: string;
          date: string;
          venue: string;
          venueMapLink?: string | null;
          description: string;
          image: string;
          status?: EventStatus;
          price?: number | null;
          remarks?: string | null;
          requiresEntryNumber?: boolean;
          upiId?: string | null;
          upiLink?: string | null;
          qrCodeImage?: string | null;
          requiresTransactionId?: boolean;
          allowedEmailDomain?: string | null;
          seatingConfig?: any | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          organizerId?: string;
          name?: string;
          date?: string;
          venue?: string;
          venueMapLink?: string | null;
          description?: string;
          image?: string;
          status?: EventStatus;
          price?: number | null;
          remarks?: string | null;
          requiresEntryNumber?: boolean;
          upiId?: string | null;
          upiLink?: string | null;
          qrCodeImage?: string | null;
          requiresTransactionId?: boolean;
          allowedEmailDomain?: string | null;
          seatingConfig?: any | null;
          createdAt?: string;
        };
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
