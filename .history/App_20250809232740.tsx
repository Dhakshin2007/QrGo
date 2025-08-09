import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import MyTicketsPage from './pages/MyTicketsPage';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import Toast from './components/Toast';
import { Mail } from 'lucide-react';
import { Event, EventStatus } from './types';
import { db } from './services/db';

// --- Event Context for Global State Management ---

interface EventContextType {
  events: Event[];
  isLoading: boolean;
  updateEventStatus: (eventId: string, newStatus: EventStatus) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const initialEvents = await db.getEvents();
        setEvents(initialEvents);
      } catch (error) {
        console.error("Failed to fetch initial events:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const updateEventStatus = useCallback((eventId: string, newStatus: EventStatus) => {
    setEvents(currentEvents =>
      currentEvents.map(event =>
        event.id === eventId ? { ...event, status: newStatus } : event
      )
    );
  }, []);

  return (
    <EventContext.Provider value={{ events, isLoading, updateEventStatus }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};


// --- Main App Component ---

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <EventProvider>
          <HashRouter>
            <div className="min-h-screen flex flex-col bg-background">
              <Header />
              <main className="flex-grow container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/book/:eventId" element={<BookingPage />} />
                  <Route path="/my-tickets" element={<MyTicketsPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Routes>
              </main>
              <footer className="text-center py-4 text-on-surface-secondary text-sm">
                <p>QrGo &copy; 2025. All rights reserved.</p>
              </footer>
            </div>
          </HashRouter>
          <a
            href="mailto:kothadhakshin123@gmail.com"
            className="fixed bottom-6 right-6 bg-accent text-white p-4 rounded-full shadow-lg hover:bg-indigo-600 transition-colors flex items-center gap-2 z-50"
            title="Contact Support"
            aria-label="Contact Support"
          >
            <Mail size={24} />
          </a>
          <Toast />
        </EventProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
