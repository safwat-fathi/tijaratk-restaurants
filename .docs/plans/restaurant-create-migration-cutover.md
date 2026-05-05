# Restaurant Migration and Cutover Plan

## Objective

Execute a safe migration from supermarket/grocery implementation to restaurant-only platform behavior with minimal downtime and controlled risk.

## Migration Strategy

- Use phased, additive rollout.
- Keep legacy endpoints operational during transition gates.
- Cut traffic by feature flags and tenant eligibility.
- Remove legacy flows only after verification metrics are green.
- Build new restaurant persistence with Prisma.
- Use raw SQL migrations for RLS, PostGIS, and `pg_trgm` capabilities that Prisma cannot represent cleanly.

## Scope of Decommission

Target to retire from active production flows:

- Grocery-specific order modes and product selection logic
- Catalog-dependent supermarket assumptions
- Product replacement flow designed for unavailable grocery items

Target to retain and adapt:

- Multi-tenant auth and user roles
- RLS and tenant context orchestration
- Core order tracking mechanisms (adapted to restaurant status model)

## Phase Plan

## Phase 0: Discovery and Freeze

1. Audit all API routes and UI flows that depend on grocery product model.
2. Freeze new development in deprecated grocery modules.
3. Introduce feature flags:
   - `restaurant_menu_enabled`
   - `restaurant_checkout_enabled`
   - `pos_sync_enabled`

Exit criteria:

- Full dependency map of legacy flows completed.
- Team alignment on sunset timeline.

## Phase 1: Data Foundation

1. Add new restaurant schema and POS integration tables.
2. Add branch model and user-branch access model.
3. Add tenant configs for sync cadence and pricing rules.
4. Add raw SQL setup for required PostgreSQL extensions and policies:
   - PostGIS for branch location and delivery-zone spatial logic
   - `pg_trgm` for fuzzy search indexes
   - RLS functions and policies for tenant isolation

Exit criteria:

- Migrations applied in non-prod.
- RLS coverage verified for all new tenant-scoped tables.
- Prisma schema and generated client represent standard restaurant tables.
- Raw SQL migration coverage exists for PostGIS, `pg_trgm`, and RLS.

## Phase 2: Read-Only Restaurant Menu

1. Implement POS sync workers and adapters.
2. Populate mirrored restaurant menu data.
3. Expose read APIs for customer UI and dashboard from new tables.

Exit criteria:

- Menu APIs stable and branch-aware.
- Sync lag and failure dashboards active.

## Phase 3: Restaurant Checkout and Orders

1. Implement fulfillment-aware order model (`delivery`, `pickup`, `dine_in`).
2. Recalculate pricing server-side from mirror data.
3. Write orders to local DB and export to POS `incoming_orders`.

Exit criteria:

- End-to-end checkout works for pilot tenants.
- No duplicate POS orders under retry scenarios.

## Phase 4: Controlled Tenant Cutover

1. Pilot with selected tenants/branches.
2. Monitor KPIs and operational alerts.
3. Roll out gradually by tenant cohort.

Exit criteria:

- SLA targets met for sync freshness and order delivery to POS.
- Incident rate acceptable for wider rollout.

## Phase 5: Legacy Flow Sunset

1. Disable legacy grocery routes via feature flags.
2. Communicate and enforce API deprecation timeline.
3. Remove obsolete code and data paths after cooldown window.

Exit criteria:

- Zero production traffic to deprecated endpoints.
- Legacy modules removed from active runtime.

## Backward Compatibility Policy

- Keep public tracking URLs stable where possible.
- If breaking API changes are required, version endpoints and provide migration guide.
- Maintain old read views for a temporary grace period if dashboards depend on them.

## Data Migration Considerations

- Historical grocery/customer order experience does not need to be preserved.
- Historical orders are not required for audit or reporting unless a separate legal/compliance requirement is identified.
- Favor a clean restaurant schema and data reset over compatibility bridges.
- Do not build old-to-new reporting bridges unless explicitly required by product or compliance.

## Testing and Validation Matrix

1. **Tenant isolation tests**
   - cross-tenant read/write denial

2. **Branch authorization tests**
   - users cannot access unauthorized branches

3. **Sync correctness tests**
   - create/update/delete in POS reflected in mirror
   - `PS_ApplicationOrders_V` rows create/update menu categories and menu items
   - `PS_ApplicationDeliveryServices_V` rows create/update branch delivery services and fees

4. **Checkout integrity tests**
   - manipulated client price rejected/overridden

5. **Order export reliability tests**
   - retries do not create duplicate incoming POS orders

6. **Order status sync tests**
   - POS `change_log` status events update local order state idempotently

7. **Failure simulation tests**
   - network outages, adapter errors, delayed change log ingestion

## Operational Readiness Checklist

- Runbooks for sync failure and backlog handling
- Alerts configured for lag/failures/export backlog
- On-call ownership for integration incidents
- Dashboards for tenant/branch sync health
- Feature flag rollback paths tested

## Rollback Strategy

- Keep legacy routes dormant but deployable during initial rollout window.
- Rollback by feature flags first, not hotfix schema rewrites.
- Keep new schema additive; avoid destructive migrations before stability window ends.

## Communication Plan

- Internal: weekly migration status with risk updates.
- External tenants: phased onboarding and expectation on POS sync windows.
- Support team: incident playbook and known limitations during transition.

## Success Metrics

- Menu sync lag within defined SLA for 99% of branches.
- Order export success rate above agreed threshold.
- Zero critical tenant data leakage incidents.
- Full decommission of grocery-only features from active product.
