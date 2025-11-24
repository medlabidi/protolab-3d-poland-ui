# ✅ Vercel Deployment Checklist

## Pre-Deployment Verification

### 1. ✅ Code Structure
- [x] Redundant `/src` folder removed
- [x] Client code in `/client/src`
- [x] Server code in `/server/src`
- [x] API functions in `/api`

### 2. ✅ Vercel Configuration
- [x] `vercel.json` configured for full-stack
- [x] API routes setup (`/api/auth/*`, `/api/orders/*`, etc.)
- [x] Static build configuration for client
- [x] Serverless functions configuration

### 3. ✅ API Structure
```
/api
  ├── index.ts          # Health check
  ├── health.ts         # Alternative health endpoint
  ├── auth/
  │   ├── login.ts      # POST /api/auth/login
  │   ├── register.ts   # POST /api/auth/register
  │   └── refresh.ts    # POST /api/auth/refresh
  └── orders/
      └── index.ts      # GET/POST /api/orders
```

### 4. ✅ Dependencies
- [x] `@vercel/node` installed
- [x] All client dependencies in `client/package.json`
- [x] All server dependencies in `server/package.json`

## Deployment Steps

### Before Deploying
- [ ] All code committed to Git
- [ ] No TypeScript errors (`npm run build` succeeds locally)
- [ ] Environment variables prepared

### Deploy to Vercel
- [ ] Import project to Vercel
- [ ] Configure build settings
- [ ] Add environment variables (see below)
- [ ] Click Deploy

### Required Environment Variables
Copy these to Vercel (get values from your services):

```bash
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
NODE_ENV=production
```

### Post-Deployment
- [ ] Test health endpoint: `https://your-app.vercel.app/api/health`
- [ ] Test frontend: `https://your-app.vercel.app`
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Check Vercel function logs for errors

## Common Issues & Solutions

### ❌ Build Fails
**Check:**
- TypeScript errors in build logs
- Missing dependencies
- Environment variables not set

**Fix:**
```bash
# Test locally first
cd client && npm install && npm run build
```

### ❌ API 500 Errors
**Check:**
- Environment variables are set correctly
- Database connection works
- Check Vercel function logs

**Fix:**
- Go to Vercel Dashboard → Functions → Click failing function → View logs

### ❌ CORS Errors
**Fix:**
Not needed! API and frontend are on same domain.

### ❌ Module Not Found
**Fix:**
Make sure all imports use correct paths and dependencies are in the right package.json

## Build Settings (Auto-detected)

```yaml
Framework: Vite
Root Directory: ./
Build Command: npm run vercel-build
Output Directory: client/dist
Install Command: npm install
```

## Files Created/Modified

### Created:
- ✅ `/api/index.ts` - Health check
- ✅ `/api/auth/login.ts` - Login endpoint
- ✅ `/api/auth/register.ts` - Registration endpoint
- ✅ `/api/auth/refresh.ts` - Token refresh
- ✅ `/api/orders/index.ts` - Orders endpoint
- ✅ `/.env.production.example` - Environment template
- ✅ `/VERCEL_DEPLOY_GUIDE.md` - Full deployment guide
- ✅ `/QUICK_DEPLOY.md` - Quick reference

### Modified:
- ✅ `/vercel.json` - Full-stack configuration

### Removed:
- ✅ `/src` folder - Redundant code

## Next Steps

1. **Read the guide:** `QUICK_DEPLOY.md` for fast deployment
2. **Need details?** See `VERCEL_DEPLOY_GUIDE.md`
3. **Deploy:** Follow the steps in the checklist above
4. **Monitor:** Check Vercel dashboard for logs

## 🎉 Ready to Deploy!

Your project is now configured for seamless full-stack deployment on Vercel!
