
export type Organizer = {
  id: string;
  username: string;
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
}

export type Event = {
  id: string;
  organizerId: string;
  name: string;
  date: string;
  venue: string;
  description: string;
  image: string;
  status: EventStatus;
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
