# Quick Test: Price Calculation in EditOrder

## ⚠️ IMPORTANT: Run Database Migration First

In **Supabase Dashboard → SQL Editor**, run:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS model_volume_cm3 DECIMAL(10, 3);
```

---

## 🧪 Test: Reduce Price (High → Low Settings)

### 1. Create New Order (Expensive Settings)
- Go to **New Print**
- Upload any 3D model
- Set: **Ultra Quality (0.1mm)** + **100% Infill** + **PLA White**
- Note the price (e.g., **45.50 PLN**)
- Submit order

### 2. Edit Order (Cheap Settings)
- Go to **My Orders** → Click **Edit** on the new order
- ✅ Verify: Original Price = 45.50 PLN, New Price = 45.50 PLN
- Change: **Draft Quality (0.3mm)** + **10% Infill**
- ✅ Verify: New Price DECREASES (e.g., to **18.20 PLN**)
- ✅ Verify: Shows negative difference (e.g., **-27.30 PLN**)

**Why?**
- Draft is 5× faster than Ultra (less labor cost)
- 10% infill uses ~50% less material than 100%

---

## 🧪 Test: No Changes = No Price Change

### Edit Without Modifying
- Go to **My Orders** → Click **Edit** on ANY order
- **Don't change anything**
- ✅ Verify: Original Price = New Price (exactly equal)
- ✅ Verify: Price Difference = 0.00 PLN

**This was your bug!** Before fix: 6.81 → 28.91 PLN with no changes ❌  
After fix: Price stays same until you change parameters ✅

---

## 🧪 Test: Exact Match When Reverting

### Change and Revert
1. Create order with **Standard (0.2mm)** + **20% infill** → Price: 25.00 PLN
2. Edit order → Change to **Ultra (0.1mm)** → Price increases to ~40.00 PLN
3. Change back to **Standard (0.2mm)** + **20% infill**
4. ✅ Verify: Price returns to EXACTLY **25.00 PLN** (no rounding errors)

---

## ✅ Success Criteria

- ✅ Price unchanged when opening edit without modifications
- ✅ Lower quality/infill = lower price
- ✅ Higher quality/infill = higher price  
- ✅ Exact price match when reverting to original parameters
- ✅ New orders have `model_volume_cm3` in database

---

## 🔍 Verify in Database

After creating order, check in Supabase SQL Editor:
```sql
SELECT model_volume_cm3, material_weight, print_time 
FROM orders 
ORDER BY created_at DESC 
LIMIT 1;
```

All three fields should have values > 0.
