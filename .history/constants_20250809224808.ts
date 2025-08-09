import { Event } from './types';

// To use your own logo, paste the URL here. It will be displayed on the top left of the header.
// For best results, use a transparent PNG or SVG.
// Example: export const LOGO_URL = 'https://example.com/my-logo.svg';
export const LOGO_URL = '/public/logo.png';

export const ORGANIZERS: Organizer[] = [
  { id: 'super-admin', username: 'SuperAdmin', secretId: 'supersecret123' },
  { id: 'org-1', username: 'RitzCinemas', secretId: 'ritz123' },
  { id: 'org-2', username: 'TechCon', secretId: 'techcon-secret' }
];


export const EVENTS: Event[] = [
  {
    id: 'Coolie-2025',
    organizerId: 'org-1',
    name: 'Coolie (2025)',
    date: '2024-08-09T02:30:00Z',
    venue: 'Ritz Multiplex ',
    description: 'Join the brightest minds in technology as they unveil the future of AI, blockchain, and sustainable tech. A three-day event full of keynotes, workshops, and networking opportunities.',
    image: 'https://i.postimg.cc/htdst9V0/coolie.jpg',
    upiId: 'eventpass@upi',
    upiLink: 'upi://pay?pa=eventpass@upi&pn=Coolie%20(2025)%20Booking&am=250&cu=INR',
    qrCodeImage: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=eventpass@upi&pn=Movie%20Screening'
  },
  {
    id: 'dev-summit-2025',
    organizerId: 'org-2',
    name: 'Global Dev Summit',
    date: '2025-10-20T09:00:00Z',
    venue: 'Metro Convention Center',
    description: 'A global gathering of developers, engineers, and tech leaders to discuss the latest trends in software development, cloud computing, and more.',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop',
    upiId: 'devsummit@upi',
    upiLink: 'upi://pay?pa=devsummit@upi&pn=Dev%20Summit%20Booking&am=500&cu=INR',
    qrCodeImage: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=devsummit@upi&pn=Dev%20Summit'
  }
];