
import React from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../types';
import { Calendar, MapPin } from 'lucide-react';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div className="bg-surface rounded-lg overflow-hidden shadow-lg hover:shadow-primary/50 transition-shadow duration-300 flex flex-col">
      <img src={event.image} alt={event.name} className="w-full h-48 object-cover" />
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold mb-2 text-on-surface">{event.name}</h3>
        <div className="flex items-center gap-2 text-on-surface-secondary mb-2">
          <Calendar size={16} />
          <span>{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-secondary mb-4">
          <MapPin size={16} />
          <span>{event.venue}</span>
        </div>
        <p className="text-on-surface-secondary mb-6 flex-grow">{event.description}</p>
        <Link to={`/book/${event.id}`} className="mt-auto text-center w-full bg-primary text-white font-bold py-3 px-6 rounded-md hover:bg-primary-focus transition-colors duration-300">
          Book Now
        </Link>
      </div>
    </div>
  );
};

export default EventCard;
