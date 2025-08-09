import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../services/db';
import { Booking, BookingStatus, Event } from '../types';
import { ADMIN_PASSWORD } from '../constants';
import { Html5Qrcode } from 'html5-qrcode';
import { Loader2, Search, CheckCircle, XCircle, QrCode, ShieldAlert, BadgeInfo, UserCheck, KeyRound, Eye, Users } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const SCANNER_REGION_ID = "qr-scanner-region";

type ScanResult = {
  booking: Booking;
  event: Event;
  message: string;
  type: 'success' | 'warning' | 'error';
}

const AdminPage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState<'dashboard' | 'scanner' | 'pins'>('dashboard');
  const [viewingProof, setViewingProof] = useState<string | null>(null);

  // Dashboard state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] =useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Scanner state
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScannerLoading, setIsScannerLoading] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  
  const { showToast } = useToast();

  const fetchBookings = useCallback(async () => {
    setIsLoadingBookings(true);
    try {
        const [allBookings, allEvents] = await Promise.all([
            db.getAllBookings(),
            db.getEvents()
        ]);
        setBookings(allBookings.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setEvents(allEvents);
    } catch (err) {
        setError("Failed to load bookings.");
        showToast("Failed to load bookings. Please try refreshing.", 'error');
    } finally {
        setIsLoadingBookings(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchBookings();
    }
  }, [isLoggedIn, fetchBookings]);
  
  const onScanSuccess = useCallback((decodedText: string) => {
    (async () => {
        setIsScannerLoading(true);
        try {
            const data = JSON.parse(decodedText);
            if (data.bookingId) {
            const booking = await db.findBookingById(data.bookingId);
            if (booking) {
                const event = await db.getEventById(booking.eventId);
                if(!event) {
                    setScanResult({ booking, event: {} as Event, message: 'Event for this ticket not found!', type: 'error' });
                    return;
                }
                if (booking.checkedIn) {
                setScanResult({ booking, event, message: 'This ticket has already been used.', type: 'warning' });
                } else if (booking.status !== BookingStatus.Confirmed) {
                setScanResult({ booking, event, message: `Booking is ${booking.status}. Not valid for entry.`, type: 'error' });
                } else {
                setScanResult({ booking, event, message: 'Valid ticket. Ready for check-in.', type: 'success' });
                }
            } else {
                setScanResult({ booking: {} as Booking, event: {} as Event, message: 'Invalid QR Code. Booking not found.', type: 'error' });
            }
            }
        } catch (err) {
            setScanResult({ booking: {} as Booking, event: {} as Event, message: 'Invalid QR Code format.', type: 'error' });
        } finally {
            setIsScannerLoading(false);
        }
    })();
  }, []);

  const stopScanner = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(err => {
            // This error can happen if the scanner is already stopped or the view is changed quickly.
            // It's generally safe to ignore.
            console.log("QR scanner stop error, likely benign:", err);
        });
        html5QrCodeRef.current = null;
    }
  }, []);

  const startScanner = useCallback(() => {
    setScanResult(null);

    const scannerRegionEl = document.getElementById(SCANNER_REGION_ID);
    if (!scannerRegionEl) {
        return;
    }
    
    const qrCode = new Html5Qrcode(SCANNER_REGION_ID);
    html5QrCodeRef.current = qrCode;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    qrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        undefined
    ).catch(err => {
        console.error("QR Scanner failed to start.", err);
        showToast("Could not start camera. Check permissions.", "error");
    });
  }, [onScanSuccess, showToast]);

  useEffect(() => {
    if (isLoggedIn && view === 'scanner') {
        startScanner();
    }
    return () => {
        stopScanner();
    };
  }, [isLoggedIn, view, startScanner, stopScanner]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Incorrect password.');
    }
  };

  const handleBookingStatusChange = async (booking: Booking, status: BookingStatus) => {
    try {
        await db.updateBooking({ ...booking, status });
        showToast(`Booking for ${booking.userName} updated to ${status}.`, 'success');
        fetchBookings();
    } catch (err) {
        showToast("Failed to update booking status.", 'error');
    }
  };
  
  const handleCheckIn = async () => {
      if(scanResult && scanResult.booking && !scanResult.booking.checkedIn){
          try {
            const updatedBooking = await db.updateBooking({ ...scanResult.booking, checkedIn: true });
            setScanResult({
                ...scanResult,
                booking: updatedBooking,
                message: 'Check-in successful!',
                type: 'success'
            });
            showToast(`${scanResult.booking.userName} checked in successfully!`, 'success');
          } catch(err) {
              showToast("Failed to check in.", 'error');
          }
      }
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto mt-16 animate-fade-in">
        <div className="bg-surface p-8 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-center mb-2 flex items-center justify-center gap-2"><ShieldAlert /> Organizer Access</h1>
          <p className="text-center text-on-surface-secondary mb-6">Enter the admin password to manage events.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-secondary" />
              <input
                type="password"
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-background p-3 pl-10 rounded-md focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-6 rounded-md hover:bg-primary-focus transition-colors">Login</button>
          </form>
        </div>
      </div>
    );
  }

  const searchedBookings = bookings.filter(b => 
    b.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dashboardBookings = searchedBookings.filter(b =>
     selectedEventFilter === 'all' || b.eventId === selectedEventFilter
  );


  return (
    <div className="animate-fade-in">
      <h1 className="text-4xl font-extrabold mb-8">Admin Dashboard</h1>
      <div className="flex border-b border-surface mb-6">
        <button onClick={() => setView('dashboard')} className={`px-6 py-3 font-semibold flex items-center gap-2 ${view === 'dashboard' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-secondary'}`}><BadgeInfo size={18}/>Bookings</button>
        <button onClick={() => setView('scanner')} className={`px-6 py-3 font-semibold flex items-center gap-2 ${view === 'scanner' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-secondary'}`}><QrCode size={18}/>QR Scanner</button>
        <button onClick={() => setView('pins')} className={`px-6 py-3 font-semibold flex items-center gap-2 ${view === 'pins' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-secondary'}`}><KeyRound size={18}/>User Pins</button>
      </div>

      {view === 'dashboard' && (
        <div>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-secondary" />
              <input 
                type="text"
                placeholder="Search by name, email, or booking ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface p-3 pl-12 rounded-md focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <select
                value={selectedEventFilter}
                onChange={(e) => setSelectedEventFilter(e.target.value)}
                className="bg-surface p-3 rounded-md focus:ring-2 focus:ring-primary outline-none"
                aria-label="Filter by event"
            >
                <option value="all">All Events</option>
                {events.map(event => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                ))}
            </select>
          </div>
          {isLoadingBookings ? (
            <div className="text-center py-8"><Loader2 size={32} className="animate-spin inline-block" /></div>
          ) : (
            <div className="bg-surface rounded-lg shadow-lg overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-background">
                  <tr>
                    <th className="p-4 font-semibold">Attendee</th>
                    <th className="p-4 font-semibold">Event</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Proof</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardBookings.map(booking => {
                     const event = events.find(e => e.id === booking.eventId);
                     return (
                      <tr key={booking.id} className="border-t border-background hover:bg-background/50">
                        <td className="p-4">
                          <div className="font-bold">{booking.userName}</div>
                          <div className="text-sm text-on-surface-secondary">{booking.userEmail}</div>
                        </td>
                        <td className="p-4 text-sm">{event?.name || 'Unknown Event'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                            booking.status === BookingStatus.Confirmed ? 'bg-green-500/20 text-green-400' :
                            booking.status === BookingStatus.Pending ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {booking.status}
                          </span>
                           {booking.checkedIn && <span className="ml-2 px-2 py-1 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-400">Checked In</span>}
                        </td>
                         <td className="p-4">
                            <button onClick={() => setViewingProof(booking.paymentProof)} className="p-2 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/40 flex items-center gap-1 text-sm">
                              <Eye size={16} /> View
                            </button>
                          </td>
                        <td className="p-4">
                          {booking.status === BookingStatus.Pending && (
                            <div className="flex gap-2">
                              <button onClick={() => handleBookingStatusChange(booking, BookingStatus.Confirmed)} className="p-2 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/40"><CheckCircle size={18} /></button>
                              <button onClick={() => handleBookingStatusChange(booking, BookingStatus.Rejected)} className="p-2 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/40"><XCircle size={18} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {dashboardBookings.length === 0 && <p className="text-center p-8 text-on-surface-secondary">No bookings found for the current filter.</p>}
            </div>
          )}
        </div>
      )}
      {view === 'scanner' && (
        <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="bg-surface p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><QrCode /> Scan Ticket</h2>
                <div id={SCANNER_REGION_ID} className="w-full"></div>
            </div>
            <div className="bg-surface p-6 rounded-lg shadow-lg min-h-[300px] flex flex-col justify-center">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><BadgeInfo /> Verification Result</h2>
                {isScannerLoading ? (
                    <div className="text-center"><Loader2 size={24} className="animate-spin inline-block" /></div>
                ) : scanResult ? (
                    <div className="space-y-3">
                      <div className={`p-4 rounded-md flex items-center gap-3 text-lg font-bold ${
                        scanResult.type === 'success' ? 'bg-green-500/20 text-green-300' :
                        scanResult.type === 'warning' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
                      }`}>{scanResult.message}</div>
                      
                      {scanResult.booking.id && (
                        <div className="space-y-2 text-on-surface-secondary">
                          <p><strong>Name:</strong> <span className="text-on-surface">{scanResult.booking.userName}</span></p>
                          <p><strong>Email:</strong> <span className="text-on-surface">{scanResult.booking.userEmail}</span></p>
                          <p><strong>Event:</strong> <span className="text-on-surface">{scanResult.event.name}</span></p>
                          <p><strong>Status:</strong> <span className="text-on-surface">{scanResult.booking.status}</span></p>
                          <p><strong>Checked-in:</strong> <span className="text-on-surface">{scanResult.booking.checkedIn ? 'Yes' : 'No'}</span></p>
                        </div>
                      )}

                      {scanResult.type === 'success' && !scanResult.booking.checkedIn && (
                          <button onClick={handleCheckIn} className="w-full bg-primary text-white font-bold py-3 px-6 rounded-md hover:bg-primary-focus transition-colors flex items-center justify-center gap-2">
                              <UserCheck /> Mark as Entered
                          </button>
                      )}
                    </div>
                ) : (
                    <div className="text-center text-on-surface-secondary">
                        <p>Point the camera at a QR code to begin verification.</p>
                    </div>
                )}
            </div>
        </div>
      )}
      {view === 'pins' && (
        <div>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-secondary" />
            <input 
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface p-3 pl-12 rounded-md focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
           <div className="bg-surface rounded-lg shadow-lg overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-background">
                  <tr>
                    <th className="p-4 font-semibold">Attendee</th>
                    <th className="p-4 font-semibold">Registered Event</th>
                    <th className="p-4 font-semibold">Secret PIN</th>
                  </tr>
                </thead>
                <tbody>
                  {searchedBookings.map(booking => {
                     const event = events.find(e => e.id === booking.eventId);
                     return (
                      <tr key={booking.id} className="border-t border-background hover:bg-background/50">
                        <td className="p-4">
                          <div className="font-bold">{booking.userName}</div>
                          <div className="text-sm text-on-surface-secondary">{booking.userEmail}</div>
                        </td>
                        <td className="p-4 text-sm">{event?.name || 'Unknown Event'}</td>
                        <td className="p-4 font-mono text-lg text-accent tracking-widest">{booking.pin}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {searchedBookings.length === 0 && <p className="text-center p-8 text-on-surface-secondary">No users found.</p>}
            </div>
        </div>
      )}
       {viewingProof && (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in"
            onClick={() => setViewingProof(null)}
        >
            <div 
                className="bg-surface p-4 rounded-lg shadow-xl relative max-w-2xl w-full mx-4"
                onClick={e => e.stopPropagation()}
            >
            <h3 className="text-xl font-bold mb-4 text-on-surface">Payment Proof</h3>
            <button 
                onClick={() => setViewingProof(null)}
                className="absolute top-4 right-4 text-on-surface-secondary hover:text-on-surface"
                aria-label="Close"
            >
                <XCircle size={24} />
            </button>
            <div className="max-h-[80vh] overflow-auto">
                <img src={viewingProof} alt="Payment Proof" className="w-full h-auto rounded-md" />
            </div>
            </div>
        </div>
        )}
    </div>
  );
};

export default AdminPage;