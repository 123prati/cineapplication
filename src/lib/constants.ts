export const SEAT_STATUS = {
  AVAILABLE: "AVAILABLE",
  HELD: "HELD",
  BOOKED: "BOOKED",
  BLOCKED: "BLOCKED",
} as const;

export type SeatStatus = (typeof SEAT_STATUS)[keyof typeof SEAT_STATUS];

export const BOOKING_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  REFUNDED: "REFUNDED",
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const SCREEN_TYPE = {
  STANDARD: "STANDARD",
  IMAX: "IMAX",
  DOLBY: "DOLBY",
  VIP: "VIP",
} as const;

export type ScreenType = (typeof SCREEN_TYPE)[keyof typeof SCREEN_TYPE];

export const SEAT_TYPE = {
  STANDARD: "STANDARD",
  PREMIUM: "PREMIUM",
  VIP: "VIP",
  ACCESSIBLE: "ACCESSIBLE",
} as const;

export type SeatType = (typeof SEAT_TYPE)[keyof typeof SEAT_TYPE];

export const USER_ROLE = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

// Business rules
export const HOLD_EXPIRATION_MINUTES = 10;
export const BOOKING_FEE_CENTS_PER_SEAT = 150; // $1.50
export const TAX_RATE = 0.0825; // 8.25%

/**
 * Format integer minor units (cents) into human-readable currency ($XX.YY)
 */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
