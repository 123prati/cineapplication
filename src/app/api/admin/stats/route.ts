import { NextRequest } from "next/server";
import { eq, sql, desc } from "drizzle-orm";
import { getDb } from "@/db";
import {
  bookings,
  tickets,
  movies,
  showtimes,
  showtimeSeats,
  auditLogs,
  users,
} from "@/db/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { apiError, apiSuccess, handleRouteError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "ADMIN") {
      return apiError("Admin privileges required", 403, "FORBIDDEN");
    }

    const db = getDb();

    // 1. Total revenue from confirmed bookings
    const confirmedBookings = await db
      .select({
        totalCents: bookings.totalCents,
      })
      .from(bookings)
      .where(eq(bookings.status, "CONFIRMED"));

    const totalRevenueCents = confirmedBookings.reduce(
      (sum: number, b: any) => sum + (b.totalCents || 0),
      0
    );

    // 2. Total tickets issued
    const allTickets = await db.select({ id: tickets.id }).from(tickets);
    const totalTicketsCount = allTickets.length;

    // 3. Total active movies and showtimes
    const allMovies = await db.select({ id: movies.id }).from(movies);
    const allShowtimes = await db.select({ id: showtimes.id }).from(showtimes);

    // 4. Seat occupancy rate across all showtime_seats
    const allSeats = await db
      .select({
        status: showtimeSeats.status,
      })
      .from(showtimeSeats);

    const totalSeatSlots = allSeats.length;
    const bookedSeatsCount = allSeats.filter((s: any) => s.status === "BOOKED").length;
    const heldSeatsCount = allSeats.filter((s: any) => s.status === "HELD").length;
    const occupancyRate =
      totalSeatSlots > 0
        ? Math.round(((bookedSeatsCount + heldSeatsCount) / totalSeatSlots) * 100)
        : 0;

    // 5. Recent bookings with user and movie details
    const recentBookings = await db
      .select({
        id: bookings.id,
        reference: bookings.bookingReference,
        status: bookings.status,
        totalCents: bookings.totalCents,
        totalSeats: bookings.totalSeats,
        createdAt: bookings.createdAt,
        userName: users.name,
        userEmail: users.email,
        movieTitle: movies.title,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .innerJoin(showtimes, eq(bookings.showtimeId, showtimes.id))
      .innerJoin(movies, eq(showtimes.movieId, movies.id))
      .orderBy(desc(bookings.createdAt))
      .limit(10);

    // 6. Recent audit logs
    const logs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(15);

    return apiSuccess({
      kpis: {
        totalRevenueCents,
        totalTicketsCount,
        totalMoviesCount: allMovies.length,
        totalShowtimesCount: allShowtimes.length,
        totalSeatSlots,
        bookedSeatsCount,
        heldSeatsCount,
        occupancyRate,
      },
      recentBookings,
      recentLogs: logs,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
