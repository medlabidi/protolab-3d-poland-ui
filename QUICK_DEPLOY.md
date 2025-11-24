# ⚡ Quick Vercel Deployment - 2 Minute Guide

## 🎯 Step 1: Push to GitHub
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

## 🎯 Step 2: Import to Vercel
1. Go to https://vercel.com/new
2. Import `protolab-3d-poland-ui`
3. Settings auto-detected ✅

## 🎯 Step 3: Add Environment Variables

**Click "Environment Variables" and paste:**

```bash
DATABASE_URL=your_supabase_connection_string
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_ACCESS_SECRET=your_random_secret_32chars
JWT_REFRESH_SECRET=another_random_secret_32chars
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
NODE_ENV=production
```

**Generate secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🎯 Step 4: Deploy
Click **"Deploy"** button ✨

## ✅ Test Your Deployment
```bash
# Test API
curl https://your-app.vercel.app/api/health

# Visit app
https://your-app.vercel.app
```

---

## 🔧 Alternative: CLI Deployment

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 📚 Full Guide
See `VERCEL_DEPLOY_GUIDE.md` for detailed instructions, troubleshooting, and configuration.

## 🎉 That's It!
Your full-stack app is now live on Vercel with serverless API functions!
