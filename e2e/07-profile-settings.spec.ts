import { test, expect } from '@playwright/test';

const BASE_URL = process.env.VITE_APP_URL || 'https://protolab.info';
const TEST_USER_EMAIL = 'test.user@protolab.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

test.describe('User Profile and Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/(dashboard|orders)/);
  });

  test('should access and view profile', async ({ page }) => {
    console.log('\n🧪 Testing user profile access');

    await test.step('Navigate to profile', async () => {
      const profileLink = page.locator('a[href*="profile"], a[href*="account"], button[aria-label*="profile"]').first();
      
      if (await profileLink.count() === 0) {
        throw new Error('❌ ISSUE: Cannot find link to profile/account settings');
      }

      await profileLink.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Navigated to profile page');
    });

    await test.step('Check profile information display', async () => {
      const nameField = page.locator('input[name="name"], [data-testid="user-name"]').first();
      const emailField = page.locator('input[name="email"], [data-testid="user-email"]').first();

      if (await nameField.count() === 0 && await emailField.count() === 0) {
        throw new Error('❌ ISSUE: Profile information not displayed. Users cannot view their details.');
      }

      console.log('✅ Profile information is visible');
    });
  });

  test('should update profile information', async ({ page }) => {
    await test.step('Edit profile', async () => {
      await page.goto(`${BASE_URL}/profile`);
      
      const nameInput = page.locator('input[name="name"]').first();
      
      if (await nameInput.count() > 0) {
        const newName = `Updated User ${Date.now()}`;
        await nameInput.fill(newName);
        
        const saveButton = page.locator('button').filter({ hasText: /save|update/i }).first();
        
        if (await saveButton.count() === 0) {
          throw new Error('❌ ISSUE: No save button found for profile updates');
        }

        await saveButton.click();
        await page.waitForTimeout(2000);

        const successMessage = await page.locator('[role="alert"]:has-text("success"), .toast:has-text("success")').count();
        
        if (successMessage === 0) {
          throw new Error('❌ ISSUE: No success confirmation after profile update');
        }

        console.log('✅ Profile updated successfully');
      }
    });
  });

  test('should logout successfully', async ({ page }) => {
    await test.step('Click logout', async () => {
      const logoutButton = page.locator('button, a').filter({ hasText: /logout|sign out/i }).first();
      
      if (await logoutButton.count() === 0) {
        throw new Error('❌ ISSUE: Logout button not found. Users cannot log out.');
      }

      await logoutButton.click();
      await page.waitForURL(/.*\/(login|home|$)/, { timeout: 5000 });

      // Verify logged out
      const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
      
      if (accessToken) {
        throw new Error('❌ ISSUE: Access token still present after logout. Session not properly cleared.');
      }

      console.log('✅ Logout successful and session cleared');
    });
  });
});
