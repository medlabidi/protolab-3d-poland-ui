# Resend Email Service Setup Guide

This guide explains how to integrate **Resend** for production email sending in ProtoLab 3D Poland.

## Overview

- **Development**: Emails are logged to console instead of actually sent
- **Production**: Emails are sent via Resend API
- **Current Setup**: Development mode active by default

## Step 1: Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up with your email address
3. Verify your email address
4. You're in! The free tier includes 100 emails/day

## Step 2: Get Your API Key

1. Log in to Resend dashboard
2. Go to **API Keys** (in sidebar)
3. Click **Create API Key**
4. Copy the key (starts with `re_`)
5. **NEVER share this key** - keep it secret!

## Step 3: Configure Environment Variables

### For Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx (paste your key from Step 2)
   NODE_ENV=production
   ```
4. Deploy to trigger update

### For Local Development

1. Create `.env.production` in project root:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxx
   NODE_ENV=production
   ```
2. Don't commit this file! Add to `.gitignore`

## Step 4: Verify Sender Email

Resend requires a verified sender email. Choose ONE:

### Option A: Use `onboarding@resend.dev` (for testing)
- Resend provides this free test email
- Works immediately
- **Only for development/testing**

### Option B: Verify Your Domain
1. In Resend dashboard → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `protolab.com`)
4. Follow DNS verification steps
5. Once verified, use `noreply@yourdomain.com`

### For Development Only
Use in `.env`:
```env
FROM_EMAIL=noreply@protolab.local
```
This is a local email - won't actually send in dev mode.

## Step 5: Update .env Files

**Root `.env` (Development):**
```env
RESEND_API_KEY=re_test_dev_key_do_not_use
NODE_ENV=development
FROM_EMAIL=noreply@protolab.local
ADMIN_EMAIL=admin@protolab.local
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:5000
```

**`server/.env` (Development - mirrors root):**
Same as above

**`.env.production` (Production):**
```env
RESEND_API_KEY=re_xxxxxxxxxxxx (your real key)
NODE_ENV=production
FROM_EMAIL=noreply@yourdomain.com (verified domain)
ADMIN_EMAIL=admin@yourdomain.com
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

## Email Flow

### Registration
```
User signs up → Registration Confirmation Email (logs to console in dev)
             → Verification Email (logs to console in dev)
             → User clicks verify link → Welcome/Congratulations Email
```

### Login
```
User logs in with verified email → JWT tokens issued
```

### Google OAuth
```
User clicks "Login with Google" → New user created (if first time)
                                → Welcome email sent
                                → Auto-logged in
```

## Testing Emails in Development

Since emails log to console in development:

1. Sign up at http://localhost:8080/signup
2. Check server terminal for console output:
   ```
   ================================================================================
   📧 REGISTRATION CONFIRMATION EMAIL
   To: user@example.com
   ================================================================================
   ...
   
   ================================================================================
   📧 VERIFICATION EMAIL
   To: user@example.com
   ================================================================================
   Subject: Verify Your Email Address - ProtoLab 3D Poland
   Verification Link: http://localhost:5000/api/auth/verify-email?token=xxxxx
   ================================================================================
   
   ================================================================================
   📧 WELCOME/CONGRATULATIONS EMAIL
   To: user@example.com
   ================================================================================
   ```

3. Copy the verification link from console
4. Paste into browser to verify email
5. User is auto-logged in

## Email Templates

All templates are in `server/src/services/email.service.ts`:

1. **sendRegistrationConfirmation()** - Welcome email on signup
2. **sendVerificationEmail()** - Email verification link
3. **sendWelcomeEmail()** - Congratulations after verification
4. **sendApprovalEmail()** - (Future) For admin approval workflow
5. **sendRejectionEmail()** - (Future) For rejection notices

## Troubleshooting

### "Invalid API Key"
- Check API key is correct (should start with `re_`)
- Ensure it's in `.env.production` or Vercel environment variables
- Regenerate key in Resend dashboard if needed

### "Unverified Sender Email"
- Use `onboarding@resend.dev` for testing
- Or verify your domain in Resend dashboard
- Set correct `FROM_EMAIL` in env vars

### Emails Still Going to Console
- Check `NODE_ENV` is set to `production`
- Verify `RESEND_API_KEY` doesn't contain "dev" or "test"
- Restart server after env changes

### "Too Many Requests"
- Free tier has rate limits (100 emails/day)
- Upgrade plan if needed
- Emails queue up and send later

## Production Checklist

Before deploying to production:

- [ ] Create Resend account and get API key
- [ ] Verify sender email domain
- [ ] Set `RESEND_API_KEY` in Vercel environment variables
- [ ] Set `NODE_ENV=production` in Vercel
- [ ] Update `FROM_EMAIL` to verified domain
- [ ] Test signup flow end-to-end
- [ ] Monitor email logs in Resend dashboard
- [ ] Set up webhooks for delivery tracking (optional)

## Advanced: Webhooks (Optional)

Resend can notify your app when emails are delivered/bounced:

1. In Resend dashboard → **Webhooks**
2. Add endpoint: `https://yourdomain.com/api/webhooks/email`
3. Select events: `email.sent`, `email.delivered`, `email.bounced`
4. Implement webhook handler in backend
5. Track email delivery status in database

## Support

- Resend Docs: https://resend.com/docs
- Resend Status: https://status.resend.com
- Email Templates Guide: https://resend.com/templates
