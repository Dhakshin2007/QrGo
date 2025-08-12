

import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Event, EventStatus } from '../types';
import { ArrowLeft, Loader2, Copy, Check, ExternalLink, User, Mail, Phone, KeyRound, FileText, ClipboardCheck, Trash2, IndianRupee, Building } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useEvents } from '../App';
import { db } from '../services/db';
import { ORGANIZERS } from '../contexts/AuthContext';

const BookingPage: React.FC = () => {
  const { eventId } = ReactRouterDOM.useParams<{ eventId: string }>();
  const navigate = ReactRouterDOM.useNavigate();
  const { events, isLoading: areEventsLoading } = useEvents();
  const [event, setEvent] = useState<Event | null>(null);
  
  const initialFormData = {
    name: '',
    email: '',
    phone: '',
    entryNumber: '',
    transactionId: '',
    pin: '',
    confirmPin: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { showToast } = useToast();
  
  const organizer = event ? ORGANIZERS.find(o => o.id === event.organizerId) : null;

  useEffect(() => {
    if (eventId) {
      const savedData = localStorage.getItem(`bookingForm-${eventId}`);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setFormData({ ...initialFormData, ...parsedData });
        } catch (e) {
          console.error("Failed to parse booking form data from localStorage", e);
        }
      }
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId && Object.values(formData).some(field => field !== '')) {
        localStorage.setItem(`bookingForm-${eventId}`, JSON.stringify(formData));
    }
  }, [formData, eventId]);

  useEffect(() => {
    if (!areEventsLoading && eventId) {
      const foundEvent = events.find(e => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
        if (foundEvent.status === EventStatus.Upcoming) {
          setError('Booking for this event is not open yet.');
          showToast('This event is not yet open for booking.', 'info');
        } else if (foundEvent.status === EventStatus.Closed) {
          setError('Booking for this event has closed.');
          showToast('This event is now closed.', 'info');
        }
      } else {
        setError('Event not found.');
      }
    }
  }, [eventId, events, areEventsLoading, showToast]);
  
  const isFreeEvent = event && !event.upiId;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProofFile(file);
    }
  };
  
  const handleCopy = () => {
    if (!event || !event.upiId) return;
    navigator.clipboard.writeText(event.upiId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }
  
  const handleClearForm = () => {
    setFormData(initialFormData);
    setPaymentProofFile(null);
    if (eventId) {
      localStorage.removeItem(`bookingForm-${eventId}`);
    }
    showToast('Form has been cleared', 'info');
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (event?.status === EventStatus.Upcoming) {
      setError('Booking for this event is not open yet.');
      return;
    }
    if (event?.status === EventStatus.Closed) {
      setError('Booking for this event has closed.');
      return;
    }
    if (formData.pin !== formData.confirmPin) {
      setError('PINs do not match.');
      return;
    }
    if(formData.pin.length !== 4){
      setError('PIN must be exactly 4 digits.');
      return;
    }
    if (!isFreeEvent && !paymentProofFile) {
      setError('Please upload proof of payment.');
      return;
    }
    
    setIsLoading(true);
    try {
      if (!eventId) throw new Error("Event ID is missing");
      
      await db.addBooking({
        eventId: eventId,
        userName: formData.name,
        userEmail: formData.email.toLowerCase(),
        userPhone: formData.phone,
        entryNumber: event?.requiresEntryNumber ? formData.entryNumber : null,
        transactionId: isFreeEvent ? null : formData.transactionId,
        pin: formData.pin,
      }, isFreeEvent ? null : paymentProofFile);

      const successMessage = isFreeEvent 
        ? 'Booking confirmed! Your ticket is ready.' 
        : 'Booking submitted for approval!';
      showToast(successMessage, 'success');
      
      if (eventId) {
          localStorage.removeItem(`bookingForm-${eventId}`);
      }
      navigate('/my-tickets');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (areEventsLoading) {
    return <div className="text-center py-16"><Loader2 size={32} className="animate-spin inline-block" /></div>;
  }
  
  if (error && !event) {
    return <div className="text-center text-red-400 py-16">{error}</div>;
  }
  
  if (!event) {
    return <div className="text-center text-on-surface-secondary py-16">Event not found.</div>
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
       <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-6 text-primary hover:underline">
          <ArrowLeft size={16} /> Back to Events
       </button>
      <div className="bg-surface rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-1">Register for: <span className="text-primary">{event.name}</span></h1>
        {organizer && (
            <div className="flex items-center gap-2 text-md text-on-surface-secondary mb-4">
                <Building size={16} />
                <span>Organized by <span className="font-semibold">{organizer.name}</span></span>
            </div>
        )}
        <p className="text-on-surface-secondary mb-6">
            { event.status === EventStatus.Upcoming ? 'Booking for this event will open soon.'
            : event.status === EventStatus.Closed ? 'Booking for this event has closed.'
            : isFreeEvent
                ? 'This is a free event. Fill out the form below to secure your spot.'
                : 'Complete payment using the details below, then fill out the form to secure your spot.'
            }
        </p>
        
        {!isFreeEvent && event.status === EventStatus.Ongoing && (
            <div className="bg-background p-6 rounded-lg mb-8 border border-primary/20">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-on-surface">Payment Instructions</h2>
                    {event.price && (
                        <div className="flex items-center gap-2 bg-primary text-white text-xl font-bold py-2 px-4 rounded-lg">
                            <IndianRupee size={22} />
                            <span>{event.price}</span>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-8 items-center">
                    <div>
                        <p className="text-on-surface-secondary mb-2">Scan the QR code or use the UPI ID:</p>
                        <div className="flex items-center gap-2 bg-gray-900 p-3 rounded-md">
                           <span className="font-mono text-lg text-accent">{event.upiId}</span>
                           <button onClick={handleCopy} title="Copy UPI ID" className="p-1 text-on-surface-secondary hover:text-primary">
                               {isCopied ? <Check size={18} /> : <Copy size={18} />}
                           </button>
                        </div>
                        {/* <a href={event.upiLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-primary hover:underline">
                            Pay with UPI App <ExternalLink size={16}/>
                        </a> */}
                    </div>
                    {event.qrCodeImage && <img src={event.qrCodeImage} alt="Payment QR Code" className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg bg-white p-1" />}
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
           <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <legend className="text-xl font-semibold mb-4 w-full col-span-1 md:col-span-2 border-b border-background pb-2">Your Details</legend>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-secondary" size={20} />
                    <input type="text" name="name" placeholder="Full Name" required value={formData.name} onChange={handleInputChange} className="w-full bg-background p-3 pl-10 rounded-md focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-secondary" size={20} />
                    <input type="email" name="email" placeholder="Email Address" required value={formData.email} onChange={handleInputChange} className="w-full bg-background p-3 pl-10 rounded-md focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="relative col-span-1 md:col-span-2">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-secondary" size={20} />
                    <input type="tel" name="phone" placeholder="Phone Number" required value={formData.phone} onChange={handleInputChange} className="w-full bg-background p-3 pl-10 rounded-md focus:ring-2 focus:ring-primary outline-none" />
                </div>
           </fieldset>
           
           {event.requiresEntryNumber && (
             <fieldset>
                <legend className="text-xl font-semibold mb-4 w-full border-b border-background pb-2">Registration Details</legend>
                <div className="relative">
                  <ClipboardCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-secondary" size={20} />
                  <input type="text" name="entryNumber" placeholder="Entry Number / College ID" required value={formData.entryNumber} onChange={handleInputChange} className="w-full bg-background p-3 pl-10 rounded-md focus:ring-2 focus:ring-primary outline-none" />
                </div>
             </fieldset>
           )}

           {!isFreeEvent && (
                <fieldset>
                    <legend className="text-xl font-semibold mb-4 w-full border-b border-background pb-2">Payment Confirmation</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-secondary" size={20} />
                            <input type="text" name="transactionId" placeholder="Transaction ID / UTR" required value={formData.transactionId} onChange={handleInputChange} className="w-full bg-background p-3 pl-10 rounded-md focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div className="bg-background rounded-md flex items-center justify-between p-3">
                            <span className="text-on-surface-secondary text-sm truncate pr-2">{paymentProofFile?.name || 'Upload payment screenshot...'}</span>
                            <label htmlFor="paymentProofFile" className="bg-primary text-white font-bold py-1 px-3 rounded-md hover:bg-primary-focus transition-colors cursor-pointer text-sm whitespace-nowrap">
                                Choose File
                            </label>
                            <input type="file" id="paymentProofFile" name="paymentProofFile" accept="image/*" required onChange={handleFileChange} className="hidden" />
                        </div>
                    </div>
                </fieldset>
           )}

           <fieldset>
                <legend className="text-xl font-semibold mb-4 w-full border-b border-background pb-2">Create Your PIN</legend>
                <p className="text-on-surface-secondary -mt-3 mb-4 text-sm">Create a 4-digit PIN to access your tickets later. Don't forget it!</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-secondary" size={20} />
                        <input type="password" name="pin" placeholder="4-Digit PIN" required value={formData.pin} onChange={handleInputChange} pattern="\d{4}" title="PIN must be exactly 4 digits" maxLength={4} className="w-full bg-background p-3 pl-10 rounded-md focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-secondary" size={20} />
                        <input type="password" name="confirmPin" placeholder="Confirm PIN" required value={formData.confirmPin} onChange={handleInputChange} pattern="\d{4}" title="PIN must be exactly 4 digits" maxLength={4} className="w-full bg-background p-3 pl-10 rounded-md focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                </div>
           </fieldset>

           {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-md">{error}</p>}
           
            <div className="flex flex-col-reverse sm:flex-row-reverse gap-4 pt-4 border-t border-background">
                <button type="submit" disabled={isLoading || event.status !== EventStatus.Ongoing} className="w-full sm:flex-1 bg-accent text-white font-bold py-4 px-6 rounded-md hover:bg-indigo-600 transition-colors text-lg flex items-center justify-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed">
                  {isLoading && <Loader2 className="animate-spin" />}
                  {(() => {
                      if (event.status === EventStatus.Upcoming) return "Booking Not Available";
                      if (event.status === EventStatus.Closed) return "Booking Closed";
                      return "Complete Registration";
                  })()}
                </button>
                <button type="button" onClick={handleClearForm} title="Clear all fields" className="w-full sm:w-auto bg-surface text-on-surface-secondary font-bold p-4 rounded-md hover:bg-background transition-colors flex items-center justify-center gap-2">
                   <Trash2 size={18} /> <span className="sm:hidden">Clear Form</span>
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default BookingPage;