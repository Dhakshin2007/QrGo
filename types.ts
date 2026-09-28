
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

// ── Seating Types ─────────────────────────────────────────────────────────────

/** Configuration for a single row in the seat map. */
export type SeatRowConfig = {
  /** Display label for this row, e.g. "A", "B", "Row 1" */
  label: string;
  /** Total number of seats in this row */
  seats: number;
  /** Zero-based indices of seats that are permanently unavailable (e.g. aisle, broken) */
  unavailableSeats?: number[];
};

/** The overall seating layout attached to an Event. */
export type SeatingConfig = {
  /** Ordered array of row definitions */
  rows: SeatRowConfig[];
  /** Optional: max seats a single booking can select (defaults to unlimited) */
  maxSeatsPerBooking?: number;
};

/** Live state of a single seat, derived at runtime from booking data. */
export enum SeatStatus {
  Available = 'available',
  Pending   = 'pending',    // someone submitted a booking but it's not yet approved
  Booked    = 'booked',     // confirmed booking
  Selected  = 'selected',   // chosen by the current user (local UI state only)
  Unavailable = 'unavailable', // permanently blocked by organizer
}

/** Represents one rendered seat cell in the SeatMap. */
export type SeatInfo = {
  /** Unique seat ID, e.g. "A-1", "B-3" */
  id: string;
  rowLabel: string;
  seatNumber: number;
  status: SeatStatus;
};

// ── Core Domain Types ──────────────────────────────────────────────────────────

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
  remarks?: string;
  requiresEntryNumber?: boolean;
  upiId?: string;
  upiLink?: string;
  qrCodeImage?: string;
  requiresTransactionId?: boolean;
  allowedEmailDomain?: string;
  /** If present, this event uses reserved seating instead of general admission. */
  seatingConfig?: SeatingConfig;
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
  /** JSON-encoded seat ID array for reserved-seat events, e.g. '["A-1","A-2"]'. Null for GA. */
  selectedSeats: string | null;
};