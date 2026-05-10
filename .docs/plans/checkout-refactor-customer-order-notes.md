# Checkout Refactor: Customer Info, Saved Addresses, And Notes

## Goal

Refactor the restaurant checkout flow so customer data entry is faster, returning customers can reuse saved addresses, notes can be captured at both item and order level, and backend persistence/POS export stay consistent.

## Scope

- Frontend checkout page UI and server actions.
- Backend public restaurant order/customer APIs.
- Prisma schema and migration for order item notes.
- Server-side customer profile cookie for later visits.
- Verification with type/lint checks where feasible.

## Current State Summary

- `frontend/app/(public)/checkout/_components/CheckoutClient.tsx` renders a single client checkout form.
- `frontend/actions/checkout-actions.ts` submits to `POST /branches/:branchId/orders` and clears the cart cookie on success.
- `backend/src/restaurant/orders.controller.ts` exposes order creation under `/branches/:branchId/orders`.
- `backend/src/restaurant/services/restaurant-orders.service.ts` persists `mvp_orders`, `mvp_order_items`, then exports each item to POS using `PS_AddApplicationCustomerOrder`.
- `backend/prisma/schema.prisma` currently has whole-order `MvpOrder.remarks` but no item-level note/remarks field.
- There is no dedicated restaurant customer profile cookie yet.
- There is no public customer lookup endpoint for restaurant checkout.

## UX Requirements

- Customer info layout should match the provided image direction:
  - Name and phone in one responsive block.
  - Address as a full-width block.
  - Selected branch and selected service area in one readonly block.
- Order summary should not show the selected service area/area name.
- Order summary should keep delivery fee only, plus subtotal, VAT, and final total.
- Phone lookup should run silently after the user enters a phone number and must not block typing, editing, or submitting.
- If saved addresses are found, inform the user and let them choose or confirm an address.
- One saved address should be auto-selected but visibly require confirmation.
- Multiple saved addresses should be presented in a modern, low-friction selector.
- Every order item should have its own note.
- The whole order should also have a separate note.

## Proposed UX Details

### Customer Info Card

- Keep the existing Arabic visual language and checkout card styling.
- Use a two-column grid on desktop/tablet and one column on small mobile:
  - `الاسم`
  - `رقم الهاتف`
- Add address textarea full width below them.
- Add a readonly context block below address:
  - `الفرع المختار`: branch name.
  - `منطقة التوصيل`: delivery service name.
- Keep this branch/service context out of the order summary.

### Order Summary Card

- Remove this row completely from summary:
  - `منطقة التوصيل` / selected service name.
- Keep:
  - Items list.
  - Subtotal.
  - Delivery fee.
  - VAT.
  - Final total.
- Add compact item note controls under each item row:
  - Default collapsed/inline small textarea placeholder: `ملاحظة لهذا الصنف`.
  - Limit to 200 chars per item.
  - Include each note in the hidden serialized `items` payload.

### Saved Address Prompt

- When lookup is in progress, do not show a blocking loader; show at most subtle text like `جاري البحث عن بيانات محفوظة...` only after the user has paused.
- If one saved address is found:
  - Show an inline card below address: `وجدنا عنوان محفوظ لهذا الرقم`.
  - Pre-fill address if the address field is empty or still unchanged by the user.
  - Show two actions:
    - `تأكيد العنوان` marks it confirmed.
    - `تعديل العنوان` keeps the textarea focused for edits.
- If multiple addresses are found:
  - Show an inline banner: `وجدنا أكثر من عنوان محفوظ` with `اختيار عنوان`.
  - Open existing `BottomSheet` for address selection.
  - Each address appears as a selectable card with a shortened preview and recency/order count if available.
  - Selecting an address fills the textarea and marks it as selected pending confirmation.
- If the user edits the address manually after selection, clear the confirmed state so the final submitted address reflects the edit.

## Backend Plan

### 1. Add Customer Lookup DTO

- Create a DTO under `backend/src/restaurant/dto/lookup-restaurant-customer.dto.ts`.
- Fields:
  - `phone`: required string, max length 32.
- Add Swagger metadata.
- Keep validation simple and compatible with current checkout phone examples.

### 2. Add Customer Lookup Endpoint

