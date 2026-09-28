import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, RotateCcw, MonitorPlay, Radio } from 'lucide-react';
import { SeatingConfig, SeatInfo, SeatStatus, BookingStatus } from '../types';
import { db } from '../services/db';
import { supabase } from '../services/supabaseClient';

const SEAT_STYLES: Record<SeatStatus, { base: string; label: string }> = {
  [SeatStatus.Available]:   { base: 'bg-surface border-2 border-primary/40 hover:bg-primary/20 hover:border-primary cursor-pointer', label: 'Available' },
  [SeatStatus.Selected]:    { base: 'bg-primary border-2 border-primary scale-105 shadow-lg shadow-primary/40 cursor-pointer', label: 'Selected' },
  [SeatStatus.Pending]:     { base: 'bg-yellow-500/20 border-2 border-yellow-500/60 cursor-not-allowed', label: 'Pending' },
  [SeatStatus.Booked]:      { base: 'bg-red-500/20 border-2 border-red-500/50 cursor-not-allowed', label: 'Booked' },
  [SeatStatus.Unavailable]: { base: 'bg-background border-2 border-background opacity-30 cursor-not-allowed', label: 'Unavailable' },
};

interface SeatMapProps {
  eventId: string;
  config: SeatingConfig;
  selectedSeats: string[];
  onSelectionChange: (seats: string[]) => void;
  readOnly?: boolean;
}

