import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { payments, bookings, auditLogs } from "@/db/schema";
import { apiError, apiSuccess, handleRouteError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, eventId, idempotencyKey, bookingId, status } = body;

    if (!eventId || !idempotencyKey) {
      return apiError("Webhook requires eventId and idempotencyKey", 400, "INVALID_WEBHOOK");
    }

    const db = getDb();
    const now = new Date();

    // Check if event/idempotency key has already been processed
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.idempotencyKey, idempotencyKey));

    if (existingPayment) {
      return apiSuccess({
        received: true,
        isDuplicate: true,
        message: "Webhook event already processed (idempotent no-op)",
      });
    }

    // Process event
    await db.insert(auditLogs).values({
      action: `WEBHOOK_${eventType || "PAYMENT"}`,
      entityType: "PAYMENT",
      entityId: bookingId || eventId,
      details: JSON.stringify({
        eventId,
        idempotencyKey,
        status,
        timestamp: now.toISOString(),
      }),
    });

    return apiSuccess({
      received: true,
      isDuplicate: false,
      eventId,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
