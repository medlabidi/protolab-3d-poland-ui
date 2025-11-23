# Testing Guide

## Overview

This document explains how to run tests for the 3D Print Pricing Calculator application.

---

## Table of Contents

1. [Setup](#setup)
2. [Running Tests](#running-tests)
3. [Test Structure](#test-structure)
4. [Pricing Calculator Tests](#pricing-calculator-tests)
5. [Manual Testing](#manual-testing)
6. [Troubleshooting](#troubleshooting)

---

## Setup

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Install Testing Dependencies

Testing dependencies are already included in `package.json`. If needed, install manually:

```bash
npm install --save-dev jest @types/jest ts-jest
```

### Jest Configuration

Jest is configured in `jest.config.js`:

```javascript
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
}
```

---

## Running Tests

### Run All Tests

```bash
npm test
```

**Output:**
```
PASS  server/src/services/__tests__/pricing-calculator.test.ts
  calculatePrintPrice
    ✓ should calculate correct price for PLA_White (20 ms)
    ✓ should calculate correct price for PLA_Red (13 ms)
    ✓ should calculate correct price for ABS with delivery fee (3 ms)
    ✓ should calculate correct price for PETG_Black (1 ms)
    ✓ should calculate labor cost based on custom labor time (1 ms)
    ✓ should handle zero material weight (2 ms)
    ✓ should throw error for invalid material (9 ms)
    ✓ should throw error for invalid color combination (1 ms)
    ✓ should work with all material types (2 ms)
    ✓ should correctly calculate VAT as 23% of internal cost (1 ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

### Run Tests in Watch Mode

Automatically re-run tests when files change:

```bash
npm run test:watch
```

**Usage:**
- Press `q` to quit
- Press `a` to run all tests
- Press `p` to filter by filename
- Press `t` to filter by test name

### Run Tests with Coverage Report

Generate a coverage report showing which code is tested:

```bash
npm run test:coverage
```

**Output:**
```
---------|----------|----------|----------|----------|
File     |  % Stmts | % Branch | % Funcs  | % Lines  |
---------|----------|----------|----------|----------|
All      |   85.5   |   78.3   |   90.0   |   85.2   |
 pricing |   95.2   |   92.1   |   100    |   95.0   |
---------|----------|----------|----------|----------|
```

Coverage report is saved to `coverage/` directory. Open `coverage/lcov-report/index.html` in a browser to view detailed coverage.

---

## Test Structure

### Location

Tests are located in:
```
server/src/services/__tests__/pricing-calculator.test.ts
```

### Test File Format

Each test follows this structure:

```typescript
describe('Feature Name', () => {
  it('should do something specific', () => {
    // 1. Arrange: Set up test data
    const input = { /* ... */ };

    // 2. Act: Execute the function
    const result = myFunction(input);

    // 3. Assert: Verify the result
    expect(result).toEqual(expectedValue);
  });
});
```

---

## Pricing Calculator Tests

### Test Suite: `calculatePrintPrice`

The pricing calculator has **10 tests** covering:

#### Test 1: Basic PLA White Calculation
- **File:** `pricing-calculator.test.ts`
- **Input:** 50g PLA White, 2 hours print time, 20 min labor
- **Expected Output:** ~17.64 PLN total price
- **What it tests:** Basic cost calculation with standard inputs

```typescript
it('should calculate correct price for PLA_White', () => {
  const params = {
    materialType: 'PLA',
    color: 'White',
    materialWeightGrams: 50,
    printTimeHours: 2,
    laborTimeMinutes: 20,
    deliveryFee: 0,
  };
  const result = pricingService.calculatePrice(params);
  expect(result.totalPrice).toBeCloseTo(17.64, 1);
});
```

#### Test 2: Higher Price Material (PLA Red)
- **Input:** 100g PLA Red, 5 hours print time
- **Expected Output:** ~24.82 PLN total price
- **What it tests:** Pricing variation based on material color

#### Test 3: Delivery Fee
- **Input:** 75g ABS Black, 3 hours print time, 25 PLN delivery fee
- **Expected Output:** ~46.05 PLN total price (includes delivery)
- **What it tests:** Delivery fee is correctly added

#### Test 4: Lowest Cost Material (PETG Black)
- **Input:** 60g PETG Black, 1.5 hours print time
- **What it tests:** Correct pricing for budget material

#### Test 5: Custom Labor Time
- **Input:** 50g PLA White, 2 hours print, **45 min labor** (custom)
- **Expected:** Labor cost = 23.55 PLN
- **What it tests:** Labor time is correctly converted from minutes to hours

#### Test 6: Zero Material Weight
- **Input:** 0g material, 1 hour print time
- **Expected:** Material cost = 0 PLN, but total cost > 0 (energy + labor)
- **What it tests:** Edge case handling

#### Test 7: Invalid Material Error
- **Input:** Material type "InvalidMaterial"
- **Expected:** Throws error: "Material price not found for: InvalidMaterial_White"
- **What it tests:** Error handling for unsupported materials

#### Test 8: Invalid Color Error
- **Input:** Color "InvalidColor" for PLA
- **Expected:** Throws error: "Material price not found for: PLA_InvalidColor"
- **What it tests:** Error handling for unsupported colors

#### Test 9: All Material Types
- **Input:** PLA White, ABS Black, PETG Red (each 50g, 2h print)
- **Expected:** All return positive total price and VAT
- **What it tests:** All supported material combinations work

#### Test 10: VAT Calculation
- **Input:** 100g PLA White, 4 hours print
- **Expected:** VAT = Cinternal × 0.23 (exactly 23%)
- **What it tests:** VAT is correctly calculated as 23% of internal cost

---

## Test Formulas

All tests verify these exact PLN calculations:

```
Cmaterial = materialPrice (PLN/kg) × (weight (g) / 1000)
Cenergy = printTime (h) × 0.27 (kW) × 0.914 (PLN/kWh)
Clabor = 31.4 (PLN/h) × laborTime (h)
Cdepreciation = (3483.39 PLN / 5000 h) × printTime (h)
Cmaintenance = Cdepreciation × 0.03
Cinternal = Cmaterial + Cenergy + Clabor + Cdepreciation + Cmaintenance
VAT = Cinternal × 0.23
priceWithoutDelivery = Cinternal + VAT
totalPrice = priceWithoutDelivery + deliveryFee (if any)
```

---

## Manual Testing

### Run Manual Pricing Test

```bash
npm run test:pricing
```

This runs a Node.js script that prints formatted output:

```
=== PRICING CALCULATOR MANUAL TEST ===

Test 1: PLA White, 50g, 2h print, 20min labor
----------------------------------------
Material Cost:      1.95 PLN
Energy Cost:        0.49 PLN
Labor Cost:         10.47 PLN
Depreciation:       1.39 PLN
Maintenance:        0.04 PLN
----------------------------------------
Internal Cost:      14.34 PLN
VAT (23%):          3.30 PLN
Price w/o Delivery: 17.64 PLN
Total Price:        17.64 PLN
```

**Location:** `server/src/__tests__/pricing.manual.ts`

---

## Test Assertion Methods

Common Jest assertions used in tests:

| Assertion | Purpose | Example |
|-----------|---------|---------|
| `toBe()` | Exact equality | `expect(result).toBe(0)` |
| `toBeCloseTo()` | Floating-point equality with tolerance | `expect(result).toBeCloseTo(17.64, 1)` |
| `toBeGreaterThan()` | Greater than comparison | `expect(result).toBeGreaterThan(0)` |
| `toThrow()` | Exception is thrown | `expect(fn).toThrow('error message')` |

### Understanding `toBeCloseTo()`

```typescript
expect(result).toBeCloseTo(17.64, 1);
// Tolerance of 1 = ±0.05 difference allowed
// 17.64 ± 0.05 = range 17.59 to 17.69
```

---

## Troubleshooting

### Tests Not Found

**Error:** `No tests found`

**Solution:**
1. Ensure test file is in correct location: `server/src/services/__tests__/pricing-calculator.test.ts`
2. File must end with `.test.ts` or `.spec.ts`
3. Run: `npm test -- --listTests` to list discovered tests

### Module Not Found Errors

**Error:** `Cannot find module '../pricing.service'`

**Solution:**
1. Check file paths in import statements
2. Ensure `pricing.service.ts` exists at `server/src/services/`
3. Run `npm install` to install all dependencies

### Tests Failing on Decimal Values

**Error:** `Expected 17.6399999 to be close to 17.64`

**Solution:**
1. Use `toBeCloseTo()` instead of `toBe()` for floating-point numbers
2. Adjust tolerance: `toBeCloseTo(value, 1)` for ±0.05 precision

### TypeScript Compilation Errors

**Error:** `Type 'PricingParams' is not assignable...`

**Solution:**
1. Check `server/src/types/pricing.ts` exists and exports types
2. Ensure imports reference correct path: `import { PricingParams } from '../../types/pricing'`
3. Run `npm run build` to check TypeScript errors

---

## Continuous Integration

### GitHub Actions (Optional)

Add this to `.github/workflows/test.yml` to run tests on every push:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

---

## Best Practices

1. **Run tests before committing:** `npm test`
2. **Keep tests focused:** One behavior per test
3. **Use descriptive test names:** `should calculate correct price for PLA_Red` instead of `test 2`
4. **Test edge cases:** Zero values, invalid inputs, boundary conditions
5. **Check coverage:** `npm run test:coverage` and aim for >80% code coverage
6. **Mock external dependencies:** Use Jest mocks for API calls, database queries
7. **Update tests when code changes:** Tests document expected behavior

---

## Summary

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode (auto-rerun) |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:pricing` | Run manual pricing calculation test |

All tests should pass before deploying to production.

For questions or issues, check the test file comments or error messages.
