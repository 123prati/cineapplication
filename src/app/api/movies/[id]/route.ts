import { NextRequest } from "next/server";
import { eq, and, gte } from "drizzle-orm";
import { getDb } from "@/db";
import {
  movies,
  movieGenres,
  genres,
  showtimes,
  auditoriums,
  cinemas,
} from "@/db/schema";
import { apiError, apiSuccess, handleRouteError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    // Check by id or slug
    let [movie] = await db
      .select()
      .from(movies)
      .where(eq(movies.id, id));

    if (!movie) {
      [movie] = await db
        .select()
        .from(movies)
        .where(eq(movies.slug, id));
    }

    if (!movie) {
      return apiError("Movie not found", 404, "MOVIE_NOT_FOUND");
    }

    // Get genres
    const movieGenreRows = await db
      .select({
        name: genres.name,
        slug: genres.slug,
      })
      .from(movieGenres)
      .innerJoin(genres, eq(movieGenres.genreId, genres.id))
      .where(eq(movieGenres.movieId, movie.id));

    // Get upcoming showtimes for this movie
    const now = new Date();
    const showtimeRows = await db
      .select({
        id: showtimes.id,
        startTime: showtimes.startTime,
        endTime: showtimes.endTime,
        basePriceCents: showtimes.basePriceCents,
        status: showtimes.status,
        auditoriumId: auditoriums.id,
        auditoriumName: auditoriums.name,
        screenType: auditoriums.screenType,
        cinemaId: cinemas.id,
        cinemaName: cinemas.name,
        cinemaAddress: cinemas.address,
        cinemaCity: cinemas.city,
      })
      .from(showtimes)
      .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
      .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
      .where(
        and(
          eq(showtimes.movieId, movie.id),
          gte(showtimes.startTime, now)
        )
      );

    // Group showtimes by cinema and date
    const cinemaMap: Record<string, any> = {};
    for (const st of showtimeRows) {
      if (!cinemaMap[st.cinemaId]) {
        cinemaMap[st.cinemaId] = {
          id: st.cinemaId,
          name: st.cinemaName,
          address: st.cinemaAddress,
          city: st.cinemaCity,
          showtimes: [],
        };
      }
      cinemaMap[st.cinemaId].showtimes.push({
        id: st.id,
        startTime: st.startTime,
        endTime: st.endTime,
        basePriceCents: st.basePriceCents,
        auditoriumName: st.auditoriumName,
        screenType: st.screenType,
      });
    }

    return apiSuccess({
      movie: {
        ...movie,
        genres: movieGenreRows,
      },
      cinemas: Object.values(cinemaMap),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
