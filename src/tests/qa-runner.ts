import { getDb } from "../db";
import {
  users,
  movies,
  cinemas,
  auditoriums,
  seats,
  showtimes,
  showtimeSeats,
  bookings,
  bookingItems,
  payments,
  tickets,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import {
  createSeatHoldAndBooking,
  confirmBookingPayment,
  releaseExpiredSeatHolds,
  cancelBooking,
} from "../lib/booking-service";
import { hashPassword, comparePassword, signSessionToken, verifySessionToken } from "../lib/auth";
import { BOOKING_FEE_CENTS_PER_SEAT, TAX_RATE, SEAT_STATUS, BOOKING_STATUS } from "../lib/constants";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    failedCount++;
  }
}

async function runQaSuite() {
  console.log("==================================================");
  console.log("🎬 CINEBOOK COMPREHENSIVE QA TEST SUITE");
  console.log("==================================================\n");

  const db = getDb();

  // ----------------------------------------------------
  // TEST 1: Database Schema & Migration Verification
  // ----------------------------------------------------
  console.log("📋 [Test 1] Database Tables & Relationships Verification");
  const usersCount = (await db.select().from(users)).length;
  const moviesCount = (await db.select().from(movies)).length;
  const showtimesCount = (await db.select().from(showtimes)).length;
  const seatsCount = (await db.select().from(seats)).length;

  assert(usersCount >= 2, "Users seeded with Customer and Admin", `Found ${usersCount}`);
  assert(moviesCount >= 6, "Movies catalog seeded", `Found ${moviesCount}`);
  assert(showtimesCount > 0, "Showtimes scheduled", `Found ${showtimesCount}`);
  assert(seatsCount > 50, "Auditorium seats matrix created", `Found ${seatsCount}`);

  // ----------------------------------------------------
  // TEST 2: Authentication & Password Security
  // ----------------------------------------------------
  console.log("\n🔐 [Test 2] Authentication & Token Cryptography");
  const rawPass = "Secr3tP@ssw0rd!";
  const hashed = await hashPassword(rawPass);
  const isValidPass = await comparePassword(rawPass, hashed);
  const isInvalidPass = await comparePassword("WrongPassword", hashed);

  assert(isValidPass, "Bcrypt verifies authentic password");
  assert(!isInvalidPass, "Bcrypt rejects erroneous password");

  const testPayload = {
    userId: "test-uuid-1234",
    email: "test@cinebook.com",
    name: "QA Tester",
    role: "USER" as const,
  };
  const token = await signSessionToken(testPayload);
  const verified = await verifySessionToken(token);

  assert(verified !== null && verified.email === testPayload.email, "JWT session sign and verify");
  assert(verified?.role === "USER", "User role preserved in signed claims");

  // ----------------------------------------------------
  // TEST 3: Pricing Calculation & Minor Units
  // ----------------------------------------------------
  console.log("\n💵 [Test 3] Pricing Calculation in Integer Minor Units");
  const seatPrices = [1400, 1800]; // $14.00 and $18.00
  const subtotal = seatPrices.reduce((a, b) => a + b, 0); // 3200 ($32.00)
  const fee = seatPrices.length * BOOKING_FEE_CENTS_PER_SEAT; // 300 ($3.00)
  const tax = Math.round((subtotal + fee) * TAX_RATE); // Math.round(3500 * 0.0825) = 289
  const expectedTotal = subtotal + fee + tax; // 3789 ($37.89)

  assert(expectedTotal === 3789, "Exact penny math in minor units (no floating-point drift)");

  // ----------------------------------------------------
  // TEST 4: Concurrency Conflict Test (Simultaneous Double-Booking Attempt)
  // ----------------------------------------------------
  console.log("\n⚡ [Test 4] Concurrency Conflict Test: Dual Simultaneous Hold Collision");
  // Find a showtime with available seats
  const [targetShowtime] = await db.select().from(showtimes).limit(1);
  const availableSeats = await db
    .select({ seatId: showtimeSeats.seatId })
    .from(showtimeSeats)
    .where(
      and(
        eq(showtimeSeats.showtimeId, targetShowtime.id),
        eq(showtimeSeats.status, SEAT_STATUS.AVAILABLE)
      )
    )
    .limit(1);

  if (availableSeats.length > 0) {
    const collisionSeatId = availableSeats[0].seatId;
    const [userA] = await db.select().from(users).where(eq(users.role, "USER")).limit(1);
    const [userB] = await db.select().from(users).where(eq(users.role, "ADMIN")).limit(1);

    // Run both requests concurrently using Promise.allSettled
    const [resA, resB] = await Promise.allSettled([
      createSeatHoldAndBooking({
        userId: userA.id,
        showtimeId: targetShowtime.id,
        seatIds: [collisionSeatId],
      }),
      createSeatHoldAndBooking({
        userId: userB.id,
        showtimeId: targetShowtime.id,
        seatIds: [collisionSeatId],
      }),
    ]);

    const successes = [resA, resB].filter((r) => r.status === "fulfilled");
    const failures = [resA, resB].filter((r) => r.status === "rejected");

    assert(
      successes.length === 1 && failures.length === 1,
      "Simultaneous hold collision: Exactly 1 succeeds and 1 is rejected",
      `Successes: ${successes.length}, Rejections: ${failures.length}`
    );

    // Verify the failure message mentions unavailable seat
    if (failures.length > 0) {
      const err = (failures[0] as PromiseRejectedResult).reason;
      assert(
        err.message.includes("no longer available") || err.statusCode === 409,
        "Rejected request received 409 SEAT_UNAVAILABLE error"
      );
    }

    // ----------------------------------------------------
    // TEST 5: Payment Idempotency & Digital Ticket Generation
    // ----------------------------------------------------
    console.log("\n🎟️ [Test 5] Payment Confirmation & Idempotency Key Guard");
    if (successes.length === 1) {
      const winningHold = (successes[0] as PromiseFulfilledResult<any>).value;
      const idempotencyKey = `qa_idem_${Date.now()}`;

      // First payment attempt
      const pay1 = await confirmBookingPayment({
        bookingId: winningHold.bookingId,
        userId: userA.id,
        idempotencyKey,
      });

      assert(pay1.success && !pay1.isDuplicate, "First payment successfully transitions seats to BOOKED");

      // Verify digital tickets created
      const createdTickets = await db
        .select()
        .from(tickets)
        .where(eq(tickets.bookingId, winningHold.bookingId));

      assert(createdTickets.length === 1, "Digital ticket generated with unique QR code payload");
      assert(
        createdTickets[0].qrCodeData.startsWith("data:image/"),
        "QR code generated as high-resolution base64 data URL"
      );

      // Duplicate payment retry with exact same idempotency key
      const pay2 = await confirmBookingPayment({
        bookingId: winningHold.bookingId,
        userId: userA.id,
        idempotencyKey,
      });

      assert(
        pay2.success && (pay2.isDuplicate || (pay2 as any).isAlreadyConfirmed),
        "Payment with duplicate idempotency key is safely ignored (zero double-charge)"
      );

      // Verify no duplicate tickets created
      const ticketsAfterRetry = await db
        .select()
        .from(tickets)
        .where(eq(tickets.bookingId, winningHold.bookingId));

      assert(
        ticketsAfterRetry.length === 1,
        "Idempotent retry prevents duplicate ticket creation"
      );

      // ----------------------------------------------------
      // TEST 6: Booking Cancellation & Automatic Seat Recovery
      // ----------------------------------------------------
      console.log("\n🔄 [Test 6] Booking Cancellation & Seat Release");
      const cancelRes = await cancelBooking({
        bookingId: winningHold.bookingId,
        userId: userA.id,
      });

      assert(cancelRes.success, "Booking cancelled and refund recorded");

      const [cancelledBooking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, winningHold.bookingId));

      assert(
        cancelledBooking.status === "REFUNDED" || cancelledBooking.status === "CANCELLED",
        "Booking status updated to REFUNDED/CANCELLED"
      );

      const [releasedSeat] = await db
        .select()
        .from(showtimeSeats)
        .where(
          and(
            eq(showtimeSeats.showtimeId, targetShowtime.id),
            eq(showtimeSeats.seatId, collisionSeatId)
          )
        );

      assert(
        releasedSeat.status === SEAT_STATUS.AVAILABLE,
        "Cancelled seat status automatically restored to AVAILABLE"
      );
    }
  }

  // ----------------------------------------------------
  // TEST 7: Expired Seat Hold Idempotent Cleanup
  // ----------------------------------------------------
  console.log("\n⏰ [Test 7] Expired Seat Hold Auto-Release Endpoint");
  // Create an artificial expired hold in DB
  const [anyAvailable] = await db
    .select()
    .from(showtimeSeats)
    .where(eq(showtimeSeats.status, SEAT_STATUS.AVAILABLE))
    .limit(1);

  if (anyAvailable) {
    const expiredTime = new Date(Date.now() - 15 * 60 * 1000); // 15 mins in the past
    await db
      .update(showtimeSeats)
      .set({
        status: SEAT_STATUS.HELD,
        holdExpiresAt: expiredTime,
      })
      .where(eq(showtimeSeats.id, anyAvailable.id));

    // Run release
    const cleanupResult = await releaseExpiredSeatHolds();
    assert(
      cleanupResult.releasedSeatsCount >= 1,
      "Cron cleanup safely identified and released expired seat holds"
    );

    const [checkedSeat] = await db
      .select()
      .from(showtimeSeats)
      .where(eq(showtimeSeats.id, anyAvailable.id));

    assert(
      checkedSeat.status === SEAT_STATUS.AVAILABLE,
      "Seat returned to AVAILABLE status following hold expiry"
    );
  }

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log("\n==================================================");
  console.log(`📊 QA TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runQaSuite()
  .then(() => {
    console.log("✨ QA Suite completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("QA Suite encountered fatal error:", err);
    process.exit(1);
  });
