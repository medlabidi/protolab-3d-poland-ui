# Resend Integration - Quick Start

## 5 Steps to Production Emails

### Step 1: Create Resend Account (2 minutes)
```
1. Go to https://resend.com
2. Click "Sign Up"
3. Enter your email
4. Verify your email address
5. You're in! 🎉
```

### Step 2: Get Your API Key (1 minute)
```
1. Log in to Resend dashboard
2. Click "API Keys" in sidebar
3. Click "Create API Key"
4. Copy the key (it looks like: re_xxxxxxxxxxxx)
5. KEEP IT SECRET - don't share!
```

### Step 3: Verify Sender Email (Choose 1)

**Option A - Quick (for testing)**
- Resend gives you `onboarding@resend.dev`
- Works immediately for testing
- Only for development/testing

**Option B - Professional (for production)**
```
1. In Resend → Domains
2. Add your domain (e.g., protolab.com)
3. Follow DNS verification steps
4. Once verified, use: noreply@protolab.com
```

### Step 4: Set Environment Variables

**Development** (in `.env`):
```env
RESEND_API_KEY=re_test_dev_key_do_not_use
NODE_ENV=development
FROM_EMAIL=noreply@protolab.local
```

**Production** (in Vercel):
```
1. Go to Vercel project settings
2. Environment Variables
3. Add:
   RESEND_API_KEY = re_xxxxxxxxxxxx
   NODE_ENV = production
   FROM_EMAIL = noreply@yourdomain.com
4. Deploy
```

### Step 5: Test It! (5 minutes)
```
1. Start dev server: npm run dev
2. Go to http://localhost:8080/signup
3. Fill form and sign up
4. Check server terminal for email logs
5. Copy verification link from console
6. Paste into browser to verify
7. Check for welcome email in logs
```

## How It Works

### In Development
```
User signs up
    ↓
Backend creates user
    ↓
Emails logged to console
    ↓
✅ Shows verification link in logs
    ↓
User copies link and verifies
```

### In Production (with Resend)
```
User signs up
    ↓
Backend creates user
    ↓
API call to Resend
    ↓
✅ Real email sent to user's inbox
    ↓
User clicks email link
    ↓
Auto-verified and logged in
```

## Email Endpoints

All configured in `server/src/services/email.service.ts`:

| Email | Triggered By | Content |
|-------|-------------|---------|
| Registration Confirmation | User signup | Welcome + next steps |
| Verification Email | User signup | Verification link |
| Welcome/Congratulations | Email verified | Account ready + dashboard link |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Emails not showing in console | Check `NODE_ENV=development` |
| "Invalid API Key" error | Verify key starts with `re_` and is from Resend |
| "Unverified sender" | Use `onboarding@resend.dev` or verify domain |
| "Too many requests" | Free tier = 100/day, upgrade plan if needed |

## Key Points

✅ **Development**: Automatic console logging, no setup needed  
✅ **Production**: One API key from Resend, emails actually send  
✅ **Free Tier**: 100 emails/day, unlimited recipients  
✅ **Verification**: Optional domain verification for professional emails  
✅ **Security**: Never share your API key!  

## Resend Docs

Full documentation: https://resend.com/docs

Quick reference:
- API Keys: https://resend.com/api-keys
- Email Sending: https://resend.com/docs/api-reference/emails/send
- Domain Setup: https://resend.com/docs/domains/overview
- React Emails: https://react.email (optional templating)

## After Deploying

Monitor emails in Resend dashboard:
- Delivery status
- Bounce rates
- Click tracking (optional)
- Webhook events (optional)

Need help? Email Resend support or check status at https://status.resend.com