- Add a public route under the restaurant module, preferably in a new controller:
  - `GET /branches/:branchId/customers/lookup?phone=01023314587`
- Route behavior:
  - Assert branch exists.
  - Trim raw phone.
  - Normalize phone with existing `formatPhoneNumber`.
  - Query recent orders for this branch where `customerMobile` matches raw phone or normalized phone.
  - Order by `createdAt desc`.
  - Select only required fields: name, mobile, address, createdAt.
  - Dedupe addresses by normalized text.
  - Return a minimal response:
    - `name?: string`
    - `phone: string`
    - `addresses: Array<{ id: string; address: string; lastUsedAt: string }>`
- Cap addresses to a small number, e.g. 5, to keep UI simple and protect payload size.

### 3. Add Item Notes To Schema

- Update `backend/prisma/schema.prisma`:
  - Add `remarks String?` or `notes String?` to `MvpOrderItem`.
  - Prefer `remarks` for consistency with current `MvpOrder.remarks` and POS naming.
- Create migration manually only if approved, because backend guidelines say not to create migration files unless explicitly required. This feature requires DB storage, so the migration is required.
- Migration shape:
  - `ALTER TABLE mvp_order_items ADD COLUMN IF NOT EXISTS remarks TEXT;`

### 4. Extend Create Order DTO

- Update `CreateRestaurantOrderItemDto`:
  - Add optional `remarks?: string` with `@IsOptional`, `@IsString`, `@MaxLength(200)`.
- Keep whole-order `remarks?: string` as-is.

### 5. Persist And Export Notes

- In `RestaurantOrdersService.createOrder`:
  - Trim whole-order remarks once.
  - Trim each item remarks.
  - Persist item remarks in `mvp_order_items.remarks`.
  - For POS export, pass an item-specific `orderRemarks` value.
- Suggested POS remarks composition:
  - If both item note and order note exist: `ملاحظة الصنف: {itemNote} | ملاحظة الطلب: {orderNote}`.
  - If only item note exists: item note.
  - If only order note exists: order note.
  - If neither exists: empty string.
- This keeps POS useful despite the stored procedure having only one remarks field per exported item.

## Frontend Plan

### 1. Add Restaurant Customer Cookie Utility

- Add a new utility file, e.g. `frontend/lib/customer/restaurant-customer-cookie.ts`.
- Add `STORAGE_KEYS.RESTAURANT_CUSTOMER_PROFILE`.
- Cookie should be server-only/httpOnly:
  - `httpOnly: true`
  - `secure: production only`
  - `sameSite: lax`
  - `path: /`
  - TTL around 90 days.
- Payload shape:
  - `v: 1`
  - `name?: string`
  - `phone?: string`
  - `addresses: Array<{ address: string; updated_at: string }>`
- Normalize/dedupe addresses and cap to 5 recent addresses.

### 2. Read Cookie On Checkout Page

- Update `frontend/app/(public)/checkout/page.tsx`:
  - Fetch branch data so branch name can be shown in the customer info card.
  - Read restaurant customer profile cookie.
  - Pass `selectedBranch` and `initialCustomerProfile` to `CheckoutClient`.
- Keep server-side data fetching parallelized with `Promise.all` where possible.

### 3. Add Customer Lookup Server Action

- Add action in `frontend/actions/checkout-actions.ts` or a small adjacent action module.
- The action accepts `branchId` and `phone`.
- It calls backend lookup endpoint using server-side `fetch`.
- It returns a safe state object:
  - `{ success: true, data: { name, phone, addresses } }`
  - or `{ success: false }` without noisy UI errors.
- Use `cache: "no-store"`.

### 4. Refactor Checkout Client State

- Extend form state:
  - `customerName`
  - `customerMobile`
  - `customerAddress`
  - `remarks`
  - `itemRemarksByMenuItemId`
  - `selectedSavedAddressId`
  - `isAddressConfirmed`
- Initialize from cookie profile when available.
- Make sure user edits are never overwritten by late lookup responses.

### 5. Implement Non-Blocking Phone Lookup

