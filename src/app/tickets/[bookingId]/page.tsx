import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Ticket, ArrowRight } from "lucide-react";
import { getDb } from "@/db";
import {
  bookings,
  bookingItems,
  showtimes,
  movies,
  auditoriums,
  cinemas,
  tickets,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { DigitalTicket } from "@/components/digital-ticket";

export const dynamic = "force-dynamic";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const db = getDb();

  // 1. Fetch booking
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    notFound();
  }

  // 2. Fetch items & tickets
  const items = await db
    .select()
    .from(bookingItems)
    .where(eq(bookingItems.bookingId, booking.id));

  const issuedTickets = await db
    .select()
    .from(tickets)
    .where(eq(tickets.bookingId, booking.id));

  // 3. Fetch showtime, movie, auditorium, cinema
  const [stDetails] = await db
    .select({
      showtime: showtimes,
      movie: movies,
      auditorium: auditoriums,
      cinema: cinemas,
    })
    .from(showtimes)
    .innerJoin(movies, eq(showtimes.movieId, movies.id))
    .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
    .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
    .where(eq(showtimes.id, booking.showtimeId));

  if (!stDetails) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl bg-emerald-950/40 border border-emerald-500/40 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Payment Confirmed!</h2>
            <p className="text-xs text-slate-300">
              Your digital entry pass has been generated with verified seat assignments.
            </p>
          </div>
        </div>

        <Link
          href="/bookings"
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <Ticket className="h-3.5 w-3.5 text-amber-400" />
          View in My Bookings <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Pass Component */}
      <DigitalTicket
        booking={{
          id: booking.id,
          bookingReference: booking.bookingReference,
          status: booking.status,
          totalCents: booking.totalCents,
          createdAt: booking.createdAt.toISOString(),
        }}
        movie={{
          title: stDetails.movie.title,
          rating: stDetails.movie.rating,
          durationMinutes: stDetails.movie.durationMinutes,
          posterUrl: stDetails.movie.posterUrl,
        }}
        cinema={{
          name: stDetails.cinema.name,
          address: stDetails.cinema.address,
          city: stDetails.cinema.city,
        }}
        auditorium={{
          name: stDetails.auditorium.name,
          screenType: stDetails.auditorium.screenType,
        }}
        showtime={{
          startTime: stDetails.showtime.startTime.toISOString(),
        }}
        tickets={issuedTickets.map((t: any) => ({
          id: t.id,
          ticketCode: t.ticketCode,
          qrCodeData: t.qrCodeData,
          status: t.status,
        }))}
        items={items.map((i: any) => ({
          seatLabel: i.seatLabel,
          priceCents: i.priceCents,
        }))}
      />
    </div>
  );
}
