import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../services/db';
import { Booking, BookingStatus, Event, EventStatus } from '../types';
import { Html5Qrcode } from 'html5-qrcode';
import { Loader2, Search, CheckCircle, XCircle, QrCode, ShieldAlert, BadgeInfo, UserCheck, KeyRound, Eye, Users, LogOut, Briefcase, User, ArrowLeft, ToggleLeft, ToggleRight, CalendarCheck2, CalendarX2, Ticket, Clock, HelpCircle, CalendarPlus } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../App';
import { aiService, AISuggestion } from '../services/aiService';

const SCANNER_REGION_ID = "qr-scanner-region";

type ScanResult = {
  booking: Booking;
  event: Event;
  message: string;
  type: 'success' | 'warning' | 'error';
}

const AiSuggestionIcon: React.FC<{ suggestion?: AISuggestion }> = ({ suggestion }) => {
  if (!suggestion) return null;

  const config = {
    Plausible: { icon: <CheckCircle size={16} className="text-green-500" />, text: "AI Suggestion: Plausible Transaction ID" },
    Suspicious: { icon: <ShieldAlert size={16} className="text-yellow-500" />, text: "AI Suggestion: Suspicious Transaction ID" },
    Invalid: { icon: <XCircle size={16} className="text-red-500" />, text: "AI Suggestion: Invalid Transaction ID" },
    Error: { icon: <HelpCircle size={16} className="text-gray-500" />, text: "AI check failed or was disabled" },
  };

  const current = config[suggestion];
  if (!current) return null;

  return (
    <div className="flex items-center gap-1.5" title={current.text}>
      {current.icon}
      <span className="text-xs hidden md:inline">{suggestion}</span>
    </div>
  );
};


