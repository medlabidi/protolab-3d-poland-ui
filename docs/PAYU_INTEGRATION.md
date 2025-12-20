# PayU Integration Setup Guide

## Overview
This guide explains how to integrate PayU payment gateway into the Protolab 3D Poland UI application.

## PayU Credentials

Your PayU Point of Sale (POS) credentials (get these from your PayU dashboard):
- **POS ID**: `your-pos-id`
- **MD5 Key**: `your-md5-key`
- **OAuth Client ID**: `your-client-id`
- **OAuth Client Secret**: `your-client-secret`

## Environment Variables

Add these variables to your `.env` file:

```env
# PayU Configuration
PAYU_CLIENT_ID=your-client-id
PAYU_CLIENT_SECRET=your-client-secret
PAYU_POS_ID=your-pos-id
PAYU_MD5_KEY=your-md5-key

# PayU Environment (sandbox or production)
PAYU_ENV=sandbox  # Change to 'production' when going live

# PayU Callback URLs (update with your actual domain)
PAYU_NOTIFY_URL=https://your-domain.com/api/payments/payu/notify
PAYU_CONTINUE_URL=https://your-domain.com/payment-success

# Frontend URL (for constructing callback URLs)
FRONTEND_URL=https://your-domain.com
```

## Sync to Vercel

After adding these variables locally, sync them to Vercel:

```bash
npm run deploy
```

Or manually add them in Vercel Dashboard:
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add each variable with its value
5. Select Production, Preview, and Development environments
6. Redeploy your application

## Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add PayU integration fields
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payu_order_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_orders_payu_order_id ON public.orders(payu_order_id);

ALTER TABLE public.credits_transactions
ADD COLUMN IF NOT EXISTS payu_order_id TEXT;

CREATE INDEX IF NOT EXISTS idx_credits_transactions_payu_order_id ON public.credits_transactions(payu_order_id);
```

## Testing the Integration

### 1. Sandbox Testing

Before going live, test in sandbox mode:
- Set `PAYU_ENV=sandbox`
- Use PayU sandbox test cards: https://developers.payu.com/en/overview.html#sandbox

### 2. Test Credit Purchase Flow

1. Log into your application
2. Navigate to Credits page (`/credits`)
3. Select a credit package
4. Choose payment method (all methods work through PayU)
5. Click "Purchase Credits"
6. You'll be redirected to PayU payment page
7. Complete the payment (use test cards in sandbox)
8. You'll be redirected back to `/payment-success`
9. Credits should be added to your account

### 3. Monitor Notifications

PayU sends payment status notifications to `/api/payments/payu/notify`. Check server logs for:
```
PayU notification received: {
  orderId: "...",
  status: "COMPLETED",
  ...
}
```

## API Endpoints

### Create Payment
**POST** `/api/payments/payu/create`

Request body:
```json
{
  "orderId": "credit_12345_user_67890",
  "amount": 100.00,
  "description": "Store Credit: 100 PLN",
  "userId": "user_id_here"
}
```

Response:
```json
{
  "success": true,
  "redirectUri": "https://secure.payu.com/...",
  "payuOrderId": "PAYU_ORDER_ID"
}
```

### Payment Notification (Webhook)
**POST** `/api/payments/payu/notify`

This endpoint is called by PayU automatically when payment status changes. It:
1. Verifies signature
2. Updates order status
3. Adds credits if applicable
4. Returns empty 200 response (required by PayU)

## Payment Flow Diagram

```
User                Frontend              Backend              PayU
  |                    |                     |                   |
  | Click Purchase     |                     |                   |
  |------------------->|                     |                   |
  |                    | POST /payu/create   |                   |
  |                    |-------------------->|                   |
  |                    |                     | Authenticate      |
  |                    |                     |------------------>|
  |                    |                     | Create Order      |
  |                    |                     |------------------>|
  |                    |                     |<------------------|
  |                    |<--------------------|                   |
  | Redirect to PayU   |                     |                   |
  |--------------------|---------------------|------------------>|
  |                    |                     |                   |
  | Complete Payment   |                     |                   |
  |--------------------|---------------------|------------------>|
  |                    |                     | Notification      |
  |                    |                     |<------------------|
  |                    |                     | Update DB         |
  |                    |                     | Add Credits       |
  |                    |                     |                   |
  | Redirect back      |                     |                   |
  |<-------------------|---------------------|-------------------|
  | /payment-success   |                     |                   |
```

## Security Considerations

1. **Signature Verification**: All PayU notifications are verified using MD5 signature
2. **HTTPS Only**: PayU requires HTTPS for production
3. **Environment Separation**: Use sandbox for testing, production for live
4. **Secret Protection**: Never commit secrets to git (use .env)

## Troubleshooting

### "Authentication failed"
- Check `PAYU_CLIENT_ID` and `PAYU_CLIENT_SECRET` are correct
- Verify credentials match your PayU dashboard

### "Invalid signature"
- Check `PAYU_MD5_KEY` is correct
- Ensure you're using the correct environment (sandbox vs production)

### "Notification not received"
- Check `PAYU_NOTIFY_URL` is publicly accessible
- Verify URL is HTTPS (required in production)
- Check server logs for incoming POST requests

### Credits not added
- Check `/api/payments/payu/notify` logs
- Verify `credits_transactions` table has the transaction
- Check `credits` table balance was updated
- Ensure order description contains "Store Credit: XXX PLN"

## Going Live

When ready for production:

1. Update environment variables:
   ```env
   PAYU_ENV=production
   PAYU_NOTIFY_URL=https://your-production-domain.com/api/payments/payu/notify
   PAYU_CONTINUE_URL=https://your-production-domain.com/payment-success
   FRONTEND_URL=https://your-production-domain.com
   ```

2. Deploy to Vercel:
   ```bash
   npm run deploy
   ```

3. Test with small real payment

4. Monitor PayU dashboard for transactions

## Support

- **PayU Documentation**: https://developers.payu.com/
- **PayU Support**: Contact PayU merchant support
- **Application Issues**: Check server logs and Supabase database

## Files Modified

- `api/_lib/payu.ts` - PayU integration library
- `api/payments/payu/create.ts` - Payment creation endpoint
- `api/payments/payu/notify.ts` - Payment notification handler
- `client/src/pages/Credits.tsx` - Credits purchase UI
- `client/src/pages/PaymentSuccess.tsx` - Payment confirmation page
- `SQL/add-payu-fields.sql` - Database migration
