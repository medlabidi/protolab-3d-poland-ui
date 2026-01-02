# Next Steps - Backend Integration

## Immediate Priorities

### 1. Database Schema Updates
**Location**: `SQL/` directory  
**Files to create/modify**:

#### Create delivery_options table
```sql
-- SQL/add-delivery-options.sql
CREATE TABLE delivery_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO delivery_options (name, price, description) VALUES
  ('pickup', 0.00, 'Free local pickup at our facility'),
  ('inpost', 12.00, 'InPost Paczkomat locker delivery'),
  ('dpd', 25.00, 'DPD courier home delivery');
```

#### Alter print_jobs table
```sql
-- SQL/add-delivery-columns.sql
ALTER TABLE print_jobs
  ADD COLUMN delivery_option_id UUID REFERENCES delivery_options(id),
  ADD COLUMN locker_id TEXT,
  ADD COLUMN locker_name TEXT,
  ADD COLUMN locker_address TEXT,
  ADD COLUMN shipping_address JSONB,
  ADD COLUMN model_volume_cm3 DECIMAL(10,2),
  ADD COLUMN model_weight_grams DECIMAL(10,2),
  ADD COLUMN model_dimensions JSONB;
```

### 2. Backend Order Creation Endpoint
**Location**: `server/src/controllers/order.controller.ts` (create new)

#### Required functionality:
```typescript
// POST /api/orders/create
interface CreateOrderRequest {
  fileId: string;
  material: string;
  quality: string;
  quantity: number;
  deliveryOptionId: string;
  lockerId?: string;
  lockerName?: string;
  lockerAddress?: string;
  shippingAddress?: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    postalCode: string;
  };
  modelAnalysis?: {
    volumeCm3: number;
    weightGrams: number;
    boundingBox: { x: number; y: number; z: number };
    surfaceArea: number;
  };
  estimatedPrice: number;
}

// Validation steps:
// 1. Verify file exists in temp storage
// 2. Validate delivery option exists
// 3. If InPost: validate lockerId
// 4. If DPD: validate shipping address
// 5. Calculate server-side price (don't trust client)
// 6. Move file from temp-files to print-jobs bucket
// 7. Create database record
// 8. Send confirmation email
// 9. Return order ID
```

### 3. File Upload to Supabase
**Location**: `client/src/services/upload.service.ts` (create new)

#### Upload flow:
```typescript
// 1. Upload to temp-files bucket
const uploadFile = async (file: File): Promise<string> => {
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('temp-files')
    .upload(fileName, file);
  
  if (error) throw error;
  return data.path; // Return file ID
};

// 2. Server moves to print-jobs bucket after order creation
// 3. Cleanup temp-files after 24 hours (cron job)
```

### 4. Connect Frontend to Backend
**Location**: `client/src/pages/NewPrint.tsx`

#### Update submitOrder function:
```typescript
const submitOrder = async () => {
  try {
    // 1. Upload file to Supabase
    const fileId = await uploadFile(file);
    
    // 2. Prepare order payload
    const orderPayload = {
      fileId,
      material,
      quality,
      quantity,
      deliveryOptionId: selectedDeliveryOption,
      lockerId: selectedLocker?.id,
      lockerName: selectedLocker?.name,
      lockerAddress: selectedLocker?.address,
      shippingAddress: selectedDeliveryOption === 'dpd' ? shippingAddress : undefined,
      modelAnalysis,
      estimatedPrice,
    };
    
    // 3. Create order
    const response = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    
    if (!response.ok) throw new Error('Order creation failed');
    
    const { orderId } = await response.json();
    
    // 4. Success feedback
    toast.success('Order created successfully!');
    navigate(`/orders/${orderId}`);
  } catch (error) {
    toast.error('Failed to create order');
    console.error(error);
  }
};
```

## Secondary Priorities

### 5. Email Notifications
**Location**: `server/src/services/email.service.ts`

