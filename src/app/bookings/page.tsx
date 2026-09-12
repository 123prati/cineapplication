"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Film,
} from "lucide-react";
import { formatCents } from "@/lib/constants";

export default function BookingsHistoryPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"UPCOMING" | "PAST">("UPCOMING");

  const loadBookings = async () => {
    try {
      const res = await fetch("/api/bookings/user");
      if (res.ok) {
        const json = await res.json();
        setBookings(json.data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking? All seats will be immediately released.")) {
      return;
    }

    setCancellingId(bookingId);
    setCancelError(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setCancelError(json.error?.message || "Failed to cancel booking");
        return;
      }

      // Reload list
      await loadBookings();
    } catch (err: any) {
      setCancelError(err.message || "Failed to contact server");
    } finally {
      setCancellingId(null);
    }
  };

  const now = new Date();
  const upcomingBookings = bookings.filter(
    (b) =>
      new Date(b.showtime.startTime) > now &&
      (b.booking.status === "CONFIRMED" || b.booking.status === "PENDING")
  );

  const pastBookings = bookings.filter(
    (b) =>
      new Date(b.showtime.startTime) <= now ||
      b.booking.status === "CANCELLED" ||
      b.booking.status === "REFUNDED" ||
      b.booking.status === "EXPIRED"
  );

  const displayedList = activeTab === "UPCOMING" ? upcomingBookings : pastBookings;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
            User Account
          </span>
          <h1 className="text-3xl font-black text-white mt-1">My Cinema Bookings</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your active passes, view digital QR codes, or manage reservations.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab("UPCOMING")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "UPCOMING"
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab("PAST")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "PAST"
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Past & Cancelled ({pastBookings.length})
          </button>
        </div>
      </div>

      {cancelError && (
        <div className="rounded-xl bg-red-950/50 border border-red-800/80 p-3.5 text-xs text-red-300 flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{cancelError}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
          <p className="text-xs text-slate-400">Loading your tickets and booking records...</p>
        </div>
      ) : displayedList.length > 0 ? (
        <div className="space-y-4">
          {displayedList.map(({ booking, showtime, movie, auditorium, cinema, items }: any) => {
            const startDate = new Date(showtime.startTime);
            const formattedDate = startDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const formattedTime = startDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            });

            const isEligibleForCancel =
              (booking.status === "CONFIRMED" || booking.status === "PENDING") &&
              startDate > now;

            return (
              <div
                key={booking.id}
                className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-700 transition-all"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-4">
                  <div className="w-16 sm:w-20 aspect-[2/3] shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {booking.bookingReference}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          booking.status === "CONFIRMED"
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/80"
                            : booking.status === "CANCELLED" || booking.status === "REFUNDED"
                            ? "bg-red-950/80 text-red-400 border border-red-800/80"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white line-clamp-1">{movie.title}</h3>

                    <p className="text-xs text-slate-300 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      {cinema.name} • {auditorium.name} ({auditorium.screenType})
                    </p>

                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {formattedDate} at <span className="text-slate-200 font-semibold">{formattedTime}</span>
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {items.map((i: any) => (
                        <span
                          key={i.id}
                          className="px-2 py-0.5 rounded bg-slate-850 text-slate-300 text-[11px] font-mono border border-slate-800"
                        >
                          {i.seatLabel}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Price and Actions */}
                <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Total Amount</span>
                    <span className="text-base font-black font-mono text-white">
                      {formatCents(booking.totalCents)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {booking.status === "CONFIRMED" && (
                      <Link
                        href={`/tickets/${booking.id}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
                      >
                        <Ticket className="h-3.5 w-3.5" />
                        View Ticket
                      </Link>
                    )}

                    {isEligibleForCancel && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-red-950/60 hover:text-red-400 text-slate-400 font-semibold text-xs border border-slate-800 hover:border-red-800/80 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Cancel Booking"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-4 border border-slate-800">
          <Ticket className="h-10 w-10 text-amber-400 mx-auto opacity-40" />
          <h3 className="text-base font-bold text-white">No Bookings Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {activeTab === "UPCOMING"
              ? "You do not have any upcoming movie bookings."
              : "No past or cancelled bookings in your account history."}
          </p>
          <Link
            href="/movies"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
          >
            Explore Movies & Showtimes <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
