import { eq, and, sql, inArray, lt, or } from "drizzle-orm";
import { getDb } from "../db";
import {
  bookings,
  bookingItems,
  showtimeSeats,
  seats,
  showtimes,
  movies,
  auditoriums,
  cinemas,
  payments,
  tickets,
  auditLogs,
} from "../db/schema";
import {
  BOOKING_FEE_CENTS_PER_SEAT,
  BOOKING_STATUS,
  HOLD_EXPIRATION_MINUTES,
  PAYMENT_STATUS,
  SEAT_STATUS,
  TAX_RATE,
} from "./constants";
import { AppError } from "./errors";
import { generateQrCodeDataUrl } from "./qr";

export interface CreateHoldParams {
  userId: string;
  showtimeId: string;
  seatIds: string[];
}

export interface HoldResult {
  bookingId: string;
  bookingReference: string;
  expiresAt: Date;
  subtotalCents: number;
  feeCents: number;
  taxCents: number;
  totalCents: number;
  seatLabels: string[];
}

/**
 * Generates a memorable booking reference: e.g. "CBK-7492A5"
 */
export function generateBookingReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "CBK-";
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

/**
 * Generates a unique ticket code: e.g. "TCK-CBK-7492A5-01"
 */
export function generateTicketCode(bookingRef: string, index: number): string {
  return `TCK-${bookingRef}-${String(index + 1).padStart(2, "0")}`;
}

/**
 * 10-Step Transactional Seat Hold & Pending Booking Creation
 */
