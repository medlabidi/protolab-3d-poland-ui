# URGENT: Database Migration Required

## Problem Found
Your production logs show a database constraint violation:
```
new row for relation "orders" violates check constraint "orders_payment_status_check"
```

The database CHECK constraint only allows: `'paid', 'on_hold', 'refunding', 'refunded'`  
But the code now uses: `'pending', 'failed', 'cancelled'` as well.

## Immediate Fix Required

### Step 1: Run Database Migration
Go to **Supabase Dashboard > SQL Editor** and run this SQL:

```sql
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('paid', 'pending', 'on_hold', 'refunding', 'refunded', 'failed', 'cancelled'));
```

### Step 2: Deploy Code Changes
```bash
git push
vercel --prod
```

## What Was Fixed

### 1. ✅ BLIK Payment Buyer Data (Your Original Issue)
**Problem**: Wrong buyer data showing on BLIK payment page  
**Cause**: PaymentPage was calling non-existent `/api/payments/blik` and `/api/payments/create` endpoints without passing:
- `userId` (needed for buyer name, email, phone!)
- `amount`
- `description`
- Proper `payMethods` structure for BLIK

**Solution**: Updated [client/src/pages/PaymentPage.tsx](client/src/pages/PaymentPage.tsx#L158-L210) to:
- Call `/api/payments/payu/create` (the correct endpoint)
- Pass full buyer data: `userId`, `amount`, `description`
- Include BLIK code in `payMethods.payMethod.authorizationCode`
- Generate proper description for credits vs print orders

### 2. ✅ Database Constraint
**Problem**: Database rejects 'pending' payment status  
**Solution**: Created migration SQL to add missing statuses to CHECK constraint

## Payment Status Flow After Fix

1. **Order Created** → `payment_status: NULL` or `'pending'`
2. **User Initiates Payment** → `'pending'` (before PayU redirect)
3. **PayU Processing** → `'on_hold'` or `'pending'`
4. **Payment Complete** → `'paid'` (via webhook)
5. **Payment Failed** → `'failed'`
6. **User Cancels** → `'cancelled'`
7. **Refund Requested** → `'refunding'`
8. **Refund Complete** → `'refunded'`

## Files Changed
- ✅ `client/src/pages/PaymentPage.tsx` - Fixed BLIK/payment buyer data
- ✅ `client/src/components/StatusBadge.tsx` - Added pending/failed/cancelled badges
- ✅ `client/src/pages/Orders.tsx` - Added icon imports
- ✅ `SQL/update-payment-status-constraint.sql` - Database migration

## Next Steps
1. **Run the SQL migration immediately** (Step 1 above)
2. Deploy the code changes
3. Test BLIK payment - buyer data should now be correct
4. Monitor logs for any remaining "Invalid PayU signature" issues

## Additional Issue Spotted
Your logs also show:
```
POST 401 /api/payments/payu/notify - Invalid PayU signature
```

This means PayU webhooks are being rejected. This is a separate issue that needs investigation - likely the signature verification is using wrong credentials or algorithm. Let me know if you want me to investigate this next.
