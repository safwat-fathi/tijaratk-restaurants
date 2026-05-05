# Restaurant Domain Schema Plan

## Objective

Define a restaurant-first PostgreSQL schema supporting:

- Tenant and branch multi-tenancy
- Menu modeling with variants and modifiers
- Branch-specific availability and pricing
- Order lifecycle and delivery tracking
- POS external ID mapping

This plan is conceptual and intended to guide Prisma schema design, Prisma migrations, and raw SQL database capabilities.

## ORM and Database Capability Policy

- Use Prisma as the application ORM and primary query layer.
- Use Prisma Client for standard CRUD, relation loading, transactions, and typed domain access.
- Do not use TypeORM for the restaurant pivot implementation.
- Use Prisma migrations for regular tables, constraints, indexes, and application-owned schema changes where Prisma supports the feature cleanly.
- Use raw SQL migration blocks or SQL files for PostgreSQL features Prisma does not model well enough:
  - PostGIS extension setup and geography/geometry indexes
  - `pg_trgm` extension setup and trigram indexes
  - RLS functions, policies, and session settings
  - advanced partial/expression indexes when Prisma schema cannot express them clearly
- Use Prisma `$queryRaw` / `$executeRaw` for runtime queries requiring PostGIS or `pg_trgm` operators/functions.
- Keep raw SQL small, named, reviewed, and isolated behind repository/service methods.

## Design Principles

- All business tables must include `tenant_id` unless globally shared by design.
- Branch-scoped data must include `branch_id`.
- Use soft delete (`deleted_at`) for sync-safe lifecycle where POS replay or rollback needs it.
- Add stable unique constraints for idempotent upsert behavior.
- Model PostGIS fields in Prisma using `Unsupported(...)` where needed, with raw SQL for spatial operations.

## Proposed Tables

## 1) Tenant and Branch

### `tenants` (existing, evolve if required)

- `id` SERIAL PK
- `name`, `slug`, `status`
- `business_type` enum: `fast_food`, `fine_dining`, `other` <!-- business_type can be multiple types and there is no cloud kitchen -->
- `created_at`, `updated_at`, `deleted_at`

### `branches`

Use PostGIS point, not separate `lat`/`lng` columns. Prisma should model this as an unsupported database type and access spatial calculations through raw SQL.

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `name` VARCHAR NOT NULL
- `code` VARCHAR(64) NOT NULL
- `phone` VARCHAR NULL
- `address` TEXT NULL
- `location` GEOGRAPHY(POINT, 4326),
- `timezone` VARCHAR NOT NULL
- `is_active` BOOLEAN DEFAULT true
- `created_at`, `updated_at`, `deleted_at`

Prisma note:

- Use `Unsupported("geography(Point,4326)")` or the equivalent supported database type mapping available in the selected Prisma/PostGIS setup.
- Use raw SQL for `ST_MakePoint`, `ST_DWithin`, `ST_Distance`, and GiST indexes.

``` sql
CREATE INDEX branches_location_gix
ON branches
USING GIST (location);

CREATE INDEX branches_active_idx
ON branches (tenant_id, is_active)
WHERE deleted_at IS NULL;

INSERT INTO branches (tenant_id, name, code, location, timezone)
VALUES (
  1,
  'Downtown',
  'DOWNTOWN',
  ST_MakePoint(31.2357, 30.0444)::geography,
  'Africa/Cairo'
);

-- Nearby branches:
SELECT *
FROM branches
WHERE tenant_id = :tenant_id
  AND is_active = true
  AND deleted_at IS NULL
  AND ST_DWithin(
    location,
    ST_MakePoint(:lng, :lat)::geography,
    5000
  );
```

Constraints:

- UNIQUE (`tenant_id`, `code`)

### `branch_operating_hours`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `branch_id` INT NOT NULL FK
- `day_of_week` SMALLINT NOT NULL (0..6)
- `open_time` TIME NOT NULL
- `close_time` TIME NOT NULL
- `is_closed` BOOLEAN DEFAULT false

Constraints:

