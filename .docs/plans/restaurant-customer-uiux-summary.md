# Restaurant App Customer UI/UX Summary

## Product Goal

Build a restaurant-first customer experience that lets users discover a restaurant, choose a branch, browse a POS-synced menu, customize items, place an order (delivery, pickup, dine-in), and track the live order status synced from the POS.

This is an "order-now" product, not a customer history/audit product. The UX prioritizes speed, clarity, and trust in pricing and availability.

## Core UX Principles

- Mobile-first, fast loading, low-friction checkout.
- Menu is always read from our local mirror of POS data, not directly from POS at request time.
- Availability and prices are validated server-side at checkout.
- Branch context is explicit and always visible.
- Tracking is real-time enough for customer trust, driven by POS order status sync. (On later phase not in MVP)
- Minimal "account" requirements; support guest checkout using phone number.

## Information Architecture (Customer)

- Restaurant storefront (tenant slug entrypoint)
- Branch selection
- Menu browsing (categories -> items)
- Item customization (variants, modifiers, notes)
- Cart
- Checkout (fulfillment type + details)
- Order confirmation
- Order tracking (active order only)

## Key Screens and Behaviors

## 1) Storefront Entry

Purpose:
- Confirm restaurant identity and start ordering.

Requirements:
- Tenant-branded page by slug.
- Primary CTA: "Start Order".
- Clear indicators: branch open/closed, estimated prep/delivery time if available.
- Language support: Arabic first, English optional based on tenant config.

## 2) Branch Selection

Purpose:
- Choose where the order is fulfilled from.

Requirements:
- List branches available to customers.
- Show branch name, address, distance (optional), open/closed state, and service types supported.
- Persist selected branch for the session.
- Allow switching branch, with clear warning that cart may be reset or revalidated.

## 3) Menu Browsing

Purpose:
- Browse menu quickly and confidently.

Requirements:
- Category navigation with "sticky" category tabs.
- Items show name, price, availability, and quick add.
- Item details include description and optional image.
- Search (optional MVP) with `pg_trgm`-backed fuzzy matching later.
- Availability and "sold out" state must be visible.

POS constraints (current):
- Menu bootstrap comes from `PS_ApplicationOrders_V` with:
  - `OrderCategory` as category label
  - `OrderCode` as POS item code
  - `OrderName` as item name
  - `OrderPrice` as price
- Until POS exposes variants/modifiers in views, the menu may be "simple items" with price.

## 4) Item Detail and Customization

Purpose:
- Let customers configure items (when supported) without confusion.

Requirements:
- Variants:
  - Single-choice selection, default selection.
- Modifiers:
  - Single or multi-select with min/max rules.
  - Show modifier price deltas.
- Notes:
  - Free-text "special instructions" with character limit.
- Add-to-cart shows computed item total for transparency.

MVP note:
- POS doesn't provide variants/modifiers yet, this screen behaves as a simple "quantity + notes" flow.

## 5) Cart

Purpose:
- Review order and prevent surprises.

Requirements:
- Line items show item name, options/modifiers summary, quantity, line total.
- Allow edit item configuration, change quantity, remove item.
- Display price breakdown:
  - Subtotal
  - Delivery fee (if delivery)
  - Service fee/tax (if configured)
  - Total
- Show "final price confirmed at checkout" messaging if needed.

## 6) Checkout

Purpose:
- Collect required fulfillment details and place the order.

Requirements:
- Fulfillment type selection:
  - Delivery (MVP feature)
  - Pickup (Not in scope for now)
  - Dine-in (Not in scope for now)
- Customer identity:
  - Name
  - Mobile number
- Delivery flow:
  - Address input (simple text MVP; map address optional later)
  - Delivery service/zone selection
  - Delivery fee shown before submit
- Pickup flow: (Not in scope for now)
  - Show branch pickup instructions and expected time (optional)
