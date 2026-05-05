# Pivot Plan: From Supermarkets to Restaurants

## Current App Summary

**Tijaratk (تجارتك)** is a SaaS platform for small merchants (supermarkets, groceries, butchers) to receive orders via a WhatsApp-like storefront. Built with:

- **Backend**: NestJS (PostgreSQL + Row-Level Security)
- **Frontend**: Next.js 16 (App Router)
- **Notifications**: Twilio WhatsApp API
- **Key Features**: Product catalog, order management, customer tracking, merchant dashboard

---

## Key Differences: Supermarkets vs Restaurants

| Aspect | Supermarket | Restaurant |
|--------|-------------|------------|
| **Product Model** | Simple items with prices | Menu items, variations, combos, modifiers |
| **Order Types** | Pickup only | Delivery, Pickup, Dine-in |
| **Ordering** | Browse & add | Configure items (size, extras, special requests) |
| **Delivery** | Not applicable | Driver tracking, ETA, zones |
| **Customer Flow** | Direct order | Cart → Checkout → Track |
| **Menu Structure** | Flat categories | Hierarchical (categories → items → variants) |

---

## Phase 1: Core Restaurant Features (MVP)

### 1.1 Menu Structure Overhaul

**Current**: Products with flat categories
**New**: Menu items with variations and modifiers

- Add `MenuItem` entity with variants (size, flavor)
- Add `Modifier` entity (extras: extra cheese, no onion)
- Add `Combo` entity (bundle items with fixed price)
- Rename `Product` → `MenuItem` or add `type` field

### 1.2 Order Type Support

**Current**: Single order mode (pickup implicit)
**New**: Explicit order types

- Add `order_type`: `'delivery' | 'pickup' | 'dine_in'`
- For delivery: address, phone, notes
- For dine-in: table number, number of guests

### 1.3 Delivery Features

- Add `DeliveryZone` (areas served, delivery fee)
- Add `Driver` entity (name, phone, status)
- Add delivery status tracking: `preparing` → `out_for_delivery` → `delivered`
- Add ETA calculation

---

## Phase 2: Customer-Facing UI Changes

### 2.1 Storefront Redesign

**Current**: Product grid → Add to cart → Submit
**New**: Menu-driven flow

- Category navigation
- Item detail with variants/modifiers
- Cart with item customization display
- Checkout with order type selection

### 2.2 Tracking Page Enhancements

- Show delivery status with timeline
- Show driver info (for delivery)
- Show ETA
- Map integration (optional)

---

## Phase 3: Merchant Dashboard Updates

### 3.1 Menu Management

- Menu builder with drag-drop categories
- Variant/modiifer builder
- Combo builder
- Availability toggle (sold out)

### 3.2 Order Management

- Filter by order type (delivery/pickup/dine-in)
- Delivery dispatch (assign driver)
- Kitchen display system (KDS) view
- Order timer (prep time tracking)

### 3.3 Delivery Management

- Driver assignment
- Delivery zone configuration
- Delivery fee settings

---

## Database Schema Changes

### New Tables

```
menu_categories
├── id, tenant_id, name, sort_order, is_active

menu_items
├── id, tenant_id, category_id, name, description, image_url
├── base_price, is_available, sort_order

menu_item_variants
├── id, menu_item_id, name, price_adjustment

menu_modifiers
├── id, tenant_id, name, price (optional)

menu_item_modifier_groups
├── id, menu_item_id, modifier_group_id, is_required

modifier_groups
├── id, tenant_id, name, multi_select

modifiers
├── id, group_id, name, price_adjustment

combos
├── id, tenant_id, name, price, items (JSON)

orders
├── order_type: 'delivery' | 'pickup' | 'dine_in'
├── delivery_address, delivery_fee, estimated_delivery_time

delivery_zones
├── id, tenant_id, name, fee, area_geojson

drivers
├── id, tenant_id, name, phone, status

order_deliveries
├── order_id, driver_id, status, started_at, delivered_at
```

---

## Implementation Order

1. **Backend**: Add restaurant modules (menu, delivery, drivers)
2. **Frontend**: Update storefront for menu browsing
3. **Backend**: Add order type to order entity + delivery logic
4. **Frontend**: Update dashboard for restaurant features
5. **Testing**: End-to-end order flow