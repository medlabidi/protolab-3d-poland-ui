# API Endpoint Mapping & Consolidation Guide

## 📋 CURRENT STATE: Dual Implementation

### Implementation A: Express.js Server
- **Location:** `server/src/routes/` + `server/src/controllers/`
- **Entry Point:** `server/src/server.ts`
- **Port:** 5000 (default)
- **Files:** ~8 route files + 7 controllers

### Implementation B: Vercel Serverless
- **Location:** `api/index.ts`
- **Entry Point:** Function export (Vercel API)
- **Size:** 1324 lines (monolithic)
- **Deployment:** Vercel Edge

---

## 🗂️ COMPLETE ENDPOINT MAPPING

### Authentication Endpoints

| Endpoint | Method | Server | Vercel | Status |
|----------|--------|--------|--------|--------|
| `/api/auth/register` | POST | ✅ | ✅ | DUPLICATE |
| `/api/auth/login` | POST | ✅ | ✅ | DUPLICATE |
| `/api/auth/refresh` | POST | ✅ | ✅ | DUPLICATE |
| `/api/auth/logout` | POST | ✅ | ✅ | DUPLICATE |
| `/api/auth/me` | GET | ✅ | ✅ | DUPLICATE |
| `/api/auth/profile` | PUT | ✅ | ✅ | DUPLICATE |
| `/api/auth/change-password` | POST | ✅ | ✅ | DUPLICATE |
| `/api/auth/forgot-password` | POST | ✅ | ✅ | DUPLICATE |
| `/api/auth/reset-password` | POST | ✅ | ✅ | DUPLICATE |
| `/api/auth/verify-email` | GET | ✅ | ✅ | DUPLICATE |
| `/api/auth/google` | POST | ✅ | ✅ | DUPLICATE |

**Auth Status:** 11/11 endpoints duplicated (100% coverage in both)

---

### User Endpoints

| Endpoint | Method | Server | Vercel | Status |
|----------|--------|--------|--------|--------|
| `/api/users/me` | GET | ✅ | ❌ | Server only |
| `/api/users/me` | PUT | ✅ | ❌ | Server only |
| `/api/users/me` | DELETE | ✅ | ❌ | Server only |
| `/api/users/profile` | GET | ❌ | ✅ | Vercel only |
| `/api/users/profile` | PUT | ❌ | ✅ | Vercel only |
| `/api/admin/users/all` | GET | ✅ | ❌ | Server only |
| `/api/admin/users/:id` | DELETE | ✅ | ❌ | Server only |

**User Status:** Inconsistent naming - `/me` vs `/profile`

**⚠️ Issue:** Client might use wrong endpoint depending on build

---

### Order Endpoints

| Endpoint | Method | Server | Vercel | Status |
|----------|--------|--------|--------|--------|
| `/api/orders` | POST | ✅ | ✅ | DUPLICATE |
| `/api/orders/my` | GET | ✅ | ✅ | DUPLICATE |
| `/api/orders/:id` | GET | ✅ | ✅ | DUPLICATE |
| `/api/orders/:id` | PUT | ✅ | ✅ | DUPLICATE |
| `/api/orders/:id` | DELETE | ✅ | ✅ | DUPLICATE |
| `/api/orders/:id/archive` | PATCH | ✅ | ❌ | Server only |
| `/api/orders/:id/restore` | PATCH | ✅ | ❌ | Server only |
| `/api/orders/:id/soft` | DELETE | ✅ | ❌ | Server only |
| `/api/orders/:id/permanent` | DELETE | ✅ | ❌ | Server only |
| `/api/orders/email/payment-confirmation` | POST | ✅ | ❌ | Server only |
| `/api/orders/email/refund-request` | POST | ✅ | ❌ | Server only |
| `/api/orders/email/invoice` | POST | ✅ | ❌ | Server only |

**Order Status:** Server has extended features, Vercel is basic

---

### Admin Endpoints

| Endpoint | Method | Server | Vercel | Status |
|----------|--------|--------|--------|--------|
| `/api/admin/orders` | GET | ✅ | ✅ | DUPLICATE |
| `/api/admin/orders/:id/status` | PATCH | ✅ | ❌ | Server only |
| `/api/admin/orders/:id/pricing` | PATCH | ✅ | ❌ | Server only |
| `/api/admin/orders/:id/tracking` | PATCH | ✅ | ❌ | Server only |
| `/api/admin/users` | GET | ✅ | ✅ | DUPLICATE |
| `/api/admin/users/all` | GET | ✅ | ❌ | Server only |
| `/api/admin/users/:id` | DELETE | ✅ | ❌ | Server only |
| `/api/admin/settings` | GET | ✅ | ❌ | Server only |
| `/api/admin/settings` | PATCH | ✅ | ❌ | Server only |

**Admin Status:** Server much more complete

---

### Upload Endpoints

| Endpoint | Method | Server | Vercel | Status |
|----------|--------|--------|--------|--------|
| `/api/upload/presigned-url` | POST | ❓ | ✅ | Vercel only |
| `/api/upload/analyze` | POST | ❓ | ✅ | Vercel only |

**Upload Status:** Only in Vercel, check if in server routes

---

### Other Endpoints

