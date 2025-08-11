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
    description: 'Delves into a mans relentless quest for vengeance since youth, driven by righting past wrongs, shaping his very existence. Viewers experience the complexities of his tumultuous vendetta journey.',
    image: 'https://i.postimg.cc/htdst9V0/coolie.jpg',
    status: EventStatus.Ongoing,
    upiId: 'eventpass@upi',
    upiLink: 'upi://pay?pa=eventpass@upi&pn=Coolie%20(2025)%20Booking&am=250&cu=INR',
    qrCodeImage: 'https://i.postimg.cc/HsdTDqNw/Whats-App-Image-2025-08-11-at-19-45-38-5707b153.jpg'
  },
  // {
  //   id: 'dev-summit-2025',
  //   organizerId: 'org-2',
  //   name: 'Global Dev Summit',
  //   date: '2025-10-20T09:00:00Z',
  //   venue: 'Metro Convention Center',
  //   description: 'A global gathering of developers, engineers, and tech leaders to discuss the latest trends in software development, cloud computing, and more.',
  //   image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop',
  //   status: EventStatus.Upcoming,
  //   upiId: 'devsummit@upi',
  //   upiLink: 'upi://pay?pa=devsummit@upi&pn=Dev%20Summit%20Booking&am=500&cu=INR',
  //   qrCodeImage: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=devsummit@upi&pn=Dev%20Summit'
  // },
  {
    id: 'fresh-test',
    organizerId: 'org-1',
    name: 'Freshers Test',
    date: '2025-08-10T10:30:00Z',
    venue: 'Community Hall',
    description: 'This is a test event for freshers to book tickets and check the QR code functionality.',
    image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2070&auto=format&fit=crop',
    status: EventStatus.Closed,
    requiresEntryNumber: true,
    // Notice upiId, upiLink, and qrCodeImage are not included
  },
  {
    id: 'linkedin-test',
    organizerId: 'org-1',
    name: 'Linkedin Test',
    date: '2025-08-11T10:30:00Z',
    venue: 'Online Event',
    description: 'This is a test event for Linkedin Users to book tickets and check the QR code functionality.',
    image: 'https://i.postimg.cc/g0Yp4zGw/tst.jpg',
    status: EventStatus.Closed,
    requiresEntryNumber: false,
    // Notice upiId, upiLink, and qrCodeImage are not included
  },
  {
    id: 'alfaaz-test',
    organizerId: 'org-2',
    name: 'Alfaaz Test',
    date: '2025-08-11T16:45:00Z',
    venue: 'Lecture Hall Complex',
    description: 'This is a test event for Alfaaz Attendants to book tickets and check the QR code functionality.',
    image: 'https://i.postimg.cc/3xC43b7M/image.png',
    status: EventStatus.Ongoing,
    requiresEntryNumber: false,
    // Notice upiId, upiLink, and qrCodeImage are not included
  },
  {
    id: 'Zeitgeist-2025',
    organizerId: 'org-1',
    name: 'Zeitgeist IIT Ropar Cultural Fest',
    date: '2025-10-25T13:30:00Z', // Displays as 7:00 PM IST
    venue: 'IIT Ropar Campus',
    description: 'Experience a night of unforgettable music under the stars with top indie bands. Food trucks and merch available.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974&auto=format&fit=crop',
    status: EventStatus.Upcoming,
    price: 350,
    upiId: 'musicfest@upi',
    upiLink: 'upi://pay?pa=musicfest@upi&pn=Indie%20Music%20Fest&am=350&cu=INR',
    qrCodeImage: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=musicfest@upi&pn=Indie%20Music%20Fest'
  },
  // {
  //   id: 'food-carnival-2025',
  //   organizerId: 'org-1',
  //   name: 'Gourmet Food Carnival',
  //   date: '2025-09-05T06:30:00Z', // Displays as 12:00 PM IST
  //   venue: 'Exhibition Grounds',
  //   description: 'A paradise for food lovers. Taste cuisines from around the world, watch live cooking demos, and enjoy a day of culinary delight.',
  //   image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop',
  //   status: EventStatus.Closed,
  //   price: 150,
  //   upiId: 'foodfest@upi',
  //   upiLink: 'upi://pay?pa=foodfest@upi&pn=Gourmet%20Food%20Carnival&am=150&cu=INR',
  //   qrCodeImage: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=foodfest@upi&pn=Gourmet%20Food%20Carnival'
  // },
  // {
  //   id: 'art-expo-2025',
  //   organizerId: 'org-1',
  //   name: 'Modern Art Expo',
  //   date: '2025-11-01T05:30:00Z', // Displays as 11:00 AM IST
  //   venue: 'Grand Art Gallery',
  //   description: 'Explore stunning works from contemporary artists. The expo features paintings, sculptures, and interactive installations.',
  //   image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?q=80&w=2066&auto=format&fit=crop',
  //   status: EventStatus.Ongoing,
  //   price: 200,
  //   upiId: 'artexpo@upi',
  //   upiLink: 'upi://pay?pa=artexpo@upi&pn=Modern%20Art%20Expo&am=200&cu=INR',
  //   qrCodeImage: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=artexpo@upi&pn=Modern%20Art%20Expo'
  // }
];