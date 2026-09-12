import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { cancelBooking } from "@/lib/booking-service";
import { apiError, apiSuccess, handleRouteError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return apiError("Authentication required", 401, "UNAUTHENTICATED");
    }

    const { id } = await params;
    const result = await cancelBooking({
      bookingId: id,
      userId: session.userId,
      isAdmin: session.role === "ADMIN",
    });

    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
