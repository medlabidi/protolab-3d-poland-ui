# Pricing System Comparison: NewPrint vs EditOrder

## Overview
This document provides a detailed comparison between the pricing calculations in the **NewPrint** page (when creating a new order) and the **EditOrder** page (when modifying an existing order).

---

## 1. PRICING FORMULA COMPARISON

### Core Formula (IDENTICAL in both systems)

Both systems use the same fundamental pricing formula:

```
Total Price = ((Cmaterial + Cenergy + Clabor + Cdepreciation + Cmaintenance) × 1.23) × quantity
```

### Component Breakdown

| Component | Formula | NewPrint | EditOrder | Notes |
|-----------|---------|----------|-----------|-------|
| **Material Cost** | `price_per_kg × (weight_g / 1000)` | ✓ | ✓ | Uses database material price |
| **Energy Cost** | `printTime_h × (power_watts / 1000) × 0.914` | ✓ | ✓ | 0.914 PLN/kWh (Kraków rate) |
| **Labor Cost** | `31.40 × (10 / 60)` | ✓ | ✓ | Fixed 10 minutes labor |
| **Depreciation** | `(printer_cost / lifespan_hours) × printTime_h` | ✓ | ✓ | Uses database printer specs |
| **Maintenance** | `Cdepreciation × maintenance_rate` | ✓ | ✓ | Uses database maintenance rate |
| **VAT** | `Cinternal × 0.23` | ✓ | ✓ | 23% VAT (Poland) |
| **Quantity** | `price × quantity` | ✓ | ✓ | Applied after VAT |
| **Shipping** | Variable | NOT included | NOT included | Added at checkout |

---

## 2. WEIGHT CALCULATION COMPARISON

### NewPrint (Creating Order)

**Source:** Direct 3D model analysis

```javascript
// Step 1: Get actual model volume from STL/3MF analysis
volumeCm3 = modelAnalysis.volumeCm3  // e.g., 50.5 cm³

// Step 2: Calculate effective volume with infill
infillPercent = INFILL_BY_QUALITY[quality]  // Draft=10%, Standard=20%, High=30%, Ultra=40%
effectiveVolume = volumeCm3 × (1 + infillPercent / 100)

// Step 3: Apply material density
density = MATERIAL_DENSITIES[material]  // PLA=1.24, ABS=1.04, PETG=1.27, etc.
materialWeightGrams = effectiveVolume × density
```

**Example:**
- Volume: 50 cm³
- Quality: Standard (20% infill)
- Material: PLA (density 1.24 g/cm³)
- Effective Volume: 50 × 1.2 = 60 cm³
- Weight: 60 × 1.24 = **74.4 grams**

### EditOrder (Modifying Order)

**Source:** Back-calculation from stored weight, then recalculation with new parameters

```javascript
// Step 1: Back-calculate original base volume from stored weight
originalDensity = MATERIAL_DENSITIES[order.material]
originalInfill = INFILL_BY_QUALITY[order.layer_height]
baseVolumeCm3 = order.material_weight / (originalDensity × (1 + originalInfill / 100))

// Step 2: Recalculate with NEW parameters
newDensity = MATERIAL_DENSITIES[newMaterial]
newInfill = INFILL_BY_QUALITY[newLayerHeight]
newEffectiveVolume = baseVolumeCm3 × (1 + newInfill / 100)
materialWeightGrams = newEffectiveVolume × newDensity
```

**Example (changing from Standard to High quality):**
- Stored weight: 74.4g (from original order)
- Original: PLA, Standard (20% infill)
- Back-calculated base volume: 74.4 / (1.24 × 1.2) = **50 cm³**
- New: PLA, High (30% infill)
- New effective volume: 50 × 1.3 = 65 cm³
- New weight: 65 × 1.24 = **80.6 grams** ⬆️

---

## 3. PRINT TIME CALCULATION COMPARISON

### NewPrint (Creating Order)

**Source:** Direct calculation from model analysis

