import { Event, Organizer, EventStatus } from './types';

// To use your own logo, paste the URL here. It will be displayed on the top left of the header.
// For best results, use a transparent PNG or SVG.
// Example: export const LOGO_URL = 'https://example.com/my-logo.svg';
export const LOGO_URL = 'https://i.postimg.cc/qqd3M6cN/Google-AI-Studio-2025-08-09-T14-17-15-618-Z.png';

// The ORGANIZERS array has been moved to contexts/AuthContext.tsx to better
// simulate secure handling of credentials and prevent them from being in a
// easily accessible constants file. In a production environment, these should
// be loaded from secure environment variables.


export const EVENTS: Event[] = [
  {
    id: 'Coolie-2025',
    organizerId: 'org-1',
    name: 'Coolie (2025)',
    date: '2024-08-15T08:15:00Z',
    venue: 'Ritz Multiplex, Ropar',
    venueMapLink: 'https://maps.app.goo.gl/X12Dntqj1eRzVzra7',
    description: 'Delves into a mans relentless quest for vengeance since youth, driven by righting past wrongs, shaping his very existence. Viewers experience the complexities of his tumultuous vendetta journey.',
    image: 'https://i.postimg.cc/htdst9V0/coolie.jpg',
    status: EventStatus.Closed,
    price: 180,
    remarks: 'Please be before 20min of Show Time ! 💓',
    upiId: 'No Bookings Are Accepted',
    upiLink: 'upi://pay?pa=deepakteja9206@axl&pn=Coolie%20(2025)%20Booking&am=180&cu=INR',
    qrCodeImage: '#'
  },
  {
    id: 'tca-dushera-2k25',
    organizerId: 'org-1',
    name: 'TCA Bathukamma Event',
    date: '2025-10-04T03:30:00Z',
    venue: 'Lecture Hall Complex , IIT Ropar',
    description: 'Btech - 300/- , MTech - 500/- , Phd - 800/- , Pay Before 3rd October',
    image: 'https://i.postimg.cc/GpX9br2s/image.png',
    status: EventStatus.Closed,
    upiId: 'mohithsai2701-3@okhdfcbank',
    remarks: 'ధన్యవాదాలు !! 💓💓',
    requiresEntryNumber: true,
    // upiLink: 'upi://pay?pa=devsummit@upi&pn=Dev%20Summit%20Booking&am=500&cu=INR',
    qrCodeImage: 'https://i.postimg.cc/ZqJ2rvS1/Whats-App-Image-2025-09-23-at-15-43-44-a3345074.jpg',
    requiresTransactionId: false,
  },
  {
    id: 'tca-ugadi-2k26',
    organizerId: 'org-1',
    name: 'TCA Ugadhi Event',
    date: '2025-03-28T05:00:00Z',
    venue: 'Lecture Hall Complex , IIT Ropar',
    description: 'Btech/B.sc/B.ed - 300/- , MTech - 500/- , Phd - 700/- , Pay Before 25th March',
    image: 'https://i.postimg.cc/BnbCXDkq/Happyugadtelugucover23.avif',
    status: EventStatus.Closed,
    price: 300,
    upiId: 'daggolu.9243@wahdfc.bank',
    remarks: 'ధన్యవాదాలు !! 💓💓',
    requiresEntryNumber: true,
    allowedEmailDomain: 'iitrpr.ac.in',
    // upiLink: 'upi://pay?pa=devsummit@upi&pn=Dev%20Summit%20Booking&am=500&cu=INR',
    qrCodeImage: 'https://i.postimg.cc/c46TKwf6/IMG-20260327-WA0001.jpg',
    requiresTransactionId: false,
  },
  {
    id: 'tca-dushera-2k26',
    organizerId: 'org-1',
    name: 'TCA Dushera Event',
    date: '2026-10-24T05:00:00Z',
    venue: 'Lecture Hall Complex , IIT Ropar',
    description: 'Btech/B.sc/B.ed - 350/- , MTech - 500/- , Phd - 700/- , Pay Before 20th October',
    image: 'https://i.postimg.cc/BnbCXDkq/Happyugadtelugucover23.avif',
    status: EventStatus.Upcoming,
    price: 350,
    upiId: 'daggolu.9243@wahdfc.bank',
    remarks: 'ధన్యవాదాలు !! 💓💓',
    requiresEntryNumber: true,
    allowedEmailDomain: 'iitrpr.ac.in',
    // upiLink: 'upi://pay?pa=devsummit@upi&pn=Dev%20Summit%20Booking&am=500&cu=INR',
    qrCodeImage: 'https://i.postimg.cc/c46TKwf6/IMG-20260327-WA0001.jpg',
    requiresTransactionId: false,
  },

  // {
  //   id: 'cinema-premiere-live',
  //   organizerId: 'super-admin',
  //   name: 'Grand Cinema Premiere: Interstellar IMAX',
  //   date: '2026-09-10T18:30:00Z',
  //   venue: 'PVR INOX Screen 4, Audi 1',
  //   venueMapLink: 'https://maps.app.goo.gl/X12Dntqj1eRzVzra7',
  //   description: 'Special screening with Dolby Atmos sound and IMAX laser projection. Select your preferred seats from the live interactive seat map below.',
  //   image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop',
  //   status: EventStatus.Ongoing,
  //   remarks: 'Please arrive 15 minutes before showtime.',
  //   requiresEntryNumber: false,
  //   seatingConfig: {
  //     rows: [
  //       { label: 'A', seats: 6, unavailableSeats: [2] }, // A-3 blocked (e.g. VIP reserved)
  //       { label: 'B', seats: 8 },
  //       { label: 'C', seats: 8, unavailableSeats: [4] }, // Aisle gap
  //       { label: 'D', seats: 10 },
  //       { label: 'E', seats: 10 },
  //     ],
  //     maxSeatsPerBooking: 4,
  //   },
  // },
  // {
  //   id: 'linkedin-test',
  //   organizerId: 'super-admin',
  //   name: 'Linkedin Test',
  //   date: '2025-08-11T10:30:00Z',
  //   venue: 'Online Event',
  //   description: 'This is a test event for Linkedin Users to book tickets and check the QR code functionality.',
  //   image: 'https://i.postimg.cc/g0Yp4zGw/tst.jpg',
  //   status: EventStatus.Ongoing,
  //   requiresEntryNumber: false,
  //   // Demonstrate Reserved Seating — rows A–E, theatre-style layout
  //   seatingConfig: {
  //     rows: [
  //       { label: 'A', seats: 8, unavailableSeats: [2] },   // A-3 blocked (0-indexed)
  //       { label: 'B', seats: 8, unavailableSeats: [4] },   // B-5 blocked
  //       { label: 'C', seats: 10 },
  //       { label: 'D', seats: 10 },
  //       { label: 'E', seats: 12 },
  //     ],
  //     maxSeatsPerBooking: 4,
  //   },
  //   // Notice upiId, upiLink, and qrCodeImage are not included — this is a free event
  // },

];
