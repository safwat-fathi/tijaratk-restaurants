# Tijaratk Restaurant Backend

This is the backend engine for the Tijaratk Restaurant platform. It is built with **NestJS**, **Prisma**, and **PostgreSQL**, designed to support multi-branch fast-food and fine-dining operations.

## Architecture & Pivot Strategy

This platform has pivoted from a grocery/supermarket model to a strict **restaurant-first** architecture.

### Key Architectural Principles

1.  **POS as Source of Truth:** The external POS system owns menu, categories, modifiers, and pricing data.
2.  **Web DB as Mirror of Truth:** The local PostgreSQL database mirrors POS data for high-performance customer reads and checkout orchestration.
3.  **Strict Write Contracts:** The backend never writes directly to POS domain tables from the web app. Orders are exported via an approved POS-owned write contract (e.g., stored procedure `dbo.PS_AddApplicationCustomerOrder`).
4.  **Prisma & Raw SQL:** **Prisma** is the primary ORM for standard CRUD and transactions. Raw SQL is reserved specifically for advanced PostgreSQL capabilities like PostGIS (spatial delivery zones), `pg_trgm` (fuzzy search), and Row-Level Security (RLS).
5.  **Multi-Tenant & Branch Isolation:** Strict data boundaries are enforced via tenant IDs, branch IDs, and PostgreSQL RLS policies.

## Core Domains

-   **Menu Domain:** Synced from the POS. Supports categories, items, variants, modifiers, and combos.
-   **Orders & Checkout:** Handles branch-aware checkout, server-side pricing recalculation from the mirror DB, and order snapshots.
-   **POS Integration:** Features cursor-based sync workers, partner adapters, idempotency management, and asynchronous order export.
-   **Tenants & Branches:** Supports multi-location management, branch operating hours, and branch-level configuration overrides.

## Tech Stack

-   **Framework:** NestJS
-   **Database:** PostgreSQL (with PostGIS & `pg_trgm`)
-   **ORM:** Prisma
-   **Integration:** MSSQL (for current POS connections)
-   **Messaging:** Twilio (WhatsApp notifications)

## Project Setup

```bash
$ pnpm install
```

### Environment Configuration

Copy `.env.example` to `.env.development` and provide the required values, including the PostgreSQL and POS connection details:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/tijaratk_restaurant?schema=public"

# POS SQL Server Configuration
POS_DB_HOST=
POS_DB_PORT=1433
POS_DB_USER=
POS_DB_PASS=
POS_DB_NAME=
POS_DB_ENCRYPT=true
POS_DB_TRUST_CERT=true
```

## Prisma & Database Commands

```bash
# Generate Prisma Client
$ pnpm run prisma:generate

# Apply migrations in development
$ pnpm run prisma:migrate:dev

# Apply migrations in production
$ pnpm run prisma:migrate:prod
```

## Running the App

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## POS Sync Operations

To manually trigger the initial POS synchronization (MVP):

```bash
$ pnpm run sync:pos:mvp
```

## WhatsApp Notifications

Set the following environment variables to enable Twilio Content Template sends. The system will fall back to plaintext if SIDs are missing.

-   `TWILIO_CONTENT_SID_NEW_ORDER_MERCHANT`
-   `TWILIO_CONTENT_SID_ORDER_RECEIVED_CUSTOMER`
-   `TWILIO_CONTENT_SID_ORDER_OUT_FOR_DELIVERY`
-   `TWILIO_CONTENT_SID_ORDER_STATUS_UPDATE_CUSTOMER`
-   `TWILIO_CONTENT_SID_MERCHANT_DAY_CLOSURE_SUMMARY`

## Testing

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e
```
