import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Booking, Event } from '../types';
import TicketCard from '../components/TicketCard';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../App';

const MyTicketsPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { events, isLoading: areEventsLoading } = useEvents();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { isUserLoggedIn, loginUser, logoutUser, userEmail, userPin } = useAuth();

  useEffect(() => {
    const fetchUserTickets = async () => {
        if (isUserLoggedIn && userEmail && userPin && !areEventsLoading) {
            setIsLoading(true);
            setError('');
            try {
                const foundBookings = await db.findBookingsByEmailAndPin(userEmail, userPin);

                if (foundBookings.length > 0) {
                    setBookings(foundBookings.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                } else {
                    setError('No bookings found for this Email and PIN combination. Please check your details or book an event first.');
                    logoutUser(); // Log out if no tickets found, allowing user to retry
                }
            } catch (err) {
                setError('Failed to fetch your tickets. Please try again later.');
                logoutUser();
            } finally {
                setIsLoading(false);
            }
        }
    };

    fetchUserTickets();
  }, [isUserLoggedIn, userEmail, userPin, areEventsLoading, logoutUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    loginUser(email, pin);
  };
  
  const handleLogout = () => {
      logoutUser();
      setBookings([]);
      setEmail('');
      setPin('');
      setError('');
  }

  if (isUserLoggedIn) {
    return (
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
            <h1 className="text-4xl font-extrabold text-center sm:text-left">My Tickets</h1>
            <button onClick={handleLogout} className="bg-surface hover:bg-red-500/50 text-on-surface font-bold py-2 px-4 rounded-md transition-colors w-full sm:w-auto">
                Log Out
            </button>
        </div>
        
        {isLoading || areEventsLoading ? (
             <div className="text-center py-8"><Loader2 size={32} className="animate-spin inline-block" /></div>
        ) : bookings.length > 0 ? (
          <div className="space-y-8">
            {bookings.map(booking => (
              <TicketCard key={booking.id} booking={booking} event={events.find(e => e.id === booking.eventId)} />
            ))}
          </div>
        ) : (
          <p className="text-center text-on-surface-secondary">No tickets found for your account.</p>
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
          <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-6 rounded-md hover:bg-primary-focus transition-colors duration-300 flex items-center justify-center gap-2 disabled:bg-gray-500">
            Find My Tickets
          </button>
        </form>
        <div className="text-center mt-6">
            <a 
              href="mailto:kothadhakshin123@gmail.com?subject=Forgot PIN Request for QrGo"
              className="text-sm text-primary hover:underline"
            >
                Forgot your PIN? Contact support.
            </a>
        </div>
      </div>
    </div>
  );
};

export default MyTicketsPage;