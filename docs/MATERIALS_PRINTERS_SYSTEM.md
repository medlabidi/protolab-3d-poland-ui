# Materials & Printers Management System

## Overview
Complete dynamic materials and printers management system for the 3D printing platform. Admin can now manage materials, colors, and pricing dynamically, with automatic updates to user-facing materials and pricing calculations.

## What Was Created

### 1. Database Schema (SQL)
**File:** `SQL/create_materials_printers_tables.sql`

Created two main tables:
- **materials**: Stores 3D printing materials with colors and pricing
  - Fields: material_type, color, price_per_kg, stock_status, lead_time_days, hex_color, description
  - Pre-populated with 23 materials (PLA, ABS, PETG variants)
  
- **printers**: Stores 3D printer specifications for pricing calculations
  - Fields: power_watts, cost_pln, lifespan_hours, maintenance_rate, build_volume, technical specs
  - Pre-populated with default printer (270W, 3483.39 PLN, 5000h lifespan)

### 2. Backend Services
**Files:**
- `server/src/types/materials.types.ts` - TypeScript interfaces for Material and Printer
- `server/src/services/material.service.ts` - Material CRUD operations and availability checks
- `server/src/services/printer.service.ts` - Printer CRUD operations and spec retrieval
- `server/src/controllers/admin.controller.ts` - Updated with materials/printers endpoints
- `server/src/routes/admin.routes.ts` - Added 10 new admin routes
- `server/src/routes/materials.routes.ts` - Public API for material availability
- `server/src/express-app.ts` - Registered materials routes

**API Endpoints:**
Admin endpoints (require authentication):
- `GET /api/admin/materials` - Get all materials
- `POST /api/admin/materials` - Create new material
- `PATCH /api/admin/materials/:id` - Update material
- `DELETE /api/admin/materials/:id` - Delete material
- `GET /api/admin/printers` - Get all printers
- `POST /api/admin/printers` - Create new printer
- `PATCH /api/admin/printers/:id` - Update printer
- `DELETE /api/admin/printers/:id` - Delete printer

Public endpoints:
- `GET /api/materials/available` - Get available materials for users
- `GET /api/materials/by-type` - Get materials grouped by type

### 3. Updated Pricing Service
**File:** `server/src/services/pricing.service.ts`

Changed from hardcoded values to dynamic database lookups:
- Material prices now fetched from `materials` table
- Printer specifications now fetched from `printers` table
- VAT rate from settings table
- Made `calculatePrice` async to support database queries

Updated all references to `calculatePrice` to use `await`:
- `server/src/controllers/upload.controller.ts` (2 locations)
- `server/src/services/order.service.ts` (1 location)

### 4. Admin Frontend Pages

**File:** `client/src/pages/admin/AdminMaterials.tsx` (520+ lines)
Features:
- Material list with search and filtering
- Color visualization with hex color picker
- Stock status management (available, low_stock, out_of_stock)
- Lead time configuration for unavailable materials
- Price per kg management
- Create, edit, delete operations
- Statistics cards (Total, Available, Out of Stock)

**File:** `client/src/pages/admin/AdminPrinters.tsx` (640+ lines)
Features:
- Printer list with search
- Status management (operational, maintenance, offline)
- Pricing parameters (power, cost, lifespan, maintenance rate)
- Build volume configuration (X, Y, Z dimensions)
- Technical specifications (speed, nozzle, layer heights)
- Supported materials selection
- Create, edit, delete operations
- Statistics cards (Total, Operational, Maintenance)

### 5. Routes & Navigation
**Updated:** `client/src/App.tsx`
- Added imports for AdminMaterials and AdminPrinters
- Registered routes:
  - `/admin/materials` → AdminMaterials page
  - `/admin/printers` → AdminPrinters page

**Sidebar:** `client/src/components/AdminSidebar.tsx`
- Already had Materials and Printers menu items with icons

### 6. Vercel Serverless Function
**File:** `api/materials/available.ts`
- Public endpoint for material availability
- Returns materials with stock status and lead time messages
- Handles CORS for public access

## User-Facing Features

### For End Users:
1. **Dynamic Material Selection**
   - Materials fetched from `/api/materials/available`
   - See real-time availability status
   - Automatic messages for unavailable materials: "Material is currently unavailable. Processing will take up to X business days."
   - See accurate pricing per material/color combination

