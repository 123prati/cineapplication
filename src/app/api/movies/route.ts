import { NextRequest } from "next/server";
import { eq, ilike, and, inArray, gte, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  movies,
  movieGenres,
  genres,
  showtimes,
  auditoriums,
  cinemas,
} from "@/db/schema";
import { apiSuccess, handleRouteError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const genreSlug = searchParams.get("genre")?.trim();
    const language = searchParams.get("language")?.trim();
    const cinemaId = searchParams.get("cinema")?.trim();
    const date = searchParams.get("date")?.trim(); // YYYY-MM-DD

    const db = getDb();

    // 1. Fetch active movies
    let baseMoviesQuery = db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        description: movies.description,
        durationMinutes: movies.durationMinutes,
        releaseDate: movies.releaseDate,
        rating: movies.rating,
        posterUrl: movies.posterUrl,
        backdropUrl: movies.backdropUrl,
        trailerUrl: movies.trailerUrl,
        language: movies.language,
        createdAt: movies.createdAt,
      })
      .from(movies)
      .where(eq(movies.isActive, true));

    const allMovies = await baseMoviesQuery;

    // 2. Fetch all movie-genres mapping
    const allMovieGenres = await db
      .select({
        movieId: movieGenres.movieId,
        genreName: genres.name,
        genreSlug: genres.slug,
      })
      .from(movieGenres)
      .innerJoin(genres, eq(movieGenres.genreId, genres.id));

    const genresByMovieId: Record<string, Array<{ name: string; slug: string }>> = {};
    for (const mg of allMovieGenres) {
      if (!genresByMovieId[mg.movieId]) {
        genresByMovieId[mg.movieId] = [];
      }
      genresByMovieId[mg.movieId].push({ name: mg.genreName, slug: mg.genreSlug });
    }

    // 3. Fetch upcoming showtimes for matching cinema/date filters
    const now = new Date();
    let showtimeFilter = gte(showtimes.startTime, now);

    const activeShowtimes = await db
      .select({
        movieId: showtimes.movieId,
        showtimeId: showtimes.id,
        startTime: showtimes.startTime,
        cinemaId: auditoriums.cinemaId,
      })
      .from(showtimes)
      .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
      .where(showtimeFilter);

    // Filter in-memory for flexible combination
    let filtered = allMovies.map((m: any) => ({
      ...m,
      genres: genresByMovieId[m.id] || [],
      showtimeCount: activeShowtimes.filter((st: any) => st.movieId === m.id).length,
    }));

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (m: any) =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }

    if (genreSlug && genreSlug !== "all") {
      filtered = filtered.filter((m: any) =>
        m.genres.some((g: any) => g.slug.toLowerCase() === genreSlug.toLowerCase())
      );
    }

    if (language && language !== "all") {
      filtered = filtered.filter(
        (m: any) => m.language.toLowerCase() === language.toLowerCase()
      );
    }

    if (cinemaId && cinemaId !== "all") {
      const movieIdsInCinema = new Set(
        activeShowtimes
          .filter((st: any) => st.cinemaId === cinemaId)
          .map((st: any) => st.movieId)
      );
      filtered = filtered.filter((m: any) => movieIdsInCinema.has(m.id));
    }

    if (date && date !== "all") {
      const movieIdsOnDate = new Set(
        activeShowtimes
          .filter((st: any) => {
            const stDate = new Date(st.startTime).toISOString().split("T")[0];
            return stDate === date;
          })
          .map((st: any) => st.movieId)
      );
      filtered = filtered.filter((m: any) => movieIdsOnDate.has(m.id));
    }

    return apiSuccess({ movies: filtered });
  } catch (error) {
    return handleRouteError(error);
  }
}
