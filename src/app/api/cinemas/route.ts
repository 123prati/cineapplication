import { NextRequest } from "next/server";
import { getDb } from "@/db";
import { cinemas, auditoriums } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, handleRouteError } from "@/lib/errors";

export async function GET(_request: NextRequest) {
  try {
    const db = getDb();
    const allCinemas = await db.select().from(cinemas);
    const allAuditoriums = await db.select().from(auditoriums);

    const result = allCinemas.map((c: any) => ({
      ...c,
      auditoriums: allAuditoriums.filter((a: any) => a.cinemaId === c.id),
    }));

    return apiSuccess({ cinemas: result });
  } catch (error) {
    return handleRouteError(error);
  }
}
