# ProtoLab E2E Test Suite 🧪

Comprehensive end-to-end tests that simulate real user behavior on the ProtoLab platform.

## Test Coverage

### 01-user-signup-flow.spec.ts
- ✅ Complete signup workflow (landing → form → dashboard)
- ✅ Duplicate email validation
- ✅ Form field validation
- ✅ Post-signup authentication check

### 02-user-login-flow.spec.ts
- ✅ Login with valid credentials
- ✅ Invalid credentials handling
- ✅ Session persistence across refreshes
- ✅ Token storage verification

### 03-order-creation-flow.spec.ts
- ✅ Full order creation (file upload → material selection → submit)
- ✅ STL file upload
- ✅ Material and color selection
- ✅ Quantity setting
- ✅ Price calculation display
- ✅ Order confirmation
- ✅ Form validation

### 04-payment-flow.spec.ts
- ✅ Payment options display
- ✅ PayU integration check
- ✅ Payment status tracking

### 05-messaging-flow.spec.ts
- ✅ Access conversation system
- ✅ Send messages
- ✅ Receive messages
- ✅ Unread indicators

### 06-admin-flow.spec.ts
- ✅ Admin dashboard access
- ✅ Order management
- ✅ Order status updates
- ✅ View order details
- ✅ Admin messaging
- ✅ User management

### 07-profile-settings.spec.ts
- ✅ View profile information
- ✅ Update profile
- ✅ Logout functionality
- ✅ Session clearing

### 08-edge-cases.spec.ts
- ✅ Network error handling
- ✅ Offline behavior
- ✅ Expired session redirect
- ✅ Invalid order IDs
- ✅ Protected route security

## Running Tests

### Single Run
```bash
# Run all tests once
npx playwright test

# Run specific test file
npx playwright test e2e/01-user-signup-flow.spec.ts

# Run with UI (see tests execute in browser)
npx playwright test --headed

# Run with Playwright inspector
npx playwright test --debug
```

### Overnight Testing (Continuous Loop)
```bash
# Windows
e2e\run-all-tests.bat

# Linux/Mac
chmod +x e2e/run-all-tests.sh
./e2e/run-all-tests.sh
```

The overnight script will:
- Run the entire test suite 100 times (configurable)
- Save HTML report for each iteration
- Wait 30 seconds between iterations
- Continue even if tests fail

## Test Output

### During Tests
Tests produce detailed console output with emoji indicators:
- 🧪 Test starting
- ✅ Step passed
- ❌ Issue detected (with detailed description)
- ⚠️ Warning (non-critical issue)
- ℹ️ Information

### Example Output
```
🧪 Testing signup flow with email: test.user.1735345678@protolab-test.com
✅ Homepage loaded successfully
✅ Navigated to signup page
✅ Signup form filled
✅ Signup successful, redirected to: https://protolab.info/orders
✅ User is successfully logged in
✅ COMPLETE: Signup flow works correctly for new users
```

### Error Reports
When tests find issues, they provide actionable feedback:
```
❌ ISSUE: Cannot find signup button on homepage. 
Expected button with text "Sign Up", "Register", or "Get Started"
```

### Reports Location
- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results/results.json`
- **Screenshots**: `test-results/` (on failure)
- **Videos**: `test-results/` (on failure)
- **Overnight Results**: `e2e-results/report_YYYYMMDD_HHMMSS.html`

## Viewing Reports
```bash
# Open latest HTML report
npx playwright show-report

# Or manually open
playwright-report/index.html
```

## Configuration

Edit `playwright.config.ts` to change:
- **baseURL**: Target different environments
- **retries**: Number of retry attempts
- **workers**: Parallel test execution
- **timeout**: Action/navigation timeouts

## Test Accounts

Tests use these credentials:

**Regular User:**
- Email: `test.user@protolab.com`
- Password: `TestPassword123!`

**Admin User:**
- Email: `admin@protolab.com`  
- Password: `AdminPassword123!`

**Note**: Signup tests create unique users with timestamp-based emails.

## Analyzing Results

After running overnight tests, analyze the results:

```bash
# Count total test runs
ls e2e-results/ | wc -l

# Check for failures in JSON results
cat test-results/results.json | grep "\"status\": \"failed\""
```

## Feeding Feedback to Copilot

When tests detect issues:

1. **Copy the error output** (the ❌ ISSUE messages)
2. **Paste into GitHub Copilot Chat**
3. Include context: "This is from E2E test, please fix"
4. Copilot will understand the issue and propose fixes

Example:
```
❌ ISSUE: Email input field not found on signup page

Hey Copilot, the E2E test found this issue. Can you check 
the signup page and make sure the email input exists?
```

## Common Issues & Solutions

### Test Timeouts
- Increase `actionTimeout` in playwright.config.ts
- Check if production site is slow/down
- Verify network connectivity

### Element Not Found
- Selector might have changed in UI
- Wait time might be too short
- Element might be behind modal/overlay

### Flaky Tests
- Tests are configured with 2 retries
- Network issues are most common cause
- Check if production has rate limiting

### File Upload Issues
- Ensure `e2e/fixtures/test-cube.stl` exists
- File path must be absolute
- File format must be valid STL

## Extending Tests

To add new test scenarios:

1. Create new file: `e2e/09-your-test.spec.ts`
2. Follow the pattern from existing tests
3. Use descriptive step names
4. Provide detailed error messages with ❌ ISSUE format
5. Log success with ✅ and console.log

Example:
```typescript
test('should do something', async ({ page }) => {
  console.log('\\n🧪 Testing something');

  await test.step('Step description', async () => {
    const element = page.locator('selector');
    
    if (await element.count() === 0) {
      throw new Error('❌ ISSUE: Element not found. Impact on users: ...');
    }
    
    console.log('✅ Step completed');
  });
});
```

## CI/CD Integration

Add to GitHub Actions workflow:

```yaml
- name: Run E2E Tests
  run: npx playwright test
  
- name: Upload Report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Monitoring

For production monitoring:
- Run tests every hour via cron/scheduled task
- Alert on failure patterns
- Track performance trends
- Monitor success rates

## Best Practices

1. **Keep tests independent** - Each test should work alone
2. **Use realistic data** - Test with production-like scenarios
3. **Clear state** - Login fresh for each test file
4. **Descriptive names** - Test names should explain what they verify
5. **Actionable errors** - Error messages should guide fixes

## Support

If tests consistently fail:
1. Check production site is accessible
2. Verify test accounts exist and are valid
3. Review recent code changes
4. Check network/firewall settings
5. Run with `--headed` flag to see what's happening

## Resources

- [Playwright Docs](https://playwright.dev)
- [ProtoLab Documentation](../docs/)
- [Test Best Practices](https://playwright.dev/docs/best-practices)
