import { calculatePrintPrice } from '../services/pricing-calculator';

// Run: npx ts-node server/src/__tests__/pricing.manual.ts

console.log('\n=== PRICING CALCULATOR MANUAL TEST ===\n');

// Test Case 1
const test1 = calculatePrintPrice({
  materialType: 'PLA',
  color: 'White',
  materialWeightGrams: 50,
  printTimeHours: 2,
  laborTimeMinutes: 20,
  deliveryFee: 0,
});

console.log('Test 1: PLA White, 50g, 2h print, 20min labor');
console.log('----------------------------------------');
console.log(`Material Cost:      ${test1.Cmaterial.toFixed(2)} PLN`);
console.log(`Energy Cost:        ${test1.Cenergy.toFixed(2)} PLN`);
console.log(`Labor Cost:         ${test1.Clabor.toFixed(2)} PLN`);
console.log(`Depreciation:       ${test1.Cdepreciation.toFixed(2)} PLN`);
console.log(`Maintenance:        ${test1.Cmaintenance.toFixed(2)} PLN`);
console.log('----------------------------------------');
console.log(`Internal Cost:      ${test1.Cinternal.toFixed(2)} PLN`);
console.log(`VAT (23%):          ${test1.vat.toFixed(2)} PLN`);
console.log(`Price w/o Delivery: ${test1.priceWithoutDelivery.toFixed(2)} PLN`);
console.log(`Total Price:        ${test1.totalPrice.toFixed(2)} PLN\n`);

// Test Case 2
const test2 = calculatePrintPrice({
  materialType: 'PLA',
  color: 'Red',
  materialWeightGrams: 100,
  printTimeHours: 5,
  laborTimeMinutes: 20,
  deliveryFee: 25,
});

console.log('Test 2: PLA Red, 100g, 5h print, 20min labor, 25 PLN delivery');
console.log('----------------------------------------');
console.log(`Material Cost:      ${test2.Cmaterial.toFixed(2)} PLN`);
console.log(`Energy Cost:        ${test2.Cenergy.toFixed(2)} PLN`);
console.log(`Labor Cost:         ${test2.Clabor.toFixed(2)} PLN`);
console.log(`Depreciation:       ${test2.Cdepreciation.toFixed(2)} PLN`);
console.log(`Maintenance:        ${test2.Cmaintenance.toFixed(2)} PLN`);
console.log('----------------------------------------');
console.log(`Internal Cost:      ${test2.Cinternal.toFixed(2)} PLN`);
console.log(`VAT (23%):          ${test2.vat.toFixed(2)} PLN`);
console.log(`Price w/o Delivery: ${test2.priceWithoutDelivery.toFixed(2)} PLN`);
console.log(`Delivery Fee:       25.00 PLN`);
console.log(`Total Price:        ${test2.totalPrice.toFixed(2)} PLN\n`);

// Test Case 3
const test3 = calculatePrintPrice({
  materialType: 'ABS',
  color: 'Black',
  materialWeightGrams: 200,
  printTimeHours: 10,
  laborTimeMinutes: 30,
  deliveryFee: 0,
});

console.log('Test 3: ABS Black, 200g, 10h print, 30min labor');
console.log('----------------------------------------');
console.log(`Material Cost:      ${test3.Cmaterial.toFixed(2)} PLN`);
console.log(`Energy Cost:        ${test3.Cenergy.toFixed(2)} PLN`);
console.log(`Labor Cost:         ${test3.Clabor.toFixed(2)} PLN`);
console.log(`Depreciation:       ${test3.Cdepreciation.toFixed(2)} PLN`);
console.log(`Maintenance:        ${test3.Cmaintenance.toFixed(2)} PLN`);
console.log('----------------------------------------');
console.log(`Internal Cost:      ${test3.Cinternal.toFixed(2)} PLN`);
console.log(`VAT (23%):          ${test3.vat.toFixed(2)} PLN`);
console.log(`Price w/o Delivery: ${test3.priceWithoutDelivery.toFixed(2)} PLN`);
console.log(`Total Price:        ${test3.totalPrice.toFixed(2)} PLN\n`);
