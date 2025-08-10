
import React from 'react';
import { useEvents } from '../App';
import EventCard from '../components/EventCard';
import { Loader2, Flame, Sparkles, Archive } from 'lucide-react';
import { EventStatus } from '../types';

const HomePage: React.FC = () => {
  const { events, isLoading } = useEvents();

  const ongoingEvents = events.filter(e => e.status === EventStatus.Ongoing);
  const upcomingEvents = events.filter(e => e.status === EventStatus.Upcoming);
  const closedEvents = events.filter(e => e.status === EventStatus.Closed);

  return (
    <div className="animate-fade-in">
      <h1 className="text-4xl font-extrabold text-center mb-4 text-on-surface">Events</h1>
      <p className="text-lg text-center text-on-surface-secondary mb-12">Book your spot for the most exciting events of the year!</p>
      
      {isLoading ? (
         <div className="text-center py-8"><Loader2 size={32} className="animate-spin inline-block" /></div>
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
              <p className="text-center text-on-surface-secondary py-8 bg-surface rounded-lg">No live events at the moment. Check back soon!</p>
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
              <p className="text-center text-on-surface-secondary py-8 bg-surface rounded-lg">No upcoming events scheduled right now.</p>
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
              <p className="text-center text-on-surface-secondary py-8 bg-surface rounded-lg">No past events to show.</p>
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
