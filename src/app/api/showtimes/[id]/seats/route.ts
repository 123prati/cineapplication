import { NextRequest } from "next/server";
import { eq, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { showtimeSeats, seats, showtimes, auditoriums } from "@/db/schema";
import { SEAT_STATUS } from "@/lib/constants";
import { apiError, apiSuccess, handleRouteError } from "@/lib/errors";

export function generateStaticParams() {
  return [];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showtimeId } = await params;
    const db = getDb();
    const now = new Date();

    // 1. Verify showtime and get auditorium
    const [st] = await db
      .select({
        showtimeId: showtimes.id,
        auditoriumId: auditoriums.id,
        screenType: auditoriums.screenType,
        auditoriumName: auditoriums.name,
        totalSeats: auditoriums.totalSeats,
      })
      .from(showtimes)
      .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
      .where(eq(showtimes.id, showtimeId));

    if (!st) {
      return apiError("Showtime not found", 404, "SHOWTIME_NOT_FOUND");
    }

    // 2. Fetch all seats for this showtime
    const seatRecords = await db
      .select({
        showtimeSeatId: showtimeSeats.id,
        seatId: seats.id,
        row: seats.row,
        number: seats.number,
        type: seats.type,
        status: showtimeSeats.status,
        priceCents: showtimeSeats.priceCents,
        holdExpiresAt: showtimeSeats.holdExpiresAt,
        heldByUserId: showtimeSeats.heldByUserId,
      })
      .from(showtimeSeats)
      .innerJoin(seats, eq(showtimeSeats.seatId, seats.id))
      .where(eq(showtimeSeats.showtimeId, showtimeId))
      .orderBy(asc(seats.row), asc(seats.number));

    // Process effective status (if held but expired, show as AVAILABLE)
    const processedSeats = seatRecords.map((s: any) => {
      let effectiveStatus = s.status;
      if (
        s.status === SEAT_STATUS.HELD &&
        s.holdExpiresAt &&
        new Date(s.holdExpiresAt) < now
      ) {
        effectiveStatus = SEAT_STATUS.AVAILABLE;
      }

      return {
        id: s.seatId,
        showtimeSeatId: s.showtimeSeatId,
        row: s.row,
        number: s.number,
        label: `${s.row}${s.number}`,
        type: s.type,
        status: effectiveStatus,
        priceCents: s.priceCents,
        isHeld: effectiveStatus === SEAT_STATUS.HELD,
        isBooked: effectiveStatus === SEAT_STATUS.BOOKED,
        isBlocked: effectiveStatus === SEAT_STATUS.BLOCKED,
        isAvailable: effectiveStatus === SEAT_STATUS.AVAILABLE,
      };
    });

    // Group seats by row
    const rowMap: Record<string, typeof processedSeats> = {};
    for (const seat of processedSeats) {
      if (!rowMap[seat.row]) {
        rowMap[seat.row] = [];
      }
      rowMap[seat.row].push(seat);
    }

    const rows = Object.keys(rowMap)
      .sort()
      .map((rowName) => ({
        row: rowName,
        seats: rowMap[rowName],
      }));

    const availableCount = processedSeats.filter((s: any) => s.isAvailable).length;
    const bookedCount = processedSeats.filter((s: any) => s.isBooked).length;
    const heldCount = processedSeats.filter((s: any) => s.isHeld).length;

    return apiSuccess({
      showtimeId,
      auditorium: {
        id: st.auditoriumId,
        name: st.auditoriumName,
        screenType: st.screenType,
        totalSeats: st.totalSeats,
      },
      stats: {
        total: processedSeats.length,
        available: availableCount,
        booked: bookedCount,
        held: heldCount,
      },
      rows,
      seats: processedSeats,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
