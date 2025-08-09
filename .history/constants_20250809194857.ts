import { Event } from './types';

// To use your own logo, paste the URL here. It will be displayed on the top left of the header.
// For best results, use a transparent PNG or SVG.
// Example: export const LOGO_URL = 'https://example.com/my-logo.svg';
export const LOGO_URL = '/public/logo.png';

export const EVENTS: Event[] = [
  {
    id: 'Coolie-2025',
    name: 'Coolie (2025)',
    date: '2024-08-09T02:30:00Z',
    venue: 'Ritz Multiplex ',
    description: 'Join the brightest minds in technology as they unveil the future of AI, blockchain, and sustainable tech. A three-day event full of keynotes, workshops, and networking opportunities.',
    image: 'https://i.postimg.cc/htdst9V0/coolie.jpg',
    upiId: 'test@upi',
    upiLink: 'upi://pay?pa=eventpass@upi&pn=Coolie%20(2025)%20Booking&am=250&cu=INR',
    qrCodeImage: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=eventpass@upi&pn=Movie%20Screening'
  }
];

export const ADMIN_PASSWORD = 'dk';