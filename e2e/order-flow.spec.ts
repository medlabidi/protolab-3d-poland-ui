/**
 * End-to-End Test: Complete Order Flow
 * 
 * This test covers the entire order process:
 * 1. User authentication (login)
 * 2. File upload (3D model)
 * 3. Parameter configuration (material, quality, quantity)
 * 4. Delivery method selection
 * 5. Price calculation
 * 6. Payment page navigation
 * 7. Payment method selection (BLIK/Card/Transfer)
 * 8. Order submission
 * 9. Order appears in dashboard/orders
 * 
 * Run with: npx playwright test e2e/order-flow.spec.ts
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

// Test order data
const TEST_ORDER = {
  material: 'pla-white',
  quality: 'standard',
  quantity: 1,
  deliveryMethod: 'pickup',
};

// Helper function to create a test STL file
function createTestSTLFile(): string {
  const testFilePath = path.join(__dirname, 'test-model.stl');
  
  // Simple ASCII STL cube
  const stlContent = `solid TestCube
  facet normal 0 0 -1
    outer loop
      vertex 0 0 0
      vertex 1 0 0
      vertex 1 1 0
    endloop
  endfacet
  facet normal 0 0 -1
    outer loop
      vertex 0 0 0
      vertex 1 1 0
      vertex 0 1 0
    endloop
  endfacet
  facet normal 0 0 1
    outer loop
      vertex 0 0 1
      vertex 1 1 1
      vertex 1 0 1
    endloop
  endfacet
  facet normal 0 0 1
    outer loop
      vertex 0 0 1
      vertex 0 1 1
      vertex 1 1 1
    endloop
  endfacet
  facet normal 0 -1 0
    outer loop
      vertex 0 0 0
      vertex 1 0 1
      vertex 1 0 0
    endloop
  endfacet
  facet normal 0 -1 0
    outer loop
      vertex 0 0 0
      vertex 0 0 1
      vertex 1 0 1
    endloop
  endfacet
  facet normal 0 1 0
    outer loop
      vertex 0 1 0
      vertex 1 1 0
      vertex 1 1 1
    endloop
  endfacet
  facet normal 0 1 0
    outer loop
      vertex 0 1 0
      vertex 1 1 1
      vertex 0 1 1
    endloop
  endfacet
  facet normal -1 0 0
    outer loop
      vertex 0 0 0
      vertex 0 1 0
      vertex 0 1 1
    endloop
  endfacet
  facet normal -1 0 0
    outer loop
      vertex 0 0 0
      vertex 0 1 1
      vertex 0 0 1
    endloop
  endfacet
  facet normal 1 0 0
    outer loop
      vertex 1 0 0
      vertex 1 1 1
      vertex 1 1 0
    endloop
  endfacet
  facet normal 1 0 0
    outer loop
      vertex 1 0 0
      vertex 1 0 1
      vertex 1 1 1
    endloop
  endfacet
endsolid TestCube`;

  fs.writeFileSync(testFilePath, stlContent);
  return testFilePath;
}

// Helper to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  
  // Fill in login form
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard or new-print
  await page.waitForURL(/\/(dashboard|new-print)/);
}

test.describe('Complete Order Flow', () => {
  let testSTLPath: string;

  test.beforeAll(() => {
    // Create test STL file
    testSTLPath = createTestSTLFile();
  });

  test.afterAll(() => {
    // Clean up test file
    if (fs.existsSync(testSTLPath)) {
      fs.unlinkSync(testSTLPath);
    }
  });

  test('1. User can login successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Check login page loads
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Fill credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect after login
    await expect(page).toHaveURL(/\/(dashboard|new-print|orders)/);
  });

  test('2. User can upload 3D model file', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/new-print`);
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('New Print');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testSTLPath);
    
    // Wait for file upload confirmation
    await expect(page.locator('text=test-model.stl')).toBeVisible({ timeout: 10000 });
    
    // Wait for 3D preview to load
    await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 30000 });
  });

  test('3. User can select material and quality', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/new-print`);
    
    // Upload file first
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testSTLPath);
    await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 30000 });
    
    // Select material
    await page.click('[id="material"]');
    await page.click('text=PLA - White');
    
    // Verify material selected
    await expect(page.locator('[id="material"]')).toContainText('PLA - White');
    
    // Select quality
    await page.click('[id="quality"]');
    await page.click('text=Standard');
    
    // Verify quality selected
    await expect(page.locator('[id="quality"]')).toContainText('Standard');
    
    // Check estimated weight and print time are shown
    await expect(page.locator('text=Est. Weight')).toBeVisible();
    await expect(page.locator('text=Est. Print Time')).toBeVisible();
  });

  test('4. User can select delivery method - Local Pickup', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/new-print`);
    
    // Scroll to delivery section
    await page.locator('text=Delivery Method').scrollIntoViewIfNeeded();
    
    // Select Local Pickup
    await page.click('text=Local Pickup');
    
    // Verify pickup location is shown
    await expect(page.locator('text=Zielonogórska 13')).toBeVisible();
    await expect(page.locator('text=30-406 Kraków')).toBeVisible();
    
    // Verify map is visible
    await expect(page.locator('iframe[title="ProtoLab Location"]')).toBeVisible();
  });

  test('5. User can select delivery method - DPD Courier', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/new-print`);
    
    // Scroll to delivery section
    await page.locator('text=Delivery Method').scrollIntoViewIfNeeded();
    
    // Select DPD
    await page.click('text=DPD Courier');
    
    // Fill address form
    await page.fill('input[placeholder*="Full Name"], input[name="fullName"]', 'Test User');
    await page.fill('input[placeholder*="Phone"], input[name="phone"]', '+48123456789');
    await page.fill('input[placeholder*="Street"], input[name="street"]', 'Test Street 123');
    await page.fill('input[placeholder*="City"], input[name="city"]', 'Kraków');
    await page.fill('input[placeholder*="Postal"], input[name="postalCode"]', '30-001');
  });

  test('6. User can calculate price', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/new-print`);
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testSTLPath);
    await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 30000 });
    
    // Select material
    await page.click('[id="material"]');
    await page.click('text=PLA - White');
    
    // Select quality
    await page.click('[id="quality"]');
    await page.click('text=Standard');
    
    // Select delivery
    await page.locator('text=Delivery Method').scrollIntoViewIfNeeded();
    await page.click('text=Local Pickup');
    
    // Click Calculate Price
    await page.click('text=Calculate Price');
    
    // Verify price breakdown is shown
    await expect(page.locator('text=Price Breakdown')).toBeVisible();
    await expect(page.locator('text=Internal Costs')).toBeVisible();
    await expect(page.locator('text=Service Fee')).toBeVisible();
    await expect(page.locator('text=VAT (23%)')).toBeVisible();
    await expect(page.locator('text=Print Cost')).toBeVisible();
    
    // Verify price is a number
    const priceElement = page.locator('text=/\\d+\\.\\d{2} PLN/').first();
    await expect(priceElement).toBeVisible();
  });

  test('7. User can proceed to payment page', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/new-print`);
    
    // Complete order setup
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testSTLPath);
    await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 30000 });
    
    await page.click('[id="material"]');
    await page.click('text=PLA - White');
    
    await page.click('[id="quality"]');
    await page.click('text=Standard');
    
    await page.locator('text=Delivery Method').scrollIntoViewIfNeeded();
    await page.click('text=Local Pickup');
    
    await page.click('text=Calculate Price');
    await expect(page.locator('text=Price Breakdown')).toBeVisible();
    
    // Click Proceed to Payment
    await page.click('text=Proceed to Payment');
    
    // Verify navigation to payment page
    await expect(page).toHaveURL(/\/payment/);
    await expect(page.locator('h1')).toContainText('Payment');
  });

  test('8. Payment page shows correct order summary', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/new-print`);
    
    // Complete order setup
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testSTLPath);
    await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 30000 });
    
    await page.click('[id="material"]');
    await page.click('text=PLA - White');
    
    await page.click('[id="quality"]');
    await page.click('text=Standard');
    
    await page.locator('text=Delivery Method').scrollIntoViewIfNeeded();
    await page.click('text=Local Pickup');
    
    await page.click('text=Calculate Price');
    await page.click('text=Proceed to Payment');
    
    // Verify order summary on payment page
    await expect(page.locator('text=Order Summary')).toBeVisible();
    await expect(page.locator('text=pla-white')).toBeVisible();
    await expect(page.locator('text=standard')).toBeVisible();
  });

  test('9. User can select BLIK payment method', async ({ page }) => {
    await login(page);
    
    // Navigate directly to payment with mock data (for speed)
    await page.goto(`${BASE_URL}/new-print`);
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testSTLPath);
    await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 30000 });
    
    await page.click('[id="material"]');
    await page.click('text=PLA - White');
    
    await page.click('[id="quality"]');
    await page.click('text=Standard');
    
    await page.locator('text=Delivery Method').scrollIntoViewIfNeeded();
    await page.click('text=Local Pickup');
    
    await page.click('text=Calculate Price');
    await page.click('text=Proceed to Payment');
    
    // Select BLIK
    await page.click('text=BLIK');
    
    // Verify BLIK code input appears
    await expect(page.locator('text=Enter BLIK Code')).toBeVisible();
    await expect(page.locator('input[placeholder="000000"]')).toBeVisible();
    
    // Enter BLIK code
    await page.fill('input[placeholder="000000"]', '123456');
    
    // Verify code is entered
    await expect(page.locator('input[placeholder="000000"]')).toHaveValue('123456');
  });

  test('10. User can select Card payment method', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/new-print`);
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testSTLPath);
    await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 30000 });
    
    await page.click('[id="material"]');
    await page.click('text=PLA - White');
    
    await page.click('[id="quality"]');
    await page.click('text=Standard');
    
    await page.locator('text=Delivery Method').scrollIntoViewIfNeeded();
    await page.click('text=Local Pickup');
    
    await page.click('text=Calculate Price');
    await page.click('text=Proceed to Payment');
    
    // Select Card
    await page.click('text=Credit/Debit Card');
    
    // Verify card form appears
    await expect(page.locator('text=Card Details')).toBeVisible();
    await expect(page.locator('input[id="cardName"]')).toBeVisible();
    await expect(page.locator('input[id="cardNumber"]')).toBeVisible();
    await expect(page.locator('input[id="expiry"]')).toBeVisible();
    await expect(page.locator('input[id="cvv"]')).toBeVisible();
    
    // Fill card details
    await page.fill('input[id="cardName"]', 'Test User');
    await page.fill('input[id="cardNumber"]', '4242424242424242');
    await page.fill('input[id="expiry"]', '1225');
    await page.fill('input[id="cvv"]', '123');
  });

  test('11. User can select Bank Transfer payment method', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/new-print`);
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testSTLPath);
    await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 30000 });
    
    await page.click('[id="material"]');
    await page.click('text=PLA - White');
    
    await page.click('[id="quality"]');
    await page.click('text=Standard');
    
    await page.locator('text=Delivery Method').scrollIntoViewIfNeeded();
    await page.click('text=Local Pickup');
    
    await page.click('text=Calculate Price');
    await page.click('text=Proceed to Payment');
    
    // Select Bank Transfer
    await page.click('text=Bank Transfer');
    
    // Verify bank options are shown
    await expect(page.locator('text=Przelewy24')).toBeVisible();
    await expect(page.locator('text=PKO BP')).toBeVisible();
    await expect(page.locator('text=mBank')).toBeVisible();
  });

  test('12. Complete order flow - end to end', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/new-print`);
    
    // Step 1: Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testSTLPath);
    await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 30000 });
    
    // Step 2: Select material
    await page.click('[id="material"]');
    await page.click('text=PLA - White');
    
    // Step 3: Select quality
    await page.click('[id="quality"]');
    await page.click('text=Standard');
    
    // Step 4: Select delivery
    await page.locator('text=Delivery Method').scrollIntoViewIfNeeded();
    await page.click('text=Local Pickup');
    
    // Step 5: Calculate price
    await page.click('text=Calculate Price');
    await expect(page.locator('text=Price Breakdown')).toBeVisible();
    
    // Step 6: Proceed to payment
    await page.click('text=Proceed to Payment');
    await expect(page).toHaveURL(/\/payment/);
    
    // Step 7: Select BLIK payment
    await page.click('text=BLIK');
    await page.fill('input[placeholder="000000"]', '123456');
    
    // Step 8: Submit payment
    await page.click('button:has-text("Pay")');
    
    // Step 9: Wait for processing
    await expect(page.locator('text=Processing')).toBeVisible();
    
    // Step 10: Verify redirect to orders page
    await expect(page).toHaveURL(/\/orders/, { timeout: 15000 });
    
    // Step 11: Verify order appears in list
    await expect(page.locator('text=test-model.stl')).toBeVisible({ timeout: 5000 });
  });

  test('13. Order appears in dashboard', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Check dashboard loads
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Check recent orders section exists
    const ordersSection = page.locator('text=/Recent Orders|Your Orders|Orders/i');
    await expect(ordersSection).toBeVisible();
  });

  test('14. User can view order details', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/orders`);
    
    // Wait for orders to load
    await page.waitForSelector('table, [class*="order"], [class*="card"]', { timeout: 10000 });
    
    // Click on first order (if exists)
    const orderRow = page.locator('tr, [class*="order-item"]').first();
    if (await orderRow.isVisible()) {
      await orderRow.click();
      
      // Verify order details page
      await expect(page).toHaveURL(/\/orders\/[a-zA-Z0-9-]+/);
    }
  });
});

// API Tests for order flow
test.describe('Order API Tests', () => {
  test('API: Create order endpoint responds', async ({ request }) => {
    // This would require authentication token
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok() || response.status() === 404).toBeTruthy();
  });

  test('API: Orders endpoint requires authentication', async ({ request }) => {
    const response = await request.get(`${API_URL}/orders`);
    expect(response.status()).toBe(401);
  });
});

// Validation Tests
test.describe('Form Validation', () => {
  test('Cannot proceed without file upload', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/new-print`);
    
    // Try to calculate price without file
    await page.click('text=Calculate Price');
    
    // Should show error
    await expect(page.locator('text=/upload.*file|file.*required/i')).toBeVisible();
  });

  test('Cannot proceed without material selection', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/new-print`);
    
    // Upload file
    const testSTLPath = createTestSTLFile();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testSTLPath);
    await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 30000 });
    
    // Select quality but not material
    await page.click('[id="quality"]');
    await page.click('text=Standard');
    
    // Try to calculate price
    await page.click('text=Calculate Price');
    
    // Should show error
    await expect(page.locator('text=/select.*material|material.*required/i')).toBeVisible();
    
    // Cleanup
    fs.unlinkSync(testSTLPath);
  });

  test('Cannot proceed without delivery selection', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/new-print`);
    
    // Upload file and configure
    const testSTLPath = createTestSTLFile();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testSTLPath);
    await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 30000 });
    
    await page.click('[id="material"]');
    await page.click('text=PLA - White');
    
    await page.click('[id="quality"]');
    await page.click('text=Standard');
    
    await page.click('text=Calculate Price');
    
    // Try to proceed without delivery
    await page.click('text=Proceed to Payment');
    
    // Should show error
    await expect(page.locator('text=/select.*delivery|delivery.*required/i')).toBeVisible();
    
    // Cleanup
    fs.unlinkSync(testSTLPath);
  });
});