- UNIQUE (`tenant_id`, `branch_id`, `day_of_week`)

### `user_branch_access`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `user_id` INT NOT NULL FK
- `branch_id` INT NOT NULL FK
- `role_in_branch` VARCHAR(32) NULL

Constraints:

- UNIQUE (`tenant_id`, `user_id`, `branch_id`)

## 2) Menu Domain

### `menu_categories`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `branch_id` INT NULL FK (NULL means shared across branches)
- `name` VARCHAR(128) NOT NULL
- `description` TEXT NULL
- `sort_order` INT DEFAULT 0
- `is_active` BOOLEAN DEFAULT true
- `deleted_at` TIMESTAMP NULL

Indexes:

- (`tenant_id`, `branch_id`, `is_active`)

### `menu_items`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `category_id` INT NOT NULL FK
- `name` VARCHAR(256) NOT NULL
- `description` TEXT NULL
- `image_url` TEXT NULL
- `base_price` DECIMAL(10,2) NOT NULL
- `currency` VARCHAR(3) NOT NULL DEFAULT 'EGP'
- `is_active` BOOLEAN DEFAULT true
- `is_available` BOOLEAN DEFAULT true
- `deleted_at` TIMESTAMP NULL

Indexes:

- (`tenant_id`, `category_id`, `is_active`, `is_available`)

### `menu_item_variants`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `menu_item_id` INT NOT NULL FK
- `name` VARCHAR(128) NOT NULL
- `sku` VARCHAR(64) NULL
- `price_override` DECIMAL(10,2) NULL
- `price_delta` DECIMAL(10,2) NULL
- `is_default` BOOLEAN DEFAULT false
- `is_active` BOOLEAN DEFAULT true
- `deleted_at` TIMESTAMP NULL

Constraints:

- UNIQUE (`tenant_id`, `menu_item_id`, `name`)

### `modifier_groups`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `name` VARCHAR(128) NOT NULL
- `selection_type` enum: `single`, `multi`
- `min_select` INT DEFAULT 0
- `max_select` INT NULL
- `is_required` BOOLEAN DEFAULT false
- `sort_order` INT DEFAULT 0
- `is_active` BOOLEAN DEFAULT true
- `deleted_at` TIMESTAMP NULL

### `modifiers`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `modifier_group_id` INT NOT NULL FK
- `name` VARCHAR(128) NOT NULL
- `price_delta` DECIMAL(10,2) DEFAULT 0
- `is_active` BOOLEAN DEFAULT true
- `deleted_at` TIMESTAMP NULL

### `menu_item_modifier_groups`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `menu_item_id` INT NOT NULL FK
- `modifier_group_id` INT NOT NULL FK
- `sort_order` INT DEFAULT 0

Constraints:

- UNIQUE (`tenant_id`, `menu_item_id`, `modifier_group_id`)

### `combos`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `branch_id` INT NULL FK
- `name` VARCHAR(128) NOT NULL
- `description` TEXT NULL
- `price` DECIMAL(10,2) NOT NULL
- `is_active` BOOLEAN DEFAULT true
- `deleted_at` TIMESTAMP NULL

### `combo_items`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `combo_id` INT NOT NULL FK
- `menu_item_id` INT NOT NULL FK
- `quantity` INT NOT NULL DEFAULT 1
- `is_optional` BOOLEAN DEFAULT false

## 3) Branch Availability and Delivery

### `branch_menu_overrides`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `branch_id` INT NOT NULL FK
- `menu_item_id` INT NOT NULL FK
- `is_available` BOOLEAN DEFAULT true
- `price_override` DECIMAL(10,2) NULL

Constraints:

- UNIQUE (`tenant_id`, `branch_id`, `menu_item_id`)

### `delivery_zones`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `branch_id` INT NOT NULL FK
- `name` VARCHAR(128) NOT NULL
- `external_code` VARCHAR(128) NULL
- `fee` DECIMAL(10,2) NOT NULL DEFAULT 0
- `min_order_amount` DECIMAL(10,2) NULL
- `polygon` GEOGRAPHY(POLYGON, 4326), -- 👈 key change <!-- Use PostGIS and store polygons as native geometry -->
- `is_active` BOOLEAN DEFAULT true
- `deleted_at` TIMESTAMP NULL