```javascript
// Step 1: Calculate effective volume with infill
effectiveVolume = volumeCm3 × (1 + infillPercent / 100)

// Step 2: Apply quality-based print speed
speedCm3PerHour = PRINT_SPEED_CM3_PER_HOUR[quality]
// Draft=15, Standard=10, High=6, Ultra=3 cm³/hour

// Step 3: Calculate time
printTimeHours = effectiveVolume / speedCm3PerHour
printTimeHours = Math.max(0.25, printTimeHours)  // Minimum 15 minutes
```

**Example:**
- Volume: 50 cm³
- Quality: Standard (20% infill)
- Effective Volume: 60 cm³
- Speed: 10 cm³/hour
- Time: 60 / 10 = **6 hours**

### EditOrder (Modifying Order)

**Source:** Back-calculation and recalculation with new parameters

```javascript
// Step 1: Back-calculate base volume (same as weight calculation)
baseVolumeCm3 = order.material_weight / (originalDensity × (1 + originalInfill / 100))

// Step 2: Recalculate effective volume with NEW infill
newEffectiveVolume = baseVolumeCm3 × (1 + newInfill / 100)

// Step 3: Apply NEW quality-based print speed
newSpeedCm3PerHour = PRINT_SPEED_CM3_PER_HOUR[newLayerHeight]
printTimeHours = Math.max(0.25, newEffectiveVolume / newSpeedCm3PerHour)
```

**Example (changing from Standard to High quality):**
- Base volume: 50 cm³
- New: High quality (30% infill)
- New effective volume: 65 cm³
- New speed: 6 cm³/hour (slower for higher quality)
- New time: 65 / 6 = **10.83 hours** ⬆️

---

## 4. CONSTANTS & CONFIGURATIONS

### Material Densities (g/cm³)

| Material | Density | Used In |
|----------|---------|---------|
| PLA | 1.24 | Both |
| ABS | 1.04 | Both |
| PETG | 1.27 | Both |
| TPU | 1.21 | Both |
| Nylon | 1.14 | Both |
| Resin | 1.1 | Both |

### Infill by Quality

| Quality | Layer Height | Infill % | Used In |
|---------|--------------|----------|---------|
| Draft | 0.3mm | 10% | Both |
| Standard | 0.2mm | 20% | Both |
| High | 0.15mm | 30% | Both |
| Ultra | 0.1mm | 40% | Both |

### Print Speed by Quality (cm³/hour)

| Quality | Layer Height | Speed | Used In |
|---------|--------------|-------|---------|
| Draft | 0.3mm | 15 | Both |
| Standard | 0.2mm | 10 | Both |
| High | 0.15mm | 6 | Both |
| Ultra | 0.1mm | 3 | Both |

### Fixed Costs

| Parameter | Value | Used In | Notes |
|-----------|-------|---------|-------|
| Energy Price | 0.914 PLN/kWh | Both | Kraków electricity rate |
| Labor Rate | 31.40 PLN/hour | Both | Fixed hourly rate |
| Labor Time | 10 minutes | Both | Setup time per print |
| VAT | 23% | Both | Poland VAT rate |

### Database-Driven Values

| Parameter | Source | NewPrint | EditOrder |
|-----------|--------|----------|-----------|
| Material Price | `/api/materials/by-type` | ✓ | ✓ |
| Printer Power | `/api/printers/default` | ✓ | ✓ |
| Printer Cost | `/api/printers/default` | ✓ | ✓ |
| Printer Lifespan | `/api/printers/default` | ✓ | ✓ |
| Maintenance Rate | `/api/printers/default` | ✓ | ✓ |

---

## 5. PROCESS FLOW COMPARISON

### NewPrint Process

