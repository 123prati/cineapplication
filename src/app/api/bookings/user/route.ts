import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
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
import { getSessionFromRequest } from "@/lib/auth";
import { apiError, apiSuccess, handleRouteError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return apiError("Authentication required", 401, "UNAUTHENTICATED");
    }

    const db = getDb();

    // Fetch all user bookings
    const userBookings = await db
      .select({
        booking: bookings,
        showtime: showtimes,
        movie: movies,
        auditorium: auditoriums,
        cinema: cinemas,
      })
      .from(bookings)
      .innerJoin(showtimes, eq(bookings.showtimeId, showtimes.id))
      .innerJoin(movies, eq(showtimes.movieId, movies.id))
      .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
      .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
      .where(eq(bookings.userId, session.userId))
      .orderBy(desc(bookings.createdAt));

    // For each booking, fetch items and tickets
    const results = [];
    for (const b of userBookings) {
      const items = await db
        .select()
        .from(bookingItems)
        .where(eq(bookingItems.bookingId, b.booking.id));

      const tix = await db
        .select()
        .from(tickets)
        .where(eq(tickets.bookingId, b.booking.id));

      results.push({
        booking: b.booking,
        showtime: b.showtime,
        movie: b.movie,
        auditorium: b.auditorium,
        cinema: b.cinema,
        items,
        tickets: tix,
      });
    }

    return apiSuccess({ bookings: results });
  } catch (error) {
    return handleRouteError(error);
  }
}
