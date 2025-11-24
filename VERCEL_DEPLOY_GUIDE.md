# 🚀 Vercel Full-Stack Deployment Guide

## Quick Start - Deploy to Vercel in 5 Minutes

### Prerequisites
- GitHub account
- Vercel account (free at https://vercel.com)
- All code pushed to GitHub repository

---

## 📝 Step-by-Step Deployment

### Step 1: Push Your Code to GitHub

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Import Project to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `protolab-3d-poland-ui`
4. Click **"Import"**

### Step 3: Configure Build Settings

Vercel should auto-detect these settings, but verify:

- **Framework Preset:** `Vite`
- **Root Directory:** `./` (leave as root)
- **Build Command:** `npm run vercel-build`
- **Output Directory:** `client/dist`
- **Install Command:** `npm install`

### Step 4: Add Environment Variables

Click on **"Environment Variables"** and add the following:

#### Required Variables:

```bash
# Database
DATABASE_URL=your_supabase_connection_string
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Secrets (generate random strings)
JWT_ACCESS_SECRET=your_random_secret_min_32_chars
JWT_REFRESH_SECRET=another_random_secret_min_32_chars

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Application
NODE_ENV=production
```

**💡 How to Generate JWT Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. Your app will be live at `https://your-project-name.vercel.app`

---

## 🔧 Alternative: Deploy via Vercel CLI

### Install Vercel CLI

```bash
npm install -g vercel
```

### Login to Vercel

```bash
vercel login
```

### Deploy

```bash
# From project root
vercel

# For production deployment
vercel --prod
```

---

## ✅ Post-Deployment Checklist

### 1. Test API Endpoints

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Should return: {"status":"healthy","message":"ProtoLab API is running"}
```

### 2. Test Authentication

- Visit `https://your-app.vercel.app`
- Try registering a new user
- Check email verification
- Try logging in

### 3. Check Logs

Go to your Vercel dashboard → Your Project → **"Logs"** to see real-time logs

### 4. Configure Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain (e.g., `protolab.yourdomain.com`)
3. Update DNS records as instructed
4. Update environment variables:
   ```bash
   FRONTEND_URL=https://protolab.yourdomain.com
   CORS_ORIGIN=https://protolab.yourdomain.com
   ```

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
# ✨ Vercel automatically builds and deploys
```

---

## 🐛 Troubleshooting

### Build Fails

**Check the build logs in Vercel dashboard**

Common issues:
- Missing environment variables
- TypeScript errors
- Missing dependencies

**Solution:**
```bash
# Test build locally first
cd client
npm install
npm run build
```

### API Returns 500 Error

**Check:**
1. All environment variables are set correctly
2. Database connection string is valid
3. JWT secrets are set

**View logs:**
- Go to Vercel Dashboard → Your Project → Functions → Click on failing function

### CORS Errors

**Update environment variables:**
```bash
CORS_ORIGIN=https://your-actual-vercel-url.vercel.app
```

Then redeploy:
```bash
vercel --prod
```

### Database Connection Issues

**For Supabase:**
- Verify connection string format
- Check if IP whitelist includes Vercel (0.0.0.0/0 for all IPs)
- Ensure service role key is correct

---

## 📊 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | Database connection string | `postgresql://...` |
| `SUPABASE_URL` | ✅ Yes | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous key | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Supabase service role key | `eyJhbG...` |
| `JWT_ACCESS_SECRET` | ✅ Yes | JWT access token secret | Random 32+ chars |
| `JWT_REFRESH_SECRET` | ✅ Yes | JWT refresh token secret | Random 32+ chars |
| `RESEND_API_KEY` | ✅ Yes | Resend email API key | `re_xxxxxx` |
| `RESEND_FROM_EMAIL` | ✅ Yes | Sender email address | `noreply@domain.com` |
| `AWS_ACCESS_KEY_ID` | ⚠️ Optional | AWS S3 access key | For file uploads |
| `AWS_SECRET_ACCESS_KEY` | ⚠️ Optional | AWS S3 secret key | For file uploads |
| `AWS_S3_BUCKET` | ⚠️ Optional | S3 bucket name | For file uploads |
| `NODE_ENV` | ✅ Yes | Environment mode | `production` |

---

## 🎯 What Was Configured

### 1. **Cleaned Up Structure**
- ✅ Removed redundant `/src` folder
- ✅ Organized into proper `client/` and `server/` structure

### 2. **Created Vercel API Routes**
- ✅ `/api/index.ts` - Health check endpoint
- ✅ `/api/auth/login.ts` - User login
- ✅ `/api/auth/register.ts` - User registration
- ✅ `/api/auth/refresh.ts` - Token refresh
- ✅ `/api/orders/index.ts` - Order management

### 3. **Updated vercel.json**
- ✅ Configured for full-stack deployment
- ✅ API routes mapped to serverless functions
- ✅ Client served as static files
- ✅ Environment variables configured

### 4. **Client Configuration**
- ✅ Already using `/api` for API calls (works in both dev and production)
- ✅ Vite proxy configured for local development
- ✅ Production uses same domain for API (no CORS issues)

---

## 🚀 You're Ready!

Your app is now configured for full-stack deployment on Vercel. Just follow the steps above to deploy!

**Need Help?**
- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
