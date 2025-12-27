import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for ProtoLab E2E tests
 * 
 * Run all tests: npx playwright test
 * Run specific test: npx playwright test e2e/01-user-signup-flow.spec.ts
 * Run with UI: npx playwright test --ui
 * Run headed: npx playwright test --headed
 * Run overnight: ./e2e/run-all-tests.bat (Windows) or ./e2e/run-all-tests.sh (Linux/Mac)
 * 
 * Testing production site: https://protolab.info
 */

export default defineConfig({
  testDir: './e2e',
  
  /* Run tests in sequence for realistic user simulation */
  fullyParallel: false,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry failed tests for flaky network issues */
  retries: 2,
  
  /* Run 1 test at a time to simulate real user behavior */
  workers: 1,
  
  /* Detailed reporting */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL - testing production */
    baseURL: process.env.VITE_APP_URL || 'https://protolab.info',

    /* Collect trace on failure for debugging */
    trace: 'retain-on-failure',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
    
    /* Increased timeouts for production testing */
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 
   * Web servers are disabled by default.
   * Start your dev servers manually before running tests:
   *   npm run dev (in root folder)
   * Or uncomment below to auto-start (may have issues on Windows)
   */
  // webServer: [
  //   {
  //     command: 'npm run dev:client',
  //     url: 'http://localhost:8080',
  //     reuseExistingServer: true,
  //     timeout: 120 * 1000,
  //   },
  //   {
  //     command: 'npm run dev:server',
  //     url: 'http://localhost:5000/api/health',
  //     reuseExistingServer: true,
  //     timeout: 120 * 1000,
  //   },
  // ],
});
