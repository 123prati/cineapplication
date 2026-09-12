import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { movies, movieGenres, genres } from "@/db/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { apiError, apiSuccess, handleRouteError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "ADMIN") {
      return apiError("Admin access required", 403, "FORBIDDEN");
    }

    const db = getDb();
    const allMovies = await db.select().from(movies).orderBy(desc(movies.createdAt));
    return apiSuccess({ movies: allMovies });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "ADMIN") {
      return apiError("Admin access required", 403, "FORBIDDEN");
    }

    const body = await request.json();
    const {
      title,
      description,
      durationMinutes,
      releaseDate,
      rating,
      posterUrl,
      backdropUrl,
      trailerUrl,
      language = "English",
      genreIds = [],
    } = body;

    if (!title || !description || !durationMinutes || !releaseDate || !rating || !posterUrl) {
      return apiError("Required movie fields are missing", 400, "MISSING_FIELDS");
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const db = getDb();

    const [newMovie] = await db
      .insert(movies)
      .values({
        title,
        slug: `${slug}-${Date.now().toString().substring(8)}`,
        description,
        durationMinutes: parseInt(durationMinutes, 10),
        releaseDate,
        rating,
        posterUrl,
        backdropUrl: backdropUrl || posterUrl,
        trailerUrl,
        language,
        isActive: true,
      })
      .returning();

    if (genreIds.length > 0) {
      for (const gid of genreIds) {
        await db.insert(movieGenres).values({
          movieId: newMovie.id,
          genreId: gid,
        });
      }
    }

    return apiSuccess({ movie: newMovie }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
