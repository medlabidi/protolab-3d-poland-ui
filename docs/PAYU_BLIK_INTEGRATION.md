# PayU BLIK Payment Integration Guide

## Overview

This guide explains how to use the PayU BLIK payment integration for testing payment flows in the sandbox environment.

## Sandbox Credentials

The following credentials are configured in the `.env` file:

```env
PAYU_POS_ID=501885
PAYU_SECOND_KEY=93e0d9536f9d4bb396c47163c3a1692e
PAYU_CLIENT_ID=501885
PAYU_CLIENT_SECRET=81927c33ee2b36ee897bef24ef90a446
PAYU_NOTIFY_URL=http://localhost:5000/api/payments/payu/notify
PAYU_CONTINUE_URL=http://localhost:8080/orders
```

## API Endpoints

### 1. Create BLIK Payment
**POST** `/api/payments/blik`

Creates a payment order using BLIK authorization code.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": "uuid-of-order",
  "blikCode": "777123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "BLIK payment initiated. Please authorize in your banking app.",
  "orderId": "uuid-of-order",
  "payuOrderId": "ABC123XYZ",
  "status": {
    "statusCode": "SUCCESS"
  }
}
```

**Response (Error - Invalid BLIK Code):**
```json
{
  "error": "BLIK payment failed",
  "code": "BLIK_INVALID_CODE",
  "message": "Invalid BLIK code",
  "payuOrderId": "ABC123XYZ"
}
```

### 2. Create Standard Payment
**POST** `/api/payments/create`

Creates a payment order and returns a redirect URL to PayU payment gateway.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": "uuid-of-order"
}
```

**Response:**
```json
{
  "success": true,
  "redirectUri": "https://secure.snd.payu.com/...",
  "orderId": "uuid-of-order",
  "payuOrderId": "ABC123XYZ"
}
```

### 3. Get Payment Status
**GET** `/api/payments/status/:orderId`

Get the current payment status for an order.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "orderId": "uuid-of-order",
  "paymentStatus": "paid",
  "paidAmount": 150.00,
  "totalAmount": 150.00
}
```

### 4. PayU Notification Webhook
**POST** `/api/payments/payu/notify`

This endpoint receives notifications from PayU about payment status changes. It's called automatically by PayU.

**Headers:**
```
OpenPayU-Signature: signature=...;algorithm=MD5
Content-Type: application/json
```

## Payment Flow

### White Label BLIK Payment Flow

1. **Customer generates BLIK code** in their banking app
2. **Customer enters code** on your website (6-digit code)
3. **Your app calls** `POST /api/payments/blik` with the code
4. **PayU processes** the BLIK payment
5. **PayU sends notification** to mobile banking app
6. **Customer authorizes** payment in banking app
7. **PayU sends webhook** notification to your server
8. **Your app updates** order status to paid

### Standard Payment Flow

1. **Customer clicks** "Pay Now" button
2. **Your app calls** `POST /api/payments/create`
3. **Your app redirects** customer to PayU payment page
4. **Customer selects** payment method (card, transfer, etc.)
5. **Customer completes** payment on PayU
6. **PayU sends webhook** notification to your server
7. **Your app updates** order status to paid
8. **Customer is redirected** back to your website

## Testing in Sandbox

### Test BLIK Codes

For successful payment:
```
777123
```

For invalid BLIK code (error simulation):
```
Any other 6-digit code
```

### Payment Scenarios

#### Scenario 1: Successful BLIK Payment

1. Create an order in your app
2. Go to payment page
3. Select BLIK payment method
4. Enter code: `777123`
5. Click "Pay with BLIK"
6. Payment should succeed immediately in sandbox

**Expected Result:**
- Payment status: `paid`
- Order status: `in_queue`
- Webhook notification received

#### Scenario 2: Invalid BLIK Code

1. Create an order in your app
2. Go to payment page
3. Select BLIK payment method
4. Enter any other 6-digit code (e.g., `123456`)
5. Click "Pay with BLIK"

**Expected Result:**
- Error message: "Invalid BLIK code"
- Payment status: `on_hold` (unchanged)
- Order remains unpaid

## Frontend Integration

### Using the BlikPayment Component

```tsx
import { BlikPayment } from '@/components/BlikPayment';

