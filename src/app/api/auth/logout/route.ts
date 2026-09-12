import { NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { apiSuccess } from "@/lib/errors";

export async function POST(_request: NextRequest) {
  const response = apiSuccess({ message: "Successfully logged out" });
  clearSessionCookie(response);
  return response;
}