const SeatMap: React.FC<SeatMapProps> = ({
  eventId,
  config,
  selectedSeats,
  onSelectionChange,
  readOnly = false,
}) => {
  const [occupancy, setOccupancy] = useState<Map<string, BookingStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const maxSeats = config.maxSeatsPerBooking ?? Infinity;

  const loadOccupancy = useCallback(async () => {
    try {
      const data = await db.getSeatOccupancy(eventId);
      setOccupancy(data);
    } catch (err) {
      setError('Could not load seat availability. Please refresh.');
      console.error('[SeatMap] loadOccupancy error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Initial load + Realtime WebSocket channel
  useEffect(() => {
    loadOccupancy();

    // Subscribe to real-time changes on the seat_reservations table
    const channel = supabase
      .channel(`seat-reservations-realtime-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seat_reservations',
          filter: `eventId=eq.${eventId}`,
        },
        () => {
          console.log('[SeatMap] Realtime update received. Refreshing seat occupancy...');
          loadOccupancy();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLiveConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, loadOccupancy]);

  const buildGrid = (): SeatInfo[][] => {
    return config.rows.map(row => {
      return Array.from({ length: row.seats }, (_, idx) => {
        const seatId = row.label + '-' + (idx + 1);
        let status: SeatStatus;
        if (row.unavailableSeats?.includes(idx)) status = SeatStatus.Unavailable;
        else if (selectedSeats.includes(seatId)) status = SeatStatus.Selected;
        else {
          const bs = occupancy.get(seatId);
          if (bs === BookingStatus.Confirmed) status = SeatStatus.Booked;
          else if (bs === BookingStatus.Pending) status = SeatStatus.Pending;
          else status = SeatStatus.Available;
        }
        return { id: seatId, rowLabel: row.label, seatNumber: idx + 1, status };
      });
    });
  };

  const handleSeatClick = (seat: SeatInfo) => {
    if (readOnly) return;
    if ([SeatStatus.Unavailable, SeatStatus.Booked, SeatStatus.Pending].includes(seat.status)) return;
    if (seat.status === SeatStatus.Selected) {
      onSelectionChange(selectedSeats.filter(id => id !== seat.id));
    } else {
      if (selectedSeats.length >= maxSeats) return;
      onSelectionChange([...selectedSeats, seat.id]);
    }
  };

  const grid = buildGrid();
  const availableCount = grid.flat().filter(s => s.status === SeatStatus.Available).length;
  const bookedCount = grid.flat().filter(s => s.status === SeatStatus.Booked).length;
  const pendingCount = grid.flat().filter(s => s.status === SeatStatus.Pending).length;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-secondary">
      <Loader2 size={32} className="animate-spin text-primary" />
      <p>Loading live seat map...</p>
    </div>
  );

  if (error) return (
    <div className="text-center py-8 space-y-3">
      <p className="text-red-400">{error}</p>
      <button onClick={loadOccupancy} className="flex items-center gap-2 mx-auto text-primary hover:underline text-sm">
        <RotateCcw size={14} /> Retry
      </button>
    </div>
  );

  const legendItems = [
    { status: SeatStatus.Available,   label: 'Available (' + availableCount + ')' },
    { status: SeatStatus.Selected,    label: 'Selected (' + selectedSeats.length + ')' },
    { status: SeatStatus.Pending,     label: 'Pending (' + pendingCount + ')' },
    { status: SeatStatus.Booked,      label: 'Booked (' + bookedCount + ')' },
    { status: SeatStatus.Unavailable, label: 'Unavailable' },
  ] as const;

  return (
    <div className="space-y-6 select-none">
      {/* Live sync indicator & Screen */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-secondary mb-1">
          <span className={`inline-block w-2 h-2 rounded-full ${isLiveConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
          <span>{isLiveConnected ? 'Live Realtime Sync Active' : 'Connecting to live updates...'}</span>
        </div>
        <div className="w-3/4 max-w-xs h-2 bg-gradient-to-b from-primary/60 to-transparent rounded-full" />
        <div className="flex items-center gap-2 text-xs text-on-surface-secondary">
          <MonitorPlay size={14} /><span>SCREEN / STAGE</span>
        </div>
      </div>

      {/* Seat grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-max mx-auto space-y-2">
          {grid.map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-1.5">
              <span className="w-6 text-center text-xs font-bold text-on-surface-secondary flex-shrink-0">{config.rows[rowIdx].label}</span>
              {row.map(seat => {
                const atMax = seat.status === SeatStatus.Available && selectedSeats.length >= maxSeats && !selectedSeats.includes(seat.id);
                return (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    disabled={readOnly || seat.status === SeatStatus.Unavailable || seat.status === SeatStatus.Booked || seat.status === SeatStatus.Pending || atMax}
                    title={atMax ? 'Max ' + maxSeats + ' seats allowed' : seat.id + ' - ' + SEAT_STYLES[seat.status].label}
                    aria-label={'Seat ' + seat.id + ': ' + SEAT_STYLES[seat.status].label}
                    aria-pressed={seat.status === SeatStatus.Selected}
                    className={['w-8 h-8 rounded-t-lg rounded-b-sm text-[10px] font-bold transition-all duration-150 flex items-center justify-center', SEAT_STYLES[seat.status].base, atMax ? 'opacity-50' : ''].join(' ')}
                  >
                    {seat.seatNumber}
                  </button>
                );
              })}
              <span className="w-6 text-center text-xs font-bold text-on-surface-secondary flex-shrink-0">{config.rows[rowIdx].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-xs">
        {legendItems.map(({ status, label }) => {
          const colorClasses = SEAT_STYLES[status].base.split(' ').filter((c: string) => c.startsWith('bg-') || c.startsWith('border-'));
          return (
            <div key={status} className="flex items-center gap-1.5">
              <div className={['w-5 h-5 rounded-t-md rounded-b-sm border-2', ...colorClasses].join(' ')} />
              <span className="text-on-surface-secondary">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Interactive selection summary */}
      {!readOnly && (
        <div className="bg-background rounded-lg p-4 text-center space-y-1 border border-primary/20">
          {selectedSeats.length === 0 ? (
            <p className="text-on-surface-secondary text-sm">
              Select your seats above.
              {maxSeats !== Infinity && (' You can choose up to ' + maxSeats + ' seat' + (maxSeats > 1 ? 's' : '') + '.')}
            </p>
          ) : (
            <>
              <p className="text-sm text-on-surface-secondary">
                {selectedSeats.length + ' seat' + (selectedSeats.length > 1 ? 's' : '') + ' selected' + (maxSeats !== Infinity ? ' (max ' + maxSeats + ')' : '')}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {selectedSeats.map(id => <span key={id} className="bg-primary/20 text-primary font-bold px-3 py-1 rounded-full text-sm">{id}</span>)}
              </div>
              <button onClick={() => onSelectionChange([])} className="text-xs text-on-surface-secondary hover:text-primary mt-1 flex items-center gap-1 mx-auto">
                <RotateCcw size={11} /> Clear selection
              </button>
            </>
          )}
        </div>
      )}

      {/* Read-only assigned seats */}
      {readOnly && selectedSeats.length > 0 && (
        <div className="bg-background rounded-lg p-4 text-center border border-primary/20">
          <p className="text-sm text-on-surface-secondary mb-2">Your assigned seats</p>
          <div className="flex flex-wrap justify-center gap-2">
            {selectedSeats.map(id => <span key={id} className="bg-primary/20 text-primary font-bold px-3 py-1 rounded-full text-sm">{id}</span>)}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatMap;
