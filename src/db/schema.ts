import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// 1. Users table
export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("USER"), // 'USER' | 'ADMIN'
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_role").on(table.role),
  ]
);

// 2. Movies table
export const movies = pgTable(
  "movies",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    releaseDate: text("release_date").notNull(),
    rating: text("rating").notNull(), // 'PG-13', 'R', etc.
    posterUrl: text("poster_url").notNull(),
    backdropUrl: text("backdrop_url").notNull(),
    trailerUrl: text("trailer_url"),
    language: text("language").notNull().default("English"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_movies_slug").on(table.slug),
    index("idx_movies_is_active").on(table.isActive),
    index("idx_movies_language").on(table.language),
  ]
);

// 3. Genres table
export const genres = pgTable("genres", {
  id: uuid("id")
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

// 4. Movie-Genres junction table
export const movieGenres = pgTable(
  "movie_genres",
  {
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.genreId] }),
    index("idx_movie_genres_movie").on(table.movieId),
    index("idx_movie_genres_genre").on(table.genreId),
  ]
);

// 5. Cinemas table
export const cinemas = pgTable(
  "cinemas",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    phone: text("phone"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_cinemas_city").on(table.city),
    index("idx_cinemas_slug").on(table.slug),
  ]
);

// 6. Auditoriums table
export const auditoriums = pgTable(
  "auditoriums",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    cinemaId: uuid("cinema_id")
      .notNull()
      .references(() => cinemas.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    screenType: text("screen_type").notNull().default("STANDARD"), // 'STANDARD', 'IMAX', 'DOLBY', 'VIP'
    totalSeats: integer("total_seats").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uniq_auditorium_cinema_name").on(table.cinemaId, table.name),
    index("idx_auditoriums_cinema").on(table.cinemaId),
  ]
);

// 7. Seats table
export const seats = pgTable(
  "seats",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    auditoriumId: uuid("auditorium_id")
      .notNull()
      .references(() => auditoriums.id, { onDelete: "cascade" }),
    row: text("row").notNull(),
    number: integer("number").notNull(),
    type: text("type").notNull().default("STANDARD"), // 'STANDARD', 'PREMIUM', 'VIP', 'ACCESSIBLE'
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uniq_seat_auditorium_pos").on(
      table.auditoriumId,
      table.row,
      table.number
    ),
    index("idx_seats_auditorium").on(table.auditoriumId),
  ]
);

// 8. Showtimes table
export const showtimes = pgTable(
  "showtimes",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    auditoriumId: uuid("auditorium_id")
      .notNull()
      .references(() => auditoriums.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    basePriceCents: integer("base_price_cents").notNull(), // integer minor units
    status: text("status").notNull().default("SCHEDULED"), // 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_showtimes_movie_time").on(table.movieId, table.startTime),
    index("idx_showtimes_auditorium").on(table.auditoriumId),
    index("idx_showtimes_start_time").on(table.startTime),
  ]
);

// 9. Showtime-Seats table (tracks seat state per showtime)
export const showtimeSeats = pgTable(
  "showtime_seats",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    showtimeId: uuid("showtime_id")
      .notNull()
      .references(() => showtimes.id, { onDelete: "cascade" }),
    seatId: uuid("seat_id")
      .notNull()
      .references(() => seats.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("AVAILABLE"), // 'AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED'
    priceCents: integer("price_cents").notNull(), // minor units
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    heldByUserId: uuid("held_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uniq_showtime_seat").on(table.showtimeId, table.seatId),
    index("idx_showtime_seats_showtime_status").on(
      table.showtimeId,
      table.status
    ),
    index("idx_showtime_seats_hold_expires").on(table.holdExpiresAt),
  ]
);

// 10. Bookings table
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    bookingReference: text("booking_reference").notNull().unique(), // e.g. 'CBK-ABC123'
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    showtimeId: uuid("showtime_id")
      .notNull()
      .references(() => showtimes.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("PENDING"), // 'PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'REFUNDED'
    totalSeats: integer("total_seats").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    feeCents: integer("fee_cents").notNull(),
    taxCents: integer("tax_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_bookings_user").on(table.userId),
    index("idx_bookings_showtime").on(table.showtimeId),
    index("idx_bookings_reference").on(table.bookingReference),
    index("idx_bookings_status").on(table.status),
    index("idx_bookings_expires_at").on(table.expiresAt),
  ]
);

