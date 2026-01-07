# Checkout & Invoice - Quick Reference

## 🚀 To Complete Setup

### 1. Run Database Migrations
```bash
# Check current status
node run-invoice-migrations.js
```

**Then in Supabase Dashboard → SQL Editor, run:**
1. `SQL/add-business-info-to-users.sql`
2. `SQL/add-invoice-columns-to-orders.sql`

### 2. Test the Flow
1. Navigate to `/new-print`
2. Upload file, configure print settings
3. Click "Proceed to Payment"
4. **NEW**: Should go to `/checkout?orderId={id}`
5. Review order details on checkout page
6. Try editing delivery address (for courier/DPD)
7. Try requesting invoice (check the checkbox)
8. Click "Proceed to Payment" → Should go to PayU

## 📋 What Changed

### User Flow
```
BEFORE: NewPrint → PayU (direct)
AFTER:  NewPrint → Checkout (review) → PayU
```

### PayU Buyer Data
```
BEFORE: email, firstName, lastName only
AFTER:  + phone, delivery address, recipient info
```

### New Features
- ✅ Full order review before payment
- ✅ Edit delivery address inline
- ✅ Request invoice (faktura) for business
- ✅ Save/reuse business information
- ✅ Enhanced buyer data to PayU

## 🔧 Key Files

| File | Purpose |
|------|---------|
| `client/src/pages/Checkout.tsx` | Main checkout page component |
| `api/users/business-info.ts` | Save/load business information |
| `api/payments/payu/create.ts` | Enhanced with phone, address, invoice |
| `client/src/pages/NewPrint.tsx` | Navigates to checkout instead of PayU |

## 📊 Database Schema

### users table
```sql
business_info JSONB  -- { company_name, nip, address, city, postal_code }
```

### orders table
```sql
invoice_required BOOLEAN              -- Customer requested invoice
invoice_business_info JSONB           -- Business info snapshot
invoice_generated_at TIMESTAMP        -- When PDF was created (future)
invoice_pdf_url TEXT                  -- PDF file location (future)
```

## 🎯 Next Steps (Future Work)

1. **PDF Invoice Generation**
   - Use pdfkit or similar
   - Polish faktura format
   - VAT calculation (23%)
   
2. **Email Delivery**
   - Send invoice after payment
   - Attach PDF + download link
   
3. **Admin Panel**
   - View all invoice requests
   - Download/regenerate invoices

## 🐛 Troubleshooting

### Checkout page not found
- Make sure you imported and added route in App.tsx
- Route: `/checkout` with ProtectedRoute

### PayU not receiving phone
- Check user profile has `phone` field
- Or ensure shipping address has `phone`
- Phone resolution: user.phone → shippingAddress.phone → empty

### Business info not saving
- Run database migration first
- Check `users.business_info` column exists
- Check API endpoint `/api/users/business-info`

### Invoice not saved to order
- Run database migration first
- Check `orders.invoice_required` column exists
- Check PayU create endpoint receives `requestInvoice` param

## 📱 UI Components Used

- Card, CardContent, CardHeader, CardTitle
- Button, Input, Label, Checkbox
- Alert, AlertDescription
- Separator
- Icons: ArrowLeft, Package, MapPin, CreditCard, FileText, etc.

## 🎨 Dark Mode

All checkout page elements have dark mode support:
- `dark:bg-gray-800` - Cards
- `dark:bg-gray-900` - Page background
- `dark:text-gray-100` - Primary text
- `dark:text-gray-300` - Secondary text
- `dark:border-gray-700` - Borders

## 🔑 Key Features

### Order Review
- File name, material, color
- Quality settings (layer height, infill)
- Quantity
- Weight and print time
- Delivery method and address

### Address Editing
- Only for courier/DPD delivery
- Inline form (no modal)
- Updates order immediately
- Saves changes before PayU redirect

### Invoice Request
- Checkbox to request faktura
- Loads saved business info if exists
- Manual entry if no saved info
- Requires: company name, NIP
- Optional: address, city, postal code

### Payment
- Sticky payment summary sidebar
- Total cost display
- "Proceed to Payment" → calls PayU API
- Redirects to PayU hosted page
- Returns to /payment-success

## 🌍 Polish Market Features

- NIP (Tax ID) field
- Faktura (invoice) terminology
- Polish addresses (ul., miasto, kod pocztowy)
- VAT-ready structure
- PLN currency
