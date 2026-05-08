# Order Submit Update POS Procedure

## Goal

Align checkout order submission with the updated POS stored procedure `PS_AddApplicationCustomerOrder`, including order quantity and remarks.

## Steps

1. Update the backend order DTO to accept cart items with quantity and optional remarks.
2. Update backend order persistence to create all submitted order items and export each item to POS.
3. Update `PosSqlService.addCustomerOrder` to pass `OrderQty` and `OrderRemarks` to the stored procedure.
4. Update frontend checkout submission to send all cart items and optional customer remarks.
5. Run targeted lint/type-check verification for changed frontend and backend code.