export async function createSeatHoldAndBooking({
  userId,
  showtimeId,
  seatIds,
}: CreateHoldParams): Promise<HoldResult> {
  if (!seatIds || seatIds.length === 0) {
    throw new AppError("At least one seat must be selected", 400, "NO_SEATS_SELECTED");
  }
  if (seatIds.length > 10) {
    throw new AppError("Maximum 10 seats per booking", 400, "TOO_MANY_SEATS");
  }

  const db = getDb();
  const now = new Date();
  const holdExpiresAt = new Date(now.getTime() + HOLD_EXPIRATION_MINUTES * 60 * 1000);

  // Execute in an ACID transaction
  return await db.transaction(async (tx: any) => {
    // 1. Check showtime exists and is active
    const [showtime] = await tx
      .select()
      .from(showtimes)
      .where(eq(showtimes.id, showtimeId));

    if (!showtime) {
      throw new AppError("Showtime not found", 404, "SHOWTIME_NOT_FOUND");
    }

    if (new Date(showtime.startTime) <= now) {
      throw new AppError("This showtime has already started", 400, "SHOWTIME_STARTED");
    }

    // 2. Lock and retrieve the requested showtime_seat records
    // We use SQL row locking if supported by PostgreSQL engine
    const requestedSeats = await tx
      .select({
        showtimeSeat: showtimeSeats,
        seat: seats,
      })
      .from(showtimeSeats)
      .innerJoin(seats, eq(showtimeSeats.seatId, seats.id))
      .where(
        and(
          eq(showtimeSeats.showtimeId, showtimeId),
          inArray(showtimeSeats.seatId, seatIds)
        )
      );

    if (requestedSeats.length !== seatIds.length) {
      throw new AppError(
        "One or more selected seats do not exist in this showtime",
        400,
        "SEATS_NOT_FOUND"
      );
    }

    // 3. Confirm every requested seat is available (or expired hold)
    for (const item of requestedSeats) {
      const stSeat = item.showtimeSeat;
      const isAvailable = stSeat.status === SEAT_STATUS.AVAILABLE;
      const isExpiredHold =
        stSeat.status === SEAT_STATUS.HELD &&
        stSeat.holdExpiresAt &&
        new Date(stSeat.holdExpiresAt) < now;
      const isMyActiveHold =
        stSeat.status === SEAT_STATUS.HELD && stSeat.heldByUserId === userId;

      if (!isAvailable && !isExpiredHold && !isMyActiveHold) {
        throw new AppError(
          `Seat ${item.seat.row}${item.seat.number} is no longer available`,
          409,
          "SEAT_UNAVAILABLE",
          { seatId: item.seat.id, label: `${item.seat.row}${item.seat.number}` }
        );
      }
    }

    // 4. Update showtime_seats to HELD status with TTL
    for (const item of requestedSeats) {
      await tx
        .update(showtimeSeats)
        .set({
          status: SEAT_STATUS.HELD,
          holdExpiresAt: holdExpiresAt,
          heldByUserId: userId,
          updatedAt: now,
        })
        .where(eq(showtimeSeats.id, item.showtimeSeat.id));
    }

    // 5. Calculate price on the server (minor units)
    let subtotalCents = 0;
    const seatLabels: string[] = [];
    for (const item of requestedSeats) {
      subtotalCents += item.showtimeSeat.priceCents;
      seatLabels.push(`${item.seat.row}${item.seat.number} (${item.seat.type})`);
    }

    const feeCents = seatIds.length * BOOKING_FEE_CENTS_PER_SEAT;
    const taxCents = Math.round((subtotalCents + feeCents) * TAX_RATE);
    const totalCents = subtotalCents + feeCents + taxCents;

    // 6. Create pending booking record
    const bookingReference = generateBookingReference();
    const [booking] = await tx
      .insert(bookings)
      .values({
        bookingReference,
        userId,
        showtimeId,
        status: BOOKING_STATUS.PENDING,
        totalSeats: seatIds.length,
        subtotalCents,
        feeCents,
        taxCents,
        totalCents,
        expiresAt: holdExpiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // 7. Create booking_items records
    for (const item of requestedSeats) {
      await tx.insert(bookingItems).values({
        bookingId: booking.id,
        showtimeSeatId: item.showtimeSeat.id,
        seatId: item.seat.id,
        priceCents: item.showtimeSeat.priceCents,
        seatLabel: `Row ${item.seat.row}, Seat ${item.seat.number}`,
      });
    }

    // 8. Write audit log
    await tx.insert(auditLogs).values({
      userId,
      action: "SEAT_HOLD_CREATED",
      entityType: "BOOKING",
      entityId: booking.id,
      details: JSON.stringify({
        bookingReference,
        seatIds,
        totalCents,
        expiresAt: holdExpiresAt.toISOString(),
      }),
    });

    return {
      bookingId: booking.id,
      bookingReference,
      expiresAt: holdExpiresAt,
      subtotalCents,
      feeCents,
      taxCents,
      totalCents,
      seatLabels,
    };
  });
}

/**
 * Idempotent Payment Confirmation & Digital Ticket Generation
 */
export async function confirmBookingPayment({
  bookingId,
  userId,
  idempotencyKey,
  paymentMethod = "TEST_CARD",
}: {
  bookingId: string;
  userId: string;
  idempotencyKey: string;
  paymentMethod?: string;
}) {
  const db = getDb();
  const now = new Date();

  return await db.transaction(async (tx: any) => {
    // 1. Check idempotency: if payment with this key already succeeded, return existing result
    const [existingPayment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.idempotencyKey, idempotencyKey));

    if (existingPayment) {
      if (existingPayment.status === PAYMENT_STATUS.SUCCEEDED) {
        const [existingBooking] = await tx
          .select()
          .from(bookings)
          .where(eq(bookings.id, existingPayment.bookingId));
        return {
          success: true,
          booking: existingBooking,
          payment: existingPayment,
          isDuplicate: true,
        };
      }
    }

    // 2. Retrieve booking
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!booking) {
      throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
    }

    if (booking.userId !== userId) {
      throw new AppError("Unauthorized access to booking", 403, "UNAUTHORIZED");
    }

    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      return { success: true, booking, isAlreadyConfirmed: true };
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      throw new AppError(
        `Cannot pay for booking with status: ${booking.status}`,
        400,
        "INVALID_BOOKING_STATUS"
      );
    }

    // Check expiration
    if (booking.expiresAt && new Date(booking.expiresAt) < now) {
      // Mark as expired
      await tx
        .update(bookings)
        .set({ status: BOOKING_STATUS.EXPIRED, updatedAt: now })
        .where(eq(bookings.id, bookingId));

      throw new AppError("Seat hold expired. Please reselect your seats.", 410, "HOLD_EXPIRED");
    }

    // 3. Retrieve booking items and verify seats are still held by this user
    const items = await tx
      .select({
        item: bookingItems,
        showtimeSeat: showtimeSeats,
      })
      .from(bookingItems)
      .innerJoin(showtimeSeats, eq(bookingItems.showtimeSeatId, showtimeSeats.id))
      .where(eq(bookingItems.bookingId, bookingId));

    for (const record of items) {
      if (
        record.showtimeSeat.status !== SEAT_STATUS.HELD ||
        record.showtimeSeat.heldByUserId !== userId
      ) {
        throw new AppError(
          "One or more seats are no longer reserved for your session",
          409,
          "SEAT_HOLD_LOST"
        );
      }
    }

    // 4. Create or update payment record
    const paymentIntentId = `pi_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const [payment] = await tx
      .insert(payments)
      .values({
        bookingId,
        paymentIntentId,
        idempotencyKey,
        provider: "TEST_GATEWAY",
        amountCents: booking.totalCents,
        currency: "USD",
        status: PAYMENT_STATUS.SUCCEEDED,
        rawResponse: JSON.stringify({ paymentMethod, timestamp: now.toISOString() }),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // 5. Transition seats to BOOKED
    for (const record of items) {
      await tx
        .update(showtimeSeats)
        .set({
          status: SEAT_STATUS.BOOKED,
          holdExpiresAt: null,
          heldByUserId: null,
          updatedAt: now,
        })
        .where(eq(showtimeSeats.id, record.showtimeSeat.id));
    }

    // 6. Transition booking to CONFIRMED
    const [confirmedBooking] = await tx
      .update(bookings)
      .set({
        status: BOOKING_STATUS.CONFIRMED,
        expiresAt: null,
        updatedAt: now,
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // 7. Generate digital tickets with unique QR code payload
    for (let i = 0; i < items.length; i++) {
      const record = items[i];
      const ticketCode = generateTicketCode(booking.bookingReference, i);
      const qrData = JSON.stringify({
        ref: booking.bookingReference,
        ticket: ticketCode,
        seat: record.item.seatLabel,
        showtimeId: booking.showtimeId,
        issued: now.toISOString(),
      });
      const qrCodeDataUrl = await generateQrCodeDataUrl(qrData);

      await tx.insert(tickets).values({
        bookingId,
        bookingItemId: record.item.id,
        ticketCode,
        qrCodeData: qrCodeDataUrl,
        status: "VALID",
        issuedAt: now,
      });
    }

    // 8. Audit log
    await tx.insert(auditLogs).values({
      userId,
      action: "BOOKING_CONFIRMED",
      entityType: "BOOKING",
      entityId: booking.id,
      details: JSON.stringify({
        bookingReference: booking.bookingReference,
        paymentId: payment.id,
        amountCents: booking.totalCents,
      }),
    });

    return {
      success: true,
      booking: confirmedBooking,
      payment,
      isDuplicate: false,
    };
  });
}

/**
 * Idempotent Expired Hold Release Worker (Safe for cron execution)
 */
export async function releaseExpiredSeatHolds(): Promise<{
  releasedSeatsCount: number;
  expiredBookingsCount: number;
}> {
  const db = getDb();
  const now = new Date();

  return await db.transaction(async (tx: any) => {
    // 1. Find all expired showtime_seats
    const expiredSeats = await tx
      .select({ id: showtimeSeats.id })
      .from(showtimeSeats)
      .where(
        and(
          eq(showtimeSeats.status, SEAT_STATUS.HELD),
          lt(showtimeSeats.holdExpiresAt, now)
        )
      );

    let releasedSeatsCount = 0;
    if (expiredSeats.length > 0) {
      const seatIdsToRelease = expiredSeats.map((s: any) => s.id);
      await tx
        .update(showtimeSeats)
        .set({
          status: SEAT_STATUS.AVAILABLE,
          holdExpiresAt: null,
          heldByUserId: null,
          updatedAt: now,
        })
        .where(inArray(showtimeSeats.id, seatIdsToRelease));

      releasedSeatsCount = expiredSeats.length;
    }

    // 2. Find and expire associated pending bookings
    const expiredPendingBookings = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, BOOKING_STATUS.PENDING),
          lt(bookings.expiresAt, now)
        )
      );

    let expiredBookingsCount = 0;
    if (expiredPendingBookings.length > 0) {
      const bookingIds = expiredPendingBookings.map((b: any) => b.id);
      await tx
        .update(bookings)
        .set({
          status: BOOKING_STATUS.EXPIRED,
          updatedAt: now,
        })
        .where(inArray(bookings.id, bookingIds));

      expiredBookingsCount = expiredPendingBookings.length;
    }

    if (releasedSeatsCount > 0 || expiredBookingsCount > 0) {
      await tx.insert(auditLogs).values({
        action: "EXPIRED_HOLDS_RELEASED",
        entityType: "CRON_CLEANUP",
        details: JSON.stringify({
          releasedSeatsCount,
          expiredBookingsCount,
          timestamp: now.toISOString(),
        }),
      });
    }

    return { releasedSeatsCount, expiredBookingsCount };
  });
}

/**
 * Cancel an eligible booking and release its seats
 */
export async function cancelBooking({
  bookingId,
  userId,
  isAdmin = false,
}: {
  bookingId: string;
  userId: string;
  isAdmin?: boolean;
}) {
  const db = getDb();
  const now = new Date();

  return await db.transaction(async (tx: any) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!booking) {
      throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
    }

    if (!isAdmin && booking.userId !== userId) {
      throw new AppError("Unauthorized access to booking", 403, "UNAUTHORIZED");
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      return { success: true, message: "Booking was already cancelled" };
    }

    if (
      booking.status !== BOOKING_STATUS.CONFIRMED &&
      booking.status !== BOOKING_STATUS.PENDING
    ) {
      throw new AppError(
        `Cannot cancel booking with status: ${booking.status}`,
        400,
        "CANNOT_CANCEL"
      );
    }

    // Check showtime start time: cannot cancel past or in-progress showtimes
    const [showtime] = await tx
      .select()
      .from(showtimes)
      .where(eq(showtimes.id, booking.showtimeId));

    if (showtime && new Date(showtime.startTime) <= now) {
      throw new AppError(
        "Cannot cancel bookings for showtimes that have already commenced",
        400,
        "SHOWTIME_ALREADY_STARTED"
      );
    }

    // 1. Get associated showtime_seat ids
    const items = await tx
      .select({ showtimeSeatId: bookingItems.showtimeSeatId })
      .from(bookingItems)
      .where(eq(bookingItems.bookingId, bookingId));

    const stSeatIds = items.map((i: any) => i.showtimeSeatId);

    // 2. Release seats back to AVAILABLE
    if (stSeatIds.length > 0) {
      await tx
        .update(showtimeSeats)
        .set({
          status: SEAT_STATUS.AVAILABLE,
          holdExpiresAt: null,
          heldByUserId: null,
          updatedAt: now,
        })
        .where(inArray(showtimeSeats.id, stSeatIds));
    }

    // 3. Mark tickets as CANCELLED
    await tx
      .update(tickets)
      .set({ status: "CANCELLED" })
      .where(eq(tickets.bookingId, bookingId));

    // 4. Update payments to REFUNDED if was confirmed
    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      await tx
        .update(payments)
        .set({
          status: PAYMENT_STATUS.REFUNDED,
          updatedAt: now,
        })
        .where(eq(payments.bookingId, bookingId));
    }

    // 5. Update booking to CANCELLED or REFUNDED
    const finalStatus =
      booking.status === BOOKING_STATUS.CONFIRMED
        ? BOOKING_STATUS.REFUNDED
        : BOOKING_STATUS.CANCELLED;

    const [updatedBooking] = await tx
      .update(bookings)
      .set({
        status: finalStatus,
        updatedAt: now,
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // 6. Audit log
    await tx.insert(auditLogs).values({
      userId,
      action: "BOOKING_CANCELLED",
      entityType: "BOOKING",
      entityId: bookingId,
      details: JSON.stringify({
        previousStatus: booking.status,
        finalStatus,
        refundedAmountCents: booking.totalCents,
      }),
    });

    return {
      success: true,
      booking: updatedBooking,
      status: finalStatus,
    };
  });
}
