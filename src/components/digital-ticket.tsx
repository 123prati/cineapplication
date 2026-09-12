"use client";

import { Printer, Share2, Ticket as TicketIcon, CheckCircle2, XCircle, MapPin, Calendar, Film } from "lucide-react";
import { formatCents } from "@/lib/constants";

export interface DigitalTicketProps {
  booking: {
    id: string;
    bookingReference: string;
    status: string;
    totalCents: number;
    createdAt: string;
  };
  movie: {
    title: string;
    rating: string;
    durationMinutes: number;
    posterUrl: string;
  };
  cinema: {
    name: string;
    address: string;
    city: string;
  };
  auditorium: {
    name: string;
    screenType: string;
  };
  showtime: {
    startTime: string;
  };
  tickets: Array<{
    id: string;
    ticketCode: string;
    qrCodeData: string;
    status: string;
  }>;
  items: Array<{
    seatLabel: string;
    priceCents: number;
  }>;
}

export function DigitalTicket({
  booking,
  movie,
  cinema,
  auditorium,
  showtime,
  tickets,
  items,
}: DigitalTicketProps) {
  const startDate = new Date(showtime.startTime);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const isCancelled = booking.status === "CANCELLED" || booking.status === "REFUNDED";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-md mx-auto w-full space-y-6">
      {/* Ticket Pass Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl print:border-none print:shadow-none">
        {/* Top Perforated Header Banner */}
        <div className="relative h-32 w-full overflow-hidden bg-slate-950">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover opacity-30 blur-sm scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-slate-900" />
          <div className="absolute inset-0 p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 font-mono">
                CineBook E-Ticket Pass
              </span>
              <h2 className="text-xl font-black text-white tracking-tight line-clamp-1">
                {movie.title}
              </h2>
              <span className="text-xs text-slate-300 font-medium">
                {auditorium.screenType} • {movie.rating}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Film className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Ticket Body Info */}
        <div className="p-6 space-y-5">
          {/* Cinema & Screening Time */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-slate-300 text-xs">
              <MapPin className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block text-sm">{cinema.name}</span>
                <span className="text-slate-400 text-xs">
                  {auditorium.name} ({cinema.address}, {cinema.city})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-300 text-xs pt-1">
              <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="font-semibold text-white">
                {formattedDate} at <span className="text-amber-400">{formattedTime}</span>
              </span>
            </div>
          </div>

          {/* Seat Badges */}
          <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Assigned Seats ({items.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {items.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold"
                >
                  {item.seatLabel}
                </span>
              ))}
            </div>
          </div>

          {/* Perforation Cutouts Simulation */}
          <div className="relative py-2 flex items-center justify-between">
            <div className="absolute -left-9 h-7 w-7 rounded-full bg-[#090d16] border-r border-slate-700/80" />
            <div className="w-full border-b-2 border-dashed border-slate-700/60" />
            <div className="absolute -right-9 h-7 w-7 rounded-full bg-[#090d16] border-l border-slate-700/80" />
          </div>

          {/* QR Code & Status Section */}
          <div className="pt-2 flex flex-col items-center justify-center space-y-3">
            {tickets.length > 0 && tickets[0].qrCodeData ? (
              <div className="p-3 bg-white rounded-2xl shadow-xl shadow-black/40 border-2 border-amber-400/80">
                <img
                  src={tickets[0].qrCodeData}
                  alt="Ticket QR Code"
                  className="w-44 h-44 object-contain"
                />
              </div>
            ) : (
              <div className="w-44 h-44 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 text-xs">
                QR Code Generated Upon Confirmation
              </div>
            )}

            <div className="text-center space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block">
                Booking Reference
              </span>
              <span className="text-lg font-black font-mono tracking-widest text-amber-400">
                {booking.bookingReference}
              </span>
            </div>

            {/* Status Pill */}
            <div className="pt-1">
              {isCancelled ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-950/60 text-red-400 border border-red-800/80">
                  <XCircle className="h-3.5 w-3.5" /> CANCELLED / REFUNDED
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                  <CheckCircle2 className="h-3.5 w-3.5" /> VALID ENTRY TICKET
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Total Paid: {formatCents(booking.totalCents)}</span>
          <span className="font-mono text-[11px]">Present at gate</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
        >
          <Printer className="h-4 w-4 text-amber-400" />
          Print Ticket
        </button>
      </div>
    </div>
  );
}
