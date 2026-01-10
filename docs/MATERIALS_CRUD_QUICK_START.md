# 🚀 Materials CRUD - Quick Start Guide

## What's Been Implemented

Your admin dashboard can now:
- ✅ Display all materials from database
- ✅ Add new materials dynamically
- ✅ Edit existing materials
- ✅ Toggle visibility (show/hide on frontend)
- ✅ Soft delete materials
- ✅ View statistics (total materials, stock value, low stock alerts)
- ✅ Real-time refresh

## 🏃 Quick Start

### Step 1: Run Database Migration

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy all contents from: `SQL/create-materials-table.sql`
6. Click **Run** (or press Ctrl+Enter)

**Expected Result:**
```
✅ Materials table created
✅ Indexes created
✅ Trigger created
✅ 10 seed materials inserted
```

### Step 2: Verify Database

In Supabase, go to **Table Editor** → Find `materials` table

You should see 10 materials:
- PLA White (2.5 kg stock)
- PLA Black (3.2 kg)
- PETG Red (1.8 kg)
- TPU Blue (0.5 kg)
- Nylon Natural (1.2 kg)
- ABS White (2.0 kg)
- PLA Wood Fill (0.8 kg)
- PETG Transparent (1.5 kg)
- TPU Flexible (0.3 kg)
- PLA Marble (1.1 kg)

### Step 3: Test Admin Interface

1. Start your development server:
```bash
cd c:\proto\landing_page\protolab-3d-poland-ui\client
npm run dev
```

2. Login as admin
3. Navigate to: **Admin Dashboard → Materials**
4. You should see the 10 seed materials loaded

### Step 4: Test CRUD Operations

#### Test 1: View Materials ✓
- Materials list displays
- Statistics cards show correct values
- Stock status indicators working

#### Test 2: Add Material ✓
1. Click "Add Material"
2. Fill form:
   - Name: "PLA Green"
   - Type: "PLA"
   - Color: #00FF00
   - Price/kg: 22.50
   - Stock: 2.5
   - Print Temp: 210
   - Bed Temp: 60
   - Supplier: "Local Warehouse"
3. Click "Ajouter"
4. New material appears immediately

#### Test 3: Edit Material ✓
1. Click Edit (pencil icon) on any material
2. Change stock quantity: 5.0
3. Click "Sauvegarder"
4. Table updates immediately

#### Test 4: Toggle Visibility ✓
1. Click Eye icon in Status column
2. Material becomes semi-transparent
3. Icon changes to EyeOff
4. This material won't show on frontend pages

#### Test 5: Delete Material ✓
1. Click Delete (trash icon)
2. Confirm deletion
3. Material disappears from list (soft deleted)

#### Test 6: Refresh Data ✓
1. Click "Refresh" button
2. Loading spinner appears
3. Data reloads from database

## 🎨 Frontend Integration (Next)

To display materials on your landing page:

### Option 1: Modify Existing Landing Page

Update `client/src/pages/Landing.tsx`:

```typescript
import { useEffect, useState } from 'react';

const Landing = () => {
  const [materials, setMaterials] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      // For public access, you might want a public endpoint
      // For now, this works if user is logged in
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/materials`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter only active materials
        setMaterials(data.materials.filter(m => m.is_active));
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      // Fallback to hardcoded materials if needed
    }
  };

  // Rest of your component...
  // Use materials array for display
};
```

### Option 2: Create Public Materials Endpoint

Create `api/materials/public.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/supabase';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabase();

  try {
    const { data: materials, error } = await supabase
      .from('materials')
      .select('id, name, type, color, price_per_kg, density, print_temp, bed_temp, image_url, description')
      .eq('is_active', true)
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching public materials:', error);
      return res.status(500).json({ error: 'Failed to fetch materials' });
    }

    return res.status(200).json({ materials: materials || [] });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

Then in Landing.tsx:
```typescript
const response = await fetch(`${API_URL}/materials/public`);
// No authentication needed!
```

