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
    date: '2024-08-15T09:30:00Z',
    venue: 'Ritz Multiplex ',
    description: 'Delves into a mans relentless quest for vengeance since youth, driven by righting past wrongs, shaping his very existence. Viewers experience the complexities of his tumultuous vendetta journey.',
    image: 'https://i.postimg.cc/htdst9V0/coolie.jpg',
    status: EventStatus.Upcoming,
    upiId: 'eventpass@upi',
    upiLink: 'upi://pay?pa=eventpass@upi&pn=Coolie%20(2025)%20Booking&am=250&cu=INR',
    qrCodeImage: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=eventpass@upi&pn=Movie%20Screening'
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
    status: EventStatus.Ongoing,
    requiresEntryNumber: true,
    // Notice upiId, upiLink, and qrCodeImage are not included
  }
  {
    id: 'Coolie-2025',
    organizerId: 'org-1',
    name: 'Coolie (2025)',
    date: '2024-08-15T09:30:00Z',
    venue: 'Ritz Multiplex ',
    description: 'Delves into a mans relentless quest for vengeance since youth, driven by righting past wrongs, shaping his very existence. Viewers experience the complexities of his tumultuous vendetta journey.',
    image: 'https://i.postimg.cc/htdst9V0/coolie.jpg',
    status: EventStatus.Upcoming,
    upiId: 'eventpass@upi',
    upiLink: 'upi://pay?pa=eventpass@upi&pn=Coolie%20(2025)%20Booking&am=250&cu=INR',
    qrCodeImage: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=eventpass@upi&pn=Movie%20Screening'
  },
];