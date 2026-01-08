# BLIK Testing Guide - PayU Sandbox

## Important: Sandbox Test Codes

In PayU's **sandbox environment**, BLIK codes have specific behaviors:

### Test Codes for Different Scenarios:

| Code | Behavior | Expected Result |
|------|----------|----------------|
| `777123` | ✅ Positive authorization (any 6 digits starting with 777) | SUCCESS - Payment completes |
| `500500` | ❌ Negative authorization | Payment fails with error |
| `200201` | ✅ Positive authorization + token registration | SUCCESS with token saved |
| `700701` | ⏰ BLIK code expired | Error: Code has expired |
| `700702` | 🚫 BLIK code cancelled | Error: Code was cancelled |
| `700703` | ♻️ BLIK code already used | Error: Code already used |

### Why Was Everything Showing as Successful?

**Problem:** In sandbox, any 6-digit code starting with `777` (like `777000`, `777999`, `777654`) is treated as a valid payment and returns `SUCCESS` status.

**Solution:** The code has been updated to:
1. Use correct PayU BLIK format: `type: "BLIK_AUTHORIZATION_CODE"` with `value: "code"`
2. Check PayU's response `status` field before redirecting
3. Only show success if status is `SUCCESS` or `WAITING_FOR_CONFIRMATION`
4. Show error message if status indicates failure

## How to Test Different Scenarios

### Test Successful Payment:
- Enter code: `777123` (or any `777xxx`)
- Expected: Success message → redirect to payment success page

### Test Failed Payment:
- Enter code: `500500`
- Expected: Error message "BLIK payment failed. Please check your code and try again."

### Test Expired Code:
- Enter code: `700701`
- Expected: Error about expired code

### Test Cancelled Code:
- Enter code: `700702`
- Expected: Error about cancelled code

## PayU Response Statuses

When creating a BLIK payment order, PayU returns:

```json
{
  "status": {
    "statusCode": "SUCCESS",
    "statusDesc": "Request completed successfully"
  },
  "orderId": "...",
  "redirectUri": "...",
  "iframeAllowed": false
}
```

### Possible Status Codes:
- `SUCCESS` - Payment completed immediately (rare with BLIK)
- `WAITING_FOR_CONFIRMATION` - Waiting for user to confirm in banking app
- `ERROR_VALUE_INVALID` - Invalid BLIK code format
- Other error codes for various failure scenarios

## Implementation Details

### Frontend (PaymentPage.tsx)
```typescript
// Correct BLIK format
paymentData.payMethods = {
  payMethod: {
    type: 'BLIK_AUTHORIZATION_CODE',
    value: blikCode, // 6-digit code
  }
};

// Check status before redirecting
if (data.status === 'SUCCESS' || data.status === 'WAITING_FOR_CONFIRMATION') {
  // Proceed to success page
} else {
  // Show error
}
```

### Backend (api/payments/payu/create.ts)
```typescript
// Returns full PayU response
return res.status(200).json({
  success: true,
  redirectUri: payuResult.redirectUri,
  status: payuResult.status,        // ← Important!
  statusDesc: payuResult.statusDesc, // ← Error description
  statusCode: payuResult.statusCode,
  orderId: payuResult.orderId,
});
```

## Production vs Sandbox

⚠️ **Important:** In production environment:
- Real BLIK codes from banking apps will be used
- Codes are 6 digits and expire after a few minutes
- User must confirm payment in their banking app
- No test codes will work

## Next Steps

1. ✅ Test with code `500500` to verify errors show correctly
2. ✅ Test with code `777123` to verify success flow works
3. ✅ Test with code `700701` to verify expired code handling
4. 🔄 When moving to production, update PayU credentials
5. 🔄 Test with real banking app BLIK codes

## References

- [PayU BLIK Documentation](https://developers.payu.com/europe/docs/payment-solutions/blik/)
- [PayU BLIK Testing Guide](https://developers.payu.com/europe/docs/payment-solutions/blik/testing/)
- [PayU Order API](https://developers.payu.com/europe/api/#tag/Order/operation/create-an-order)
