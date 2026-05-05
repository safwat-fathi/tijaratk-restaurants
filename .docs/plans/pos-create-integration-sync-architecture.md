# POS Integration and Sync Architecture Plan

## Objective

Implement a robust integration layer where external POS is the Source of Truth (SoT), while PostgreSQL in the web app remains a performant local mirror.

## Integration Contract

### Source of Truth Policy

- POS owns menu/category/modifier/price state.
- Web app owns customer-facing read performance and checkout orchestration.
- Web app writes to POS only through `incoming_orders` table.

### Adapter Policy

- Use a canonical internal schema for menu/order models.
- Build partner-specific adapters for:
  - raw record parsing
  - field normalization
  - enum/status mapping
  - upsert key derivation

## POS-Side Views and Required Tables

Current POS read views discovered:

1. `PS_ApplicationOrders_V`
   - current menu source view exposed by POS
   - columns: `OrderCategory`, `OrderCode`, `OrderName`, `OrderPrice`
   - maps to menu category, external menu item code, menu item name, and menu item price

2. `PS_ApplicationDeliveryServices_V`
   - current branch delivery service fee source view exposed by POS
   - columns: `BranchName`, `DeliveryServiceCode`, `DeliveryServiceName`, `DeliveryServiceAmount`
   - maps to branch, delivery zone/service external code, delivery service name, and delivery fee amount

Required POS write/replay tables to request from the POS team:

1. `change_log`
   - append-only events
   - includes menu, availability, and order status events
   - columns: `id`, `entity_type`, `entity_id`, `operation`, `changed_at`, `branch_ref`, `payload_json`

2. `incoming_orders`
   - receives orders from web app
   - columns: `id`, `external_order_key`, `tenant_ref`, `branch_ref`, `payload_json`, `status`, `created_at`, `processed_at`, `error`

3. Optional helper tables
   - `sync_acknowledgements` if POS team needs explicit processing confirmations

## Web-App Integration Tables

- `pos_integrations`
- `external_mappings`
- `sync_state`
- `sync_runs`
- `integration_events` (optional raw audit stream)

Prisma implementation policy:

- Model these integration tables in Prisma schema.
- Use Prisma Client for sync state, sync runs, external mappings, and idempotent local upserts.
- Use raw SQL only for PostgreSQL features outside Prisma's clean modeling surface, such as RLS policies, PostGIS queries, and `pg_trgm` search indexes.

## Sync Worker Model

## Worker Types

1. **Pull worker**
   - polls POS `change_log` using cursor pagination
   - batches by entity type and branch
   - for initial menu and delivery-fee bootstrap, reads `PS_ApplicationOrders_V` and `PS_ApplicationDeliveryServices_V`

2. **Transform worker**
   - validates payload against partner adapter schema
   - maps to canonical DTOs

3. **Apply worker**
   - performs idempotent upserts to PostgreSQL mirror
   - updates `external_mappings`

4. **Recovery worker**
   - retries failed batches with exponential backoff

## Scheduling

- Default: every 5-10 minutes for menu and availability changes.
- Delivery service fees should sync on the same cadence as menu pricing unless configured otherwise.
- Dynamic cadence can be configured per partner/tenant.
- 30-minute max stale window may be too long for busy restaurants; keep as fallback not default.

## POS View Mapping

### `PS_ApplicationOrders_V` to local menu mirror

| POS column | Local meaning | Notes |
|------------|---------------|-------|
| `OrderCategory` | menu category name | category is created or matched by tenant/partner/category name unless POS later provides category code |
| `OrderCode` | remote menu item ID/code | stored in `external_mappings.remote_id` for `entity_type = 'menu_item'` |
| `OrderName` | menu item name | Arabic names must be stored as UTF-8 text without transformation |
| `OrderPrice` | base menu item price | authoritative menu price from POS mirror |

Initial interpretation:

- Treat each row as a sellable menu item.
- Use `OrderCategory` to create or match `menu_categories`.
- Use `OrderCode` as the stable POS remote ID for `menu_items`.
- Use `OrderPrice` as `menu_items.base_price` unless branch-specific pricing is later provided.
- If the POS later adds item active/deleted/branch columns, sync must respect them.

### `PS_ApplicationDeliveryServices_V` to local delivery services

| POS column | Local meaning | Notes |
|------------|---------------|-------|
| `BranchName` | branch name / branch match key | should be replaced by branch code if POS can expose one |
| `DeliveryServiceCode` | remote delivery service ID/code | stored in `external_mappings.remote_id` for delivery service/zone |
| `DeliveryServiceName` | delivery service or zone name | example: area/neighborhood name |
| `DeliveryServiceAmount` | delivery fee amount | authoritative delivery fee from POS mirror |

Initial interpretation:

