import { test, expect } from '@playwright/test';

const BASE_URL = process.env.VITE_APP_URL || 'https://protolab.info';
const TEST_USER_EMAIL = 'test.user@protolab.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

test.describe('User Login Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    console.log(`\n🧪 Testing login flow with email: ${TEST_USER_EMAIL}`);

    await test.step('Navigate to login page', async () => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page).toHaveURL(/.*\/login/);
      console.log('✅ Login page loaded');
    });

    await test.step('Fill login form', async () => {
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      if (await emailInput.count() === 0) {
        throw new Error('❌ ISSUE: Email input not found on login page');
      }
      if (await passwordInput.count() === 0) {
        throw new Error('❌ ISSUE: Password input not found on login page');
      }

      await emailInput.fill(TEST_USER_EMAIL);
      await passwordInput.fill(TEST_USER_PASSWORD);
      console.log('✅ Login credentials entered');
    });

    await test.step('Submit login form', async () => {
      const loginButton = page.locator('button[type="submit"], button').filter({ hasText: /login|sign in/i }).first();
      await loginButton.click();

      // Wait for redirect
      await page.waitForURL(/.*\/(dashboard|orders)/, { timeout: 10000 });
      console.log('✅ Login successful, redirected to dashboard');
    });

    await test.step('Verify user session', async () => {
      // Check localStorage for token
      const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
      
      if (!accessToken) {
        throw new Error('❌ ISSUE: No access token found in localStorage after login');
      }

      console.log('✅ User session established with valid token');
    });

    console.log(`\n✅ COMPLETE: Login flow works correctly`);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await test.step('Try login with wrong password', async () => {
      await page.goto(`${BASE_URL}/login`);
      
      await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
      await page.locator('input[type="password"]').fill('WrongPassword123!');
      await page.locator('button[type="submit"]').click();

      // Should show error
      await page.waitForSelector('[role="alert"], .error, .toast', { timeout: 5000 });
      const errorText = await page.locator('[role="alert"], .error, .toast').first().textContent();

      if (!errorText?.toLowerCase().includes('invalid') && !errorText?.toLowerCase().includes('incorrect')) {
        throw new Error(`❌ ISSUE: Error message for wrong credentials is unclear: "${errorText}"`);
      }

      console.log('✅ Invalid credentials properly rejected');
    });
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    await test.step('Login and refresh page', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
      await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
      await page.locator('button[type="submit"]').click();
      
      await page.waitForURL(/.*\/(dashboard|orders)/);
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should still be logged in
      const currentUrl = page.url();
      if (currentUrl.includes('login')) {
        throw new Error('❌ ISSUE: User session not maintained after page refresh. Redirected back to login.');
      }

      console.log('✅ Session persists across page refresh');
    });
  });
});