function OrderPaymentPage() {
  const orderId = 'your-order-id';
  const amount = 150.00;

  const handleSuccess = () => {
    console.log('Payment successful!');
    // Redirect to order confirmation page
  };

  const handleError = (error: string) => {
    console.error('Payment failed:', error);
    // Show error message to user
  };

  return (
    <BlikPayment
      orderId={orderId}
      amount={amount}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}
```

## Order Payment Status

The order model includes payment-related fields:

```typescript
{
  payment_status: 'paid' | 'on_hold' | 'refunding' | 'refunded',
  paid_amount: number,
  status: OrderStatus
}
```

### Payment Status Values

- `on_hold`: Payment initiated but not completed
- `paid`: Payment completed successfully
- `refunding`: Refund in progress
- `refunded`: Payment refunded

## Webhook Security

PayU notifications are verified using MD5 signature:

```typescript
const hash = crypto
  .createHash('md5')
  .update(notification + PAYU_SECOND_KEY)
  .digest('hex');

if (hash === signature) {
  // Valid notification
}
```

## Error Handling

### Common Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `BLIK_INVALID_CODE` | Invalid or expired BLIK code | Ask user to generate new code |
| `BLIK_EXPIRED_CODE` | BLIK code has expired (2 minutes) | Ask user to generate new code |
| `BLIK_USER_CANCELLED` | User cancelled in banking app | Allow retry |
| `BLIK_LIMIT_EXCEEDED` | Daily limit exceeded | Suggest alternative payment method |
| `UNAUTHORIZED` | Invalid OAuth credentials | Check PayU configuration |
| `ERROR_VALUE_INVALID` | Invalid request parameters | Check request format |

## Environment Variables

### Development (.env)
```env
PAYU_POS_ID=501885
PAYU_SECOND_KEY=93e0d9536f9d4bb396c47163c3a1692e
PAYU_CLIENT_ID=501885
PAYU_CLIENT_SECRET=81927c33ee2b36ee897bef24ef90a446
PAYU_NOTIFY_URL=http://localhost:5000/api/payments/payu/notify
PAYU_CONTINUE_URL=http://localhost:8080/orders
```

### Production
Replace with your production PayU credentials:
- Use `https://secure.payu.com` instead of `https://secure.snd.payu.com`
- Update `PAYU_NOTIFY_URL` to your production webhook URL
- Update `PAYU_CONTINUE_URL` to your production frontend URL

## Database Schema Update

Make sure your orders table includes payment fields:

```sql
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'on_hold',
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0;
```

## Troubleshooting

### Payment not completing

1. Check server logs for PayU API errors
2. Verify OAuth token is being obtained successfully
3. Check webhook URL is accessible from internet
4. Verify BLIK code is exactly 6 digits

### Webhook not received

1. Use ngrok or similar tool for local testing:
   ```bash
   ngrok http 5000
   ```
2. Update `PAYU_NOTIFY_URL` in .env to ngrok URL
3. Check PayU dashboard for webhook delivery status

### Authentication errors

1. Verify credentials in .env file
2. Check OAuth token expiry (tokens expire after ~3600 seconds)
3. Ensure client_id and client_secret match

## Testing Checklist

- [ ] BLIK payment with valid code (777123)
- [ ] BLIK payment with invalid code
- [ ] Standard payment redirect
- [ ] Payment status update via webhook
- [ ] Order status changes after payment
- [ ] Error handling for expired codes
- [ ] Error handling for cancelled payments
- [ ] Payment amount matches order price

## Additional Resources

- [PayU Documentation](https://developers.payu.com/)
- [PayU Sandbox](https://secure.snd.payu.com/)
- [BLIK Payment Guide](https://developers.payu.com/en/blik.html)

## Support

For issues with PayU integration:
1. Check server logs in `server/logs`
2. Review PayU dashboard for transaction details
3. Contact PayU support for sandbox issues
