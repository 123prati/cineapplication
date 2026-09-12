# 🎬 CineBook: Production Cinema Ticket-Booking Platform

**CineBook** is a production-grade cinema ticketing web application engineered with **Next.js 15+ (App Router)**, **TypeScript**, **Tailwind CSS**, **Neon Serverless PostgreSQL** (via Vercel Marketplace), and **Drizzle ORM**.

Built by a specialized three-agent team:
- **Agent 1 (App Agent)**: Dark luxury cinema UI with dynamic filters, curved seat maps, hold countdown checkout, scannable digital passes, and admin portal.
- **Agent 2 (Database Engine Agent)**: 14 relational tables, ACID transactions with row-level locks, integer minor units, and idempotent cleanup.
- **Agent 3 (QA Agent)**: Automated QA test harness verifying concurrency collisions, payment idempotency, and access controls.

---

## 🌟 Key Features

- **Interactive Seat Map**: Curved projection screen, color-coded seat tiers (VIP Recliner, Premium, Standard, Accessible), real-time seat availability, and live hover tooltips.
- **ACID Transactional Seat Holds**: 10-minute hold TTL preventing race conditions and double-booking collisions.
- **Integer Minor Units**: All monetary amounts are stored in cents ($14.00 = `1400`) to completely eliminate floating-point rounding errors.
- **Idempotent Payment Engine**: Idempotency keys prevent duplicate charges and double ticket issuance on network retries.
- **Digital E-Tickets with QR Codes**: Passbook-style entry tickets featuring high-resolution scannable QR codes and barcodes.
- **Booking Cancellation & Seat Recovery**: One-click cancellation for eligible screenings that automatically restores seats to `AVAILABLE`.
- **Scheduled Hold Release Endpoint**: Secure, idempotent cleanup route protected by `CRON_SECRET` for Vercel Cron.
- **Admin Dashboard**: Real-time operational KPIs, revenue in USD, seat occupancy rate (%), recent bookings, and manual hold flushing.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15+ (App Router, Server & Client Components) |
| **Styling** | Tailwind CSS with dark cinema design system |
| **Database** | Neon Serverless PostgreSQL (via Vercel Marketplace) |
| **ORM & Migrations** | Drizzle ORM (`drizzle-kit`) |
| **Local Engine** | Embedded PGlite fallback for zero-setup local testing |
| **Security & Auth** | Bcrypt password hashing, JWT session cookies |
| **Digital Tickets** | High-res QR code generator (`qrcode`) |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Pooled Neon PostgreSQL connection URL | `postgresql://user:pass@ep-pooler.us-east-2.aws.neon.tech/cinebook?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | Direct Neon PostgreSQL connection URL for migrations | `postgresql://user:pass@ep.us-east-2.aws.neon.tech/cinebook?sslmode=require` |
| `JWT_SECRET` | Secret key for signing session tokens (min 32 chars) | `cinebook_super_secret_jwt_key_9876543210` |
| `CRON_SECRET` | Secret token guarding the scheduled hold release endpoint | `cinebook_cron_secret_auth_token_456789` |
| `STRIPE_SECRET_KEY` | Payment provider secret key (test mode) | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Payment provider public key | `pk_test_...` |
| `NEXT_PUBLIC_APP_URL` | Canonical application base URL | `http://localhost:3000` |

---

## 🚀 Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate and Run Database Migrations
```bash
# Generate SQL migrations from schema
npm run db:generate

# Push schema directly to database or execute migration runner
npm run db:push
```

### 3. Seed Database
Populate movies, cinemas, auditoriums, seats, showtimes, and demo user accounts:
```bash
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated QA Testing

Run the complete QA verification suite:
```bash
npm run test:qa
```

The test runner validates:
1. **Database Schema & Relations**: Confirms 14 relational tables, foreign keys, and indexes.
2. **Cryptographic Security**: Password hashing with Bcrypt, JWT claim issuance and validation.
3. **Integer Minor Units Math**: Accurate price calculations (subtotal + fees + taxes) down to the exact cent.
4. **Concurrency Collision**: Simulates two simultaneous asynchronous requests attempting to reserve the exact same seat at the exact same millisecond. Asserts exactly 1 succeeds and 1 receives a 409 Conflict.
5. **Payment Idempotency**: Tests duplicate payment retries and confirms zero duplicate charges or double ticket creation.
6. **Booking Cancellation**: Verifies status transitions to `REFUNDED` and seat status reverts to `AVAILABLE`.
7. **Hold Expiration Cleanup**: Asserts expired holds are reclaimed automatically.

---

## 🌐 Vercel Deployment Guide

### 1. Provision Neon PostgreSQL via Vercel Marketplace
1. In your Vercel project dashboard, navigate to the **Storage** tab.
2. Click **Create Database** and select **Neon Serverless Postgres**.
3. Choose your preferred region (e.g., `Washington, D.C. (iad1)`).
4. Vercel will automatically populate `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` in your project environment variables.

### 2. Configure Environment Variables in Vercel
In the Vercel Dashboard under **Project Settings > Environment Variables**, ensure the following are configured for both **Production** and **Preview**:
- `DATABASE_URL` (from Neon)
- `DATABASE_URL_UNPOOLED` (from Neon)
- `JWT_SECRET` (generate a random 32-character string)
- `CRON_SECRET` (generate a secure secret)
- `STRIPE_SECRET_KEY` (or test gateway key)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL` (`https://your-domain.vercel.app`)

### 3. Deployment Command & Migrations
In your Vercel project build settings:
- **Build Command**: `npm run build`
- To run migrations before each deployment, set the build command to:
  ```bash
  npx tsx src/db/migrate.ts && npm run build
  ```

### 4. Configure Vercel Cron for Automatic Seat Hold Cleanup
Add a `vercel.json` file in the project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/release-holds",
      "schedule": "*/5 * * * *"
    }
  ]
}
```
Vercel will automatically invoke `/api/cron/release-holds` every 5 minutes with `Authorization: Bearer <CRON_SECRET>`.

---

## 👤 Pre-configured Demo Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| **Customer** | `customer@cinebook.com` | `Password123!` | Browsing, seat hold, checkout, digital tickets, booking history |
| **Administrator** | `admin@cinebook.com` | `AdminPassword123!` | Admin dashboard, revenue KPIs, seat occupancy, hold flushing |

*Both accounts can be filled in with a single click using the "One-Click Demo Credentials" switcher on the login page.*
