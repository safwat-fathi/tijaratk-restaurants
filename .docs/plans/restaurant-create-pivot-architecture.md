# Restaurant Pivot Architecture Plan

## Objective

Pivot the platform from supermarket/grocery workflows to a restaurant engine that supports:

- Fast-food and fine-dining tenants
- Menu modeling (items, variants, modifiers, combos)
- Order lifecycle and delivery tracking
- Branch-aware operations
- Multi-tenant isolation with strict data boundaries
- POS integration where POS remains Source of Truth (SoT)

The outcome is a restaurant-first architecture, not a supermarket extension.

## Product Positioning Decision

- Remove grocery/butcher-specific domain behavior from active flows.
- Keep reusable platform primitives (auth, tenant, user, RLS infrastructure, notifications, shared infra).
- Build restaurant modules explicitly rather than overloading existing product semantics.

## Core Architecture Principles

1. **POS as Source of Truth; Web DB as Mirror of Truth**
   - Menu, categories, modifiers, and pricing are synced from POS into local PostgreSQL.
   - Web app reads from local mirror for performance and resiliency.

2. **Write constraints to POS**
   - Never write directly to POS domain tables from web app.
   - Only write orders through an approved POS-owned write contract.
   - Current discovered write contract is stored procedure `dbo.PS_AddApplicationCustomerOrder`.
   - A dedicated POS `incoming_orders` table remains the preferred future contract if the POS team can add it.

3. **Tenant and branch boundaries**
   - Tenant data must be isolated using PostgreSQL RLS and service-level checks.
   - Branch scoping must be enforced at service level and optionally in RLS where needed.

4. **Idempotent synchronization**
   - Sync jobs should be cursor-based and idempotent.
   - Reprocessing the same change events must produce the same final state.

5. **Price integrity at checkout**
   - Recalculate totals from mirrored DB at submit time.
   - Ignore client-sent price as authoritative input.

6. **Prisma-first persistence**
   - Use Prisma as the application ORM for the restaurant pivot.
   - Use Prisma Client for standard CRUD, transactions, and typed data access.
   - Do not implement the pivot on TypeORM.
   - Use raw SQL only where PostgreSQL capabilities require it, specifically RLS policies/session settings, PostGIS spatial queries/indexes, and `pg_trgm` search indexes.

## Target Bounded Contexts

- **Tenant Management**: tenant identity, status, plans, config
- **Branch Management**: branch profile, operating hours, delivery zones
- **Menu Domain**: categories, items, variants, modifier groups, modifiers, combos, availability
- **Orders Domain**: cart checkout, pricing engine, order state transitions, order events
- **Delivery Domain**: addresses, dispatch assignment, statuses, ETA
- **POS Integration Domain**: adapters, mapping, sync state, sync workers, incoming order export
- **Observability Domain**: sync run metrics, alerting, integration health

## Required Domain Changes

### Keep

- Tenant, User, Customer (with cleanup where needed)
- Existing RLS pattern and tenant context middleware/interceptor approach
- Existing auth and role model as a base

### Replace or retire from active flows

- Grocery-centric product ordering modes (weight/grams/amount-specific behavior)
- Catalog-driven supermarket assumptions
- Replacement flows tied to unavailable grocery items

### Add

- Restaurant menu model
- Branch model and branch access model
- POS integration and sync state model
- Delivery tracking model

## Runtime Data Flow

1. POS changes menu-related data or order operational status.
2. Sync workers poll POS `change_log` per tenant/branch; webhooks can trigger faster polling but are not the source of truth.
3. Worker transforms data via partner adapter into canonical format.
4. Worker upserts canonical entities into PostgreSQL mirror tables.
5. Customer UI reads only from web app DB.
6. Checkout recalculates totals and writes order into web app DB.
7. Integration service exports order through the approved POS write contract.
8. Current MVP write path calls `dbo.PS_AddApplicationCustomerOrder` with customer name, mobile, address, delivery service code, and order code.
9. POS receives the order and continues kitchen/POS processing.
10. POS writes order status changes to `change_log`.
11. Sync workers replay order status events into the web app DB for tracking, dashboards, notifications, and delivery workflows.

Initial POS views available for bootstrap and mirror reads:

- `PS_ApplicationOrders_V`: menu view with `OrderCategory`, `OrderCode`, `OrderName`, `OrderPrice`.
- `PS_ApplicationDeliveryServices_V`: branch delivery service fee view with `BranchName`, `DeliveryServiceCode`, `DeliveryServiceName`, `DeliveryServiceAmount`.

## Non-Negotiable Guard Rails

- No direct writes to POS business tables.
- Only call the approved POS order write contract (`dbo.PS_AddApplicationCustomerOrder` now, `incoming_orders` if added later).
- Respect soft deletes and inactive flags from POS during sync.
- Alert on 3 or more consecutive sync failures.
- Use least-privileged read-only POS DB credentials for sync reads.
- Support idempotency keys for order export to avoid duplicate orders in POS.
- Use POS `change_log` as the replayable source for order status sync; webhooks are acceleration only.

## Risk Register

1. **Risk: stale menu**
   - Mitigation: frequent sync, lag metrics, failure alerting, fallback messaging in UI.

2. **Risk: enum collision in orders**
   - Mitigation: split order dimensions (source type vs fulfillment type) to avoid semantic overload.

3. **Risk: branch leakage across users**
   - Mitigation: user-branch membership enforcement in service layer + audits.

4. **Risk: adapter complexity growth**
   - Mitigation: strict adapter contract and canonical schema with versioning.

## Phased Rollout

### Phase 0: Preparation

- Freeze new grocery-specific features.
- Define canonical restaurant domain and integration contracts.

### Phase 1: Foundation

- Introduce branch and menu domains.
- Introduce POS mapping, sync state, sync runs, adapter interfaces.

### Phase 2: Sync and Read Path

- Implement menu mirror sync from POS.
- Switch customer-facing menu reads to mirrored tables.

### Phase 3: Order Write Path

- Introduce restaurant checkout pricing engine and order fulfillment types.
- Export orders through `dbo.PS_AddApplicationCustomerOrder` for MVP, or `incoming_orders` if POS adds the richer table contract.

### Phase 4: Decommission Grocery Flow

- Remove grocery-centric APIs from active routing.
- Keep archival migration path for legacy data queries.

## Acceptance Criteria

- Tenant and branch isolation validated for all new modules.
- Menu freshness SLA defined and monitored.
- Order export idempotency and retry policy implemented.
- Grocery-specific ordering path no longer exposed in production API.
- Operational dashboards available for sync health and lag.