```
1. User uploads 3D model file
   ↓
2. Frontend analyzes STL/3MF → extracts actual volume (cm³)
   ↓
3. User selects: material, color, quality, quantity
   ↓
4. Calculate Price button clicked
   ↓
5. Frontend calculates:
   - Weight = volume × density × (1 + infill%)
   - Time = effectiveVolume / speed
   - Price using formula
   ↓
6. Display price breakdown to user
   ↓
7. User submits order
   ↓
8. Frontend sends to backend:
   - file, material, color, quality, quantity
   - price (calculated)
   - materialWeight (grams)
   - printTime (minutes)
   ↓
9. Backend stores order with all data
   ↓
10. Order created ✓
```

### EditOrder Process

```
1. User opens existing order for editing
   ↓
2. Frontend fetches order from backend
   - Includes: material_weight, print_time (if available)
   ↓
3. Display current parameters in form
   ↓
4. User changes parameters (material/quality/quantity)
   ↓
5. Frontend automatically recalculates:
   - Back-calculate base volume from stored weight
   - Recalculate weight with new density/infill
   - Recalculate time with new speed/infill
   - Recalculate price using formula
   ↓
6. Display: Original Price vs New Price
   ↓
7. User saves changes
   ↓
8. Frontend determines action:
   - Price increased → Redirect to payment
   - Price decreased → Redirect to refund
   - Price same → Save directly
   ↓
9. Backend updates order:
   - material, color, layer_height, infill, quantity
   - price (new)
   - material_weight (recalculated)
   - print_time (recalculated)
   ↓
10. Order updated ✓
```

---

## 6. KEY DIFFERENCES

### Data Source

| Aspect | NewPrint | EditOrder |
|--------|----------|-----------|
| **Volume Source** | Direct 3D model analysis | Back-calculated from stored weight |
| **Weight Source** | Calculated from model | Recalculated from base volume |
| **Time Source** | Calculated from model | Recalculated from base volume |
| **Material Price** | Current database price | Current database price |

### Calculation Approach

| Aspect | NewPrint | EditOrder |
|--------|----------|-----------|
| **Weight Calculation** | Forward: Volume → Weight | Backward then Forward: Weight → Volume → Weight |
| **Time Calculation** | Forward: Volume → Time | Backward then Forward: Time → Volume → Time |
| **Base Volume** | From 3D model analysis | Back-calculated from stored data |

### What Changes

| Parameter Change | NewPrint | EditOrder |
|------------------|----------|-----------|
| **Material Changed** | Affects weight (density) | Affects weight (density) ✓ |
| **Quality Changed** | Affects weight (infill) & time (speed) | Affects weight (infill) & time (speed) ✓ |
| **Quantity Changed** | Multiplies final price | Multiplies final price ✓ |
| **Material Price Changed** | Uses current price | Uses current price ✓ |

---

## 7. ACCURACY & CONSISTENCY

### Strengths

✅ **Consistent Formula**: Both systems use identical pricing formula  
✅ **Database-Driven**: Material prices and printer specs from database  
✅ **Dynamic Recalculation**: EditOrder recalculates weight/time on changes  
✅ **Stored Data**: New orders store weight/time for accurate future edits  
✅ **VAT Compliance**: Proper 23% VAT application  

### Considerations

⚠️ **Old Orders**: Orders created before weight/time storage use estimates  
⚠️ **Volume Approximation**: EditOrder back-calculates volume (slight rounding)  
⚠️ **No Model Access**: EditOrder cannot re-analyze original 3D file  

---

## 8. EXAMPLE SCENARIOS

### Scenario 1: Creating New Order

**Input:**
- File: cube.stl (50 cm³)
- Material: PLA-White (39 PLN/kg)
- Quality: Standard (0.2mm, 20% infill, 10 cm³/h)
- Quantity: 1

**Calculation:**
```
Weight: 50 × 1.2 × 1.24 = 74.4g
Time: (50 × 1.2) / 10 = 6 hours
Material: 0.0744 × 39 = 2.90 PLN
Energy: 6 × 0.27 × 0.914 = 1.48 PLN
Labor: 31.40 × (10/60) = 5.23 PLN
Depreciation: (3483.39 / 5000) × 6 = 4.18 PLN
Maintenance: 4.18 × 0.03 = 0.13 PLN
Internal: 2.90 + 1.48 + 5.23 + 4.18 + 0.13 = 13.92 PLN
VAT: 13.92 × 0.23 = 3.20 PLN
Total: 13.92 + 3.20 = 17.12 PLN
```

