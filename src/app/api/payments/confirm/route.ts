import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { confirmBookingPayment } from "@/lib/booking-service";
import { apiError, apiSuccess, handleRouteError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return apiError("Authentication required for payment", 401, "UNAUTHENTICATED");
    }

    const body = await request.json();
    const { bookingId, idempotencyKey, paymentMethod } = body;

    if (!bookingId || !idempotencyKey) {
      return apiError(
        "Booking ID and Idempotency Key are required",
        400,
        "MISSING_PAYMENT_PARAMS"
      );
    }

    const result = await confirmBookingPayment({
      bookingId,
      userId: session.userId,
      idempotencyKey,
      paymentMethod,
    });

    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
