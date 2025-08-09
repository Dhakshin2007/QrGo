import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import MyTicketsPage from './pages/MyTicketsPage';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import { ToastProvider } from './contexts/ToastContext';
// import { AuthProvider } from './contexts/AuthContext';
import Toast from './components/Toast';
import { Mail } from 'lucide-react';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
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
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;