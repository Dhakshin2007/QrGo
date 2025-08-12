import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Booking, Event, BookingStatus, EventStatus } from '../types';
import { Calendar, MapPin, User, CheckCircle, Clock, XCircle, QrCode, CalendarX2, Loader2, MapPinned } from 'lucide-react';
import { ORGANIZERS } from '../contexts/AuthContext';
import { LOGO_URL } from '../constants';

interface TicketCardProps {
  booking: Booking;
  event: Event | undefined;
}

const TicketCard: React.FC<TicketCardProps> = ({ booking, event }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const organizer = event ? ORGANIZERS.find(o => o.id === event.organizerId) : undefined;

  useEffect(() => {
    // Only generate QR code if booking is confirmed and event is not closed.
    if (booking.status === BookingStatus.Confirmed && event && event.status !== EventStatus.Closed) {
      const qrData = JSON.stringify({ bookingId: booking.id, eventId: booking.eventId, userName: booking.userName });
      QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error(err));
    } else {
      // Clear QR code if conditions are not met (e.g., event is closed)
      setQrCodeUrl('');
    }
  }, [booking.status, booking.id, booking.eventId, booking.userName, event]);

  if (!event) {
    return <div className="bg-surface rounded-lg p-6 text-center text-red-400">Event details not found for this booking.</div>;
  }

  const statusInfo = {
    [BookingStatus.Confirmed]: { text: 'Confirmed', icon: <CheckCircle className="text-green-400" />, color: 'text-green-400', bgColor: 'bg-green-500/10' },
    [BookingStatus.Pending]: { text: 'Pending Approval', icon: <Clock className="text-yellow-400" />, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
    [BookingStatus.Rejected]: { text: 'Rejected', icon: <XCircle className="text-red-400" />, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  };

  const currentStatus = statusInfo[booking.status];

  return (
    <div className="bg-surface rounded-lg shadow-lg overflow-hidden transition-all duration-300">
      <div className={`p-4 ${currentStatus.bgColor} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          {organizer && <img src={organizer.logoUrl} alt={`${organizer.name} logo`} className="h-10 w-10 rounded-full bg-white object-contain p-1" />}
          <h3 className="text-xl font-bold text-on-surface">{event.name}</h3>
        </div>
        <span className={`flex items-center gap-2 font-semibold ${currentStatus.color}`}>
          {currentStatus.icon} {currentStatus.text}
        </span>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <User className="text-primary" />
            <div>
              <p className="text-sm text-on-surface-secondary">Attendee</p>
              <p className="font-semibold">{booking.userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="text-primary" />
            <div>
              <p className="text-sm text-on-surface-secondary">Date & Time</p>
              <p className="font-semibold">{new Date(event.date).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', timeZoneName: 'short' })}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-on-surface-secondary">Venue</p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold">{event.venue}</p>
                {event.venueMapLink && (
                  <a href={event.venueMapLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-focus -m-1 p-1 rounded-full inline-flex items-center gap-1 text-xs" title="Open in Maps">
                    <MapPinned size={14} /> <span>Map</span>
                  </a>
                )}
              </div>
            </div>
          </div>
          {booking.checkedIn && (
              <div className="flex items-center gap-2 text-green-400 font-bold p-2 bg-green-500/10 rounded-md">
                <CheckCircle /> Checked In
              </div>
          )}
        </div>
        <div className="flex flex-col items-center justify-center text-center">
          {booking.status === BookingStatus.Confirmed ? (
            event.status === EventStatus.Closed ? (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-secondary p-4 bg-background rounded-lg">
                  <CalendarX2 size={48} className="mb-4 text-red-400" />
                  <p className="font-semibold">Event Concluded</p>
                  <p className="text-sm">This ticket is no longer valid.</p>
                </div>
              ) : qrCodeUrl ? (
                <>
                  <img src={qrCodeUrl} alt="QR Code" className="rounded-lg w-40 h-40 md:w-48 md:h-48 bg-white p-2" />
                  <p className="text-sm text-on-surface-secondary mt-2">Present this at the entrance</p>
                  <div className="mt-4 flex items-center justify-center gap-2 opacity-70">
                    <img src={LOGO_URL} alt="QrGo Logo" className="h-4 w-auto" />
                    <p className="text-xs text-on-surface-secondary">
                      Powered by <span className="font-bold text-on-surface">QrGo</span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-secondary">
                  <Loader2 size={32} className="animate-spin text-primary mb-2" />
                  <p>Generating QR Code...</p>
                </div>
              )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-secondary p-4 bg-background rounded-lg">
              <QrCode size={48} className="mb-4" />
              <p className="font-semibold">QR Code Unavailable</p>
              <p className="text-sm">Your booking is not yet confirmed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketCard;