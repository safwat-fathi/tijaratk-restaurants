# Phase 0 Legacy Audit Matrix

## Objective

Inventory grocery/supermarket-centric functionality across backend and frontend, then classify each capability for retirement, replacement, or temporary retention.

## Classification

- `retire`: remove from active product in pivot phases.
- `replace`: keep concept but rebuild in restaurant form.
- `temporary-retain`: keep only if hard deletion is blocked by immediate runtime dependencies.

## Backend Audit

| Area | Current implementation | Evidence | Classification | Phase target |
|------|------------------------|----------|----------------|-------------|
| Tenant business categories | Grocery-specific categories (`grocery`, `greengrocer`, `butcher`, `bakery`, `pharmacy`) | `backend/src/tenants/constants/tenant-category.ts` | replace | Phase 1 |
| Product domain as primary catalog | Product-centric domain used by public and dashboard flows | `backend/src/products/products.module.ts`, `backend/src/products/products.service.ts` | replace | Phase 2 |
| Global grocery catalog seeding | Large supermarket catalog data seeder | `backend/src/common/seeders/catalog.seeder.ts` | retire | Phase 9 |
| Product order modes | Quantity/weight/price ordering semantics | `backend/src/common/enums/product-order-mode.enum.ts` | replace | Phase 2 |
| Order type semantics | `catalog` vs `free_text` order type | `backend/src/common/enums/order-type.enum.ts` | replace | Phase 5 |
| Availability requests flow | Grocery-style availability requests | `backend/src/availability-requests/availability-requests.module.ts` | retire | Phase 9 |
| Product replacement workflow | Replacement decision workflow in orders | `backend/src/common/enums/replacement-decision-status.enum.ts`, `backend/src/orders/orders.service.ts` | retire | Phase 9 |
| App module composition | Grocery-first modules wired as core | `backend/src/app.module.ts` (`ProductsModule`, `AvailabilityRequestsModule`) | temporary-retain | Phases 2-9 |

## Frontend Audit

| Area | Current implementation | Evidence | Classification | Phase target |
|------|------------------------|----------|----------------|-------------|
| Public storefront data source | Slug page reads `products` service | `frontend/app/(public)/[slug]/page.tsx`, `frontend/services/api/products.service.ts` | replace | Phase 2 |
| Grocery product model in shared types | Product model exposes grocery order mode and category | `frontend/types/models/product.ts` | replace | Phase 2 |
| Grocery order payload semantics | Order service uses `selection_mode` values (`quantity`, `weight`, `price`) | `frontend/types/services/orders.ts`, `frontend/actions/order-actions.ts` | replace | Phase 5 |
| Merchant order replacement UI | Replacement-heavy dashboard UX for unavailable products | `frontend/app/(dashboard)/merchant/(features)/orders/[id]/_components/OrderItemsReplacement.tsx` | retire | Phase 9 |
| Tenant categories in UI constants | Grocery-first category labels and values | `frontend/constants/tenant-categories.ts` | replace | Phase 1 |
| Availability request UI/services | Customer availability request flows and cookies | `frontend/services/api/availability-requests.service.ts`, `frontend/actions/availability-request-cookie-actions.ts` | retire | Phase 9 |

## Legacy API and Contract Risks

1. Existing order payloads depend on product-based fields not aligned with restaurant item modeling.
2. Public storefront routes and UI contracts currently assume products, not menu entities.
3. Replacement and availability workflows are deeply wired into merchant and order experiences.

## Retirement Sequence Guidance

1. Remove legacy grocery features directly as a hard decommission decision.
2. Build restaurant replacements as new modules and routes.
3. Accept temporary functionality reduction until restaurant replacements are live.

## Phase 0 Output

This audit is the baseline inventory for migration planning and progressive shutdown in later phases.
