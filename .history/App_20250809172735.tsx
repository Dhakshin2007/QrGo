import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import MyTicketsPage from './pages/MyTicketsPage';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import { ToastProvider } from './contexts/ToastContext';
import Toast from './components/Toast';

const App: React.FC = () => {
  return (
    <ToastProvider>
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
            <p> &copy; 2025. All rights reserved.</p>
          </footer>
        </div>
      </HashRouter>
      <Toast />
    </ToastProvider>
  );
};

export default App;
