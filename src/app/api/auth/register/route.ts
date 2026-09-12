import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { apiError, apiSuccess, handleRouteError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return apiError("Name, email, and password are required", 400, "MISSING_FIELDS");
    }

    if (password.length < 8) {
      return apiError("Password must be at least 8 characters", 400, "PASSWORD_TOO_SHORT");
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = getDb();

    // Check existing email
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail));

    if (existing) {
      return apiError("An account with this email already exists", 409, "EMAIL_EXISTS");
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: "USER",
      })
      .returning();

    const userPayload = {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as "USER" | "ADMIN",
    };

    const response = apiSuccess({ user: userPayload }, 201);
    await setSessionCookie(response, userPayload);
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
