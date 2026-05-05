# Database Entity Relationship Diagram (ERD)

## Overview

This is a multi-tenant e-commerce/restaurant management system. All tenant-scoped entities inherit from `TenantBaseEntity` which adds `tenant_id` for multi-tenancy support.

---

## Entity Diagrams

### 1. Tenant (tenants)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| name | VARCHAR | NOT NULL | Tenant business name |
| phone | VARCHAR | UNIQUE, NOT NULL | Contact phone |
| customer_counter | INT | DEFAULT 0 | Auto-increment counter for customer codes |
| category | ENUM | DEFAULT 'other' | Tenant category |
| slug | VARCHAR | UNIQUE, NOT NULL | URL-friendly identifier |
| status | ENUM | DEFAULT 'active' | Tenant status |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Enums:**
- `TenantCategory`: RESTAURANT, GROCERY, PHARMACY, OTHER
- `TenantStatus`: ACTIVE, INACTIVE, SUSPENDED

---

### 2. User (users)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| tenant_id | INT | NOT NULL, INDEX | FK to tenants |
| phone | VARCHAR | UNIQUE, NOT NULL | Unique phone number |
| name | VARCHAR | NOT NULL | User display name |
| role | ENUM | NOT NULL | User role (owner/staff) |
| password | VARCHAR | NOT NULL, SELECT: false | Bcrypt hashed password |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Enums:**
- `UserRole`: OWNER, STAFF

**Relationships:**
- `tenant` (N:1) → Tenant

---

### 3. Customer (customers)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| tenant_id | INT | NOT NULL, INDEX | FK to tenants |
| phone | VARCHAR | NOT NULL | Customer phone |
| name | VARCHAR | NULLABLE | Customer name |
| code | INT | NOT NULL | Tenant-specific customer code |
| merchant_label | VARCHAR | NULLABLE | Custom label |
| address | TEXT | NULLABLE | Delivery address |
| notes | TEXT | NULLABLE | Internal notes |
| first_order_at | TIMESTAMP | NULLABLE | First order timestamp (DB trigger) |
| last_order_at | TIMESTAMP | NULLABLE | Last order timestamp (DB trigger) |
| order_count | INT | DEFAULT 0 | Total orders (DB trigger) |
| completed_order_count | INT | DEFAULT 0 | Completed orders (DB trigger) |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Constraints:**
- UNIQUE(tenant_id, phone)
- UNIQUE(tenant_id, code)

**Relationships:**
- `tenant` (N:1) → Tenant

---

### 4. Product (products)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| tenant_id | INT | NOT NULL, INDEX | FK to tenants |
| name | VARCHAR | NOT NULL | Product name |
| image_url | TEXT | NULLABLE | Product image URL |
| category | VARCHAR | DEFAULT 'أخرى' | Product category |
| source | ENUM | DEFAULT 'manual' | Product source |
| status | ENUM | DEFAULT 'active' | Product status |
| current_price | DECIMAL(10,2) | NULLABLE | Current selling price |
| order_mode | ENUM | DEFAULT 'quantity' | How customers order |
| order_config | JSONB | NULLABLE | Order mode configuration |
| is_available | BOOLEAN | DEFAULT true | Availability flag |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Enums:**
- `ProductSource`: MANUAL, CATALOG
- `ProductStatus`: ACTIVE, INACTIVE, ARCHIVED
- `ProductOrderMode`: QUANTITY, GRAMS, AMOUNT, SELECTION

**Relationships:**
- `tenant` (N:1) → Tenant

---

### 5. TenantProductCategory (tenant_product_categories)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| tenant_id | INT | NOT NULL, INDEX | FK to tenants |
| name | VARCHAR(64) | NOT NULL | Category name |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Relationships:**
- `tenant` (N:1) → Tenant

---

### 6. ProductPriceHistory (product_price_history)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| tenant_id | INT | NOT NULL | FK to tenants |
| product_id | INT | NOT NULL | FK to products |
| price | DECIMAL(10,2) | NOT NULL | Historical price |
| effective_from | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Price start date |
| effective_to | TIMESTAMPTZ | NULLABLE | Price end date |
| reason | TEXT | NULLABLE | Price change reason |

**Indexes:**
- INDEX(product_id)
- INDEX(tenant_id)

**Relationships:**
- `product` (N:1) → Product

---

### 7. CatalogItem (catalog_items)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| name | VARCHAR | NOT NULL | Catalog item name |
| image_url | TEXT | NULLABLE | Image URL |
| category | VARCHAR | NOT NULL | Category |
| is_active | BOOLEAN | DEFAULT true | Active flag |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Note:** Not tenant-scoped (global catalog for products)

---

### 8. Order (orders)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| tenant_id | INT | NOT NULL, INDEX | FK to tenants |
| customer_id | INT | NOT NULL | FK to customers |
| public_token | VARCHAR | UNIQUE, NOT NULL | Public order token |
| order_type | ENUM | NOT NULL | Order type |
| status | ENUM | DEFAULT 'draft' | Order status |
| pricing_mode | ENUM | DEFAULT 'auto' | Pricing mode |
| subtotal | DECIMAL(10,2) | NULLABLE | Subtotal amount |
| delivery_fee | DECIMAL(10,2) | DEFAULT 0 | Delivery fee |
| delivery_address | TEXT | NULLABLE | Delivery address |
| customer_phone | VARCHAR | NULLABLE | Customer phone (snapshot) |
| customer_name | VARCHAR | NULLABLE | Customer name (snapshot) |
| total | DECIMAL(10,2) | NULLABLE | Total amount |
| free_text_payload | JSONB | NULLABLE | Free-form data |
| notes | TEXT | NULLABLE | Order notes |
| customer_rejection_reason | TEXT | NULLABLE | Rejection reason |
| customer_rejected_at | TIMESTAMPTZ | NULLABLE | Rejection timestamp |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Enums:**
- `OrderType`: PICKUP, DELIVERY
- `OrderStatus`: DRAFT, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
- `PricingMode`: AUTO, MANUAL

