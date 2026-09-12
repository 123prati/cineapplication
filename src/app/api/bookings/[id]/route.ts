import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  bookings,
  bookingItems,
  showtimes,
  movies,
  auditoriums,
  cinemas,
  tickets,
  payments,
} from "@/db/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { apiError, apiSuccess, handleRouteError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return apiError("Authentication required", 401, "UNAUTHENTICATED");
    }

    const { id } = await params;
    const db = getDb();

    // Fetch booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));

    if (!booking) {
      return apiError("Booking not found", 404, "BOOKING_NOT_FOUND");
    }

    // Security check: only the booking owner or an admin can access it!
    if (booking.userId !== session.userId && session.role !== "ADMIN") {
      return apiError("Access denied to this booking", 403, "FORBIDDEN");
    }

    // Fetch booking items
    const items = await db
      .select()
      .from(bookingItems)
      .where(eq(bookingItems.bookingId, booking.id));

    // Fetch showtime, movie, cinema, auditorium
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

    // Fetch tickets (if confirmed)
    const issuedTickets = await db
      .select()
      .from(tickets)
      .where(eq(tickets.bookingId, booking.id));

    // Fetch payment record
    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, booking.id));

    const now = new Date();
    let remainingHoldSeconds = 0;
    if (booking.status === "PENDING" && booking.expiresAt) {
      const diffMs = new Date(booking.expiresAt).getTime() - now.getTime();
      remainingHoldSeconds = Math.max(0, Math.floor(diffMs / 1000));
    }

    return apiSuccess({
      booking: {
        ...booking,
        remainingHoldSeconds,
        isExpired: booking.status === "PENDING" && remainingHoldSeconds <= 0,
      },
      items,
      showtime: stDetails?.showtime,
      movie: stDetails?.movie,
      auditorium: stDetails?.auditorium,
      cinema: stDetails?.cinema,
      tickets: issuedTickets,
      payment: paymentRecord || null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