**Stored in DB:** weight=74.4g, time=360min, price=17.12

### Scenario 2: Editing Order - Change Quality

**Original Order:**
- Material: PLA, Standard, price=17.12 PLN
- Stored: weight=74.4g, time=360min

**Change:** Standard → High quality

**Calculation:**
```
Back-calculate base volume: 74.4 / (1.24 × 1.2) = 50 cm³
New weight: 50 × 1.3 × 1.24 = 80.6g (↑8.3%)
New time: (50 × 1.3) / 6 = 10.83 hours (↑80%)
Material: 0.0806 × 39 = 3.14 PLN (↑8.3%)
Energy: 10.83 × 0.27 × 0.914 = 2.67 PLN (↑80%)
Labor: 5.23 PLN (same)
Depreciation: (3483.39 / 5000) × 10.83 = 7.55 PLN (↑80%)
Maintenance: 7.55 × 0.03 = 0.23 PLN (↑80%)
Internal: 18.82 PLN
VAT: 4.33 PLN
Total: 23.15 PLN (↑35%)
```

**Updated in DB:** weight=80.6g, time=650min, price=23.15

### Scenario 3: Editing Order - Change Material

**Original Order:**
- Material: PLA-White, Standard, price=17.12 PLN
- Stored: weight=74.4g, time=360min

**Change:** PLA (39 PLN/kg) → ABS-Black (45 PLN/kg)

**Calculation:**
```
Base volume: 50 cm³ (same)
ABS density: 1.04 g/cm³ (vs PLA 1.24)
New weight: 50 × 1.2 × 1.04 = 62.4g (↓16%)
Time: Same (6 hours)
Material: 0.0624 × 45 = 2.81 PLN (↓3%)
Energy: 1.48 PLN (same)
Labor: 5.23 PLN (same)
Depreciation: 4.18 PLN (same)
Maintenance: 0.13 PLN (same)
Internal: 13.83 PLN
VAT: 3.18 PLN
Total: 17.01 PLN (↓0.6%)
```

**Updated in DB:** weight=62.4g, time=360min, price=17.01

---

## 9. VALIDATION & TESTING

### Test Cases

| Test | NewPrint | EditOrder | Expected Result |
|------|----------|-----------|-----------------|
| Same parameters | ✓ | ✓ | Identical price |
| Change to cheaper material | N/A | ✓ | Price decreases |
| Change to expensive material | N/A | ✓ | Price increases |
| Increase quality | N/A | ✓ | Price increases (more time) |
| Decrease quality | N/A | ✓ | Price decreases (less time) |
| Double quantity | ✓ | ✓ | Price doubles |
| Change printer specs | ✓ | ✓ | Affects depreciation/energy |

---

## 10. CONCLUSION

### System Alignment

Both NewPrint and EditOrder use **identical pricing formulas** with the following differences:

1. **Data Source**: NewPrint uses direct 3D analysis; EditOrder back-calculates from stored data
2. **Purpose**: NewPrint creates; EditOrder modifies with change tracking
3. **Storage**: Both store weight/time for future consistency
4. **Accuracy**: Both achieve consistent results when database values are unchanged

### Recommendations

✅ **Current System is Correct**: Both systems properly calculate prices  
✅ **Weight/Time Storage**: Essential for accurate price recalculation  
✅ **Database-Driven**: Material prices and printer specs ensure consistency  
✅ **Dynamic Updates**: Price changes reflect parameter modifications accurately  

### Future Enhancements

- Store original 3D model volume explicitly for even more accurate recalculations
- Add price history tracking for transparency
- Provide detailed breakdown in EditOrder UI
- Add validation warnings when old orders lack stored data
