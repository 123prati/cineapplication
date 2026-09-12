"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Film,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { SeatMap, SeatItem } from "@/components/seat-map";
import { formatCents, BOOKING_FEE_CENTS_PER_SEAT, TAX_RATE } from "@/lib/constants";
import { MOCK_MOVIES, MOCK_CINEMAS, generateClientSeatMatrix } from "@/lib/mock-data";

export default function ShowtimeClient({ showtimeId }: { showtimeId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Showtime & Seat Data
  const [showtimeData, setShowtimeData] = useState<any>(null);
  const [seatRows, setSeatRows] = useState<any[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SeatItem[]>([]);

  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load showtime and seats
  const loadData = useCallback(async () => {
    try {
      const [stRes, seatsRes, userRes] = await Promise.all([
        fetch(`/api/showtimes/${showtimeId}`).then((r) => r.json()).catch(() => null),
        fetch(`/api/showtimes/${showtimeId}/seats`).then((r) => r.json()).catch(() => null),
        fetch("/api/auth/me").then((r) => r.json()).catch(() => null),
      ]);

      if (stRes?.success && seatsRes?.success) {
        setShowtimeData(stRes.data);
        setSeatRows(seatsRes.data.rows);
        if (userRes?.success) {
          setCurrentUser(userRes.data.user);
        }
        return;
      }
    } catch (_err) {
      // Fallback for static hosting
    }

    // Static GitHub Pages fallback
    const mockMovie = MOCK_MOVIES[0];
    const mockCinema = MOCK_CINEMAS[0];
    const auditorium = mockCinema.auditoriums[0];
    const today = new Date();

    setShowtimeData({
      movie: mockMovie,
      cinema: mockCinema,
      auditorium: auditorium,
      showtime: {
        id: showtimeId,
        startTime: new Date(today.setHours(19, 30)).toISOString(),
        basePriceCents: 1400,
      },
    });
    setSeatRows(generateClientSeatMatrix(auditorium.screenType));

    // Check localStorage auth in demo mode
    try {
      const stored = localStorage.getItem("cinebook_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        // In demo mode, automatically allow booking as Demo Guest
        setCurrentUser({ id: "demo-guest", fullName: "Demo Guest", email: "guest@cinebook.demo" });
      }
    } catch (_e) {
      setCurrentUser({ id: "demo-guest", fullName: "Demo Guest", email: "guest@cinebook.demo" });
    }
  }, [showtimeId]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Toggle seat selection
  const handleToggleSeat = (seat: SeatItem) => {
    setError(null);
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.id === seat.id);
      if (exists) {
        return prev.filter((s) => s.id !== seat.id);
      }
      if (prev.length >= 10) {
        setError("You may reserve a maximum of 10 seats per order");
        return prev;
      }
      return [...prev, seat];
    });
  };

  // Pricing calculations
  const subtotalCents = selectedSeats.reduce((sum, s) => sum + s.priceCents, 0);
  const feeCents = selectedSeats.length * BOOKING_FEE_CENTS_PER_SEAT;
  const taxCents = Math.round((subtotalCents + feeCents) * TAX_RATE);
  const totalCents = subtotalCents + feeCents + taxCents;

  // Handle Proceed to Checkout
  const handleProceedToCheckout = async () => {
    if (selectedSeats.length === 0) {
      setError("Please select at least one seat to proceed");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId,
          seatIds: selectedSeats.map((s) => s.id),
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const json = await res.json();
        if (json.success) {
          router.push(`/checkout/${json.data.bookingId}`);
          return;
        }
      }
    } catch (_err) {
      // Fallback below
    }

    // Static fallback: save selected seats in sessionStorage and go to demo checkout
    try {
      sessionStorage.setItem(
        "cinebook_active_booking",
        JSON.stringify({
          showtimeId,
          selectedSeats,
          subtotalCents,
          feeCents,
          taxCents,
          totalCents,
          movie: showtimeData?.movie,
          cinema: showtimeData?.cinema,
          auditorium: showtimeData?.auditorium,
          showtime: showtimeData?.showtime,
        })
      );
    } catch (_e) {}

    router.push("/checkout/demo-booking-1");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading cinema auditorium and live seat map...</p>
      </div>
    );
  }

  if (!showtimeData) {
    return (
      <div className="mx-auto max-w-lg p-12 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Showtime Unavailable</h2>
        <p className="text-xs text-slate-400">{error || "This showtime could not be found."}</p>
        <Link
          href="/movies"
          className="inline-block px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-amber-400"
        >
          Return to Movies
        </Link>
      </div>
    );
  }

  const { movie, cinema, auditorium, showtime } = showtimeData;
  const startDate = new Date(showtime.startTime);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Showtime Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <Link
            href={`/movies/${movie.slug || "dune-part-two"}`}
            className="text-xs text-amber-400/90 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors mb-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Movie Details
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            {movie.title}
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {movie.rating}
            </span>
          </h1>
          <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-amber-400" /> {cinema.name}
            </span>
            <span>•</span>
            <span className="font-semibold text-amber-400">{auditorium.name} ({auditorium.screenType})</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-amber-400" /> {formattedDate} at {formattedTime}
            </span>
          </p>
        </div>
      </div>

      {/* Main Grid: Seat Map & Order Summary Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Interactive Seat Map */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800 flex flex-col items-center">
          {error && (
            <div className="w-full rounded-xl bg-red-950/50 border border-red-800/80 p-3.5 text-xs text-red-300 flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <SeatMap
            rows={seatRows}
            selectedSeatIds={selectedSeats.map((s) => s.id)}
            onToggleSeat={handleToggleSeat}
            screenType={auditorium.screenType}
          />
        </div>

        {/* Right 1 Col: Live Order Summary Card */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 space-y-6 border border-slate-800 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 font-mono">
                  Reservation Summary
                </span>
                <h3 className="text-lg font-black text-white">Your Selection</h3>
              </div>
              <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                {selectedSeats.length}
              </div>
            </div>

            {/* Selected Seats List */}
            {selectedSeats.length > 0 ? (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400">Chosen Seats:</span>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {selectedSeats.map((seat) => (
                    <div
                      key={seat.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">
                          Seat {seat.label}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {seat.type}
                        </span>
                      </div>
                      <span className="font-semibold text-white">
                        {formatCents(seat.priceCents)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 pt-4 border-t border-slate-800/80 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal ({selectedSeats.length} seats)</span>
                    <span className="font-mono text-slate-200">{formatCents(subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Convenience Fee ($1.50/seat)</span>
                    <span className="font-mono text-slate-200">{formatCents(feeCents)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Tax (8.25%)</span>
                    <span className="font-mono text-slate-200">{formatCents(taxCents)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                    <span>Total Amount</span>
                    <span className="font-mono text-amber-400">{formatCents(totalCents)}</span>
                  </div>
                </div>

                {/* Hold Guarantee Note */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Selected seats will be locked for 10 minutes upon proceeding to checkout.
                  </span>
                </div>

                {/* Proceed Button */}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleProceedToCheckout}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Acquiring Seat Lock...
                    </>
                  ) : (
                    <>
                      <Ticket className="h-4 w-4" />
                      Proceed to Checkout
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="py-10 text-center space-y-2 text-slate-500">
                <Ticket className="h-8 w-8 mx-auto opacity-40 text-amber-400" />
                <p className="text-xs">Select your seats from the layout to view pricing and checkout.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
