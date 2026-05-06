# Restaurant Platform Leadership Roadmap

## Executive Summary

We are pivoting the platform from a supermarket and grocery ordering product into a restaurant operating engine. The target product supports fast-food and fine-dining tenants, branch-based operations, POS-synced menus, restaurant checkout, delivery tracking, tenant configuration, and strict tenant and branch data isolation.

The key architecture decision is that the external POS remains the Source of Truth for menu data, while our PostgreSQL database acts as a high-performance local mirror for customer and dashboard experiences.

## Strategic Goals

1. Become restaurant-first, not grocery-compatible.
2. Support multi-branch restaurant operations.
3. Make POS integration a reusable platform capability.
4. Protect tenant and branch data boundaries.
5. Improve customer ordering reliability through local mirrored reads.
6. Keep restaurant pricing and availability trustworthy at checkout.
7. Standardize the new persistence layer on Prisma while using raw SQL for advanced PostgreSQL capabilities.

## Success Metrics

- POS menu changes reflected in the web app within agreed SLA.
- Zero tenant data leakage incidents.
- Orders exported to POS without duplication.
- Customer checkout validates pricing server-side.
- Restaurant tenants can operate multiple branches from one account.
- Legacy grocery flows removed from active product.

## Phase 0: Alignment and Legacy Audit

### Purpose

Create organizational agreement on the pivot and identify all grocery-specific product areas that must be retired.

### Key Outcomes

- Clear product decision: restaurant-only going forward.
- Documented list of legacy grocery features to remove.
- Agreement on what infrastructure is reused.
- Feature flag strategy for staged rollout.

### Feature Requirements

- Define restaurant business types: fast food, fine dining, other.
- Identify grocery-specific flows: products, catalog items, weight ordering, replacements, availability requests.
- Confirm retained platform capabilities: tenants, users, customers, auth, RLS, notifications, tracking.
- Define rollout flags for restaurant menu, checkout, POS sync, and legacy flow shutdown.
- Confirm Prisma as the ORM for the restaurant pivot, with raw SQL reserved for PostGIS, `pg_trgm`, and RLS.

### Business Value

Reduces ambiguity and prevents the team from building a restaurant layer on top of supermarket assumptions.

## Phase 1: Tenant, Branch, and Configuration Foundation

### Purpose

Make branches and tenant configuration core platform concepts.

### Key Outcomes

- Restaurants can operate one or many branches.
- Staff access can be limited by branch.
- Tenant and branch behavior becomes configurable.

### Feature Requirements

- Branch management.
- Branch operating hours.
- User-to-branch access control.
- Tenant-level configuration.
- Branch-level configuration override.
- Tenant isolation using database RLS.
- Branch isolation enforced at service and API level.
- Prisma-backed tenant, branch, and config data access.
- Raw SQL migrations for RLS policies and database session context functions.

### Business Value

Enables restaurant chains, franchise operations, and multi-location setups without duplicating tenants.

## Phase 2: Restaurant Menu Platform

### Purpose

Replace grocery products with a restaurant menu model.

### Key Outcomes

- Customers browse restaurant menus instead of supermarket products.
- Menu items support variants, modifiers, combos, and branch availability.
- Menu data can be synced from POS.

### Feature Requirements

- Menu categories.
- Menu items.
- Item variants such as size or meal type.
- Modifier groups such as extras, sauces, sides.
- Modifiers with price adjustments.
- Combos and bundle meals.
- Branch-specific availability.
- Branch-specific price overrides where needed.
- Public menu API for customer storefront.
- Dashboard menu visibility for restaurant staff.
- Raw SQL support for `pg_trgm` search indexes where fuzzy menu search is needed.

### Business Value

Supports real restaurant ordering behavior and unlocks both fast-food and fine-dining use cases.

## Phase 3: POS Integration Foundation

### Purpose

Create the reusable integration layer for current and future POS partners.

### Key Outcomes

- POS remains Source of Truth.
- Web app gets a fast local mirror.
- New POS partners can be added through adapters.

### Feature Requirements

- POS integration records per tenant and branch.
- External mappings between local IDs and POS remote IDs.
- Sync state tracking.
- Sync run history.
- Partner adapter interface.
- Read-only POS connection for sync reads.
- Restricted POS write access only for incoming orders.
- Initial menu source view: `PS_ApplicationOrders_V` with `OrderCategory`, `OrderCode`, `OrderName`, `OrderPrice`.
- Initial delivery-fee source view: `PS_ApplicationDeliveryServices_V` with `BranchName`, `DeliveryServiceCode`, `DeliveryServiceName`, `DeliveryServiceAmount`.

### Business Value

Turns POS integration into a product capability instead of one-off partner work.

## Phase 4: Menu Sync and Mirror of Truth

### Purpose

Keep restaurant menu data synchronized from POS to the web app database.

### Key Outcomes

- Customer UI reads fast local data.
- POS changes flow into the web app automatically.
- Sync issues are observable and actionable.

### Feature Requirements

- Scheduled sync jobs.
- POS change-log polling.
- Cursor-based sync.
- Idempotent upserts.
- Soft-delete and inactive-state awareness.
- Sync failure tracking.
- Alerting after repeated failures.
- Sync lag visibility.
- Menu bootstrap and sync from `PS_ApplicationOrders_V`.
- Branch delivery service fee bootstrap and sync from `PS_ApplicationDeliveryServices_V`.
- Server-side delivery-fee calculation from synced POS delivery service data.

### Business Value

Improves storefront performance while respecting POS ownership of menu and pricing.

## Phase 5: Restaurant Checkout and Pricing Integrity

### Purpose

Enable customers to place restaurant orders safely and accurately.

