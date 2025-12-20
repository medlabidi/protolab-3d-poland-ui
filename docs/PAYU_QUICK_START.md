# PayU Integration - Quick Start

## ⚡ Quick Setup (5 minutes)

### 1. Add Environment Variables

Add to your `.env` file:

```env
# PayU Configuration
PAYU_CLIENT_ID=501885
PAYU_CLIENT_SECRET=81927c33ee2b36ee897bef24ef90a446
PAYU_POS_ID=501885
PAYU_MD5_KEY=93e0d9536f9d4bb396c47163c3a1692e
PAYU_ENV=sandbox
PAYU_NOTIFY_URL=https://your-domain.vercel.app/api/payments/payu/notify
PAYU_CONTINUE_URL=https://your-domain.vercel.app/payment-success
FRONTEND_URL=https://your-domain.vercel.app
```

### 2. Run Database Migration

Run this in Supabase SQL Editor (Dashboard → SQL Editor):

```sql
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payu_order_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_orders_payu_order_id ON public.orders(payu_order_id);

ALTER TABLE public.credits_transactions
ADD COLUMN IF NOT EXISTS payu_order_id TEXT;

CREATE INDEX IF NOT EXISTS idx_credits_transactions_payu_order_id ON public.credits_transactions(payu_order_id);
```

### 3. Deploy to Vercel

```bash
npm run deploy
```

### 4. Test Credit Purchase

1. Visit `/credits` page
2. Select a credit package
3. Click "Purchase Credits"
4. You'll be redirected to PayU
5. Use test cards (sandbox mode)
6. Complete payment
7. Credits added automatically! ✨

## 🎯 Features

✅ **Full PayU Integration**
- OAuth authentication with token caching
- Order creation with automatic redirect
- Secure webhook notifications
- Signature verification

✅ **Store Credits System**
- Buy credits with PayU
- Automatic balance updates
- Transaction history
- Refund to credits support

✅ **Payment Flow**
- User clicks "Purchase"
- Redirects to PayU payment page
- User pays with any method (card, BLIK, transfer)
- PayU notifies your backend
- Credits added automatically
- User redirected to success page

## 📁 New Files

```
api/
  _lib/
    payu.ts                      # PayU integration library
  payments/
    payu/
      create.ts                  # Create payment endpoint
      notify.ts                  # Webhook notification handler

client/src/pages/
  PaymentSuccess.tsx             # Payment confirmation page

SQL/
  add-payu-fields.sql           # Database migration

docs/
  PAYU_INTEGRATION.md           # Full documentation
  PAYU_QUICK_START.md           # This file

run-payu-migration.js           # Migration helper script
```

## 🔐 Security

- ✅ Signature verification on all notifications
- ✅ OAuth token caching with expiry
- ✅ Environment-based configuration
- ✅ HTTPS required for production

## 🧪 Testing

### Sandbox Mode (Default)
- Set `PAYU_ENV=sandbox`
- Use test cards from PayU docs
- Test all payment flows

### Test Cards
Visit: https://developers.payu.com/en/overview.html#sandbox

### Production Mode
- Set `PAYU_ENV=production`
- Update notify/continue URLs to production domain
- Test with small real payment first

## 🎨 User Flow

```
Credits Page → Select Package → Choose Payment Method → 
Click Purchase → Redirect to PayU → Complete Payment → 
Redirect Back → Success Page → Credits Added
```

## 📊 Monitoring

Check these in production:

1. **Vercel Logs**: Monitor `/api/payments/payu/notify` calls
2. **Supabase**: Check `credits_transactions` table
3. **PayU Dashboard**: View all transactions

## 🐛 Troubleshooting

**Credits not added?**
- Check Vercel logs for notification errors
- Verify `PAYU_NOTIFY_URL` is correct and accessible
- Check `credits_transactions` table

**Payment redirect fails?**
- Verify `PAYU_CONTINUE_URL` is correct
- Check browser console for errors

**Authentication error?**
- Verify `PAYU_CLIENT_ID` and `PAYU_CLIENT_SECRET`
- Check they match your PayU dashboard

## 🚀 Go Live Checklist

- [ ] Add production environment variables
- [ ] Set `PAYU_ENV=production`
- [ ] Update `PAYU_NOTIFY_URL` to production domain
- [ ] Update `PAYU_CONTINUE_URL` to production domain
- [ ] Deploy to Vercel
- [ ] Test with small real payment
- [ ] Monitor first transactions

## 📚 Documentation

Full details: `docs/PAYU_INTEGRATION.md`

## 💡 Tips

- Start in sandbox mode
- Test all payment methods
- Monitor logs during first transactions
- Keep credentials secure (never commit to git)

---

**That's it!** Your PayU integration is ready. Users can now purchase credits with real payments. 🎉
