import { Booking, Event } from '../types';

// ── Theme (mirrors tailwind config in index.html) ─────────────────────────────
const COLORS = {
  primary: '#14b8a6',
  primaryDark: '#0d9488',
  background: '#1f2937',
  surface: '#374151',
  text: '#f3f4f6',
  textSecondary: '#9ca3af',
  white: '#ffffff',
};

const FONT = `'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;

/** Default event length used when the event has no explicit end time. */
const DEFAULT_EVENT_DURATION_HOURS = 3;

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatEventDate = (iso: string): string =>
  new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
    timeZoneName: 'short',
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/** Wraps text to fit maxWidth; returns the lines (capped at maxLines with ellipsis). */
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (ctx.measureText(last + '…').width > maxWidth && last.length > 0) last = last.slice(0, -1);
    kept[maxLines - 1] = last + '…';
    return kept;
  }
  return lines;
};

const parseSeats = (selectedSeats: string | null): string[] => {
  if (!selectedSeats) return [];
  try {
    const seats = JSON.parse(selectedSeats);
    return Array.isArray(seats) ? seats : [];
  } catch {
    return [];
  }
};

// ── Ticket image rendering ────────────────────────────────────────────────────

/**
 * Renders the ticket onto an off-screen canvas.
 * Only the QR (a same-origin data URL) is drawn as an image, so the canvas is
 * never "tainted" by cross-origin images and can always be exported.
 */
export const renderTicketCanvas = async (booking: Booking, event: Event, qrCodeDataUrl: string): Promise<HTMLCanvasElement> => {
  const W = 800;
  const H = 1240;
  const SCALE = 2; // crisp output on high-DPI screens / when zoomed
  const PAD = 56;

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  ctx.scale(SCALE, SCALE);

  // Page background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, W, H);

  // Ticket body
  const cardX = 32, cardY = 32, cardW = W - 64, cardH = H - 64;
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fillStyle = COLORS.surface;
  ctx.fill();

  // Header band
  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.clip();
  const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + 230);
  grad.addColorStop(0, COLORS.primary);
  grad.addColorStop(1, COLORS.primaryDark);
  ctx.fillStyle = grad;
  ctx.fillRect(cardX, cardY, cardW, 230);
  ctx.restore();

  // Header text
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `600 18px ${FONT}`;
  ctx.textBaseline = 'top';
  ctx.fillText('EVENT TICKET', PAD + 8, cardY + 36);

  ctx.fillStyle = COLORS.white;
  ctx.font = `800 40px ${FONT}`;
  const nameLines = wrapText(ctx, event.name, cardW - PAD * 2, 3);
  const nameLineH = nameLines.length > 2 ? 40 : 48;
  if (nameLines.length > 2) ctx.font = `800 34px ${FONT}`;
  nameLines.forEach((line, i) => ctx.fillText(line, PAD + 8, cardY + 72 + i * nameLineH));

  // Details
  let y = cardY + 270;
  const drawField = (label: string, value: string, maxLines = 2) => {
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = `600 16px ${FONT}`;
    ctx.fillText(label.toUpperCase(), PAD + 8, y);
    y += 26;
    ctx.fillStyle = COLORS.text;
    ctx.font = `700 26px ${FONT}`;
    const lines = wrapText(ctx, value, cardW - PAD * 2, maxLines);
    lines.forEach(line => { ctx.fillText(line, PAD + 8, y); y += 34; });
    y += 18;
  };

  drawField('Ticket Holder', booking.userName, 1);
  drawField('Date & Time', formatEventDate(event.date), 2);
  drawField('Venue', event.venue, 2);
  const seats = parseSeats(booking.selectedSeats);
  if (seats.length > 0) drawField('Seats', seats.join(', '), 2);

  // Perforated divider
  const dividerY = Math.max(y + 4, 780);
  ctx.fillStyle = COLORS.background;
  ctx.beginPath(); ctx.arc(cardX, dividerY, 22, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cardX + cardW, dividerY, 22, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.textSecondary;
  ctx.globalAlpha = 0.5;
  ctx.setLineDash([10, 10]);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cardX + 34, dividerY); ctx.lineTo(cardX + cardW - 34, dividerY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // QR code
  const qrSize = 300;
  const qrX = (W - qrSize) / 2;
  const qrY = dividerY + 40;
  roundRect(ctx, qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 20);
  ctx.fillStyle = COLORS.white;
  ctx.fill();
  const qrImg = await loadImage(qrCodeDataUrl);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = `500 18px ${FONT}`;
  ctx.fillText('Present this QR code at the entrance', W / 2, qrY + qrSize + 32);
  ctx.font = `400 13px ${FONT}`;
  ctx.fillText('Booking ID: ' + booking.id, W / 2, qrY + qrSize + 60);
  ctx.font = `600 15px ${FONT}`;
  ctx.fillStyle = COLORS.primary;
  ctx.fillText('Powered by QrGo', W / 2, cardY + cardH - 40);
  ctx.textAlign = 'left';

  return canvas;
};

/** Renders the ticket and triggers a browser download as PNG or JPG. */
export const downloadTicketImage = async (
  booking: Booking,
  event: Event,
  qrCodeDataUrl: string,
  format: 'png' | 'jpg' = 'png'
): Promise<void> => {
  // Make sure web fonts are ready so text measures/renders correctly.
  if (document.fonts?.ready) await document.fonts.ready;

  const canvas = await renderTicketCanvas(booking, event, qrCodeDataUrl);
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';

  const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, mime, 0.95));
  if (!blob) throw new Error('Could not generate the ticket image.');

  const safeName = (event.name + '-' + booking.userName)
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qrgo-ticket-${safeName}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after the click has been processed (iOS Safari needs a short delay).
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

// ── Google Calendar ───────────────────────────────────────────────────────────

/** Formats a Date as the UTC basic format Google Calendar expects: YYYYMMDDTHHMMSSZ */
const toGCalDate = (d: Date): string => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Builds a "create event" Google Calendar URL pre-filled with the event details. */
export const buildGoogleCalendarUrl = (event: Event, booking?: Booking): string => {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + DEFAULT_EVENT_DURATION_HOURS * 60 * 60 * 1000);

  const detailParts: string[] = [];
  if (event.description) detailParts.push(event.description);
  if (booking) {
    detailParts.push('Ticket holder: ' + booking.userName);
    const seats = parseSeats(booking.selectedSeats);
    if (seats.length > 0) detailParts.push('Seats: ' + seats.join(', '));
  }
  if (event.remarks) detailParts.push('Note: ' + event.remarks);
  if (event.venueMapLink) detailParts.push('Map: ' + event.venueMapLink);
  detailParts.push('Your QR ticket is available in QrGo → My Tickets: ' + window.location.origin + '/#/my-tickets');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${toGCalDate(start)}/${toGCalDate(end)}`,
    details: detailParts.join('\n\n'),
    location: event.venue,
    ctz: 'Asia/Kolkata',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