## 📋 Testing Checklist

Use this to verify everything works:

### Database
- [ ] SQL migration executed successfully
- [ ] Materials table exists in Supabase
- [ ] 10 seed materials present
- [ ] Indexes created

### Admin Dashboard
- [ ] Navigate to /admin/materials
- [ ] Materials list loads
- [ ] Statistics cards show correct data
- [ ] Add material works
- [ ] Edit material works
- [ ] Toggle visibility works
- [ ] Delete material works
- [ ] Refresh button works
- [ ] Loading states display
- [ ] Error toast appears on failures

### API
- [ ] GET /api/materials returns all materials
- [ ] POST /api/materials creates material
- [ ] PATCH /api/materials updates material
- [ ] DELETE /api/materials soft deletes
- [ ] Admin authentication enforced

### Frontend (After Integration)
- [ ] Landing page shows active materials only
- [ ] Hidden materials don't appear
- [ ] Material details display correctly
- [ ] Changes in admin reflect on frontend

## 🐛 Troubleshooting

### Problem: "Unauthorized" error in admin
**Solution:**
1. Ensure you're logged in as admin
2. Check localStorage for accessToken
3. Verify token hasn't expired
4. Re-login if needed

### Problem: Materials not loading
**Solution:**
1. Check Network tab in DevTools
2. Verify API URL is correct
3. Check Supabase connection
4. Ensure table exists

### Problem: Field errors (pricePerKg not found)
**Solution:**
All field names use **snake_case**:
- ✅ price_per_kg
- ✅ stock_quantity
- ✅ print_temp
- ✅ bed_temp
- ❌ NOT pricePerKg, stockQuantity, etc.

### Problem: Can't add/edit materials
**Solution:**
1. Check browser console for errors
2. Verify all required fields filled (name, type, price)
3. Check network response in DevTools
4. Ensure Supabase has write permissions

## 🎯 What's Next?

### Immediate:
1. ✅ Run SQL migration (Step 1 above)
2. ✅ Test admin interface (Step 3-4 above)
3. ⏳ Integrate with frontend (See Frontend Integration)

### Future Enhancements:
- [ ] Image upload for materials
- [ ] Bulk import from CSV
- [ ] Advanced filtering and search
- [ ] Stock history tracking
- [ ] Automatic reorder notifications
- [ ] Material properties expansion (strength, flexibility, etc.)

## 📁 Files Modified/Created

### Created:
- ✅ `SQL/create-materials-table.sql` - Database schema
- ✅ `docs/MATERIALS_CRUD_COMPLETE.md` - Full documentation
- ✅ `docs/MATERIALS_CRUD_QUICK_START.md` - This file

### Modified:
- ✅ `client/src/pages/admin/AdminMaterials.tsx` - Full API integration
  - Added fetchMaterials()
  - Added handleAddMaterial()
  - Added handleEditMaterial()
  - Added handleDeleteMaterial()
  - Added handleToggleActive()
  - Updated all form fields to snake_case
  - Added loading states
  - Added error handling
  - Added refresh button
  - Added visibility toggle

### Already Exists:
- ✅ `api/materials/index.ts` - API endpoints (no changes needed)

## 🎉 Success Criteria

You'll know everything works when:
1. Admin can add a new material → Appears in database immediately
2. Admin can edit material → Changes saved to database
3. Admin can toggle visibility → Eye icon changes, opacity changes
4. Admin can delete material → Disappears from list
5. Statistics update correctly
6. Loading states show during API calls
7. Error messages appear on failures
8. Refresh button reloads data

## 💡 Tips

1. **Always use snake_case for API fields**
2. **Check Network tab for API errors**
3. **Test with seed data first before adding real materials**
4. **Use visibility toggle to hide materials from frontend without deleting**
5. **Refresh page if data seems stale**

---

**Ready to start?** Begin with Step 1: Run Database Migration! 🚀
