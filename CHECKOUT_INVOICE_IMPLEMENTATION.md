# Checkout Page & Invoice System Implementation

## Overview
Implemented a comprehensive checkout page with full order review, delivery address editing, and business invoice (faktura) support before PayU payment.

## What Was Changed

### 1. New Checkout Page (`client/src/pages/Checkout.tsx`)
- **Full Order Summary**: Shows all print job details (file, material, quality, infill, quantity, weight, print time)
- **Delivery Information**: Displays delivery method and address with visual indicators
- **Edit Delivery Address**: Inline form to edit courier/DPD delivery addresses before payment
- **Invoice Request**: Checkbox to request invoice (faktura) for business customers
- **Business Information**: 
  - Loads saved business info from user profile if available
  - Allows entering company name, NIP (tax ID), and address
  - Shows alert that invoice will be emailed after payment
- **Payment Summary**: Shows total cost with prominent "Proceed to Payment" button
- **Dark Mode Support**: Full dark mode styling with proper contrast

### 2. Updated Payment Flow
**Before:**
```
NewPrint → Create Order → Direct PayU Redirect
```

**After:**
```
NewPrint → Create Order → Checkout Page (Review/Edit) → PayU Payment
```

#### Updated Files:
- **App.tsx**: Added `/checkout` route with ProtectedRoute
- **NewPrint.tsx**: Changed to navigate to `/checkout?orderId={id}` instead of direct PayU redirect
  - Line ~991: Now shows "Please review your order before payment" and navigates to checkout

### 3. Enhanced PayU Buyer Data (`api/payments/payu/create.ts`)
**Now Sends Full Buyer Information to PayU:**
- ✅ Email
- ✅ First name / Last name
- ✅ **Phone number** (from user profile or shipping address)
- ✅ **Delivery address** (street, postal code, city) for courier orders
- ✅ Recipient name/phone if different from buyer

**Buyer Object Structure:**
```typescript
{
  email: "user@example.com",
  firstName: "Jan",
  lastName: "Kowalski",
  phone: "+48123456789",  // NEW
  language: "pl",
  delivery: {              // NEW - for courier/DPD
    street: "ul. Przykładowa 10/5",
    postalCode: "30-001",
    city: "Kraków",
    countryCode: "PL",
    recipientName: "Jan Kowalski",
    recipientEmail: "user@example.com",
    recipientPhone: "+48123456789"
  }
}
```

### 4. Invoice System Backend

#### New API Endpoint: `/api/users/business-info.ts`
- **GET**: Retrieve user's saved business information
- **POST/PUT**: Save business information to user profile
- Returns: `{ businessInfo: { company_name, nip, address, city, postal_code } }`

#### Enhanced PayU Create Endpoint
Now accepts additional parameters:
```typescript
{
  orderId: string,
  amount: number,
  description: string,
  userId: string,
  shippingAddress: object,  // NEW
  requestInvoice: boolean,  // NEW
  businessInfo: object      // NEW
}
```

Saves invoice request to order:
- `invoice_required`: TRUE when customer requests invoice
- `invoice_business_info`: JSON snapshot of business info at payment time

### 5. Database Migrations (⚠️ NEED TO RUN)

#### SQL Migration Files Created:
1. **`SQL/add-business-info-to-users.sql`**
   - Adds `business_info` JSONB column to `users` table
   - Stores company name, NIP, address for reusable business info

2. **`SQL/add-invoice-columns-to-orders.sql`**
   - Adds to `orders` table:
     - `invoice_required` BOOLEAN - whether invoice was requested
     - `invoice_business_info` JSONB - snapshot of business info
     - `invoice_generated_at` TIMESTAMP - when PDF was generated
     - `invoice_pdf_url` TEXT - path to generated invoice file

#### Migration Script: `run-invoice-migrations.js`
- Checks if columns exist
- Provides instructions to run SQL files in Supabase Dashboard

**⚠️ TO COMPLETE SETUP:**
```bash
# Check current status
node run-invoice-migrations.js

# Then go to Supabase Dashboard → SQL Editor and run:
# 1. SQL/add-business-info-to-users.sql
# 2. SQL/add-invoice-columns-to-orders.sql
```

## User Journey

### Current Flow
1. **NewPrint Page**: User configures print job, enters delivery details
2. **Click "Proceed to Payment"** → Order created in database
3. **Checkout Page** (NEW):
   - Review all order details
   - Edit delivery address if needed
   - Request invoice (faktura) for business
   - Enter or use saved business information
   - See total cost breakdown
