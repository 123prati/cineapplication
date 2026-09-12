import { NextRequest } from "next/server";
import { getDb } from "@/db";
import { genres } from "@/db/schema";
import { apiSuccess, handleRouteError } from "@/lib/errors";

export async function GET(_request: NextRequest) {
  try {
    const db = getDb();
    const allGenres = await db.select().from(genres);
    return apiSuccess({ genres: allGenres });
  } catch (error) {
    return handleRouteError(error);
  }
}