POS mapping:

- `PS_ApplicationDeliveryServices_V.BranchName` maps to branch lookup key for MVP.
- `PS_ApplicationDeliveryServices_V.DeliveryServiceCode` maps to `external_code` and `external_mappings.remote_id`.
- `PS_ApplicationDeliveryServices_V.DeliveryServiceName` maps to `name`.
- `PS_ApplicationDeliveryServices_V.DeliveryServiceAmount` maps to `fee`.

Recommendation:

- Request a stable POS `BranchCode` column to avoid long-term matching by `BranchName`.

✅ Add GiST index
✅ Use ST_Contains / ST_DWithin

Prisma note:

- Use `Unsupported("geography(Polygon,4326)")` or equivalent for the polygon column.
- Use raw SQL for polygon creation, `ST_Contains`, `ST_DWithin`, and GiST index creation.

### `drivers`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `branch_id` INT NOT NULL FK
- `name` VARCHAR(128) NOT NULL
- `phone` VARCHAR(32) NULL
- `status` enum: `offline`, `idle`, `delivering`
- `is_active` BOOLEAN DEFAULT true
- `deleted_at` TIMESTAMP NULL

## 4) Orders Domain

### `orders` (evolve existing)

Add/adjust conceptual columns:

- `branch_id` INT NOT NULL FK
- `source_type` enum: `customer_ui`, `staff_panel`, `pos_import`
- `fulfillment_type` enum: `delivery`, `pickup`, `dine_in`
- `status` enum restaurant lifecycle
- `table_label` VARCHAR(32) NULL (for dine-in)
- `guest_count` INT NULL
- `subtotal`, `discount_total`, `delivery_fee`, `service_fee`, `tax_total`, `total`
- `pricing_snapshot` JSONB (rule versions and computed lines)

### `order_items` (evolve existing)

- `menu_item_id` INT NULL FK
- `variant_id` INT NULL FK
- `name_snapshot`, `variant_snapshot`, `unit_price`, `quantity`, `line_total`
- `notes` TEXT NULL

### `order_item_modifiers`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `order_item_id` INT NOT NULL FK
- `modifier_id` INT NULL FK
- `name_snapshot` VARCHAR(128) NOT NULL
- `price_delta_snapshot` DECIMAL(10,2) NOT NULL DEFAULT 0
- `quantity` INT NOT NULL DEFAULT 1

### `order_deliveries`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `order_id` INT NOT NULL FK
- `driver_id` INT NULL FK
- `status` enum: `pending`, `assigned`, `picked_up`, `delivered`, `failed`
- `eta_minutes` INT NULL
- `picked_up_at`, `delivered_at` TIMESTAMPTZ NULL

## 5) Tenant Config

### `tenant_configs`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `branch_id` INT NULL FK
- `key` VARCHAR(128) NOT NULL
- `value` JSONB NOT NULL
- `is_secret` BOOLEAN DEFAULT false
- `updated_by` INT NULL FK user

Constraints:

- UNIQUE (`tenant_id`, `branch_id`, `key`)

## 6) POS Integration Tables

### `pos_integrations`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `branch_id` INT NULL FK
- `partner` VARCHAR(64) NOT NULL
- `status` enum: `active`, `paused`, `error`
- `config` JSONB NOT NULL
- `created_at`, `updated_at`, `deleted_at`

### `external_mappings`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `branch_id` INT NULL FK
- `partner` VARCHAR(64) NOT NULL
- `entity_type` enum: `category`, `menu_item`, `variant`, `modifier_group`, `modifier`, `combo`, `branch`, `delivery_service`, `order`
- `local_id` INT NOT NULL
- `remote_id` VARCHAR(128) NOT NULL
- `remote_version` VARCHAR(64) NULL
- `last_synced_at` TIMESTAMPTZ NULL

Constraints:

