# Separate Print Jobs and Design Assistance Tables

## 📋 Overview

The ProtoLab platform now uses **two separate database tables**:

1. **`print_jobs`** - 3D printing orders (STL file upload → print → deliver)
2. **`design_requests`** - Design assistance requests (idea → design → optional print)

## 🎯 Why Separate Tables?

### Benefits
✅ **Better Performance** - Optimized queries for each type  
✅ **Clearer Data Model** - No nullable fields or type confusion  
✅ **Easier Maintenance** - Independent schema evolution  
✅ **Type Safety** - Clear TypeScript interfaces for each  
✅ **Specialized Workflows** - Different status flows for each  

### Before (Single Table)
```
orders
├── id, user_id, file_url, file_name
├── Print fields: material, color, layer_height, infill...
├── Design fields: idea_description, usage_type... (mostly NULL)
└── order_type: 'print' | 'design'
```

### After (Separate Tables)
```
print_jobs                          design_requests
├── id, user_id                     ├── id, user_id
├── file_url, file_name             ├── project_name
├── material, color                 ├── idea_description
├── layer_height, infill            ├── usage_type
├── quantity, status                ├── design_status
└── shipping_method                 └── request_chat
```

## 📊 Database Schema

### print_jobs Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Customer reference |
| `file_url` | TEXT | STL file URL |
| `file_name` | TEXT | File name |
| `material` | VARCHAR(50) | PLA, ABS, PETG, etc. |
| `color` | VARCHAR(50) | Material color |
| `layer_height` | NUMERIC | 0.1, 0.2, 0.3 mm |
| `infill` | INTEGER | 0-100% |
| `quantity` | INTEGER | Number of prints |
| `material_weight` | NUMERIC | Grams |
| `print_time` | NUMERIC | Hours |
| `price` | NUMERIC | Total price (PLN) |
| `paid_amount` | NUMERIC | Amount paid |
| `payment_status` | VARCHAR | paid, on_hold, refunding, refunded |
| `status` | VARCHAR | submitted, in_queue, printing, finished, delivered |
| `shipping_method` | VARCHAR | pickup, inpost, dpd, courier |
| `shipping_address` | TEXT | Delivery address |
| `tracking_code` | VARCHAR | Shipping tracking number |
| `project_name` | TEXT | Optional project name |
| `parent_design_request_id` | UUID | Links to design_requests if created from design |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |

### design_requests Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Customer reference |
| `project_name` | TEXT | Project name |
| `idea_description` | TEXT | What customer wants designed |
| `usage_type` | VARCHAR | mechanical, decorative, functional, prototype, other |
| `usage_details` | TEXT | Additional usage info |
| `approximate_dimensions` | VARCHAR | Size requirements |
| `desired_material` | VARCHAR | Preferred material for printing |
| `attached_files` | JSONB | Reference files (images, PDFs) |
| `reference_images` | JSONB | Reference image URLs |
| `request_chat` | BOOLEAN | Customer wants to chat with admin |
| `design_status` | VARCHAR | pending, in_review, in_progress, completed, cancelled |
| `admin_design_file` | TEXT | 3D file created by admin |
| `admin_notes` | TEXT | Admin notes |
| `estimated_price` | NUMERIC | Initial price estimate |
| `final_price` | NUMERIC | Final agreed price |
| `paid_amount` | NUMERIC | Amount paid |
| `payment_status` | VARCHAR | pending, paid, on_hold, refunded |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |
| `completed_at` | TIMESTAMP | When design was completed |

## 🔄 Migration

### Step 1: Run Migration SQL

```bash
# In Supabase SQL Editor
# Run: SQL/separate-print-design-tables.sql
```

**What it does:**
1. ✅ Creates `print_jobs` table
2. ✅ Creates `design_requests` table
3. ✅ Creates indices for performance
4. ✅ Migrates existing data from `orders` table
5. ✅ Creates `all_orders` view for compatibility
6. ✅ Sets up Row Level Security (RLS)

### Step 2: Restart Server

```bash
cd server
npm run dev
```

## 💻 Code Usage

### Backend - Create Print Job

```typescript
import { printJobService } from './services/printJob.service';

const printJob = await printJobService.createPrintJob(userId, {
  fileName: 'model.stl',
  fileUrl: 'https://...',
  material: 'PLA',
  color: 'Blue',
  layerHeight: 0.2,
  infill: 20,
  quantity: 1,
  shippingMethod: 'pickup',
  price: 45.00,
});
```

### Backend - Create Design Request

```typescript
import { designRequestService } from './services/designRequest.service';

const designRequest = await designRequestService.createDesignRequest(userId, {
  projectName: 'Custom Phone Holder',
  ideaDescription: 'I need a phone holder for my car dashboard',
  usageType: 'functional',
  usageDetails: 'Must hold iPhone 14 Pro securely',
  approximateDimensions: '100mm x 60mm x 40mm',
  desiredMaterial: 'PETG',
  requestChat: true,
  attachedFiles: ['https://.../sketch.jpg'],
});
```

### Backend - Get All Orders (Admin Dashboard)

```typescript
import { orderService } from './services/order.service';

// Get combined view (print jobs + design requests)
const allOrders = await orderService.getAllOrdersCombined();

// Get only print jobs
const printJobs = await orderService.getOrdersByType('print');

// Get only design requests
const designRequests = await orderService.getOrdersByType('design');
```

### Frontend - Submit Print Job