**Relationships:**
- `tenant` (N:1) → Tenant
- `customer` (N:1) → Customer
- `items` (1:N) → OrderItem

---

### 9. OrderItem (order_items)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| order_id | INT | NOT NULL | FK to orders |
| product_id | INT | NULLABLE | FK to products |
| name_snapshot | VARCHAR | NOT NULL | Product name at order time |
| quantity | TEXT | NOT NULL | Quantity (string for flexibility) |
| unit_price | DECIMAL(10,2) | NULLABLE | Unit price |
| total_price | DECIMAL(10,2) | NULLABLE | Total price |
| notes | TEXT | NULLABLE | Item notes |
| selection_mode | ENUM | NULLABLE | Selection mode |
| selection_quantity | DECIMAL(10,3) | NULLABLE | Selected quantity |
| selection_grams | INT | NULLABLE | Selected weight in grams |
| selection_amount_egp | DECIMAL(10,2) | NULLABLE | Selected amount in EGP |
| unit_option_id | VARCHAR(64) | NULLABLE | Unit option identifier |
| replaced_by_product_id | INT | NULLABLE | Replacement product FK |
| pending_replacement_product_id | INT | NULLABLE | Pending replacement FK |
| replacement_decision_status | ENUM | DEFAULT 'none' | Replacement status |
| replacement_decision_reason | TEXT | NULLABLE | Decision reason |
| replacement_decided_at | TIMESTAMPTZ | NULLABLE | Decision timestamp |

**Enums:**
- `OrderItemSelectionMode`: QUANTITY, GRAMS, AMOUNT, SELECTION
- `ReplacementDecisionStatus`: NONE, ACCEPTED, REJECTED

**Relationships:**
- `order` (N:1) → Order (CASCADE delete)
- `product` (N:1) → Product (nullable)
- `replaced_by_product` (N:1) → Product (nullable)
- `pending_replacement_product` (N:1) → Product (nullable)

---

### 10. DayClosure (day_closures)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| tenant_id | INT | NOT NULL, INDEX | FK to tenants |
| closure_date | DATE | NOT NULL | Closure date |
| orders_count | INT | DEFAULT 0 | Total orders that day |
| cancelled_count | INT | DEFAULT 0 | Cancelled orders |
| completed_sales_total | DECIMAL(10,2) | DEFAULT 0 | Total completed sales |
| closed_at | TIMESTAMPTZ | NOT NULL | Closure timestamp |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Constraints:**
- UNIQUE(tenant_id, closure_date)

**Indexes:**
- INDEX(closure_date)

**Relationships:**
- `tenant` (N:1) → Tenant

---

### 11. AvailabilityRequest (availability_requests)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| tenant_id | INT | NOT NULL, INDEX | FK to tenants |
| product_id | INT | NOT NULL, INDEX | FK to products |
| visitor_key | VARCHAR(64) | NOT NULL, INDEX | Visitor identifier |
| request_date | DATE | NOT NULL, INDEX | Request date |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Constraints:**
- UNIQUE(tenant_id, product_id, visitor_key, request_date)

**Relationships:**
- `tenant` (N:1) → Tenant
- `product` (N:1) → Product

---

## Relationship Summary

```
┌─────────────────┐
│     Tenant     │  (1) ────── (N) ───► User
└─────────────────┘                └──────────┘
      │ (1) ────── (N) ───► Customer
      │                   └──────────┘
      │ (1) ────── (N) ───► Product
      │                   └──────────┘
      │ (1) ────── (N) ───► Order
      │                   │      │
      │                   │      └───── (N) ──► OrderItem ◄─── (N) Product
      │                   │
      │                   └──────────┘
      │ (1) ────── (N) ───► DayClosure
      │
      │ (1) ────── (N) ───► AvailabilityRequest ◄─── (N) Product
      │
      └──────────────────┘

CatalogItem (standalone, global)
ProductPriceHistory (standalone, linked to Product)
```

---

## Base Entities

### BaseEntity (abstract)

All entities inherit these columns:

| Column | Type | Description |
|--------|------|-------------|
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |
| deleted_at | TIMESTAMP | Soft delete (nullable) |

### TenantBaseEntity (abstract)

Inherits from BaseEntity, adds:

| Column | Type | Description |
|--------|------|-------------|
| tenant_id | INT | FK to tenant (indexed) |

All tenant-scoped entities use this base class for multi-tenancy.

---

## Index Summary

| Table | Index | Columns |
|-------|-------|---------|
| users | INDEX | tenant_id |
| customers | INDEX | tenant_id, phone, code |
| products | INDEX | tenant_id |
| tenant_product_categories | INDEX | tenant_id |
| product_price_history | INDEX | product_id, tenant_id |
| orders | INDEX | tenant_id |
| order_items | INDEX | order_id |
| day_closures | INDEX | tenant_id, closure_date |
| availability_requests | INDEX | tenant_id, product_id, visitor_key, request_date |

---

## Notes

- Primary keys use `SERIAL` (auto-increment), not UUIDs
- JSONB used for JSON columns (not plain JSON)
- Relations use `Relation<T>` pattern from TypeORM
- Soft deletes via `deleted_at` timestamp
- All tenant-scoped entities include `tenant_id` with foreign key to tenants table
- Enum columns stored as PostgreSQL ENUM type
- Decimal fields use DECIMAL(10,2) or DECIMAL(10,3) for precision