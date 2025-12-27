import { test, expect } from '@playwright/test';

const BASE_URL = process.env.VITE_APP_URL || 'https://protolab.info';

test.describe('Edge Cases and Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    console.log('\n🧪 Testing error handling');

    await test.step('Test offline behavior', async () => {
      await page.goto(`${BASE_URL}/login`);
      
      // Simulate offline
      await page.context().setOffline(true);
      
      await page.locator('input[type="email"]').fill('test@test.com');
      await page.locator('input[type="password"]').fill('password');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(3000);

      // Should show error message
      const errorMessage = await page.locator('[role="alert"], .error, .toast').count();
      
      if (errorMessage === 0) {
        throw new Error('❌ ISSUE: No error message shown when offline. Users get no feedback about connection issues.');
      }

      console.log('✅ Offline error handled with user feedback');
      
      await page.context().setOffline(false);
    });
  });

  test('should validate file size limits', async ({ page }) => {
    await test.step('Try uploading oversized file', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.locator('input[type="email"]').fill('test.user@protolab.com');
      await page.locator('input[type="password"]').fill('TestPassword123!');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/.*\/(dashboard|orders)/);

      await page.goto(`${BASE_URL}/upload`);
      
      // Note: This test needs a large file in fixtures
      console.log('ℹ️ File size validation test requires large test file');
    });
  });

  test('should handle expired session', async ({ page }) => {
    await test.step('Clear token and try accessing protected page', async () => {
      await page.goto(BASE_URL);
      
      // Clear tokens
      await page.evaluate(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });

      // Try accessing protected page
      await page.goto(`${BASE_URL}/orders`);
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      
      if (!currentUrl.includes('login')) {
        throw new Error('❌ ISSUE: Protected page accessible without authentication. Security vulnerability!');
      }

      console.log('✅ Protected routes properly redirect unauthenticated users');
    });
  });

  test('should handle invalid order IDs', async ({ page }) => {
    await test.step('Access non-existent order', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.locator('input[type="email"]').fill('test.user@protolab.com');
      await page.locator('input[type="password"]').fill('TestPassword123!');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/.*\/(dashboard|orders)/);

      // Try accessing fake order
      await page.goto(`${BASE_URL}/orders/00000000-0000-0000-0000-000000000000`);
      await page.waitForTimeout(2000);

      const errorMessage = await page.locator('[role="alert"], .error, text=/not found|doesn\'t exist/i').count();
      
      if (errorMessage === 0) {
        console.log('⚠️ No clear error message for invalid order ID');
      } else {
        console.log('✅ Invalid order ID handled with error message');
      }
    });
  });
});
