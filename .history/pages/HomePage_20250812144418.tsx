

import React, { useState } from 'react';
import { useEvents } from '../App';
import EventCard from '../components/EventCard';
import { Loader2, Flame, Sparkles, Archive, Search } from 'lucide-react';
import { EventStatus } from '../types';
import { ORGANIZERS } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { events, isLoading } = useEvents();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter(event => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const organizer = ORGANIZERS.find(o => o.id === event.organizerId);
    const organizerName = organizer ? organizer.name.toLowerCase() : '';

    return event.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      event.description.toLowerCase().includes(lowerCaseSearchTerm) ||
      event.venue.toLowerCase().includes(lowerCaseSearchTerm) ||
      organizerName.includes(lowerCaseSearchTerm);
  });

  const ongoingEvents = filteredEvents.filter(e => e.status === EventStatus.Ongoing);
  const upcomingEvents = filteredEvents.filter(e => e.status === EventStatus.Upcoming);
  const closedEvents = filteredEvents.filter(e => e.status === EventStatus.Closed);

  const noResultsFound = !isLoading && events.length > 0 && filteredEvents.length === 0;

  return (
    <div className="animate-fade-in">
      <h1 className="text-4xl font-extrabold text-center mb-4 text-on-surface">Events</h1>
      <p className="text-lg text-center text-on-surface-secondary mb-8">Book your spot for the most exciting events of the year!</p>
      
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-secondary" size={20} />
          <input
            type="text"
            placeholder="Search events by name, organizer, or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface p-4 pl-12 rounded-full focus:ring-2 focus:ring-primary outline-none transition-shadow shadow-md hover:shadow-lg focus:shadow-lg"
            aria-label="Search for events"
          />
        </div>
      </div>

      {isLoading ? (
         <div className="text-center py-8"><Loader2 size={32} className="animate-spin inline-block" /></div>
      ) : noResultsFound ? (
         <p className="text-center text-on-surface-secondary py-8 bg-surface rounded-lg">
           No events found for "{searchTerm}". Try a different search.
         </p>
      ) : events.length > 0 ? (
        <div className="space-y-16">
          <section id="live-events">
            <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
              <Flame /> Live (Ongoing)
            </h2>
            {ongoingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {ongoingEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <p className="text-center text-on-surface-secondary py-8 bg-surface rounded-lg">
                {searchTerm ? `No live events match "${searchTerm}".` : 'No live events at the moment. Check back soon!'}
              </p>
            )}
          </section>

          <section id="upcoming-events">
            <h2 className="text-3xl font-bold text-accent mb-6 flex items-center gap-3">
              <Sparkles /> Coming Soon
            </h2>
            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <p className="text-center text-on-surface-secondary py-8 bg-surface rounded-lg">
                {searchTerm ? `No upcoming events match "${searchTerm}".` : 'No upcoming events scheduled right now.'}
              </p>
            )}
          </section>

          <section id="past-events">
            <h2 className="text-3xl font-bold text-on-surface-secondary mb-6 flex items-center gap-3">
              <Archive /> Ended
            </h2>
            {closedEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {closedEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <p className="text-center text-on-surface-secondary py-8 bg-surface rounded-lg">
                {searchTerm ? `No past events match "${searchTerm}".` : 'No past events to show.'}
              </p>
            )}
          </section>
        </div>
      ) : (
        <p className="text-center text-on-surface-secondary">No events found.</p>
      )}
    </div>
  );
};

export default HomePage;