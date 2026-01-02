# EditOrder Exact Calculation Implementation

## Summary
Updated EditOrder to calculate prices **EXACTLY** like NewPrint by storing and using the base model volume directly, eliminating back-calculation errors.

## Changes Made

### 1. Frontend - NewPrint.tsx
**File**: `client/src/pages/NewPrint.tsx`  
**Change**: Store model volume when creating orders
```typescript
// Line ~820: Added modelVolume to FormData
if (modelAnalysis) {
  formData.append('modelVolume', modelAnalysis.volumeCm3.toString()); // in cm³
}
```

### 2. Backend Types
**File**: `server/src/types/index.ts`  
**Change**: Added modelVolume field to OrderCreateInput interface
```typescript
export interface OrderCreateInput {
  // ... existing fields
  modelVolume?: number;  // Base model volume in cm³ (for exact recalculation)
}
```

### 3. Backend Controller
**File**: `server/src/controllers/order.controller.ts`  
**Change**: Parse modelVolume from request
```typescript
modelVolume: req.body.modelVolume ? parseFloat(req.body.modelVolume) : undefined,
```

### 4. Backend Service
**File**: `server/src/services/order.service.ts`  
**Change**: Store modelVolume in database
```typescript
model_volume_cm3: data.modelVolume,  // Store base volume in cm³
```

### 5. Backend Model
**File**: `server/src/models/Order.ts`  
**Change**: Added model_volume_cm3 field to IOrder interface
```typescript
export interface IOrder {
  // ... existing fields
  model_volume_cm3?: number;
}
```

### 6. Frontend - EditOrder.tsx
**File**: `client/src/pages/EditOrder.tsx`  
**Changes**: Use stored volume directly instead of back-calculating

#### In `calculateNewWeightAndTime()` function (Line ~320):
```typescript
// EXACT CALCULATION: Use stored base volume directly (same as NewPrint)
let baseVolumeCm3: number;

if (order.model_volume_cm3) {
  // Use stored base volume directly - EXACT same as NewPrint's modelAnalysis.volumeCm3
  baseVolumeCm3 = order.model_volume_cm3;
} else if (order.material_weight && order.print_time) {
  // Fallback for old orders: back-calculate from stored weight
  // ... existing back-calculation code for backward compatibility
}

// Calculate NEW weight with NEW material density and infill
// EXACT same formula as NewPrint.tsx lines 184-196
const newDensity = MATERIAL_DENSITIES[selectedMaterialType] || 1.24;
const newInfillPercent = INFILL_BY_QUALITY[layerHeight] || 20;
const newEffectiveVolume = baseVolumeCm3 * (1 + newInfillPercent / 100);
const materialWeightGrams = Math.round(newEffectiveVolume * newDensity);

// Calculate NEW print time with NEW quality/speed settings
// EXACT same formula as NewPrint.tsx lines 198-213
const printSpeedCm3PerHour = PRINT_SPEED_CM3_PER_HOUR[layerHeight] || 10;
const printTimeHours = Math.max(0.25, newEffectiveVolume / printSpeedCm3PerHour);
```

#### In `calculateNewPrice()` function (Line ~360):
Same changes as above - uses stored `order.model_volume_cm3` directly when available.

### 7. Database Migration
**File**: `SQL/add_model_volume_column.sql`  
**Content**:
```sql
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS model_volume_cm3 DECIMAL(10, 3);

COMMENT ON COLUMN orders.model_volume_cm3 IS 'Base 3D model volume in cm³, used for exact price recalculation when editing orders';
```

## How It Works Now

### NewPrint (Creating Orders):
1. Analyze 3D model file → get `volumeCm3`
2. Calculate: `volumeCm3` → `effectiveVolume` → `weight` & `time` → `price`
3. Store: `weight`, `time`, **`volumeCm3`** in database

### EditOrder (Editing Orders):
1. Load order from database (includes `model_volume_cm3`)
2. Use stored `volumeCm3` directly (NO back-calculation)
3. Calculate: `volumeCm3` → `effectiveVolume` → `weight` & `time` → `price`
4. **Exact same calculation as NewPrint**

## Key Benefits

✅ **Exact Calculation Match**: EditOrder now uses identical calculation method as NewPrint  
✅ **No Back-Calculation**: Eliminates rounding errors from weight → volume → weight conversion  
✅ **Backward Compatible**: Falls back to old back-calculation method for orders without stored volume  
✅ **Future-Proof**: All new orders store base volume for accurate recalculation

## Calculation Flow Comparison

### Before (Back-Calculation):
```
NewPrint:    volumeCm3 → weight → price
EditOrder:   weight → volumeCm3 → weight → price  ❌ Different!
```

### After (Direct Calculation):
```
NewPrint:    volumeCm3 → weight → price
EditOrder:   volumeCm3 → weight → price  ✅ Identical!
```

## Database Migration Required

**IMPORTANT**: Run the SQL migration to add the `model_volume_cm3` column:

### Option 1: Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Run the contents of `SQL/add_model_volume_column.sql`

### Option 2: Command Line (if psql available)
```bash
psql YOUR_DATABASE_URL -f SQL/add_model_volume_column.sql
```

### Option 3: Node.js Script (when network is stable)
```bash
node run-volume-migration.js
```

## Testing Steps

1. **Create new order in NewPrint**:
   - Upload a 3D model
   - Select material, color, quality
   - Note the price (e.g., 45.50 PLN)

2. **Edit the order**:
   - Go to order list
   - Click edit on the new order
   - Change material/color/quality back to original values
   - Price should match exactly (45.50 PLN)

3. **Verify calculation**:
   - Change quality to different setting
   - Price recalculates correctly
   - Weight and time update appropriately

## Backward Compatibility

Orders created before this update (without `model_volume_cm3`):
- Still work using fallback back-calculation
- Slightly less accurate due to rounding
- Should be re-ordered to get exact calculations

Orders created after this update:
- Store `model_volume_cm3` automatically
- Use exact calculation in EditOrder
- Perfect price matching between NewPrint and EditOrder

## Files Modified

1. ✅ `client/src/pages/NewPrint.tsx` - Store modelVolume
2. ✅ `client/src/pages/EditOrder.tsx` - Use stored volume directly
3. ✅ `server/src/types/index.ts` - Add modelVolume to interface
4. ✅ `server/src/controllers/order.controller.ts` - Parse modelVolume
5. ✅ `server/src/services/order.service.ts` - Store model_volume_cm3
6. ✅ `server/src/models/Order.ts` - Add model_volume_cm3 field
7. ✅ `SQL/add_model_volume_column.sql` - Database migration
8. ✅ `run-volume-migration.js` - Migration script

## Next Steps

1. ⚠️ **Run database migration** (see above)
2. ✅ Test with new order creation
3. ✅ Test order editing with exact price match
4. ✅ Verify old orders still work (fallback)