- UNIQUE (`tenant_id`, `branch_id`, `partner`, `entity_type`, `local_id`)
- UNIQUE (`tenant_id`, `branch_id`, `partner`, `entity_type`, `remote_id`)

### `sync_state`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `branch_id` INT NULL FK
- `partner` VARCHAR(64) NOT NULL
- `entity_type` VARCHAR(64) NOT NULL
- `last_cursor` VARCHAR(128) NULL
- `last_synced_at` TIMESTAMPTZ NULL
- `consecutive_failures` INT DEFAULT 0
- `last_error` TEXT NULL

Constraints:

- UNIQUE (`tenant_id`, `branch_id`, `partner`, `entity_type`)

### `sync_runs`

- `id` SERIAL PK
- `tenant_id` INT NOT NULL FK
- `branch_id` INT NULL FK
- `partner` VARCHAR(64) NOT NULL
- `entity_type` VARCHAR(64) NOT NULL
- `started_at`, `finished_at` TIMESTAMPTZ
- `status` enum: `success`, `failed`, `partial`
- `rows_read` INT DEFAULT 0
- `rows_upserted` INT DEFAULT 0
- `rows_skipped` INT DEFAULT 0
- `error_message` TEXT NULL

## RLS Strategy

### Tenant-level RLS

- Apply RLS policies to all tenant-scoped tables.
- Policy rule: `tenant_id = app.current_tenant_id()` for `USING` and `WITH CHECK`.
- Define RLS functions and policies through raw SQL migrations, not Prisma schema declarations.
- Set the tenant session variable from the NestJS request context before tenant-scoped Prisma queries.

### Branch-level control

- Enforce branch access in service layer using `user_branch_access`.
- Optionally enforce SQL filtering for branch list endpoints.

## Indexing Strategy

- Composite indexes for hot filters:
  - (`tenant_id`, `branch_id`, `is_active`)
  - (`tenant_id`, `status`, `created_at`)
  - (`tenant_id`, `public_token`) for tracking
- Keep lookup indexes for external mappings by remote and local keys.
- Use raw SQL migrations for PostGIS GiST indexes and `pg_trgm` GIN/GiST indexes.
- Use `pg_trgm` for search-heavy fields such as menu item name, category name, modifier name, customer name, and branch name when fuzzy search is required.

## Data Integrity Rules

- No hard delete for synced entities except controlled archival.
- Respect POS inactive/deleted signals during sync.
- Preserve checkout-time order snapshots for active restaurant operations and customer tracking.
- Historical grocery orders do not need preservation for customer experience, audit, or reporting unless a separate legal/compliance requirement is identified.

## Initial POS View Contracts

### Menu View: `PS_ApplicationOrders_V`

This view is the initial POS source for synced menu items.

| POS column | Local table/field |
|------------|-------------------|
| `OrderCategory` | `menu_categories.name` |
| `OrderCode` | `external_mappings.remote_id` for `menu_item` |
| `OrderName` | `menu_items.name` |
| `OrderPrice` | `menu_items.base_price` |

Notes:

- Each row is treated as a sellable menu item.
- Category code is not currently available, so category matching starts by name.
- Item code is the stable remote key for item upsert.
- POS should ideally add item active/deleted and branch columns for cleaner sync.

### Delivery Service View: `PS_ApplicationDeliveryServices_V`

This view is the initial POS source for synced branch delivery services and fees.

| POS column | Local table/field |
|------------|-------------------|
| `BranchName` | `branches.name` lookup key for MVP |
| `DeliveryServiceCode` | `delivery_zones.external_code` and `external_mappings.remote_id` |
| `DeliveryServiceName` | `delivery_zones.name` |
| `DeliveryServiceAmount` | `delivery_zones.fee` |

Notes:

- Each row is treated as a branch-scoped delivery service/zone.
- Checkout must calculate delivery fee server-side from the synced delivery service fee.
- POS should ideally expose stable branch code, active flag, and deleted/inactive signal.

## Migration Notes

- Favor additive migrations first.
- Backfill relationships where needed.
- Switch APIs to new tables in staged manner.
- Decommission legacy product-centric tables after cutover validation.