#### Order confirmation email:
- Order ID and details
- 3D model preview image (screenshot)
- Delivery information
- Payment instructions
- Estimated completion date

### 6. Order Tracking Page
**Location**: `client/src/pages/OrderDetails.tsx` (create new)

#### Features:
- Order status timeline
- 3D model preview
- Download STL file
- Print settings summary
- Delivery tracking (if shipped)
- Contact support button

### 7. Admin Dashboard Updates
**Location**: `client/src/pages/Admin.tsx`

#### New features:
- View all orders with delivery info
- Export delivery labels
- Batch print multiple orders
- Mark orders as shipped
- InPost integration for tracking

## File Upload Requirements

### Supabase Storage Buckets
```sql
-- Create buckets if not exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('temp-files', 'temp-files', false),
  ('print-jobs', 'print-jobs', false);

-- Storage policies
CREATE POLICY "Users can upload to temp-files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'temp-files');

CREATE POLICY "Users can view their print jobs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'print-jobs' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Cleanup Cron Job
```typescript
// server/src/jobs/cleanup-temp-files.ts
// Run daily at 3 AM
// Delete files in temp-files older than 24 hours
```

## API Endpoints to Create

### Orders
- `POST /api/orders/create` - Create new order
- `GET /api/orders/:id` - Get order details
- `GET /api/orders` - List user's orders
- `PATCH /api/orders/:id/status` - Update order status (admin)
- `DELETE /api/orders/:id` - Cancel order (if not started)

### Files
- `POST /api/files/upload` - Upload file to temp storage
- `GET /api/files/:id` - Get file metadata
- `DELETE /api/files/:id` - Delete file (if order not created)

### Delivery
- `GET /api/delivery/options` - List available delivery methods
- `GET /api/delivery/inpost/lockers?city=Krakow` - Proxy to InPost API
- `POST /api/delivery/dpd/validate` - Validate DPD address

## Environment Variables to Add

```env
# server/.env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
INPOST_API_KEY=your_inpost_api_key (if required)
DPD_API_KEY=your_dpd_api_key (if required)
RESEND_API_KEY=your_resend_api_key
```

## Testing Checklist

### Frontend
- [ ] File upload to Supabase
- [ ] Order creation with pickup
- [ ] Order creation with InPost (locker selection)
- [ ] Order creation with DPD (address validation)
- [ ] Price calculation accuracy
- [ ] Error handling (network failure, invalid data)

### Backend
- [ ] File storage and retrieval
- [ ] Database schema migrations
- [ ] Order creation validation
- [ ] Email sending
- [ ] Delivery option pricing
- [ ] Server-side price calculation matches frontend

### Integration
- [ ] End-to-end order flow
- [ ] File moves from temp to permanent storage
- [ ] Email delivery
- [ ] Order appears in user's orders list
- [ ] Admin can view and manage orders

## Current Status

✅ **Completed**:
- 3D model viewer with Three.js
- Volume and weight calculation
- Material-color-price dropdown
- Delivery options UI (pickup, InPost, DPD)
- InPost locker picker with API
- DPD address form with validation
- Price calculation with all cost components
- Real-time model analysis integration

⏹️ **Pending**:
- Database schema updates
- Backend order creation API
- File upload to Supabase
- Email notifications
- Order tracking page
- Admin order management

## Time Estimates

| Task | Estimated Time |
|------|---------------|
| Database schema | 1 hour |
| Backend order API | 3 hours |
| File upload service | 2 hours |
| Email integration | 2 hours |
| Frontend integration | 2 hours |
| Order tracking page | 3 hours |
| Testing | 3 hours |
| **Total** | **16 hours** |

## Next Command to Run

After reviewing this document, run:
```bash
cd c:\Users\MED\Documents\GitHub\protolab-3d-poland-ui
psql -U postgres -d protolab -f SQL/add-delivery-options.sql
psql -U postgres -d protolab -f SQL/add-delivery-columns.sql
```

Or if using Supabase SQL Editor, copy contents of SQL files and execute there.
