import { test, expect } from '@playwright/test';

const BASE_URL = process.env.VITE_APP_URL || 'https://protolab.info';

test.describe('User Signup and Onboarding Flow', () => {
  test('should complete full signup workflow from landing to dashboard', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test.user.${timestamp}@protolab-test.com`;
    const testPassword = 'TestPassword123!';
    const testName = `Test User ${timestamp}`;

    console.log(`\n🧪 Testing signup flow with email: ${testEmail}`);

    // Step 1: Navigate to homepage
    await test.step('Navigate to homepage', async () => {
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/ProtoLab/i);
      console.log('✅ Homepage loaded successfully');
    });

    // Step 2: Find and click signup/register button
    await test.step('Find and click signup button', async () => {
      const signupButton = page.locator('button, a').filter({ hasText: /sign up|register|get started/i }).first();
      
      if (await signupButton.count() === 0) {
        throw new Error('❌ ISSUE: Cannot find signup button on homepage. Expected button with text "Sign Up", "Register", or "Get Started"');
      }
      
      await signupButton.click();
      await page.waitForURL(/.*\/(signup|register).*/i, { timeout: 10000 });
      console.log('✅ Navigated to signup page');
    });

    // Step 3: Fill signup form
    await test.step('Fill signup form', async () => {
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i], input[type="text"]').first();
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      if (await nameInput.count() === 0) {
        throw new Error('❌ ISSUE: Name input field not found on signup page');
      }
      if (await emailInput.count() === 0) {
        throw new Error('❌ ISSUE: Email input field not found on signup page');
      }
      if (await passwordInput.count() === 0) {
        throw new Error('❌ ISSUE: Password input field not found on signup page');
      }

      await nameInput.fill(testName);
      await emailInput.fill(testEmail);
      await passwordInput.fill(testPassword);
      
      console.log('✅ Signup form filled');
    });

    // Step 4: Submit signup form
    await test.step('Submit signup form', async () => {
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /sign up|register|create account/i }).first();
      
      if (await submitButton.count() === 0) {
        throw new Error('❌ ISSUE: Submit button not found on signup page');
      }

      await submitButton.click();
      
      // Wait for either success redirect or error message
      await Promise.race([
        page.waitForURL(/.*\/(dashboard|orders|login).*/i, { timeout: 15000 }),
        page.waitForSelector('[role="alert"], .error, .toast', { timeout: 5000 }).catch(() => {})
      ]);

      const currentUrl = page.url();
      if (currentUrl.includes('signup') || currentUrl.includes('register')) {
        const errorMsg = await page.locator('[role="alert"], .error, .toast').first().textContent();
        console.log(`⚠️ Still on signup page. Error message: ${errorMsg}`);
        throw new Error(`❌ ISSUE: Signup failed or did not redirect. Error: ${errorMsg}`);
      }

      console.log(`✅ Signup successful, redirected to: ${currentUrl}`);
    });

    // Step 5: Verify user is logged in
    await test.step('Verify user is logged in and can access dashboard', async () => {
      // Look for user-specific elements
      const userMenuExists = await page.locator('[data-testid="user-menu"], button:has-text("' + testName + '"), [aria-label*="user" i]').count() > 0;
      const logoutExists = await page.locator('button, a').filter({ hasText: /logout|sign out/i }).count() > 0;

      if (!userMenuExists && !logoutExists) {
        throw new Error('❌ ISSUE: User does not appear to be logged in. Cannot find user menu or logout button.');
      }

      console.log('✅ User is successfully logged in');
    });

    console.log(`\n✅ COMPLETE: Signup flow works correctly for new users`);
  });

  test('should prevent duplicate email signup', async ({ page }) => {
    const existingEmail = 'duplicate.test@protolab.com';
    
    await test.step('Attempt signup with duplicate email', async () => {
      await page.goto(`${BASE_URL}/signup`);
      
      await page.locator('input[name="name"]').fill('Duplicate User');
      await page.locator('input[type="email"]').fill(existingEmail);
      await page.locator('input[type="password"]').fill('Password123!');
      
      await page.locator('button[type="submit"]').click();
      
      // Should show error
      await page.waitForSelector('[role="alert"], .error, .toast', { timeout: 5000 });
      const errorText = await page.locator('[role="alert"], .error, .toast').first().textContent();
      
      if (!errorText?.toLowerCase().includes('already') && !errorText?.toLowerCase().includes('exists')) {
        throw new Error(`❌ ISSUE: Error message for duplicate email is unclear: "${errorText}". Expected message about email already existing.`);
      }
      
      console.log('✅ Duplicate email properly rejected with clear error message');
    });
  });
});
