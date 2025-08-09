import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { Event } from '../types';
import { ArrowLeft, Loader2, Copy, Check } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const BookingPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    transactionId: '',
    pin: '',
    confirmPin: ''
  });
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchEvent = async () => {
      if (eventId) {
        try {
          const foundEvent = await db.getEventById(eventId);
          if (foundEvent) {
            setEvent(foundEvent);
          } else {
            setError('Event not found.');
          }
        } catch (err) {
            setError('Failed to load event details.');
        } finally {
            setIsPageLoading(false);
        }
      }
    };
    fetchEvent();
  }, [eventId]);

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
    if (!event) return;
    navigator.clipboard.writeText(event.upiId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.pin !== formData.confirmPin) {
      setError('PINs do not match.');
      return;
    }
    if(formData.pin.length !== 4){
      setError('PIN must be exactly 4 digits.');
      return;
    }
    if (!paymentProofFile) {
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
        transactionId: formData.transactionId,
        pin: formData.pin,
      }, paymentProofFile);

      showToast('Booking submitted for approval!', 'success');
      navigate('/my-tickets');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isPageLoading) {
    return <div className="text-center"><Loader2 className="animate-spin" /></div>;
  }
  
  if (error && !event) {
    return <div className="text-center text-red-400">{error}</div>;
  }
  
  if (!event) {
    return <div className="text-center text-on-surface-secondary">Event not found.</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
       <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-6 text-primary hover:underline">
          <ArrowLeft size={16} /> Back to Events
       </button>
      <div className="bg-surface rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-2">Register for: <span className="text-primary">{event.name}</span></h1>
        <p className="text-on-surface-secondary mb-6">Complete payment using the details below, then fill out the form to secure your spot.</p>

        <div className="bg-background p-6 rounded-lg mb-8 border border-primary/20">
            <h2 className="text-2xl font-bold mb-4 text-on-surface">Payment Details</h2>
            <div className="flex flex-wrap items-start gap-8">
                <div className="flex-1 min-w-[250px]">
                    <label className="block text-sm font-medium text-on-surface-secondary">UPI ID</label>
                    <div className="mt-1 flex items-center gap-2">
                    <input 
                        type="text" 
                        readOnly 
                        value={event.upiId} 
                        className="w-full bg-surface p-3 rounded-md outline-none text-on-surface font-mono"
                    />
                    <button 
                        onClick={handleCopy}
                        className="p-3 bg-primary text-white rounded-md hover:bg-primary-focus transition-colors"
                        title="Copy UPI ID"
                        aria-label="Copy UPI ID"
                    >
                        {isCopied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                    </div>
                    {event.paymentLink && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-on-surface-secondary">Payment Link</label>
                        <a 
                          href={event.paymentLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline"
                        >
                          Make Payment
                        </a>
                      </div>
                    )}
                </div>
                {event.qrCodeImage && (
                    <div className="text-center">
                        <label className="block text-sm font-medium text-on-surface-secondary mb-2">or Scan QR Code</label>
                        <img src={event.qrCodeImage} alt="Payment QR Code" className="w-36 h-36 rounded-lg bg-white p-1 shadow-md" />
                    </div>
                )}
            </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" name="name" placeholder="Full Name" required className="w-full bg-background p-3 rounded-md focus:ring-2 focus:ring-primary outline-none" onChange={handleInputChange} />
            <input type="email" name="email" placeholder="Email Address" required className="w-full bg-background p-3 rounded-md focus:ring-2 focus:ring-primary outline-none" onChange={handleInputChange} />
            <input type="tel" name="phone" placeholder="Phone Number" required className="w-full bg-background p-3 rounded-md focus:ring-2 focus:ring-primary outline-none" onChange={handleInputChange} />
            <input type="text" name="transactionId" placeholder="Payment Transaction ID" required className="w-full bg-background p-3 rounded-md focus:ring-2 focus:ring-primary outline-none" onChange={handleInputChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-secondary mb-2">Upload Payment Screenshot</label>
            <input type="file" name="paymentProof" accept="image/*" required className="w-full text-sm text-on-surface-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-focus" onChange={handleFileChange}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="password" name="pin" placeholder="Create a 4-digit Secret PIN" required minLength={4} maxLength={4} pattern="\d{4}" title="PIN must be exactly 4 digits" className="w-full bg-background p-3 rounded-md focus:ring-2 focus:ring-primary outline-none" onChange={handleInputChange} />
            <input type="password" name="confirmPin" placeholder="Confirm PIN" required minLength={4} maxLength={4} className="w-full bg-background p-3 rounded-md focus:ring-2 focus:ring-primary outline-none" onChange={handleInputChange} />
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full bg-primary text-white font-bold py-3 px-6 rounded-md hover:bg-primary-focus transition-colors duration-300 flex items-center justify-center gap-2 disabled:bg-gray-500">
            {isLoading ? <><Loader2 className="animate-spin" /> Submitting...</> : 'Submit Booking'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingPage;