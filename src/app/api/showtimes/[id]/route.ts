import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { showtimes, movies, auditoriums, cinemas } from "@/db/schema";
import { apiError, apiSuccess, handleRouteError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const [record] = await db
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
      .where(eq(showtimes.id, id));

    if (!record) {
      return apiError("Showtime not found", 404, "SHOWTIME_NOT_FOUND");
    }

    return apiSuccess({
      showtime: record.showtime,
      movie: record.movie,
      auditorium: record.auditorium,
      cinema: record.cinema,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