- Use `useDebouncedCallback` already available in dependencies.
- Trigger lookup when phone has enough digits, e.g. 10+ numeric chars.
- Use `useTransition` for non-urgent lookup state updates.
- Track latest request key/ref to ignore stale responses.
- Abort is optional because this is a server action; stale response guarding is enough.
- Autofill name/address only if the user has not already typed into those fields.

### 6. Build Saved Address UI

- Reuse `BottomSheet` from `frontend/components/ui/bottom-sheet.tsx` for multiple address selection.
- Inline saved address card states:
  - Loading: subtle text only.
  - One address: confirmation card.
  - Multiple addresses: banner + bottom sheet.
  - Confirmed: compact success state like `تم تأكيد العنوان`.
- Keep submission allowed with manually entered address; do not force DB match.

### 7. Update Serialized Order Items

- Update checkout `items` hidden input generation:
  - Include `remarks` for each cart item when present.
- Update `CheckoutOrderItem` type in server action:
  - Add optional `remarks?: string`.
- Sanitize/truncate each item note to 200 chars before sending to backend.

### 8. Persist Cookie After Successful Submit

- In `submitCheckoutOrderAction`, after successful backend response and before redirect:
  - Upsert restaurant customer profile cookie with name, phone, and submitted address.
- Keep cart cookie clearing behavior.

## Files Expected To Change

### Backend

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/<timestamp>_add_order_item_remarks/migration.sql`
- `backend/src/restaurant/dto/create-restaurant-order.dto.ts`
- `backend/src/restaurant/dto/lookup-restaurant-customer.dto.ts`
- `backend/src/restaurant/customers.controller.ts` or an equivalent restaurant customer lookup controller
- `backend/src/restaurant/restaurant.module.ts`
- `backend/src/restaurant/services/restaurant-orders.service.ts`
- `backend/src/restaurant/services/restaurant.service.ts` or a small new service method for lookup

### Frontend

- `frontend/constants/index.ts`
- `frontend/lib/customer/restaurant-customer-cookie.ts`
- `frontend/actions/checkout-actions.ts`
- `frontend/app/(public)/checkout/page.tsx`
- `frontend/app/(public)/checkout/_components/CheckoutClient.tsx`
- Possibly `frontend/services/api/branches.service.ts` if adding `getBranch` is cleaner than filtering the branch list.

## Data And Compatibility Notes

- Existing orders remain valid because item remarks are nullable.
- Existing checkout submissions remain compatible if item remarks are absent.
- No client-side storage will be used for customer PII.
- Cookie is httpOnly, so checkout receives it through the server page only.
- The customer lookup endpoint returns only minimal historical checkout data and is branch-scoped.

## Edge Cases

- Phone has no matching orders: no prompt, user continues normally.
- Lookup returns after user changed phone: ignore stale result.
- Lookup returns after user typed name/address manually: do not overwrite those fields.
- One saved address exists but user edits it: mark as unconfirmed/manual.
- Multiple duplicate address strings: show once, newest first.
- POS export failure: local order still stores item notes before export attempt status is updated.

## Verification Plan

- Run Prisma generation after schema edit:
  - `pnpm prisma:generate` from `backend`.
- Run backend non-mutating lint/type check if available:
  - Prefer `pnpm lint:ci` from `backend`.
- Run frontend lint/type check:
  - `pnpm lint` from `frontend`.
- Manually verify checkout behaviors:
  - Order summary no longer displays service area.
  - Delivery fee still appears.
  - Customer info card layout matches requested structure on mobile and desktop.
  - Phone lookup does not block input.
  - Single saved address preselects and can be confirmed.
  - Multiple saved addresses open selector and fill address.
  - Per-item notes and order note reach backend payload.
  - Submitted profile is available on later checkout visit through server cookie.

## Implementation Order

1. Backend schema and DTO support for item notes.
2. Backend customer lookup endpoint.
3. Frontend cookie utility and checkout page server data loading.
4. Frontend checkout UI layout and order summary cleanup.
5. Frontend silent lookup and saved address UI.
6. Submit action updates for item notes and customer profile cookie.
7. Verification commands and final review.

## Open Decisions

- Confirm whether item note field should be named `remarks` everywhere for consistency or exposed as `notes` in frontend and translated to `remarks` in backend.
- Confirm whether customer lookup should search all branches or only the selected branch. The safer default is selected branch only.
