export enum BookingStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Rejected = 'Rejected',
}

export interface Event {
  id: string;
  name: string;
  date: string;
  venue: string;
  description: string;
  image: string;
  upiId: string;
  qrCodeImage?: string;
  paymentLink?: string;
}

export interface Booking {
  id: string;
  eventId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  transactionId: string;
  paymentProof: string; // Public URL to the image in Supabase Storage
  pin: string; // Should be hashed on a real backend
  status: BookingStatus;
  checkedIn: boolean;
  createdAt: string;
}