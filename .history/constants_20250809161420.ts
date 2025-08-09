import { Event } from './types';

export const EVENTS: Event[] = [
  {
    id: 'Coolie-2025',
    name: 'Coolie (2025)',
    date: '2024-08-09T02:30:00Z',
    venue: 'Ritz Multiplex ',
    description: 'Join the brightest minds in technology as they unveil the future of AI, blockchain, and sustainable tech. A three-day event full of keynotes, workshops, and networking opportunities.',
    image: 'https://i.postimg.cc/htdst9V0/coolie.jpg',
    upiId: 'eventpass@upi',
    qrCodeImage: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=eventpass@upi&pn=Movie%20Screening'
  }
];

export const ADMIN_PASSWORD = 'dk';