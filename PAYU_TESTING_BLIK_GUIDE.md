# PayU Testing & BLIK Integration Guide

## Payment Lifecycle Understanding

### Status Flow
```
Order Created → PENDING → WAITING_FOR_CONFIRMATION → COMPLETED (or CANCELED)
```

**Important**: 
- PayU sends notifications for: **PENDING**, **WAITING_FOR_CONFIRMATION**, **COMPLETED**, **CANCELED**
- Webhooks are sent asynchronously after each status change
- System should expect 200 HTTP status response to confirm notification receipt
- If non-200 response, PayU will retry notification

### Auto-Receive Feature
- **Enabled by default**: Successful payments are automatically captured
- **Process**:
  1. Order authorized
  2. Buyer's account charged
  3. Shop balance incremented
  4. PayU calculates commission

## Buyer Data in PayU Orders

### What We Send (Current Implementation)
```typescript
buyer: {
  email: "john.doe@example.com",
  firstName: "John",
  lastName: "Doe",
  phone: "+48654111654",        // NOW INCLUDED
  language: "pl",
  delivery: {                    // NOW INCLUDED for courier/DPD
    street: "ul. Przykładowa 10/5",
    postalCode: "30-001",
    city: "Kraków",
    countryCode: "PL",
    recipientName: "John Doe",
    recipientEmail: "john.doe@example.com",
    recipientPhone: "+48654111654"
  }
}
```

### BLIK Payment Method Issue

**Problem**: When user selects BLIK as payment method, PayU shows incorrect user data on the payment confirmation page.

**Possible Causes**:
1. **Pre-filled vs Provided Data Conflict**:
   - PayU may have cached/pre-filled data from previous transactions
   - Our buyer object might not override PayU's stored data correctly
   
2. **BLIK-Specific Flow**:
   - BLIK payments may use a different confirmation flow
   - User data display might come from PayU's internal user profile, not from our API call
   
3. **Buyer Data Not Fully Propagated**:
   - The buyer.delivery object might not be used for BLIK payments
   - Phone number might not be properly formatted for BLIK interface

**Investigation Steps**:
1. Check PayU management panel for buyer data logs
2. Verify phone format matches PayU expectations (+48XXXXXXXXX)
3. Test if issue occurs with different payment methods (cards, bank transfer)
4. Compare buyer object sent vs what PayU displays on BLIK page

**Potential Solutions**:
1. **Use `extCustomerId` parameter**:
   ```typescript
   buyer: {
     extCustomerId: userId,  // Link to our user ID
     ...
   }
   ```
   This helps PayU track users across multiple payments.

2. **Add `birthDate` if available** (helps with user identification):
   ```typescript
   buyer: {
     birthDate: "2006-12-03T00:00:00.000+01:00",
     ...
   }
   ```

3. **Ensure phone format is correct**:
   - Must start with country code (+48 for Poland)
   - No spaces or special characters
   - Example: `+48654111654` (NOT `+48 654 111 654`)

## Testing Payment Scenarios

### PayU Sandbox Environment
- Production URL: `https://secure.payu.com/api/v2_1/orders`
- Sandbox URL: `https://secure.snd.payu.com/api/v2_1/orders`

### Test Card Numbers (Sandbox)

#### Successful Payment
```
Card Number: 4444 3333 2222 1111
Expiry: Any future date
CVV: Any 3 digits
```

#### Failed Payment
```
Card Number: 4444 3333 2222 2222
Expiry: Any future date
CVV: Any 3 digits
```

#### 3DS Authentication Required
```
Card Number: 4012 0010 3714 1112
Expiry: Any future date  
CVV: Any 3 digits
```

### Test BLIK Code (Sandbox)
```
BLIK Code: 777777
```
This will simulate a successful BLIK payment in sandbox.

### Testing Different Statuses

#### Test COMPLETED Status
1. Create order with test card `4444 3333 2222 1111`
2. Complete payment on PayU page
3. Wait for webhook notification with status: COMPLETED
4. Verify order.payment_status = 'paid' in database

#### Test CANCELED Status
1. Create order with test card `4444 3333 2222 2222`
2. Payment will fail automatically
3. Webhook notification with status: CANCELED
4. Verify order.payment_status = 'failed'

#### Test PENDING → WAITING → COMPLETED Flow
1. Create order with 3DS card
2. Status: PENDING (initial)
3. Complete 3DS authentication
4. Status: WAITING_FOR_CONFIRMATION
5. Bank confirms payment
6. Status: COMPLETED

### Webhook Notification Testing

#### Expected Notification for COMPLETED Order
```json
{
  "order": {
    "orderId": "LDLW5N7MF4140324GUEST000P01",
    "extOrderId": "your-order-id",
    "orderCreateDate": "2012-12-31T12:00:00",
    "customerIp": "127.0.0.1",
    "merchantPosId": "145227",
    "description": "Order description",
    "currencyCode": "PLN",
    "totalAmount": "21000",
    "buyer": {
      "email": "john.doe@example.com",
      "phone": "+48654111654",
      "firstName": "John",
      "lastName": "Doe",
      "language": "pl"
    },
    "payMethod": {
      "type": "PBL"  // or "CARD_TOKEN", "INSTALLMENTS"
    },
    "products": [...],
    "status": "COMPLETED"
  },
  "localReceiptDateTime": "2016-03-02T12:58:14.828+01:00",
  "properties": [
    {
      "name": "PAYMENT_ID",
      "value": "151471228"
    }
  ]
}
```

