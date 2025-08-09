import { Event } from './types';

export const EVENTS: Event[] = [
  {
    id: 'Coolie-2025',
    name: 'Coolie (2025)',
    date: '2024-08-09T02:30:00Z',
    venue: 'Ritz Multiplex',
    description: 'A highly anticipated movie from Super Star Rajnikanth, our Thalaiva, and Director Lokesh Kanagaraj, known for his excellent scripts like Vikram Hitlist, Khaidi, LEO, Master.',
    image: 'https://i.postimg.cc/htdst9V0/coolie.jpg',
    upiId: 'eventpass@upi',
    qrCodeImage: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=eventpass@upi&pn=Movie%20Screening',
    paymentLink: 'https://docs.google.com/forms/d/14yrjaguRQ6VxFNDumKiGlk32kKfOG5a3-xP4wuhf-Uc/edit'
  }
];

export const ADMIN_PASSWORD = 'dk';