```typescript
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    orderType: 'print',
    fileName: 'model.stl',
    fileUrl: fileUrl,
    material: 'PLA',
    color: 'Blue',
    layerHeight: 0.2,
    infill: 20,
    quantity: 1,
    shippingMethod: 'pickup',
    price: 45.00,
  }),
});
```

### Frontend - Submit Design Request

```typescript
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    orderType: 'design',
    projectName: 'Custom Phone Holder',
    ideaDescription: 'I need a phone holder for my car',
    usageType: 'functional',
    approximateDimensions: '100mm x 60mm x 40mm',
    desiredMaterial: 'PETG',
    requestChat: true,
  }),
});
```

## 📡 API Endpoints

### Create Order (Unified - Routes Based on Type)
```
POST /api/orders
Body: { orderType: 'print' | 'design', ... }
```

### Get All Orders (Admin)
```
GET /api/admin/orders
Returns: Combined array of print jobs + design requests
```

### Get Print Jobs Only
```
GET /api/admin/orders?type=print
Returns: Array of print jobs
```

### Get Design Requests Only
```
GET /api/admin/orders?type=design
Returns: Array of design requests
```

### Get User's Orders
```
GET /api/orders
Returns: User's print jobs + design requests combined
```

## 🔍 Querying

### SQL - Get All Print Jobs

```sql
SELECT * FROM print_jobs 
WHERE is_archived = FALSE
ORDER BY created_at DESC;
```

### SQL - Get Pending Design Requests

```sql
SELECT * FROM design_requests 
WHERE design_status = 'pending'
AND is_archived = FALSE
ORDER BY created_at ASC;
```

### SQL - Get Design Requests Needing Chat

```sql
SELECT * FROM design_requests 
WHERE request_chat = TRUE
AND design_status IN ('pending', 'in_review')
ORDER BY created_at ASC;
```

### SQL - Get Print Jobs from Design Requests

```sql
SELECT 
  pj.*,
  dr.project_name as original_design_name,
  dr.idea_description
FROM print_jobs pj
JOIN design_requests dr ON pj.parent_design_request_id = dr.id
ORDER BY pj.created_at DESC;
```

### SQL - Combined View (Compatibility)

```sql
-- Use the all_orders view for unified queries
SELECT * FROM all_orders 
WHERE order_type = 'print'
ORDER BY created_at DESC;
```

## 🎨 Frontend Integration

### Admin Dashboard - Fetch Orders

```typescript
// AdminOrders.tsx
useEffect(() => {
  const fetchOrders = async () => {
    const response = await fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setOrders(data.orders); // Combined array
  };
  fetchOrders();
}, []);
```

### Filter by Type

```typescript
// Show only print jobs
const printJobs = orders.filter(o => o.order_type === 'print');

// Show only design requests
const designRequests = orders.filter(o => o.order_type === 'design');
```

### Display Appropriate Fields

```tsx
{order.order_type === 'print' ? (
  <div>
    <p>Material: {order.material}</p>
    <p>Color: {order.color}</p>
    <p>Status: {order.status}</p>
  </div>
) : (
  <div>
    <p>Idea: {order.idea_description}</p>
    <p>Usage: {order.usage_type}</p>
    <p>Design Status: {order.design_status}</p>
  </div>
)}
```

## ⚙️ Configuration

### Environment Variables (No Changes Needed)

The same `DATABASE_URL` / Supabase config works for both tables.

## 🧪 Testing

### Test Print Job Creation

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderType": "print",
    "fileName": "test.stl",
    "fileUrl": "https://...",
    "material": "PLA",
    "color": "Red",
    "layerHeight": 0.2,
    "infill": 20,
    "quantity": 1,
    "shippingMethod": "pickup",
    "price": 30.00
  }'
```

### Test Design Request Creation

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderType": "design",
    "projectName": "Test Design",
    "ideaDescription": "Test description",
    "usageType": "functional",
    "requestChat": true
  }'
```

## 📁 Files Created/Modified

### New Files
- `SQL/separate-print-design-tables.sql` - Migration script
- `server/src/models/PrintJob.ts` - Print job model
- `server/src/models/DesignRequest.ts` - Design request model
- `server/src/services/printJob.service.ts` - Print job service
- `server/src/services/designRequest.service.ts` - Design request service
- `docs/SEPARATE_TABLES_GUIDE.md` - This guide

### Modified Files
- `server/src/services/order.service.ts` - Routes to appropriate service
- `server/src/types/index.ts` - Added new types
- `client/src/types/index.ts` - Added new types

## 🚨 Breaking Changes

### ⚠️ Important

**The old `orders` table is NOT deleted**. It's renamed to `orders_old_backup` after you uncomment the lines at the end of the migration script.

**If you have existing code** that directly queries the `orders` table:
1. Update to use `print_jobs` or `design_requests`
2. Or use `all_orders` view for compatibility
3. Or use the `orderService.getAllOrdersCombined()` method

## ✅ Checklist

- [ ] Run migration SQL in Supabase
- [ ] Verify both tables created successfully
- [ ] Check data migrated correctly
- [ ] Restart backend server
- [ ] Test creating print job
- [ ] Test creating design request
- [ ] Test admin dashboard shows both types
- [ ] Test user dashboard shows their orders
- [ ] Update any direct database queries in code

---

**Migration Date:** January 11, 2026  
**Migration Script:** `SQL/separate-print-design-tables.sql`  
**Status:** ✅ Ready for production