- Treat each row as a branch-scoped delivery service/zone.
- Match branch by `BranchName` for MVP, but request a stable `BranchCode` from POS to avoid name-based matching.
- Store `DeliveryServiceCode` as the external remote ID.
- Use `DeliveryServiceAmount` as the server-side delivery fee during checkout.
- Customer checkout must not trust client-sent delivery fee.

## Cursor Strategy (Preferred)

- Use `change_log.id` monotonic cursor.
- Store cursor in `sync_state.last_cursor`.
- Process with deterministic ordering (`ORDER BY id ASC`).

Why not only `updated_at > lastSync`:

- timestamp precision mismatch
- clock skew
- race conditions around transaction commit times

## Idempotency Strategy

- Upsert using stable business keys and mappings.
- Track per-entity mapping in `external_mappings`.
- Write operations must be safe on retries.

## Order Export Flow

1. Customer submits order.
2. Web app recalculates final price from mirrored DB.
3. Web app stores order locally as system-of-engagement record.
4. Export job writes to POS `incoming_orders` with idempotency key (`external_order_key`).
5. POS consumes and updates status independently.

## Order Status Sync Flow

1. POS writes order status changes into `change_log` with `entity_type = 'order_status'` or equivalent partner-specific type.
2. Sync worker polls `change_log` using the same cursor-based replay mechanism as menu sync.
3. Adapter normalizes POS status into the canonical restaurant order lifecycle.
4. Apply worker updates the local order state idempotently.
5. Local order events update customer tracking, dashboards, notifications, and delivery workflows.

Webhooks may be used as an acceleration signal, but not as the authoritative recovery path. The POS `change_log` remains the source for replay, recovery, and consistency.

Order status sync requirements:

- Store POS order references in `external_mappings`.
- Track order-status cursor per tenant, branch, partner, and entity type.
- Handle duplicate status events safely.
- Handle out-of-order status events using timestamps, sequence IDs, or partner-specific precedence rules.
- Surface order-status sync lag and failures separately from menu sync.

## Failure Handling

### Sync Failures

- Increment `consecutive_failures` in `sync_state`.
- Alert immediately after 3 consecutive failures.
- Keep last error payload and context in `sync_runs`.

### Partial Batch Failures

- Continue processing unaffected entities.
- mark run as `partial` and enqueue targeted retries.

### Dead-letter Queue

- If a payload repeatedly fails validation/transformation, persist it in a dead-letter store for manual triage.

## Observability and SLAs

Track at minimum:

- sync lag in minutes per tenant/branch/entity
- runs success/fail/partial counts
- rows read/upserted/skipped
- retry counts and mean time to recovery
- order export latency
- order status sync lag

Alerting:

- 3 consecutive failures
- lag above SLA threshold
- order export backlog growth
- order status sync lag above SLA threshold

## Security Model

- Read-only MySQL user for sync reads.
- Separate write user with scope limited to `incoming_orders` only.
- Credentials per environment and partner, managed in secrets store.
- Structured audit logs for all POS integration operations.

## NestJS Implementation Shape

Suggested module split:

- `pos-integration.module`
  - `pos-connection.factory`
  - `adapter.registry`
  - `sync-orchestrator.service`
  - `sync-workers/*`
  - `order-export.service`
  - `sync-monitoring.service`
  - `prisma-pos-mirror.repository`

Suggested interfaces:

- `PosAdapter` with `transformCategory`, `transformMenuItem`, `transformModifier`, `transformOrderStatus`
- `SyncCursorStore` for reading/writing sync cursor and failure counters
- `MirrorRepository` abstraction for idempotent upserts

Prisma usage:

- `MirrorRepository` should use Prisma Client transactions for local PostgreSQL writes.
- Raw SQL should be limited to specialized database capabilities, not normal menu/order CRUD.
- POS MySQL reads remain outside Prisma unless a separate Prisma datasource is explicitly chosen later; the default approach is a dedicated POS DB service/adapter.

## Webhook + Poll Hybrid

- If POS can emit webhooks, use webhook as trigger signal only.
- Always pull from `change_log` for consistency and replayability.
- Do not trust webhook payload as sole data source.
- Order status updates follow the same rule: webhook can wake the worker, but `change_log` is the replayable source.

## Key Guard Rails (Enforced)

- No direct POS writes except `incoming_orders`.
- Soft delete and inactive states must propagate to mirror.
- Checkout price must come from mirrored DB, not client payload.
- Alerting and run bookkeeping are mandatory from initial rollout.

## Acceptance Criteria

- Integration can add a new POS partner by implementing adapter only.
- Sync is idempotent and replay-safe.
- Lag and failures are visible with actionable alerts.
- Orders reach POS reliably without duplicates.
- POS order status changes update local tracking reliably.
