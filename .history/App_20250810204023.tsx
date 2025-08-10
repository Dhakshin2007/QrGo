

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import MyTicketsPage from './pages/MyTicketsPage';
import AdminPage from './pages/AdminPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import Header from './components/Header';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import Toast from './components/Toast';
import { Mail, Shield } from 'lucide-react';
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
          <ReactRouterDOM.HashRouter>
            <div className="min-h-screen flex flex-col bg-background">
              <Header />
              <main className="flex-grow container mx-auto px-4 py-8">
                <ReactRouterDOM.Routes>
                  <ReactRouterDOM.Route path="/" element={<HomePage />} />
                  <ReactRouterDOM.Route path="/book/:eventId" element={<BookingPage />} />
                  <ReactRouterDOM.Route path="/my-tickets" element={<MyTicketsPage />} />
                  <ReactRouterDOM.Route path="/admin" element={<AdminPage />} />
                  <ReactRouterDOM.Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                </ReactRouterDOM.Routes>
              </main>
              <footer className="bg-surface mt-auto py-6 px-4">
                <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-on-surface-secondary text-sm gap-4">
                    <p className="text-center sm:text-left">QrGo &copy; 2025. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <ReactRouterDOM.Link to="/privacy-policy" className="hover:text-primary transition-colors flex items-center gap-2">
                            <Shield size={16} /> Privacy & Policy
                        </ReactRouterDOM.Link>
                        <a href="mailto:kothadhakshin123@gmail.com" className="hover:text-primary transition-colors flex items-center gap-2">
                            <Mail size={16} /> Contact Support
                        </a>
                    </div>
                </div>
              </footer>
            </div>
          </ReactRouterDOM.HashRouter>
          <Toast />
        </EventProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;