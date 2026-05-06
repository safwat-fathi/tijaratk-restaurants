# Phase 0 Retained Capabilities Matrix

## Objective

Identify platform capabilities to preserve and reuse during the restaurant pivot.

## Reuse Categories

- `keep-as-is`: reuse with no structural changes in Phase 0.
- `keep-with-adaptation`: reuse core foundation with restaurant-oriented changes in later phases.

## Backend Capabilities

| Capability | Current implementation | Reuse decision | Notes |
|-----------|------------------------|----------------|------|
| Auth and session foundation | `backend/src/auth/*`, session middleware | keep-as-is | Continue role-based auth and secure session handling |
| Users and roles | `backend/src/users/*`, `backend/src/common/enums/user-role.enum.ts` | keep-with-adaptation | Keep owner/staff model; expand branch-level permissions later |
| Tenants foundation | `backend/src/tenants/*` | keep-with-adaptation | Keep tenant boundary; update categories and restaurant metadata |
| Customer identity and snapshots | `backend/src/customers/*` | keep-with-adaptation | Keep customer records; align checkout fields with restaurant flow |
| RLS request-context pattern | `backend/src/common/interceptors/tenant-rls.interceptor.ts`, RLS migrations | keep-with-adaptation | Keep tenant isolation pattern; extend to new tables |
| Exception handling and response patterns | `backend/src/common/filters/*`, `backend/src/common/interceptors/response-transform.transform.ts` | keep-as-is | Reuse globally |
| WhatsApp notification infrastructure | `backend/src/whatsapp/*` | keep-with-adaptation | Re-map templates to restaurant lifecycle events |
| Public order tracking shell | `backend/src/orders/orders.controller.ts` (tracking endpoints) | keep-with-adaptation | Keep concept; map to POS status sync lifecycle |

## Frontend Capabilities

| Capability | Current implementation | Reuse decision | Notes |
|-----------|------------------------|----------------|------|
| App routing and layout foundation | `frontend/app/*` route groups | keep-as-is | Reuse structure for restaurant pages |
| API service abstraction | `frontend/services/base/http.service.ts`, `frontend/services/api/*` | keep-with-adaptation | Reuse pattern; add menu/branch/delivery services |
| Auth flow and protected dashboard shell | `frontend/app/(dashboard)/merchant/(auth)/*`, dashboard layouts | keep-as-is | Keep login/session flow |
| Tracking UX shell | `frontend/app/(public)/track-order/[token]/*` | keep-with-adaptation | Keep route and experience; update statuses and messages |
| Utility libraries and formatting helpers | `frontend/lib/utils/*` | keep-as-is | Reuse where relevant |

## Technical Direction Confirmation

1. New persistence direction is Prisma for application data access.
2. Raw SQL remains approved for PostGIS, `pg_trgm`, and RLS.
3. Existing TypeORM codebase remains operational baseline until migration phases are executed.

## Phase 0 Output

This matrix defines the "platform core" that survives the pivot and reduces rework in later phases.
