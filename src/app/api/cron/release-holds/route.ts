import { NextRequest } from "next/server";
import { releaseExpiredSeatHolds } from "@/lib/booking-service";
import { getSessionFromRequest } from "@/lib/auth";
import { apiError, apiSuccess, handleRouteError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  return handleCleanup(request);
}

export async function POST(request: NextRequest) {
  return handleCleanup(request);
}

async function handleCleanup(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET || "cinebook_local_cron_secret_auth_token_456789";

    // 1. Check Authorization header
    const authHeader = request.headers.get("authorization");
    const cronHeader = request.headers.get("x-cron-secret");
    const searchSecret = request.nextUrl.searchParams.get("secret");

    let isAuthorized = false;

    if (
      (authHeader && authHeader === `Bearer ${cronSecret}`) ||
      (cronHeader && cronHeader === cronSecret) ||
      (searchSecret && searchSecret === cronSecret)
    ) {
      isAuthorized = true;
    }

    // 2. Alternatively allow logged-in ADMIN
    if (!isAuthorized) {
      const session = await getSessionFromRequest(request);
      if (session && session.role === "ADMIN") {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return apiError("Unauthorized cron trigger", 401, "UNAUTHORIZED_CRON");
    }

    const result = await releaseExpiredSeatHolds();
    return apiSuccess({
      message: "Expired seat holds release executed successfully",
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