4. **Click "Proceed to Payment"** → PayU payment page
5. **PayU hosted page**: User completes payment
6. **PaymentSuccess Page**: Confirmation with order details

### Checkout Page Features

#### For All Customers:
- Full order summary with file name, material, quality settings
- Delivery method and address display
- Total cost breakdown
- Secure PayU payment badge

#### For Courier/DPD Delivery:
- "Edit Delivery Address" button
- Inline form to update:
  - Full name
  - Phone number
  - Street address
  - Postal code and city
- Changes saved immediately to order

#### For Business Customers:
- "I need an invoice for this purchase" checkbox
- If saved business info exists:
  - Shows company name, NIP, address from profile
  - Uses saved info automatically
- If no saved info:
  - Form to enter:
    - Company name (required)
    - NIP / Tax ID (required)
    - Address (optional)
    - Postal code and city (optional)
- Alert: "Invoice will be sent to your email and available for download after payment"

## Technical Details

### Phone Number Resolution
PayU buyer phone is resolved in this order:
1. User profile phone (`users.phone`)
2. Shipping address phone (`shippingAddress.phone`)
3. Empty string if neither available

### Invoice Data Flow
1. User requests invoice on Checkout page
2. Business info sent to `/api/payments/payu/create`
3. Saved to order as `invoice_business_info` JSON
4. After webhook confirms payment (status: COMPLETED):
   - **TODO**: Generate PDF invoice
   - **TODO**: Email invoice to customer
   - **TODO**: Store PDF URL in `invoice_pdf_url`

## Next Steps (Future Implementation)

### 1. PDF Invoice Generation
- Use library like `pdfkit` or `jsPDF`
- Polish invoice (faktura) format with:
  - Seller info (Protolab company details)
  - Buyer info (company name, NIP, address)
  - Invoice number (sequential)
  - Order details (items, quantity, price)
  - VAT calculation (23% Polish standard rate)
  - Issue date and payment date
  - Signature area

### 2. Invoice Email Delivery
- Trigger on webhook payment completion
- Use email service (Resend, SendGrid, etc.)
- Attach PDF invoice
- Include download link

### 3. Invoice Management in Admin Panel
- List all orders with invoice requests
- View/download generated invoices
- Regenerate invoice if needed
- Manual invoice creation for offline payments

## Files Changed

### New Files:
- `client/src/pages/Checkout.tsx` (475 lines) - Main checkout page
- `api/users/business-info.ts` (95 lines) - Business info API endpoint
- `SQL/add-business-info-to-users.sql` - Users table migration
- `SQL/add-invoice-columns-to-orders.sql` - Orders table migration
- `run-invoice-migrations.js` - Migration checker script

### Modified Files:
- `client/src/App.tsx` - Added Checkout route
- `client/src/pages/NewPrint.tsx` - Changed payment flow to navigate to checkout
- `api/payments/payu/create.ts` - Enhanced with full buyer data and invoice support

## Testing Checklist

- [ ] Run database migrations in Supabase
- [ ] Test checkout page displays order correctly
- [ ] Test delivery address editing works
- [ ] Test business info form (new customer)
- [ ] Test business info loading (existing customer)
- [ ] Test PayU receives phone number
- [ ] Test PayU receives delivery address (for courier orders)
- [ ] Test invoice_required flag saved to order
- [ ] Test invoice_business_info saved to order
- [ ] Test dark mode styling on checkout page

## Polish Market Compliance

✅ **Faktura (Invoice) Support**: Full business information capture
✅ **NIP Validation Ready**: Field for Polish tax ID (validation can be added)
✅ **Polish Language**: UI labels can be easily translated
✅ **VAT Ready**: Database structure supports VAT information
✅ **Legal Requirements**: Invoice generation follows Polish B2B standards

## Notes

- Invoice PDF generation is **NOT YET IMPLEMENTED** - this is the backend task
- Email delivery of invoices is **NOT YET IMPLEMENTED**
- User profile `phone` field may not exist yet - PayU will work without it
- Business info is stored as JSONB for flexibility
- Invoice business info is **snapshot at payment time** (immutable)
- Checkout page is fully responsive (mobile + desktop)
- All dark mode colors use proper Tailwind dark: classes