const AdminPage: React.FC = () => {
  const { loggedInOrganizer, loginOrganizer, logoutOrganizer } = useAuth();
  const { events, isLoading: areEventsLoading, updateEventStatus } = useEvents();

  const [username, setUsername] = useState('');
  const [secretId, setSecretId] = useState('');
  const [error, setError] = useState('');
  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [view, setView] = useState<'dashboard' | 'scanner' | 'pins'>('dashboard');
  const [viewingProof, setViewingProof] = useState<string | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, AISuggestion>>({});

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScannerLoading, setIsScannerLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isFocusing, setIsFocusing] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  
  const { showToast } = useToast();

  const fetchBookings = useCallback(async () => {
    if (!loggedInOrganizer) return;
    setIsLoadingBookings(true);
    setAiSuggestions({});
    try {
        const allBookings = await db.getAllBookings();
        // Sort bookings by creation date, oldest first, to assign serial numbers.
        const sortedBookings = allBookings.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setBookings(sortedBookings);

        // Fetch AI suggestions in parallel
        const suggestions: Record<string, AISuggestion> = {};
        await Promise.all(
          sortedBookings.map(async (booking) => {
            if (booking.transactionId) {
              const suggestion = await aiService.getTxnIdSuggestion(booking.transactionId);
              suggestions[booking.id] = suggestion;
            }
          })
        );
        setAiSuggestions(suggestions);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        showToast(errorMessage, 'error');
    } finally {
        setIsLoadingBookings(false);
    }
  }, [loggedInOrganizer, showToast]);

  useEffect(() => {
    if (loggedInOrganizer) {
      fetchBookings();
    }
  }, [loggedInOrganizer, fetchBookings]);
  
  const onScanSuccess = useCallback((decodedText: string) => {
    if (!selectedEvent) {
      showToast('Cannot scan: No event selected.', 'error');
      return;
    }
    (async () => {
        setIsCheckingIn(false); // Reset check-in state on new scan
        setIsScannerLoading(true);
        try {
            const data = JSON.parse(decodedText);
            if (data.bookingId) {
                const booking = await db.findBookingById(data.bookingId);
                if (booking) {
                    if (booking.eventId !== selectedEvent.id) {
                        setScanResult({ booking: {} as Booking, event: {} as Event, message: 'Ticket is for a different event!', type: 'error' });
                        return;
                    }
                    if (booking.checkedIn) {
                        setScanResult({ booking, event: selectedEvent, message: 'This ticket has already been used.', type: 'warning' });
                    } else if (booking.status !== BookingStatus.Confirmed) {
                        setScanResult({ booking, event: selectedEvent, message: `Booking is ${booking.status}. Not valid for entry.`, type: 'error' });
                    } else {
                        setScanResult({ booking, event: selectedEvent, message: 'Valid ticket. Ready for check-in.', type: 'success' });
                    }
                } else {
                    setScanResult({ booking: {} as Booking, event: {} as Event, message: 'Invalid QR Code. Booking not found.', type: 'error' });
                }
            } else {
                setScanResult({ booking: {} as Booking, event: {} as Event, message: 'Invalid QR Code format.', type: 'error' });
            }
        } catch (err) {
            setScanResult({ booking: {} as Booking, event: {} as Event, message: 'Invalid QR Code format.', type: 'error' });
        } finally {
            setIsScannerLoading(false);
        }
    })();
  }, [selectedEvent, showToast]);

  const stopScanner = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(err => {
            console.log("QR scanner stop error, likely benign:", err);
        });
        html5QrCodeRef.current = null;
    }
  }, []);

  const startScanner = useCallback(() => {
    setScanResult(null);
    const scannerRegionEl = document.getElementById(SCANNER_REGION_ID);
    if (!scannerRegionEl) return;
    
    const qrCode = new Html5Qrcode(SCANNER_REGION_ID);
    html5QrCodeRef.current = qrCode;

    const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const qrBoxSize = Math.floor(minEdge * 0.75);
        return {
            width: qrBoxSize,
            height: qrBoxSize,
        };
    };

    const config = { 
      fps: 25, 
      qrbox: qrboxFunction,
      aspectRatio: 1.0, // Request a square video feed
      disableFlip: false, // May improve scanning on some devices.
    };

    qrCode.start({ facingMode: "environment" }, config, onScanSuccess, undefined)
    .catch(err => {
        console.error("QR Scanner failed to start.", err);
        showToast("Could not start camera. Check permissions.", "error");
    });
  }, [onScanSuccess, showToast]);

  useEffect(() => {
    if (loggedInOrganizer && selectedEvent && view === 'scanner') {
        startScanner();
    }
    return () => {
        stopScanner();
    };
  }, [loggedInOrganizer, selectedEvent, view, startScanner, stopScanner]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginOrganizer(username, secretId)) {
      setError('');
    } else {
      setError('Incorrect username or Secret ID.');
    }
  };

  const handleLogout = () => {
    logoutOrganizer();
    setUsername('');
    setSecretId('');
    setSelectedEvent(null);
    setBookings([]);
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

  const handleScannerClick = () => {
    setIsFocusing(true);
    setTimeout(() => setIsFocusing(false), 500); // Animation duration
  };
  
  const handleCheckIn = async () => {
      if(scanResult && scanResult.booking && !scanResult.booking.checkedIn){
          setIsCheckingIn(true);
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
          } finally {
              setIsCheckingIn(false);
          }
      }
  }

  const handleEventStatusToggle = (eventId: string, currentStatus: EventStatus) => {
    let newStatus: EventStatus;
    switch (currentStatus) {
      case EventStatus.Upcoming:
        newStatus = EventStatus.Ongoing;
        break;
      case EventStatus.Ongoing:
        newStatus = EventStatus.BookingStopped;
        break;
      case EventStatus.BookingStopped:
        newStatus = EventStatus.Closed;
        break;
      case EventStatus.Closed:
        newStatus = EventStatus.Upcoming;
        break;
      default:
        newStatus = EventStatus.Upcoming;
    }
    updateEventStatus(eventId, newStatus);
    showToast(`Event status changed to ${newStatus}`, 'info');
  };

  if (!loggedInOrganizer) {
    return (
      <div className="max-w-md mx-auto mt-16 animate-fade-in">
        <div className="bg-surface p-8 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-center mb-2 flex items-center justify-center gap-2"><ShieldAlert /> Organizer Access</h1>
          <p className="text-center text-on-surface-secondary mb-6">Login with your Organizer credentials.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-secondary" />
                <input type="text" placeholder="Organizer Username" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full bg-background p-3 pl-10 rounded-md focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-secondary" />
              <input type="password" placeholder="Secret ID" value={secretId} onChange={(e) => setSecretId(e.target.value)} required className="w-full bg-background p-3 pl-10 rounded-md focus:ring-2 focus:ring-primary outline-none"/>
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-6 rounded-md hover:bg-primary-focus transition-colors">Login</button>
          </form>
        </div>
      </div>
    );
  }

  const organizerEvents = loggedInOrganizer.id === 'super-admin'
    ? events
    : events.filter(e => e.organizerId === loggedInOrganizer.id);

  if (!selectedEvent) {
    return (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-extrabold">Welcome, {loggedInOrganizer.username}</h1>
              <button onClick={handleLogout} className="flex items-center gap-2 bg-surface hover:bg-red-500/50 text-on-surface font-semibold py-2 px-4 rounded-md transition-colors">
                  <LogOut size={18} /> Logout
              </button>
          </div>
          <h2 className="text-2xl font-bold mb-6 text-on-surface">{loggedInOrganizer.id === 'super-admin' ? 'All Events' : 'Your Events'}</h2>
          {areEventsLoading ? <div className="text-center py-8"><Loader2 size={32} className="animate-spin inline-block" /></div> :
          organizerEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {organizerEvents.map(event => {
                      let statusToggleAction;
                        switch (event.status) {
                            case EventStatus.Upcoming:
                                statusToggleAction = (
                                    <button onClick={() => handleEventStatusToggle(event.id, event.status)} title="Set to Ongoing" className="w-full p-2 bg-surface hover:bg-background text-on-surface-secondary rounded-md transition-colors flex items-center justify-center gap-2">
                                        <CalendarCheck2 size={16}/> Set Ongoing
                                    </button>
                                );
                                break;
                            case EventStatus.Ongoing:
                                statusToggleAction = (
                                    <button onClick={() => handleEventStatusToggle(event.id, event.status)} title="Stop Bookings" className="w-full p-2 bg-surface hover:bg-background text-on-surface-secondary rounded-md transition-colors flex items-center justify-center gap-2">
                                        <ToggleRight size={16}/> Stop Bookings
                                    </button>
                                );
                                break;
                            case EventStatus.BookingStopped:
                                 statusToggleAction = (
                                    <button onClick={() => handleEventStatusToggle(event.id, event.status)} title="Set to Closed" className="w-full p-2 bg-surface hover:bg-background text-on-surface-secondary rounded-md transition-colors flex items-center justify-center gap-2">
                                        <CalendarX2 size={16}/> Set Closed
                                    </button>
                                );
                                break;
                            case EventStatus.Closed:
                                 statusToggleAction = (
                                    <button onClick={() => handleEventStatusToggle(event.id, event.status)} title="Set to Upcoming" className="w-full p-2 bg-surface hover:bg-background text-on-surface-secondary rounded-md transition-colors flex items-center justify-center gap-2">
                                        <CalendarPlus size={16}/> Re-open as Upcoming
                                    </button>
                                );
                                break;
                        }

                      return (
                      <div key={event.id} className="bg-surface rounded-lg shadow-lg p-6 flex flex-col justify-between hover:shadow-primary/30 transition-shadow">
                        <div>
                          <div className="flex justify-between items-start">
                              <h3 className="text-xl font-bold text-primary mb-2 pr-2">{event.name}</h3>
                              <span className={`px-2 py-1 text-xs font-bold rounded-full whitespace-nowrap ${
                                event.status === EventStatus.Ongoing ? 'bg-green-500/20 text-green-400' :
                                event.status === EventStatus.Upcoming || event.status === EventStatus.BookingStopped ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                                }`}>{event.status}</span>
                          </div>
                          <p className="text-on-surface-secondary text-sm">{event.venue}</p>
                          <p className="text-on-surface-secondary text-sm mb-4">{new Date(event.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</p>
                        </div>
                        <div className="mt-4 space-y-2">
                           <button onClick={() => setSelectedEvent(event)} className="w-full bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary-focus transition-colors flex items-center justify-center gap-2">
                              <Briefcase size={18} /> Manage Event
                          </button>
                          <div className="flex gap-2">
                            {statusToggleAction}
                          </div>
                        </div>
                      </div>
                  )})}
              </div>
          ) : (
              <p className="text-center text-on-surface-secondary p-8 bg-surface rounded-lg">You are not managing any events.</p>
          )}
        </div>
    );
  }

  const eventBookings = bookings.filter(b => b.eventId === selectedEvent.id);
  const searchedBookings = eventBookings.filter(b => 
    b.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.id && b.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const stats = {
    total: eventBookings.length,
    confirmed: eventBookings.filter(b => b.status === BookingStatus.Confirmed).length,
    pending: eventBookings.filter(b => b.status === BookingStatus.Pending).length
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
        <div>
            <button onClick={() => { setSelectedEvent(null); setView('dashboard'); setSearchTerm(''); }} className="flex items-center gap-2 mb-2 text-primary hover:underline">
                <ArrowLeft size={16} /> Back to My Events
            </button>
            <h1 className="text-4xl font-extrabold">Manage: <span className="text-primary">{selectedEvent.name}</span></h1>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-surface hover:bg-red-500/50 text-on-surface font-semibold py-2 px-4 rounded-md transition-colors">
            <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface p-4 rounded-lg flex items-center gap-4"><Ticket size={32} className="text-accent"/><div ><p className="text-2xl font-bold">{stats.total}</p><p className="text-on-surface-secondary">Total Bookings</p></div></div>
        <div className="bg-surface p-4 rounded-lg flex items-center gap-4"><CheckCircle size={32} className="text-green-500"/><div ><p className="text-2xl font-bold">{stats.confirmed}</p><p className="text-on-surface-secondary">Confirmed</p></div></div>
        <div className="bg-surface p-4 rounded-lg flex items-center gap-4"><Clock size={32} className="text-yellow-500"/><div ><p className="text-2xl font-bold">{stats.pending}</p><p className="text-on-surface-secondary">Pending</p></div></div>
      </div>

      <div className="flex flex-wrap border-b border-surface mb-6">
        <button onClick={() => setView('dashboard')} className={`px-6 py-3 font-semibold flex items-center gap-2 ${view === 'dashboard' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-secondary'}`}><Users size={18}/>Bookings</button>
        <button onClick={() => setView('scanner')} className={`px-6 py-3 font-semibold flex items-center gap-2 ${view === 'scanner' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-secondary'}`}><QrCode size={18}/>QR Scanner</button>
        <button onClick={() => setView('pins')} className={`px-6 py-3 font-semibold flex items-center gap-2 ${view === 'pins' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-secondary'}`}><KeyRound size={18}/>User Pins</button>
      </div>

      {(view === 'dashboard' || view === 'pins') && (
         <div className="relative mb-6 max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-secondary" />
            <input type="text" placeholder="Search by name, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-surface p-3 pl-12 rounded-md focus:ring-2 focus:ring-primary outline-none" />
         </div>
      )}

      {view === 'dashboard' && (
        <div>
          {isLoadingBookings ? (
            <div className="text-center py-8"><Loader2 size={32} className="animate-spin inline-block" /></div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="space-y-4 md:hidden">
                {searchedBookings.map(booking => {
                  const serialNumber = eventBookings.findIndex(b => b.id === booking.id) + 1;
                  return (
                    <div key={booking.id} className="bg-surface rounded-lg p-4 shadow-md space-y-3">
                        <div>
                            <div className="flex justify-between items-start gap-4">
                              <span className="font-bold text-lg text-on-surface break-words flex-1 pr-2">{booking.userName}</span>
                              <span className="font-mono text-lg text-primary font-bold">#{serialNumber > 0 ? serialNumber : '-'}</span>
                            </div>
                            <div className="text-sm text-on-surface-secondary break-all">{booking.userEmail}</div>
                            <div className="text-xs text-on-surface-secondary mt-1">{new Date(booking.createdAt).toLocaleString()}</div>
                        </div>

                        <div className="border-t border-background pt-3 space-y-2">
                          {booking.entryNumber && <p className="text-sm text-on-surface-secondary"><span className="font-semibold text-on-surface">Entry #:</span> {booking.entryNumber}</p>}
                            {booking.transactionId && (
                                <div className="text-sm text-on-surface-secondary flex flex-wrap items-center gap-x-2">
                                    <span className="font-semibold text-on-surface">Txn ID:</span> 
                                    <span className="break-all">{booking.transactionId}</span>
                                    <AiSuggestionIcon suggestion={aiSuggestions[booking.id]} />
                                </div>
                            )}
                        </div>
                        
                        <div className="border-t border-background pt-3 flex flex-wrap gap-4 items-center justify-between">
                            <div>
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${ booking.status === BookingStatus.Confirmed ? 'bg-green-500/20 text-green-400' : booking.status === BookingStatus.Pending ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {booking.status}
                                </span>
                                {booking.checkedIn && <span className="mt-2 block px-2 py-1 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-400">Checked In</span>}
                            </div>
                            {booking.paymentProof && (
                              <button onClick={() => setViewingProof(booking.paymentProof!)} className="p-2 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/40 flex items-center gap-1.5 text-sm font-semibold">
                                  <Eye size={16} /> View Proof
                              </button>
                            )}
                        </div>

                        {booking.status === BookingStatus.Pending && (
                            <div className="flex gap-2 border-t border-background pt-3">
                                <button title="Approve Booking" onClick={() => handleBookingStatusChange(booking, BookingStatus.Confirmed)} className="flex-1 p-2 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/40 flex items-center justify-center gap-2"><CheckCircle size={18} /> Approve</button>
                                <button title="Reject Booking" onClick={() => handleBookingStatusChange(booking, BookingStatus.Rejected)} className="flex-1 p-2 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/40 flex items-center justify-center gap-2"><XCircle size={18} /> Reject</button>
                            </div>
                        )}
                    </div>
                  );
                })}
                {searchedBookings.length === 0 && <p className="text-center p-8 text-on-surface-secondary">No bookings found matching your search.</p>}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-surface rounded-lg shadow-lg overflow-x-auto">
                <table className="w-full text-left min-w-[850px]">
                  <thead className="bg-background">
                    <tr>
                      <th className="p-4 font-semibold w-12">#</th>
                      <th className="p-4 font-semibold">Attendee</th>
                      <th className="p-4 font-semibold">Details</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Proof</th>
                      <th className="p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchedBookings.map(booking => {
                      const serialNumber = eventBookings.findIndex(b => b.id === booking.id) + 1;
                      return (
                        <tr key={booking.id} className="border-t border-background hover:bg-background/50">
                          <td className="p-4 align-top font-mono text-lg text-primary">{serialNumber > 0 ? serialNumber : '-'}</td>
                          <td className="p-4 align-top">
                            <div className="font-bold">{booking.userName}</div>
                            <div className="text-sm text-on-surface-secondary">{booking.userEmail}</div>
                            <div className="text-xs text-on-surface-secondary mt-1">{new Date(booking.createdAt).toLocaleString()}</div>
                          </td>
                          <td className="p-4 align-top">
                            {booking.entryNumber && <div className="text-sm"><span className="font-semibold text-on-surface-secondary">Entry #:</span> {booking.entryNumber}</div>}
                            {booking.transactionId && (
                              <div className="text-sm flex items-center gap-2">
                                <span className="font-semibold text-on-surface-secondary">Txn ID:</span> {booking.transactionId}
                                <AiSuggestionIcon suggestion={aiSuggestions[booking.id]} />
                              </div>
                            )}
                          </td>
                          <td className="p-4 align-top">
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${ booking.status === BookingStatus.Confirmed ? 'bg-green-500/20 text-green-400' : booking.status === BookingStatus.Pending ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                              {booking.status}
                            </span>
                            {booking.checkedIn && <span className="mt-2 block px-2 py-1 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-400">Checked In</span>}
                          </td>
                          <td className="p-4 align-top">
                              {booking.paymentProof ? (
                                  <button onClick={() => setViewingProof(booking.paymentProof!)} className="p-2 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/40 flex items-center gap-1 text-sm">
                                  <Eye size={16} /> View
                                  </button>
                              ) : (
                                  <span className="text-sm text-on-surface-secondary">N/A</span>
                              )}
                            </td>
                          <td className="p-4 align-top">
                            {booking.status === BookingStatus.Pending && (
                              <div className="flex gap-2">
                                <button title="Approve Booking" onClick={() => handleBookingStatusChange(booking, BookingStatus.Confirmed)} className="p-2 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/40"><CheckCircle size={18} /></button>
                                <button title="Reject Booking" onClick={() => handleBookingStatusChange(booking, BookingStatus.Rejected)} className="p-2 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/40"><XCircle size={18} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {searchedBookings.length === 0 && <p className="text-center p-8 text-on-surface-secondary">No bookings found matching your search.</p>}
              </div>
            </>
          )}
        </div>
      )}
      {view === 'scanner' && (
        <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="bg-surface p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><QrCode /> Scan Ticket</h2>
                <div 
                  id={SCANNER_REGION_ID} 
                  className="w-full bg-gray-900 rounded-md aspect-square overflow-hidden relative cursor-pointer"
                  onClick={handleScannerClick}
                  title="Tap to focus"
                >
                   {isFocusing && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-24 h-24 border-2 border-white rounded-md animate-focus-pulse"></div>
                      </div>
                  )}
                </div>
            </div>
            <div className="bg-surface p-6 rounded-lg shadow-lg min-h-[300px] flex flex-col justify-center transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><BadgeInfo /> Verification Result</h2>
                {isScannerLoading ? (
                    <div className="text-center py-8"><Loader2 size={32} className="animate-spin text-primary" /></div>
                ) : scanResult ? (
                    <div className="animate-fade-in text-center">
                        {/* Success State */}
                        {scanResult.type === 'success' && (
                            <div className="space-y-4">
                                <CheckCircle size={64} className="text-green-500 mx-auto" />
                                <h3 className="text-2xl font-bold text-green-400">
                                    {scanResult.booking.checkedIn ? 'Check-in Successful!' : 'Valid Ticket'}
                                </h3>
                                <div className="text-left bg-background p-4 rounded-lg space-y-2">
                                    <p><strong>Name:</strong> <span className="text-on-surface text-lg font-semibold">{scanResult.booking.userName}</span></p>
                                    <p><strong>Status:</strong> <span className="text-on-surface font-semibold">{scanResult.booking.status}</span></p>
                                </div>
                                {!scanResult.booking.checkedIn && (
                                    <button 
                                        onClick={handleCheckIn} 
                                        className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-md hover:bg-green-700 transition-colors text-lg flex items-center justify-center gap-3 disabled:bg-gray-500 disabled:cursor-not-allowed"
                                        disabled={isCheckingIn}
                                    >
                                        {isCheckingIn ? <Loader2 className="animate-spin" /> : <UserCheck />}
                                        {isCheckingIn ? 'Processing...' : 'Confirm Check-In'}
                                    </button>
                                )}
                            </div>
                        )}
                        {/* Warning State */}
                        {scanResult.type === 'warning' && (
                            <div className="space-y-4">
                                <ShieldAlert size={64} className="text-yellow-500 mx-auto" />
                                <h3 className="text-2xl font-bold text-yellow-400">{scanResult.message}</h3>
                                <div className="text-left bg-background p-4 rounded-lg space-y-2">
                                    <p><strong>Name:</strong> <span className="text-on-surface text-lg font-semibold">{scanResult.booking.userName}</span></p>
                                    <p><strong>Status:</strong> <span className="text-on-surface font-semibold">{scanResult.booking.status}</span></p>
                                </div>
                            </div>
                        )}
                        {/* Error State */}
                        {scanResult.type === 'error' && (
                            <div className="space-y-4">
                                <XCircle size={64} className="text-red-500 mx-auto" />
                                <h3 className="text-2xl font-bold text-red-400">{scanResult.message}</h3>
                                {scanResult.booking.id && (
                                   <div className="text-left bg-background p-4 rounded-lg space-y-2">
                                       <p><strong>Name:</strong> <span className="text-on-surface text-lg font-semibold">{scanResult.booking.userName}</span></p>
                                       <p><strong>Status:</strong> <span className="text-on-surface font-semibold">{scanResult.booking.status}</span></p>
                                   </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-on-surface-secondary space-y-4">
                        <QrCode size={48} className="mx-auto" />
                        <p>Point the camera at a QR code to begin verification.</p>
                    </div>
                )}
            </div>
        </div>
      )}
      {view === 'pins' && (
         <>
          {/* Mobile Card View */}
          <div className="space-y-4 md:hidden">
              {searchedBookings.map(booking => (
                <div key={booking.id} className="bg-surface rounded-lg p-4 shadow-md">
                   <div>
                      <div className="font-bold text-lg text-on-surface">{booking.userName}</div>
                      <div className="text-sm text-on-surface-secondary break-all">{booking.userEmail}</div>
                   </div>
                   <div className="border-t border-background mt-3 pt-3">
                       <span className="text-sm text-on-surface-secondary">Secret PIN:</span>
                       <p className="font-mono text-xl text-accent tracking-widest">{booking.pin}</p>
                   </div>
                </div>
              ))}
              {searchedBookings.length === 0 && <p className="text-center p-8 text-on-surface-secondary">No users found matching your search.</p>}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-surface rounded-lg shadow-lg overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-background">
                <tr>
                  <th className="p-4 font-semibold">Attendee</th>
                  <th className="p-4 font-semibold">Secret PIN</th>
                </tr>
              </thead>
              <tbody>
                {searchedBookings.map(booking => (
                    <tr key={booking.id} className="border-t border-background hover:bg-background/50">
                      <td className="p-4">
                        <div className="font-bold">{booking.userName}</div>
                        <div className="text-sm text-on-surface-secondary">{booking.userEmail}</div>
                        {booking.entryNumber && <div className="text-xs text-accent">Entry #: {booking.entryNumber}</div>}
                      </td>
                      <td className="p-4 font-mono text-lg text-accent tracking-widest">{booking.pin}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {searchedBookings.length === 0 && <p className="text-center p-8 text-on-surface-secondary">No users found matching your search.</p>}
          </div>
        </>
      )}
      {viewingProof && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in" onClick={() => setViewingProof(null)}>
            <div className="bg-surface p-4 rounded-lg shadow-xl relative max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-on-surface">Payment Proof</h3>
                <button onClick={() => setViewingProof(null)} className="absolute top-4 right-4 text-on-surface-secondary hover:text-on-surface" aria-label="Close">
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