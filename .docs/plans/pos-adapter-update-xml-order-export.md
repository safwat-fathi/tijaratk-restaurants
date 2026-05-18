# POS Adapter Update XML Order Export

## Goal

Align the application backend with the current POS stored procedure contract without changing the POS database.

## Scope

- Update the backend POS adapter to call `dbo.PS_AddApplicationCustomerOrder` once per local order.
- Build the POS order item XML as an in-memory string only.
- Send local order identity, invoice remarks, and XML item payload to the POS procedure.
- Replace the per-item POS export loop with one export call using persisted order items.

## Implementation Steps

1. Update `backend/src/pos/pos-sql.service.ts`:
   - Accept full-order export parameters.
   - Build XML text in memory from order items.
   - Send `CustomerName`, `CustomerMobile`, `CustomerAddress`, `DeliveryServiceCode`, `OnLineInvoiceCode`, `InvoiceRemarks`, and `xmlData`.

2. Update `backend/src/restaurant/services/restaurant-orders.service.ts`:
   - Remove the per-item POS procedure loop.
   - Call POS once after local order creation.
   - Use persisted `order.items` as the source of POS XML rows.

3. Verify backend compilation.
