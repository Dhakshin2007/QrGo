
import React from 'react';
import { useEvents } from '../App';
import EventCard from '../components/EventCard';
import { Loader2 } from 'lucide-react';

const HomePage: React.FC = () => {
  const { events, isLoading } = useEvents();

  return (
    <div className="animate-fade-in">
      <h1 className="text-4xl font-extrabold text-center mb-4 text-on-surface">Upcoming Events</h1>
      <p className="text-lg text-center text-on-surface-secondary mb-12">Book your spot for the most exciting events of the year!</p>
      {isLoading ? (
         <div className="text-center py-8"><Loader2 size={32} className="animate-spin inline-block" /></div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="text-center text-on-surface-secondary">No events found.</p>
      )}
    </div>
  );
};

export default HomePage;