import { test, expect } from '@playwright/test';

const BASE_URL = process.env.VITE_APP_URL || 'https://protolab.info';
const TEST_USER_EMAIL = 'test.user@protolab.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

test.describe('Payment and Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/(dashboard|orders)/);
  });

  test('should display payment options for pending order', async ({ page }) => {
    console.log('\n🧪 Testing payment flow');

    await test.step('Navigate to orders and find pending order', async () => {
      await page.goto(`${BASE_URL}/orders`);
      await page.waitForLoadState('networkidle');

      const pendingOrder = page.locator('[data-status="submitted"], [data-status="pending"]').first();
      
      if (await pendingOrder.count() === 0) {
        console.log('⚠️ No pending orders found. Create one first to test payment.');
        return;
      }

      await pendingOrder.click();
      console.log('✅ Opened pending order details');
    });

    await test.step('Check for payment button', async () => {
      const payButton = page.locator('button, a').filter({ hasText: /pay|payment|checkout/i }).first();
      
      if (await payButton.count() === 0) {
        throw new Error('❌ ISSUE: No payment button found for pending order. Users cannot pay for their orders.');
      }

      await payButton.click();
      console.log('✅ Payment button clicked');
    });

    await test.step('Verify payment gateway loads', async () => {
      // Wait for either internal payment page or external redirect
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      const hasPaymentForm = await page.locator('form, [data-testid="payment-form"]').count() > 0;
      const isPayUUrl = currentUrl.includes('payu');
      
      if (!hasPaymentForm && !isPayUUrl) {
        throw new Error('❌ ISSUE: Payment page did not load. Neither payment form nor PayU redirect detected.');
      }

      console.log(`✅ Payment interface loaded (${isPayUUrl ? 'PayU gateway' : 'internal form'})`);
    });

    console.log('\n✅ COMPLETE: Payment flow is accessible');
  });

  test('should show payment status on order', async ({ page }) => {
    await test.step('Check order payment status display', async () => {
      await page.goto(`${BASE_URL}/orders`);
      
      const firstOrder = page.locator('[data-testid="order-item"]').first();
      
      if (await firstOrder.count() > 0) {
        const paymentStatus = await firstOrder.locator('text=/paid|unpaid|pending payment/i').count();
        
        if (paymentStatus === 0) {
          throw new Error('❌ ISSUE: Payment status not visible on orders. Users cannot see which orders are paid.');
        }

        console.log('✅ Payment status is displayed on orders');
      }
    });
  });
});
