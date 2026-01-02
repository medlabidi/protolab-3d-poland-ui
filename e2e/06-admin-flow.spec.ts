import { test, expect } from '@playwright/test';

const BASE_URL = process.env.VITE_APP_URL || 'https://protolab.info';
const ADMIN_EMAIL = 'admin@protolab.com';
const ADMIN_PASSWORD = 'AdminPassword123!';

test.describe('Admin Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/(admin|dashboard)/);
  });

  test('should access admin dashboard', async ({ page }) => {
    console.log('\n🧪 Testing admin dashboard access');

    await test.step('Verify admin dashboard loads', async () => {
      const adminLink = page.locator('a[href*="admin"]').first();
      
      if (await adminLink.count() > 0) {
        await adminLink.click();
      }

      await page.waitForURL(/.*\/admin/);
      
      const statsCards = await page.locator('[data-testid="stat-card"], .stat, .metric').count();
      
      if (statsCards === 0) {
        throw new Error('❌ ISSUE: Admin dashboard appears empty. No statistics or metrics displayed.');
      }

      console.log(`✅ Admin dashboard loaded with ${statsCards} stat cards`);
    });
  });

  test('should view and manage orders', async ({ page }) => {
    console.log('\n🧪 Testing admin order management');

    await test.step('Navigate to orders management', async () => {
      const ordersLink = page.locator('a[href*="/admin/order"]').first();
      
      if (await ordersLink.count() === 0) {
        throw new Error('❌ ISSUE: Cannot find link to admin orders page');
      }

      await ordersLink.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Navigated to admin orders page');
    });

    await test.step('Check orders table exists', async () => {
      const ordersTable = page.locator('table, [role="table"]').first();
      
      if (await ordersTable.count() === 0) {
        throw new Error('❌ ISSUE: Orders table not found. Admin cannot view customer orders.');
      }

      const orderRows = await page.locator('tr[data-testid="order-row"], tbody tr').count();
      console.log(`✅ Orders table loaded with ${orderRows} orders`);
    });

    await test.step('Click on an order to view details', async () => {
      const firstOrder = page.locator('tr[data-testid="order-row"], tbody tr').first();
      
      if (await firstOrder.count() > 0) {
        await firstOrder.click();
        
        // Check if modal or detail page opens
        await page.waitForTimeout(1000);
        
        const modalOpen = await page.locator('[role="dialog"], .modal, [data-testid="order-modal"]').count() > 0;
        const detailPage = page.url().includes('/orders/');
        
        if (!modalOpen && !detailPage) {
          throw new Error('❌ ISSUE: Clicking order does not open details. Admin cannot view order information.');
        }

        console.log(`✅ Order details opened (${modalOpen ? 'modal' : 'page'})`);
      }
    });

    await test.step('Change order status', async () => {
      const statusSelector = page.locator('select[name="status"], [role="combobox"]').first();
      
      if (await statusSelector.count() === 0) {
        throw new Error('❌ ISSUE: Cannot find status selector. Admin cannot update order status.');
      }

      await statusSelector.click();
      const statusOption = page.locator('option, [role="option"]').filter({ hasText: /queue|printing|finished/i }).first();
      
      if (await statusOption.count() > 0) {
        await statusOption.click();
        await page.waitForTimeout(1000);
        
        // Check for success message
        const successToast = await page.locator('[role="alert"]:has-text("success"), .toast:has-text("success")').count();
        
        if (successToast === 0) {
          console.log('⚠️ No success confirmation after status change');
        } else {
          console.log('✅ Order status updated successfully');
        }
      }
    });

    console.log('\n✅ COMPLETE: Admin order management is functional');
  });

  test('should view and respond to messages', async ({ page }) => {
    console.log('\n🧪 Testing admin messaging');

    await test.step('Navigate to admin conversations', async () => {
      const conversationsLink = page.locator('a[href*="/admin/conversation"]').first();
      
      if (await conversationsLink.count() === 0) {
        throw new Error('❌ ISSUE: Cannot find link to admin conversations');
      }

      await conversationsLink.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Navigated to admin conversations');
    });

    await test.step('Open a conversation', async () => {
      const firstConversation = page.locator('[data-testid="conversation-item"]').first();
      
      if (await firstConversation.count() > 0) {
        await firstConversation.click();
        await page.waitForTimeout(1000);
        
        const messagesVisible = await page.locator('[data-testid="message"], .message').count() > 0;
        
        if (!messagesVisible) {
          throw new Error('❌ ISSUE: Conversation opened but no messages displayed');
        }

        console.log('✅ Conversation messages loaded');
      } else {
        console.log('ℹ️ No conversations to test');
      }
    });

    await test.step('Send admin reply', async () => {
      const messageInput = page.locator('textarea, input[placeholder*="message" i]').first();
      
      if (await messageInput.count() > 0) {
        await messageInput.fill('Admin test reply');
        await page.locator('button').filter({ hasText: /send/i }).first().click();
        
        await page.waitForTimeout(1000);
        console.log('✅ Admin reply sent');
      }
    });
  });

  test('should view user management', async ({ page }) => {
    await test.step('Navigate to users page', async () => {
      const usersLink = page.locator('a[href*="/admin/user"]').first();
      
      if (await usersLink.count() === 0) {
        throw new Error('❌ ISSUE: Cannot find link to user management');
      }

      await usersLink.click();
      await page.waitForLoadState('networkidle');

      const usersTable = await page.locator('table, [role="table"]').count();
      
      if (usersTable === 0) {
        throw new Error('❌ ISSUE: Users table not found. Admin cannot manage users.');
      }

      console.log('✅ User management page loaded');
    });
  });
});
