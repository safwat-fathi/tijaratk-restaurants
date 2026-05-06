# Phase 0 Decision Record: Restaurant-Only Pivot

## Status

Approved for implementation kickoff.

## Decision Summary

We are pivoting from supermarket/grocery workflows to a restaurant-only platform.

- In scope: fast-food and fine-dining restaurant operations.
- Out of scope: grocery, butcher, bakery, and pharmacy specialized workflows.
- POS remains Source of Truth for menu and operational statuses.
- Web app database remains a performance mirror and engagement layer.

## Product Boundary Decisions

1. Customer-facing experience is restaurant-first (menu, branch, delivery service, checkout, tracking).
2. Legacy grocery-specific behavior will be sunset through phased feature rollout.
3. Customer historical-order experience is not a product requirement.
4. Active order tracking remains a product requirement.

## Persistence and Database Decisions

1. Prisma is the ORM direction for the restaurant pivot.
2. Raw SQL is allowed for PostgreSQL features not cleanly represented in Prisma:
   - PostGIS
   - `pg_trgm`
   - RLS functions and policies
3. Existing TypeORM implementation is treated as legacy baseline until migration phases execute.

## POS Contract Decisions

1. Initial read views:
   - `PS_ApplicationOrders_V`
   - `PS_ApplicationDeliveryServices_V`
2. Initial write contract:
   - `dbo.PS_AddApplicationCustomerOrder`
3. Preferred long-term write contract:
   - dedicated `incoming_orders` table with idempotency key support.

## Phase 0 Deliverables

- Legacy audit matrix (backend/frontend inventory and retirement candidates).
- Retained capabilities matrix (what is reused as platform foundation).
- Shared decision artifacts for engineering and product alignment.

## Exit Criteria

1. Team agrees on restaurant-only scope.
2. Legacy grocery flows are inventoried and tagged by retirement priority.
3. Retained platform capabilities are confirmed.
4. No feature flags are introduced for this pivot stage.
5. Legacy grocery code removal is direct and immediate.
6. Prisma + raw SQL policy is documented and accepted.
