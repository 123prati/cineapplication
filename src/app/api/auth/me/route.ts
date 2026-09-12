import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/errors";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return apiError("Not authenticated", 401, "UNAUTHENTICATED");
  }
  return apiSuccess({ user: session });
}
