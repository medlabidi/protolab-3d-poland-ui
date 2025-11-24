# 🚀 Vercel Full-Stack Deployment Guide

## ✅ Pre-Deployment Checklist

Your repository is now configured for Vercel full-stack deployment with:

- ✅ Redundant `/src` folder removed
- ✅ Serverless API functions in `/api` directory
- ✅ Updated `vercel.json` for full-stack routing
- ✅ Build scripts optimized for Vercel
- ✅ `.vercelignore` configured
- ✅ Client configured to use relative API paths

## 📋 Deployment Steps

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Configure for Vercel full-stack deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `protolab-3d-poland-ui`
4. Click "Import"

### Step 3: Configure Project Settings

**Framework Preset:** Other (or Vite)

**Root Directory:** `./` (leave as root)

**Build Command:** 
```bash
npm run vercel-build
```

**Output Directory:** 
```
client/dist
```

**Install Command:** 
```bash
npm install
```

### Step 4: Add Environment Variables

Go to **Settings → Environment Variables** and add ALL of the following:

#### Required Variables:

```
MONGO_URI=mongodb+srv://your-connection-string
JWT_ACCESS_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
NODE_ENV=production
CORS_ORIGIN=https://your-app-name.vercel.app
```

#### Email Service (Resend):

```
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com
```

#### AWS S3 (if using file uploads):

```
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=eu-central-1
S3_BUCKET_NAME=your-bucket
```

#### Optional:

```
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

> **Note:** For each variable, select **Production**, **Preview**, and **Development** environments

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Your app will be live at `https://your-app-name.vercel.app`

## 🔍 Post-Deployment Verification

### Test API Endpoints:

1. **Health Check:**
   ```
   https://your-app.vercel.app/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Frontend:**
   ```
   https://your-app.vercel.app
   ```
   Should load your React app

3. **API Routes:**
   ```
   https://your-app.vercel.app/api/auth/...
   https://your-app.vercel.app/api/orders/...
   ```

### Check Logs:

1. Go to Vercel Dashboard → Your Project
2. Click on the deployment
3. Go to **"Functions"** tab to see serverless function logs
4. Check for any errors

## 🐛 Troubleshooting

### Issue: API routes return 404

**Solution:**
- Verify `api/index.ts` exists
- Check Vercel Functions tab for errors
- Ensure all environment variables are set

### Issue: CORS errors

**Solution:**
- Update `CORS_ORIGIN` environment variable to match your Vercel URL
- Redeploy after changing environment variables

### Issue: Database connection fails

**Solution:**
- Check `MONGO_URI` is correct
- Ensure MongoDB Atlas allows connections from `0.0.0.0/0` (Vercel IPs)
- Verify MongoDB user has correct permissions

### Issue: Build fails

**Solution:**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Try local build: `npm run vercel-build`

## 📊 Architecture Overview

```
Vercel Deployment:
├── Frontend (Static)
│   └── client/dist/ → Served at /
│
└── Backend (Serverless)
    └── api/index.ts → Handles /api/* routes
    └── api/health.ts → Handles /health

Request Flow:
1. User visits https://your-app.vercel.app
2. Frontend served from client/dist
3. API calls go to /api/* → routed to serverless function
4. Serverless function uses Express app from server/src
```

## 🔄 Redeployment

### Automatic (Recommended):
- Push to GitHub → Vercel auto-deploys
- Main branch = Production
- Other branches = Preview deployments

### Manual:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## 📈 Monitoring

1. **Vercel Analytics:** Automatically enabled
2. **Function Logs:** Dashboard → Functions tab
3. **Error Tracking:** Check Runtime Logs
4. **Performance:** Analytics tab shows response times

## 🔐 Security Checklist

- ✅ Environment variables not in Git
- ✅ JWT secrets are strong (32+ chars)
- ✅ CORS_ORIGIN set to your domain
- ✅ Rate limiting enabled
- ✅ Helmet middleware active
- ✅ Database credentials secure
- ⚠️ Setup custom domain (optional)
- ⚠️ Enable Vercel firewall (optional)

## 🎯 Next Steps

1. **Custom Domain:** Settings → Domains
2. **SSL Certificate:** Automatic with custom domain
3. **Environment Per Branch:** Configure preview/dev environments
4. **Monitoring:** Setup external monitoring (e.g., UptimeRobot)
5. **Backups:** Regular database backups
6. **CI/CD:** Already setup via GitHub integration

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- GitHub Issues: Your repository issues tab

---

**Deployment Date:** November 24, 2025
**Status:** Ready for Production ✅
