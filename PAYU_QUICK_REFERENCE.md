# 🚀 PayU BLIK Quick Reference Card

## 📋 Quick Start Checklist

- [x] PayU sandbox credentials configured in `.env`
- [x] Backend API endpoints created
- [x] Frontend payment component created  
- [x] Payment routes configured
- [x] Database schema ready
- [x] TypeScript compiled successfully
- [x] All dependencies installed

## 🎯 Test Now!

### Option 1: Manual Test
```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start client  
cd client
npm run dev

# Browser
# 1. Login at http://localhost:8080
# 2. Create/select an order
# 3. Go to /orders/{orderId}/payment
# 4. Enter BLIK code: 777123
# 5. Click "Pay with BLIK"
```

### Option 2: Automated Test
```bash
node test-payu-payment.js
```

## 🔑 Essential Info

| Item | Value |
|------|-------|
| **Test BLIK Code** | `777123` |
| **Payment URL** | `/orders/{orderId}/payment` |
| **API Base** | `/api/payments` |
| **Webhook** | `/api/payments/payu/notify` |

## 🔌 API Endpoints

```
POST   /api/payments/blik          # BLIK payment
POST   /api/payments/create        # Standard payment
GET    /api/payments/status/:id    # Check status
POST   /api/payments/payu/notify   # Webhook
```

## 📊 Payment Status Flow

```
submitted → on_hold → paid → in_queue
                   ↓
                cancelled/refunded
```

## 🧪 Test Scenarios

### ✅ Success Test
1. Use BLIK code: `777123`
2. Payment completes
3. Order status → `in_queue`
4. Payment status → `paid`

### ❌ Failure Test
1. Use BLIK code: `123456`
2. Error message shown
3. Payment status → `on_hold`
4. Can retry

## 💾 Database Schema

```sql
ALTER TABLE orders 
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'on_hold',
ADD COLUMN paid_amount DECIMAL(10, 2) DEFAULT 0;
```

## 📝 Component Usage

```tsx
import { BlikPayment } from '@/components/BlikPayment';

<BlikPayment
  orderId={orderId}
  amount={totalAmount}
  onSuccess={() => navigate(`/orders/${orderId}`)}
  onError={(error) => toast.error(error)}
/>
```

## 🔐 Environment Variables

```env
PAYU_POS_ID=501885
PAYU_SECOND_KEY=93e0d9536f9d4bb396c47163c3a1692e
PAYU_CLIENT_ID=501885
PAYU_CLIENT_SECRET=81927c33ee2b36ee897bef24ef90a446
```

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Webhook not received | Use ngrok: `ngrok http 5000` |
| Payment fails | Check server logs |
| Invalid BLIK | Use test code `777123` |
| TypeScript errors | Run `npm run build` in server |

## 📚 Documentation Files

- `PAYU_PAYMENT_SETUP.md` - Quick start guide
- `PAYU_INTEGRATION_SUMMARY.md` - Complete summary
- `docs/PAYU_BLIK_INTEGRATION.md` - Detailed docs

## 🎨 UI Components

### BlikPayment
- Location: `client/src/components/BlikPayment.tsx`
- Features: BLIK input, payment method selector, error handling

### PaymentPage
- Location: `client/src/pages/PaymentPage.tsx`
- Features: Order summary, payment form, status tracking

## 🔄 Payment Lifecycle

```
1. Create Order → 2. Navigate to Payment → 3. Enter BLIK
    ↓                      ↓                        ↓
4. Submit Payment → 5. PayU Processes → 6. Webhook Received
    ↓                      ↓                        ↓
7. Update Status → 8. Show Success → 9. Complete
```

## ⚡ Key Features

- ✅ OAuth 2.0 authentication
- ✅ BLIK authorization code
- ✅ Standard redirect payment
- ✅ Webhook notifications
- ✅ MD5 signature verification
- ✅ Payment status tracking
- ✅ Error handling
- ✅ Request validation

## 🎁 Bonus Scripts

```bash
# Test payment flow
node test-payu-payment.js

# Build server
cd server && npm run build

# Start dev servers
npm run dev  # In both server/ and client/
```

## 📞 Support Resources

- PayU Docs: https://developers.payu.com/
- BLIK Guide: https://developers.payu.com/en/blik.html
- Local Docs: Check `docs/` folder

---

**Ready to Go!** 🎉

Everything is set up and tested. Start your servers and test the payment flow!
