import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { comparePassword, setSessionCookie } from "@/lib/auth";
import { apiError, apiSuccess, handleRouteError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiError("Email and password are required", 400, "MISSING_FIELDS");
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = getDb();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail));

    if (!user) {
      return apiError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return apiError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const userPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "USER" | "ADMIN",
    };

    const response = apiSuccess({ user: userPayload });
    await setSessionCookie(response, userPayload);
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
