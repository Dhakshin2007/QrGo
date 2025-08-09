
import React, { useState } from 'react';
import { db } from '../services/db';
import { Booking, Event } from '../types';
import TicketCard from '../components/TicketCard';
import { Loader2 } from 'lucide-react';

const MyTicketsPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const [foundBookings, allEvents] = await Promise.all([
          db.findBookingsByEmailAndPin(email, pin),
          db.getEvents()
      ]);

      if (foundBookings.length > 0) {
        setBookings(foundBookings.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setEvents(allEvents);
        setIsLoggedIn(true);
      } else {
        setError('No bookings found for this Email and PIN combination. Please check your details or book an event first.');
      }
    } catch (err) {
      setError('Failed to search for tickets. Please try again later.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = () => {
      setIsLoggedIn(false);
      setBookings([]);
      setEvents([]);
      setEmail('');
      setPin('');
  }

  if (isLoggedIn) {
    return (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-extrabold">My Tickets</h1>
            <button onClick={handleLogout} className="bg-surface hover:bg-red-500/50 text-on-surface font-bold py-2 px-4 rounded-md transition-colors">
                Log Out
            </button>
        </div>
        
        {bookings.length > 0 ? (
          <div className="space-y-8">
            {bookings.map(booking => (
              <TicketCard key={booking.id} booking={booking} event={events.find(e => e.id === booking.eventId)} />
            ))}
          </div>
        ) : (
          <p>Something went wrong. No bookings found.</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 animate-fade-in">
      <div className="bg-surface p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-2">Access Your Tickets</h1>
        <p className="text-center text-on-surface-secondary mb-6">Enter your email and the PIN you created during booking.</p>
        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            placeholder="Your Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-background p-3 rounded-md focus:ring-2 focus:ring-primary outline-none"
          />
          <input
            type="password"
            placeholder="Your Secret PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
            className="w-full bg-background p-3 rounded-md focus:ring-2 focus:ring-primary outline-none"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full bg-primary text-white font-bold py-3 px-6 rounded-md hover:bg-primary-focus transition-colors duration-300 flex items-center justify-center gap-2 disabled:bg-gray-500">
            {isLoading ? <><Loader2 className="animate-spin" /> Accessing...</> : 'Find My Tickets'}
          </button>
        </form>
        <div className="text-center mt-6">
            <a 
              href="mailto:kothadhakshin123@gmail.com?subject=Forgot PIN Request for Evento"
              className="text-sm text-primary hover:underline"
            >
                Forgot your PIN? Contact support(Mail: kothadhakshin123@gmail.com).
            </a>
        </div>
      </div>
    </div>
  );
};

export default MyTicketsPage;
