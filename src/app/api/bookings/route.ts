import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { createSeatHoldAndBooking } from "@/lib/booking-service";
import { apiError, apiSuccess, handleRouteError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return apiError("Authentication required to hold seats and book", 401, "UNAUTHENTICATED");
    }

    const body = await request.json();
    const { showtimeId, seatIds } = body;

    if (!showtimeId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return apiError("Showtime ID and at least one seat ID are required", 400, "INVALID_SEAT_SELECTION");
    }

    // Execute 10-step transactional hold
    const result = await createSeatHoldAndBooking({
      userId: session.userId,
      showtimeId,
      seatIds,
    });

    return apiSuccess(result, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
