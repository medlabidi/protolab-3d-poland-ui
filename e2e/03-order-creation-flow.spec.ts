import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = process.env.VITE_APP_URL || 'https://protolab.info';
const TEST_USER_EMAIL = 'test.user@protolab.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

test.describe('Order Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/(dashboard|orders)/);
  });

  test('should create new order with STL file upload', async ({ page }) => {
    console.log('\n🧪 Testing full order creation workflow');

    await test.step('Navigate to create order page', async () => {
      const createButton = page.locator('button, a').filter({ hasText: /new order|create order|upload/i }).first();
      
      if (await createButton.count() === 0) {
        throw new Error('❌ ISSUE: Cannot find "Create Order" or "New Order" button on dashboard');
      }

      await createButton.click();
      await page.waitForURL(/.*\/(order|upload|create)/, { timeout: 10000 });
      console.log('✅ Navigated to order creation page');
    });

    await test.step('Upload 3D model file', async () => {
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.count() === 0) {
        throw new Error('❌ ISSUE: File upload input not found on order creation page');
      }

      // Create a test STL file path (you need to have this file)
      const testFilePath = path.join(process.cwd(), 'e2e', 'fixtures', 'test-cube.stl');
      
      try {
        await fileInput.setInputFiles(testFilePath);
        await page.waitForTimeout(2000); // Wait for upload processing
        console.log('✅ File uploaded successfully');
      } catch (error) {
        throw new Error(`❌ ISSUE: File upload failed. Make sure test-cube.stl exists in e2e/fixtures/. Error: ${error}`);
      }
    });

    await test.step('Select material and color', async () => {
      const materialSelector = page.locator('select[name="material"], [role="combobox"]').filter({ hasText: /material/i }).first();
      const colorSelector = page.locator('select[name="color"], [role="combobox"]').filter({ hasText: /color/i }).first();

      if (await materialSelector.count() === 0) {
        throw new Error('❌ ISSUE: Material selector not found. Users cannot choose print material.');
      }

      if (await colorSelector.count() === 0) {
        throw new Error('❌ ISSUE: Color selector not found. Users cannot choose print color.');
      }

      await materialSelector.click();
      await page.locator('option, [role="option"]').filter({ hasText: /pla/i }).first().click();
      
      await colorSelector.click();
      await page.locator('option, [role="option"]').filter({ hasText: /black|white/i }).first().click();

      console.log('✅ Material and color selected');
    });

    await test.step('Set quantity', async () => {
      const quantityInput = page.locator('input[name="quantity"], input[type="number"]').first();
      
      if (await quantityInput.count() > 0) {
        await quantityInput.fill('2');
        console.log('✅ Quantity set to 2');
      } else {
        console.log('⚠️ Quantity input not found (may be optional)');
      }
    });

    await test.step('View price calculation', async () => {
      const priceElement = page.locator('text=/price|total|cost/i').first();
      
      await page.waitForTimeout(1000); // Wait for price calculation
      
      if (await priceElement.count() === 0) {
        throw new Error('❌ ISSUE: Price not displayed. Users cannot see order cost before submitting.');
      }

      const priceText = await priceElement.textContent();
      console.log(`✅ Price displayed: ${priceText}`);

      if (!priceText?.match(/\d+/)) {
        throw new Error(`❌ ISSUE: Price appears invalid or not calculated: "${priceText}"`);
      }
    });

    await test.step('Submit order', async () => {
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /submit|create|place order/i }).first();
      
      if (await submitButton.count() === 0) {
        throw new Error('❌ ISSUE: Submit button not found. Cannot complete order creation.');
      }

      await submitButton.click();
      
      // Wait for success or error
      await Promise.race([
        page.waitForURL(/.*\/(orders|payment|success)/, { timeout: 15000 }),
        page.waitForSelector('[role="alert"]:has-text("success"), .toast:has-text("success")', { timeout: 15000 })
      ]);

      console.log('✅ Order submitted successfully');
    });

    await test.step('Verify order appears in orders list', async () => {
      await page.goto(`${BASE_URL}/orders`);
      await page.waitForLoadState('networkidle');

      const ordersList = page.locator('[data-testid="order-item"], .order-card, tr').first();
      
      if (await ordersList.count() === 0) {
        throw new Error('❌ ISSUE: No orders found in orders list after creation. Order may not have been saved.');
      }

      console.log('✅ Order visible in orders list');
    });

    console.log('\n✅ COMPLETE: Order creation flow works end-to-end');
  });

  test('should validate required fields', async ({ page }) => {
    await test.step('Try submitting empty form', async () => {
      await page.goto(`${BASE_URL}/upload`);
      
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should show validation errors
      const errorMessages = await page.locator('[role="alert"], .error, input:invalid').count();
      
      if (errorMessages === 0) {
        throw new Error('❌ ISSUE: Form validation not working. Empty form was submitted without errors.');
      }

      console.log('✅ Form validation prevents empty submission');
    });
  });
});
