# 🚀 Quick Start: Running E2E Tests

## Run Tests Now (5 minutes)

```bash
# Install dependencies (if not already installed)
npm install

# Run all tests
npm run test:e2e

# View report
npm run test:e2e:report
```

## Run Tests Overnight (Continuous)

### Windows:
```bash
e2e\run-all-tests.bat
```

### Linux/Mac:
```bash
chmod +x e2e/run-all-tests.sh
./e2e/run-all-tests.sh
```

## Get AI-Ready Feedback

After tests finish:

```bash
# Analyze results and get Copilot-ready feedback
npm run test:e2e:analyze
```

This will output something like:

```
📋 COPY THIS TO COPILOT:

I ran E2E tests on ProtoLab and found the following issues:

1. **should complete full signup workflow**
   - Test: User Signup and Onboarding Flow
   - Error: ❌ ISSUE: Email input field not found on signup page

2. **should create new order with STL file upload**
   - Test: Order Creation Flow
   - Error: ❌ ISSUE: Price not displayed. Users cannot see order cost.

Please analyze these issues and suggest fixes.
```

**Copy that entire section** → Paste into GitHub Copilot → Let it fix!

## Test Scenarios Covered

✅ User signup & login  
✅ Order creation & file upload  
✅ Payment flow  
✅ Messaging system  
✅ Admin dashboard  
✅ Profile management  
✅ Error handling  
✅ Security (protected routes)  

## What Happens During Tests?

The tests will:
1. Visit https://protolab.info (production)
2. Create test users with unique emails
3. Upload 3D models
4. Create orders
5. Send messages
6. Test admin functions
7. Check error handling

All automatically, like a real user would!

## Understanding Results

### ✅ Green = Working
```
✅ Signup form filled
✅ Order submitted successfully
```

### ❌ Red = Broken (needs fix)
```
❌ ISSUE: Email input not found on signup page
❌ ISSUE: Price not displayed before order submission
```

### ⚠️ Yellow = Warning (not critical)
```
⚠️ No success confirmation after profile update
```

## Debugging Failed Tests

### See what's happening:
```bash
npm run test:e2e:headed
```
This opens a browser so you can watch the tests.

### Step through slowly:
```bash
npm run test:e2e:debug
```
This lets you step through each action.

### Check screenshots:
Failed tests save screenshots to `test-results/`

### Watch videos:
Failed tests record videos to `test-results/`

## Common Questions

**Q: How long do tests take?**  
A: 5-10 minutes for all tests

**Q: Do I need test accounts?**  
A: Signup tests create new users automatically. Other tests use:
- User: `test.user@protolab.com` / `TestPassword123!`
- Admin: `admin@protolab.com` / `AdminPassword123!`

**Q: What if tests fail?**  
A: Run `npm run test:e2e:analyze` to get AI-ready feedback, paste into Copilot!

**Q: Can I test specific flows?**  
A: Yes! 
```bash
npx playwright test e2e/03-order-creation-flow.spec.ts
npx playwright test e2e/06-admin-flow.spec.ts
```

**Q: Tests are flaky/timeout?**  
A: Tests retry 2 times automatically. If still failing, the issue is likely real.

## Overnight Testing Strategy

The overnight script will:
- Run tests 100 times (configurable in the script)
- Save results for each run
- Continue even if some tests fail
- Wait 30 seconds between runs

In the morning:
1. Check `e2e-results/` folder
2. Look at most recent reports
3. Run `npm run test:e2e:analyze`
4. Copy feedback to Copilot
5. Fix issues
6. Re-run to verify

## Need Help?

See full documentation: [e2e/README.md](./README.md)

## Tips

🔥 **Run before deploying** - Catch issues before users do  
🌙 **Run overnight** - Stress test the platform  
🤖 **Use with Copilot** - Let AI fix the issues  
📊 **Track trends** - See if issues are getting better or worse  
🎯 **Add tests** - When you find bugs manually, add tests for them  