### Key Outcomes

- Checkout supports delivery, pickup, and dine-in.
- Server recalculates all prices.
- Orders preserve checkout-time snapshots for active restaurant operations and customer tracking.

### Feature Requirements

- Restaurant order model.
- Branch-aware checkout.
- Fulfillment type selection.
- Item variants and modifiers in cart.
- Server-side pricing calculation.
- Delivery-fee calculation.
- Tax and service-fee support where configured.
- Immutable order snapshots.
- Rejection of invalid or unavailable menu selections.

### Business Value

Protects revenue from price tampering and creates a trustworthy restaurant checkout flow.

## Phase 6: Order Export to POS

### Purpose

Send customer orders from the web app into POS reliably.

### Key Outcomes

- Web orders reach POS through the approved POS order write contract.
- Current discovered write contract is `dbo.PS_AddApplicationCustomerOrder`.
- POS downtime does not lose orders.
- Retries do not create duplicates.

### Feature Requirements

- Local order creation.
- POS export queue and state.
- POS order procedure adapter.
- Procedure call support for `dbo.PS_AddApplicationCustomerOrder` parameters: customer name, customer mobile, customer address, delivery service code, and order code.
- Validation that selected delivery service code comes from synced POS delivery service data.
- Validation that selected order code comes from synced POS menu data.
- Confirmation with POS team on multi-item, quantity, variant, and modifier behavior.
- Future support for `incoming_orders` if POS team adds a richer idempotent payload table.
- Idempotency key.
- Retry policy.
- Export failure visibility.
- Export backlog monitoring.

### Business Value

Connects online ordering to restaurant operations without compromising POS data ownership.

## Phase 6.5: POS Order Status Sync

### Purpose

Keep the web app order state aligned with the POS after an order is exported.

### Key Outcomes

- POS remains the operational source for kitchen/preparation status.
- Customer tracking reflects POS status changes.
- Dashboard order state stays aligned without manual staff updates.

### Feature Requirements

- Poll POS `change_log` for order status events when the POS team can add them.
- Treat webhooks as optional acceleration signals, not the source of truth.
- Use POS `change_log` as the replay and recovery source.
- Normalize POS statuses into the platform restaurant order lifecycle.
- Store POS order references through external mappings.
- Track order-status sync cursors per tenant, branch, and POS partner.
- Handle duplicate and out-of-order status events idempotently.
- Emit local order events for tracking, dashboard updates, notifications, and delivery workflows.
- Show order-status sync lag and failures in the POS health dashboard.

### Business Value

Makes customer tracking reliable and closes the loop after web orders are handed to POS operations.

## Phase 7: Delivery and Tracking

### Purpose

Support delivery operations and customer-facing tracking.

### Key Outcomes

- Restaurants can manage delivery flow.
- Customers can track order progress.
- Delivery data is branch-aware.
- Tracking depends on POS order-status sync for kitchen/preparation milestones.

### Feature Requirements

- Delivery zones.
- Delivery fees.
- Driver records.
- Driver assignment.
- Delivery status lifecycle.
- ETA display.
- Customer tracking page updates.
- Pickup and dine-in tracking variants.
- Raw SQL support for PostGIS delivery-zone and nearby-branch calculations.

### Business Value

Expands the product beyond menu ordering into operational order fulfillment.

## Phase 8: Restaurant Dashboard

### Purpose

Provide restaurant operators with branch-aware control and visibility.

### Key Outcomes

- Staff manage orders by branch.
- Operators see POS sync health.
- Restaurant teams can act on delivery and order status.

### Feature Requirements

- Branch selector.
- Orders dashboard by branch, status, and fulfillment type.
- Menu visibility with sync status.
- Delivery management.
- Driver assignment.
- POS sync health panel.
- Manual retry action for failed sync and export cases.

### Business Value

Gives restaurants operational confidence and reduces support load.

## Phase 9: Legacy Grocery Shutdown

### Purpose

Remove supermarket-specific behavior from the active product.

### Key Outcomes

- Product is restaurant-only.
- Legacy code paths stop receiving production traffic.
- Legacy grocery data is not preserved for customer experience, audit, or reporting unless a separate legal requirement is identified.

### Feature Requirements

- Disable grocery storefront flows.
- Disable catalog and product ordering endpoints.
- Remove grocery order modes from UI.
- Allow clean restaurant-schema reset where appropriate.
- Archive or remove deprecated modules after validation.

### Business Value

Reduces maintenance cost, product confusion, and engineering complexity.

## Phase 10: Production Hardening and Scale

### Purpose

Prepare the restaurant engine for broader rollout.

### Key Outcomes

- Reliable performance.
- Strong observability.
- Operational runbooks.
- Reduced incident risk.

### Feature Requirements

- Menu-read performance optimization.
- Public menu caching.
- Sync health dashboards.
- Alerting and runbooks.
- Audit logs for sensitive actions.
- Integration health checks.
- Tenant and branch access verification.

### Business Value

Makes the platform dependable enough for production growth and larger restaurant tenants.

## Major Risks

1. Stale POS menu data causing incorrect customer ordering.
2. Branch access leakage if service checks are incomplete.
3. Duplicate POS orders during retry.
4. Over-generalized POS adapter abstraction too early.
5. Legacy grocery assumptions leaking into restaurant flows.

## Recommended Leadership Decisions

1. Confirm restaurant-only pivot and stop grocery feature investment.
2. Treat POS as menu Source of Truth.
3. Require branch support before restaurant checkout rollout.
4. Require sync observability before pilot tenants.
5. Require server-side pricing before accepting real orders.
6. Use phased feature flags for controlled rollout.