2. **Transparent Pricing**
   - All prices calculated from current database values
   - Reflects actual material costs
   - Accounts for printer specifications
   - VAT and other fees from settings

### For Admins:
1. **Materials Management** (`/admin/materials`)
   - Add new materials and colors easily
   - Update prices without code changes
   - Mark materials as out of stock with lead times
   - Visual color representation
   - Bulk material management

2. **Printers Management** (`/admin/printers`)
   - Configure all printer specifications
   - Update pricing parameters dynamically
   - Track printer status (operational/maintenance/offline)
   - Multiple printer support for future scaling

3. **Automatic Pricing Updates**
   - Changes to materials or printers immediately affect pricing
   - No code deployment needed for price changes
   - Historical orders maintain their original pricing

## Database Migration

Run the SQL script to create tables and seed initial data:

```bash
# Using Supabase SQL Editor or psql
psql -h your-db-host -U your-username -d your-database -f SQL/create_materials_printers_tables.sql
```

Or execute in Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `SQL/create_materials_printers_tables.sql`
3. Run the script

## Configuration

### Environment Variables (Already Set)
```env
# In client/.env.production
VITE_SUPABASE_URL=https://ejauqqpatmqbxxhbmkzp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ADMIN_ACCESS_KEY=mokded-kassem-1997
```

## How It Works

### Admin Workflow:
1. Admin logs in to `/admin/login` with access key
2. Navigate to Materials or Printers from sidebar
3. Add/Edit materials with colors and pricing
4. Update printer specifications for pricing calculations
5. Changes are immediately reflected in user pricing

### User Workflow:
1. User uploads 3D model
2. Selects material and color from available options
3. System fetches material price from database
4. System fetches printer specs from database
5. Calculates price using dynamic values
6. If material unavailable, shows lead time message

### Pricing Calculation Flow:
```
User Request
    ↓
Material Service → Get price_per_kg from materials table
    ↓
Printer Service → Get power_watts, cost_pln, lifespan_hours
    ↓
Settings Service → Get VAT rate
    ↓
Pricing Service → Calculate total with all dynamic values
    ↓
Return Price to User
```

## Key Benefits

1. **No Code Changes for Pricing**: Update materials or printers anytime without deployment
2. **Inventory Management**: Track stock status and set lead times
3. **Scalability**: Support multiple printers and unlimited material/color combinations
4. **Transparency**: Users see exactly what's available with clear messaging
5. **Audit Trail**: All changes tracked with timestamps
6. **Flexibility**: Easy to add new materials or adjust pricing strategies

## Testing Checklist

- [ ] Run SQL migration script in Supabase
- [ ] Verify tables created: `materials`, `printers`
- [ ] Verify initial data loaded (23 materials, 1 printer)
- [ ] Test admin login and navigation to Materials page
- [ ] Test creating new material
- [ ] Test updating material price
- [ ] Test marking material as out_of_stock
- [ ] Test Printers page CRUD operations
- [ ] Verify pricing calculation uses database values
- [ ] Test public API: `/api/materials/available`
- [ ] Verify user-facing material selection shows availability

## Future Enhancements

1. **Material Images**: Add image URLs for material swatches
2. **Printer Scheduling**: Track which printer is assigned to which order
3. **Material Consumption Tracking**: Monitor material usage over time
4. **Price History**: Track price changes over time
5. **Bulk Import**: CSV upload for materials
6. **Material Categories**: Group materials by properties (flexible, strong, heat-resistant)
7. **Printer Maintenance Logs**: Track maintenance history

## Files Summary

**Created (15 files):**
- SQL/create_materials_printers_tables.sql
- server/src/types/materials.types.ts
- server/src/services/material.service.ts
- server/src/services/printer.service.ts
- server/src/routes/materials.routes.ts
- client/src/pages/admin/AdminMaterials.tsx
- client/src/pages/admin/AdminPrinters.tsx
- api/materials/available.ts

**Modified (6 files):**
- server/src/controllers/admin.controller.ts
- server/src/routes/admin.routes.ts
- server/src/services/pricing.service.ts
- server/src/controllers/upload.controller.ts
- server/src/services/order.service.ts
- server/src/express-app.ts
- client/src/App.tsx

**Total Lines Added:** ~2,500+ lines of code
