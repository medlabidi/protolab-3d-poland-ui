import { test, expect } from '@playwright/test';

const BASE_URL = process.env.VITE_APP_URL || 'https://protolab.info';
const TEST_USER_EMAIL = 'test.user@protolab.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

test.describe('Messaging and Support Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/(dashboard|orders)/);
  });

  test('should send message to support about an order', async ({ page }) => {
    console.log('\n🧪 Testing messaging/support flow');

    await test.step('Navigate to conversations or messages', async () => {
      const conversationsLink = page.locator('a[href*="conversation"], a[href*="message"], a[href*="support"]').first();
      
      if (await conversationsLink.count() === 0) {
        throw new Error('❌ ISSUE: No link to conversations/messages found. Users cannot access support messaging.');
      }

      await conversationsLink.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Navigated to conversations page');
    });

    await test.step('Start new conversation or open existing', async () => {
      const existingConversation = page.locator('[data-testid="conversation-item"]').first();
      
      if (await existingConversation.count() > 0) {
        await existingConversation.click();
        console.log('✅ Opened existing conversation');
      } else {
        const newConversationButton = page.locator('button').filter({ hasText: /new|start|create/i }).first();
        
        if (await newConversationButton.count() > 0) {
          await newConversationButton.click();
          console.log('✅ Started new conversation');
        } else {
          throw new Error('❌ ISSUE: Cannot start new conversation. No existing conversations and no "New Conversation" button found.');
        }
      }
    });

    await test.step('Send a test message', async () => {
      const messageInput = page.locator('textarea, input[placeholder*="message" i]').first();
      const sendButton = page.locator('button').filter({ hasText: /send/i }).first();

      if (await messageInput.count() === 0) {
        throw new Error('❌ ISSUE: Message input field not found. Users cannot type messages.');
      }

      if (await sendButton.count() === 0) {
        throw new Error('❌ ISSUE: Send button not found. Users cannot send messages.');
      }

      const testMessage = `Test message sent at ${new Date().toISOString()}`;
      await messageInput.fill(testMessage);
      await sendButton.click();

      // Wait for message to appear
      await page.waitForTimeout(2000);
      
      const sentMessage = page.locator(`text="${testMessage}"`).first();
      if (await sentMessage.count() === 0) {
        throw new Error('❌ ISSUE: Sent message does not appear in conversation. Message may not have been saved.');
      }

      console.log('✅ Message sent and displayed successfully');
    });

    await test.step('Check for unread indicator', async () => {
      // Navigate away and back
      await page.goto(`${BASE_URL}/orders`);
      await page.goto(`${BASE_URL}/conversations`);

      // Check if there's any visual indication of new messages
      const unreadIndicator = await page.locator('.unread, [data-unread="true"], .badge, .dot').count();
      
      console.log(`ℹ️ Unread indicators found: ${unreadIndicator}`);
    });

    console.log('\n✅ COMPLETE: Messaging system is functional');
  });
});