- Dine-in flow: (Not in scope for now)
  - Table label/number
  - Guest count (optional)

POS constraints (current delivery fees):
- Delivery services bootstrap from `PS_ApplicationDeliveryServices_V` with:
  - `BranchName` branch match key (MVP)
  - `DeliveryServiceCode` remote delivery service code
  - `DeliveryServiceName` display name
  - `DeliveryServiceAmount` fee

Server-side integrity rules:
- On submit, server recalculates totals from mirrored menu and delivery fees.
- Client-sent totals are treated as display-only.

Order export constraints (current):
- POS write contract is `dbo.PS_AddApplicationCustomerOrder`:
  - customer name
  - customer mobile
  - customer address
  - delivery service code
  - order code
- Current procedure accepts one `OrderCode` per call, so multi-item orders require POS confirmation of the intended contract before production rollout.

## 7) Order Confirmation

Purpose:
- Give immediate confidence the order is placed.

Requirements:
- Show order reference (public token or short code).
- Summarize order items and total.
- Clear next step: "Track Order".
- Provide support contact method (WhatsApp/call) for the branch.

## 8) Order Tracking (Active Order Only)

Purpose:
- Show live progress and reduce customer anxiety.

Requirements:
- Status timeline with canonical statuses mapped from POS:
  - Received/Confirmed
  - Preparing
  - Ready
  - Out for delivery (delivery only)
  - Delivered/Completed
  - Cancelled/Rejected (if supported)
- Show branch info.
- Show delivery fee and order summary (read-only).
- Show ETA if available (optional).
- Updates come from POS order-status sync via POS `change_log`.
- Webhooks can accelerate refresh, but `change_log` is the source of truth for replay/recovery.

Non-goal:
- No long-term order history for customers. Tracking is for active/recent orders only based on retention policy.

## Notifications (Customer) - (To Be Determined) 

- WhatsApp message on:
  - Order placed
  - Key status changes (Preparing, Ready, Out for delivery, Delivered)
  - Failure/export issue messaging if POS export fails and requires manual resolution

## Edge Cases and UX Rules

- Branch closed:
  - Disable checkout and show next opening time.
- Item becomes unavailable at checkout:
  - Reject submit with a clear message and guide user back to cart.
- Delivery not supported for address/zone:
  - Disable delivery option and suggest pickup.
- Menu stale risk:
  - If sync health indicates stale menu beyond SLA, show banner and restrict ordering if required by policy.
- Language and text rendering:
  - Arabic names from POS must be shown as-is; avoid auto-translation.
- Performance:
  - Menu endpoint must be cacheable per tenant+branch and invalidated on sync updates.

## MVP Cut (Initial Launch)

- Branch selection
- Simple menu items from `PS_ApplicationOrders_V`
- Delivery services and fees from `PS_ApplicationDeliveryServices_V`
- Cart, checkout (delivery + pickup; dine-in optional)
- Server-side pricing validation
- POS export through `dbo.PS_AddApplicationCustomerOrder` only after multi-item contract is confirmed
- Order tracking driven by POS `change_log` status events

## Phase 2 Enhancements

- Variants/modifiers/combos once POS exposes data for them
- Map-based address input and delivery zone auto-detection (PostGIS)
- Fuzzy search on menu (pg_trgm)
- Promotions/coupons (tenant-configurable)
- Rich ETA and driver tracking if we manage drivers locally

## Open Questions (Need Decisions)

- Payment: cash only at MVP, or online payments planned? (Decision: cash only at MVP)
- Customer auth: fully guest via phone, or optional login? (Decision: fully guest via phone)
- Dine-in: required at MVP, or later? (Decision: later)
- POS contract: how to represent multi-item orders, quantities, modifiers, and variants with the current procedure? (Decision: Need to update the Store Procdure to support multi-item orders)
- Order retention: how long do we keep completed orders for operational support if we don't support customer history? (Decision: [To Be Determined])