// 11. Booking Items table
export const bookingItems = pgTable(
  "booking_items",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    showtimeSeatId: uuid("showtime_seat_id")
      .notNull()
      .references(() => showtimeSeats.id, { onDelete: "cascade" }),
    seatId: uuid("seat_id")
      .notNull()
      .references(() => seats.id, { onDelete: "cascade" }),
    priceCents: integer("price_cents").notNull(),
    seatLabel: text("seat_label").notNull(), // e.g. "Row D, Seat 8"
  },
  (table) => [
    uniqueIndex("uniq_booking_showtime_seat").on(
      table.bookingId,
      table.showtimeSeatId
    ),
    index("idx_booking_items_booking").on(table.bookingId),
  ]
);

// 12. Payments table
export const payments = pgTable(
  "payments",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    paymentIntentId: text("payment_intent_id").unique(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    provider: text("provider").notNull().default("TEST_GATEWAY"), // 'STRIPE_TEST', 'TEST_GATEWAY'
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    status: text("status").notNull().default("PENDING"), // 'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'
    failureReason: text("failure_reason"),
    rawResponse: text("raw_response"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_payments_booking").on(table.bookingId),
    index("idx_payments_idempotency").on(table.idempotencyKey),
    index("idx_payments_status").on(table.status),
  ]
);

// 13. Tickets table
export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    bookingItemId: uuid("booking_item_id")
      .notNull()
      .references(() => bookingItems.id, { onDelete: "cascade" })
      .unique(),
    ticketCode: text("ticket_code").notNull().unique(), // e.g. 'TCK-CBK-74892'
    qrCodeData: text("qr_code_data").notNull(),
    status: text("status").notNull().default("VALID"), // 'VALID', 'CHECKED_IN', 'CANCELLED'
    issuedAt: timestamp("issued_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_tickets_booking").on(table.bookingId),
    index("idx_tickets_code").on(table.ticketCode),
  ]
);

// 14. Audit Logs table
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    details: text("details"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_audit_logs_user").on(table.userId),
    index("idx_audit_logs_action").on(table.action),
    index("idx_audit_logs_created_at").on(table.createdAt),
  ]
);

// Drizzle Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  auditLogs: many(auditLogs),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieGenres),
  showtimes: many(showtimes),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}));

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}));

export const cinemasRelations = relations(cinemas, ({ many }) => ({
  auditoriums: many(auditoriums),
}));

export const auditoriumsRelations = relations(auditoriums, ({ one, many }) => ({
  cinema: one(cinemas, {
    fields: [auditoriums.cinemaId],
    references: [cinemas.id],
  }),
  seats: many(seats),
  showtimes: many(showtimes),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  auditorium: one(auditoriums, {
    fields: [seats.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
}));

export const showtimesRelations = relations(showtimes, ({ one, many }) => ({
  movie: one(movies, {
    fields: [showtimes.movieId],
    references: [movies.id],
  }),
  auditorium: one(auditoriums, {
    fields: [showtimes.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
  bookings: many(bookings),
}));

export const showtimeSeatsRelations = relations(showtimeSeats, ({ one }) => ({
  showtime: one(showtimes, {
    fields: [showtimeSeats.showtimeId],
    references: [showtimes.id],
  }),
  seat: one(seats, {
    fields: [showtimeSeats.seatId],
    references: [seats.id],
  }),
  heldByUser: one(users, {
    fields: [showtimeSeats.heldByUserId],
    references: [users.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  showtime: one(showtimes, {
    fields: [bookings.showtimeId],
    references: [showtimes.id],
  }),
  items: many(bookingItems),
  payments: many(payments),
  tickets: many(tickets),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  showtimeSeat: one(showtimeSeats, {
    fields: [bookingItems.showtimeSeatId],
    references: [showtimeSeats.id],
  }),
  seat: one(seats, {
    fields: [bookingItems.seatId],
    references: [seats.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  booking: one(bookings, {
    fields: [tickets.bookingId],
    references: [bookings.id],
  }),
  bookingItem: one(bookingItems, {
    fields: [tickets.bookingItemId],
    references: [bookingItems.id],
  }),
}));
