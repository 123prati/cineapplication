"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Lock,
  ShieldCheck,
  AlertCircle,
  Clock,
  Loader2,
  CheckCircle2,
  Sparkles,
  MapPin,
  Calendar,
  Ticket,
} from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";
import { formatCents } from "@/lib/constants";

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isHoldExpired, setIsHoldExpired] = useState(false);

  // Form states
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Persistent idempotency key for this checkout attempt
  const [idempotencyKey] = useState(
    () => `idem_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`
  );

  // Load booking details
  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error?.message || "Failed to load booking details");
          return;
        }

        setBookingData(json.data);
        if (json.data.booking.isExpired || json.data.booking.status === "EXPIRED") {
          setIsHoldExpired(true);
        }
      } catch (err: any) {
        setError(err.message || "Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [bookingId]);

  // Quick fill test card
  const handleQuickFill = () => {
    setCardName("Jane CinemaGoer");
    setCardNumber("4242 •••• •••• 4242");
    setCardExp("12/28");
    setCardCvc("888");
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isHoldExpired) {
      setError("This seat hold has expired. Please reselect your seats.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          idempotencyKey,
          paymentMethod: `CARD_${cardNumber.slice(-4) || "TEST"}`,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Payment processing failed. Please try again.");
        return;
      }

      // Success! Redirect to digital ticket page
      router.push(`/tickets/${bookingId}`);
    } catch (err: any) {
      setError(err.message || "Payment connection failure");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
        <p className="text-xs text-slate-400">Securing payment channel and reviewing hold...</p>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="mx-auto max-w-lg p-12 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Booking Not Found</h2>
        <p className="text-xs text-slate-400">{error || "Could not retrieve booking details."}</p>
        <Link
          href="/movies"
          className="inline-block px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-amber-400"
        >
          Explore Movies
        </Link>
      </div>
    );
  }

  const { booking, movie, cinema, auditorium, showtime, items } = bookingData;
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
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header & Countdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
            Step 2 of 2: Checkout
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
            Complete Your Ticket Order
          </h1>
        </div>

        {/* 10-Minute Hold Expiration Timer */}
        {!isHoldExpired && booking.remainingHoldSeconds > 0 && (
          <CountdownTimer
            initialSeconds={booking.remainingHoldSeconds}
            onExpire={() => setIsHoldExpired(true)}
          />
        )}
      </div>

      {isHoldExpired && (
        <div className="rounded-2xl bg-red-950/60 border border-red-800/90 p-5 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Seat Hold Expired</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            The 10-minute hold window for these seats has elapsed. The seats have been released back
            to the general public.
          </p>
          <Link
            href={`/showtimes/${showtime.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            <Ticket className="h-4 w-4" /> Reselect Seats on Seat Map
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-950/50 border border-red-800/80 p-4 text-xs text-red-300 flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handlePayment}
            className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Payment Method (Test Mode)</h2>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
              >
                <Sparkles className="h-3 w-3" /> Quick-Fill Test Card
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g. Jane CinemaGoer"
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 border border-slate-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-slate-100 font-mono placeholder-slate-500 border border-slate-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="text"
                    required
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-slate-100 font-mono placeholder-slate-500 border border-slate-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CVC Code
                  </label>
                  <input
                    type="text"
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="CVC"
                    maxLength={4}
                    className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-slate-100 font-mono placeholder-slate-500 border border-slate-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Idempotency & Security Badge */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                256-Bit SSL Encrypted & Idempotent
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                Key: {idempotencyKey.substring(0, 14)}...
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || isHoldExpired}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Payment & Issuing Tickets...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Pay {formatCents(booking.totalCents)} & Generate Digital Tickets
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right 1 Col: Order Breakdown */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 space-y-6 border border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 font-mono">
                Order Review
              </span>
              <h3 className="text-lg font-black text-white">{movie.title}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Ref: <span className="font-mono text-amber-400">{booking.bookingReference}</span>
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  {cinema.name} ({auditorium.name})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  {formattedDate} at {formattedTime}
                </span>
              </div>
            </div>

            {/* Seats */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400">Reserved Seats:</span>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item: any) => (
                  <span
                    key={item.id}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-amber-300"
                  >
                    {item.seatLabel}
                  </span>
                ))}
              </div>
            </div>

            {/* Total Math */}
            <div className="space-y-2 pt-4 border-t border-slate-800/80 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Seats Subtotal</span>
                <span className="font-mono text-slate-200">
                  {formatCents(booking.subtotalCents)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Convenience Fee</span>
                <span className="font-mono text-slate-200">
                  {formatCents(booking.feeCents)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Tax (8.25%)</span>
                <span className="font-mono text-slate-200">
                  {formatCents(booking.taxCents)}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                <span>Total Due</span>
                <span className="font-mono text-amber-400">
                  {formatCents(booking.totalCents)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