| Endpoint | Method | Server | Vercel | Status |
|----------|--------|--------|--------|--------|
| `/api/credits/balance` | GET | ✅ | ✅ | DUPLICATE |
| `/api/conversations` | GET | ✅ | ✅ | DUPLICATE |
| `/api/conversations/:id/messages` | GET | ✅ | ✅ | DUPLICATE |
| `/api/conversations/:id/messages` | POST | ✅ | ✅ | DUPLICATE |

**Other Status:** Complete duplication

---

## 📊 SUMMARY STATISTICS

| Category | Server | Vercel | Duplicated | Only Server | Only Vercel |
|----------|--------|--------|------------|-------------|------------|
| Auth | 11 | 11 | 11 | 0 | 0 |
| Users | 7 | 2 | 0 | 5 | 2 |
| Orders | 12 | 5 | 5 | 7 | 0 |
| Admin | 9 | 3 | 3 | 6 | 0 |
| Upload | ? | 2 | ? | ? | 2 |
| Other | 4 | 4 | 4 | 0 | 0 |
| **TOTAL** | **~43-45** | **~27** | **~23** | **~18-20** | **~4** |

**Key Finding:** 
- Server has ~40% more endpoints
- 50%+ of Vercel endpoints are duplicated in server
- Server has extended features (archive, restore, email)
- Vercel has upload endpoints (need to verify server)

---

## 🔧 IMPLEMENTATION COMPARISON

### Server (Express.js)

**Pros:**
- ✅ More complete feature set
- ✅ Better organized (separate files)
- ✅ Includes email endpoints
- ✅ Advanced order management (archive, restore)
- ✅ Admin settings management
- ✅ Easier to extend
- ✅ Standard Node.js stack

**Cons:**
- ❌ Requires running separate process
- ❌ Different scaling model
- ❌ Upload endpoint unclear

**Best For:** Production, Traditional hosting, Full-featured app

---

### Vercel (Serverless)

**Pros:**
- ✅ Serverless, no infrastructure management
- ✅ Auto-scaling
- ✅ CDN integrated
- ✅ Simple deployment
- ✅ Has upload presigned URL feature

**Cons:**
- ❌ 1324 lines in single file (monolithic)
- ❌ Less feature-complete
- ❌ Harder to maintain
- ❌ Missing admin features
- ❌ Missing email endpoints

**Best For:** MVP, Simple features, Quick deployment

---

## 🎯 CONSOLIDATION OPTIONS

### Option A: Keep Server, Deprecate Vercel ⭐ RECOMMENDED
```
✅ Production: Use server/src (Express.js)
⚠️ Deprecate: api/index.ts (mark as legacy)
📝 Action: Delete api/index.ts, update README
💰 Cost: Same
⏱️ Effort: Low
```

### Option B: Keep Vercel, Deprecate Server
```
❌ Production: Use api/index.ts (Vercel)
❌ Risk: Losing features (archive, restore, email, settings)
❌ Complexity: Rewrite missing endpoints
⏱️ Effort: Very High
```

### Option C: Hybrid Approach
```
⚙️ Client API: Smart routing (dev → server, prod → Vercel)
⚠️ Complexity: Requires abstraction layer
⚠️ Maintenance: Must keep both in sync
⏱️ Effort: High
```

---

## ✅ RECOMMENDED ACTION PLAN

### Step 1: Decide (5 mins)
- [ ] Confirm server is production target
- [ ] Confirm deployment runs `server/src`
- [ ] Update team about decision

### Step 2: Document (15 mins)
```markdown
# In README.md, add:

## API Implementation
- **Status:** Server-based (Express.js)
- **Location:** server/src/routes
- **Port:** 5000
- **Legacy:** api/index.ts (deprecated)
```

### Step 3: Mark Legacy (10 mins)
Add comment to api/index.ts:
```typescript
/**
 * ⚠️ DEPRECATED - Use server/src implementation instead
 * This file is kept for historical reference only
 * Production API: http://localhost:5000/api/*
 */
```

### Step 4: Cleanup (30 mins) - Optional
- [ ] Remove api/index.ts if not needed for Vercel
- [ ] Remove related files (api/_lib/*)
- [ ] Update deployment config

### Step 5: Test (30 mins)
```bash
npm run dev          # Start both
curl http://localhost:5000/health  # Test server
# Test all endpoints manually or with E2E tests
```

### Step 6: Document (20 mins)
- [ ] Create API endpoint reference
- [ ] Document any breaking changes
- [ ] Update deployment guide

---

## 🚨 CRITICAL ITEMS TO VERIFY

Before making changes:

1. **Check which API is actually used in production**
   ```bash
   grep -r "api.protolab" vercel.json
   grep -r "API_URL" client/
   ```

2. **Verify environment variables**
   ```bash
   cat server/.env
   cat client/.env
   ```

3. **Check package.json build scripts**
   ```bash
   cat package.json | grep -A10 "build"
   ```

4. **Confirm no Vercel edge functions**
   ```bash
   ls -la api/
   ```

5. **Test before consolidating**
   ```bash
   npm run test
   npm run test:e2e
   ```

---

## 📚 REFERENCES

- **Server Routes:** `server/src/express-app.ts` (route registration)
- **Server Auth:** `server/src/controllers/auth.controller.ts`
- **Vercel Handlers:** `api/index.ts` (lines 1-1324)
- **Client Config:** `client/src/config/api.ts`
- **Environment:** `server/.env`, `client/.env`

---

**Generated:** January 6, 2026  
**Next Review:** After decision on implementation strategy

