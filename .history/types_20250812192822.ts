
export type Organizer = {
  id: string;
  username: string;
  name: string;
  logoUrl: string;
  secretId: string;
};

export enum BookingStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Rejected = 'Rejected',
}

export enum EventStatus {
  Upcoming = 'Upcoming',
  Ongoing = 'Ongoing',
  BookingStopped = 'Booking Stopped',
  Closed = 'Closed',
}

export type Event = {
  id: string;
  organizerId: string;
  name: string;
  date: string;
  venue: string;
  venueMapLink?: string;
  description: string;
  image: string;
  status: EventStatus;
  price?: number;
  requiresEntryNumber?: boolean;
  upiId?: string;
  upiLink?: string;
  qrCodeImage?: string;
};

export type Booking = {
  id: string;
  eventId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  entryNumber: string | null;
  transactionId: string | null;
  paymentProof: string | null; // Public URL to the image in Supabase Storage
  pin: string; // Should be hashed on a real backend
  status: BookingStatus;
  checkedIn: boolean;
  createdAt: string;
};