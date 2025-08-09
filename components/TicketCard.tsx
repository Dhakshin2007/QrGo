
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Booking, Event, BookingStatus } from '../types';
import { Calendar, MapPin, User, CheckCircle, Clock, XCircle, QrCode } from 'lucide-react';

interface TicketCardProps {
  booking: Booking;
  event: Event | undefined;
}

const TicketCard: React.FC<TicketCardProps> = ({ booking, event }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (booking.status === BookingStatus.Confirmed) {
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
    }
  }, [booking]);

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
        <h3 className="text-xl font-bold text-on-surface">{event.name}</h3>
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
              <p className="font-semibold">{new Date(event.date).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="text-primary" />
            <div>
              <p className="text-sm text-on-surface-secondary">Venue</p>
              <p className="font-semibold">{event.venue}</p>
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
            qrCodeUrl ? (
              <>
                <img src={qrCodeUrl} alt="QR Code" className="rounded-lg w-48 h-48 bg-white p-2" />
                <p className="text-sm text-on-surface-secondary mt-2">Present this at the entrance</p>
              </>
            ) : <p>Generating QR Code...</p>
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