#### Notification Headers
```
PayU-Processing-Time: 1000
Content-Type: application/json;charset=UTF-8
Authorization: Basic MTIzNDU2Nzg6QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo=
OpenPayu-Signature: sender=checkout;signature=d47d8a771d558c29285887febddd9327;algorithm=MD5;content=DOCUMENT
```

**Signature Verification** (already implemented in api/payments/payu/notify.ts):
```typescript
const signature = calculateSignature(body + PAYU_CONFIG.secondKey);
const expectedSignature = headerSignature.split(';')[1].split('=')[1];
if (signature !== expectedSignature) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### PayU Management Panel Testing
1. Go to: https://secure.payu.com (production) or https://secure.snd.payu.com (sandbox)
2. Login with your merchant credentials
3. Navigate to **Transactions** → **Transaction Search**
4. Find your test order by `extOrderId`
5. Check:
   - Order status
   - Buyer information displayed
   - Payment method used
   - Transaction timeline

### Notification IP Whitelist
If filtering IPs, allow PayU notification servers:

**Production**:
```
185.68.12.10, 185.68.12.11, 185.68.12.12
185.68.12.26, 185.68.12.27, 185.68.12.28
```

**Sandbox**:
```
185.68.14.10, 185.68.14.11, 185.68.14.12
185.68.14.26, 185.68.14.27, 185.68.14.28
```

## Payment Success Page Improvements

### Previous Issue
- Page got stuck showing "Payment is being processed..." toast repeatedly
- No retry limit, could loop indefinitely
- Toast appeared multiple times

### Current Fix
```typescript
const MAX_RETRIES = 10; // 30 seconds total
const [retryCount, setRetryCount] = useState(0);

// In checkPaymentStatus:
if (retryCount >= MAX_RETRIES) {
  setStatus('success'); // Assume success after max retries
  toast.warning('Payment verification taking longer than expected...');
} else {
  setRetryCount(prev => prev + 1);
  setTimeout(() => checkPaymentStatus(), 3000);
}
```

**Benefits**:
- Toast only shows once on first check
- Maximum 10 retries (30 seconds)
- After max retries, shows "check your order status" message
- Prevents infinite loop and duplicate toasts

## Checkout Page Improvements

### Quality Display Logic

#### Standard Mode (Preset Quality)
- **Draft**: Layer 0.3mm, Infill 10% → Shows "Draft"
- **Standard**: Layer 0.2mm, Infill 20% → Shows "Standard" 
- **High**: Layer 0.15mm, Infill 50% → Shows "High"
- **Ultra High**: Layer 0.1mm, Infill 100% → Shows "Ultra High"

**Display**: Only shows quality name, hides technical parameters

#### Advanced Mode (Custom Parameters)
- Any other layer height/infill combination
- **Display**: Shows "Layer Height: X.Xmm" and "Infill: X%"

### Removed Fields
- ❌ Weight (internal manufacturing detail)
- ❌ Print Time (estimated, not guaranteed)

**Rationale**: Keep checkout clean and focused on what customer ordered, not production specifics.

## Debugging BLIK User Data Issue

### Step-by-Step Investigation

1. **Check Console Logs**:
   ```bash
   # Look for PayU order payload in browser console
   [PAYU-CREATE] Order payload: { buyer: { ... } }
   ```

2. **Verify Phone Format**:
   - Must be international format: `+48XXXXXXXXX`
   - No spaces, dashes, or parentheses
   - Check user profile and shipping_address both have phone

3. **Test with Different Payment Methods**:
   - Try with card payment → Does it show correct data?
   - Try with bank transfer → Does it show correct data?
   - Try with BLIK → Does it show wrong data?
   
   If only BLIK shows wrong data, it's BLIK-specific issue.

4. **Check PayU Management Panel**:
   - Login to PayU dashboard
   - Find the test transaction
   - View buyer details in transaction details
   - Compare with what was sent in API request

5. **Contact PayU Support**:
   If buyer data is correctly sent but BLIK page shows wrong info:
   - Provide PayU with `orderId` from transaction
   - Reference `Correlation-Id` header from API response
   - Describe discrepancy between API request and BLIK display
   - Ask about BLIK-specific buyer data handling

## Next Steps

1. ✅ **Fixed**: Checkout page quality display (standard vs advanced)
2. ✅ **Fixed**: Removed weight and print time from checkout
3. ✅ **Fixed**: Payment success page retry loop
4. 🔄 **To Investigate**: BLIK showing wrong user data
   - Test in PayU sandbox with BLIK code: 777777
   - Check if phone/address displays correctly
   - Document exact discrepancy
   - Contact PayU support if needed
5. 🔄 **To Test**: Different payment scenarios (see Testing Payment Scenarios above)

## References

- [PayU Payment Lifecycle](https://developers.payu.com/europe/docs/payment-flows/lifecycle/)
- [PayU Order API](https://developers.payu.com/europe/docs/payment-flows/auth-and-order/)
- [PayU Testing Guide](https://developers.payu.com/europe/docs/testing/)
- [PayU Notifications](https://developers.payu.com/europe/docs/payment-flows/lifecycle/#notifications)
