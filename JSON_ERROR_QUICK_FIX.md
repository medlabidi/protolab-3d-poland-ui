# JSON Parsing Error - Quick Fix Guide

## Issue Summary
**Error:** `Unexpected token 'A', "A server e"... is not valid JSON`

**Meaning:** The API is returning plain text (like "A server error") instead of JSON

---

## 🚀 Quick Solution

### Most Likely Cause: Helmet CSP (Content Security Policy)

The error "A server e" might mean "A server error" - suggesting your responses are being intercepted or modified.

### Fix 1: Test Without Helmet
File: `server/src/express-app.ts`

Current:
```typescript
app.use(helmet());  // This might be the problem
```

**Temporary test** - comment it out:
```typescript
// app.use(helmet());  // Temporarily disabled for testing
```

Then restart server and test API.

---

### Fix 2: Configure Helmet Properly
If helmet is the issue, configure it:

```typescript
app.use(helmet({
  contentSecurityPolicy: false,  // ← Add this
  crossOriginEmbedderPolicy: false,
}));
```

Or use:
```typescript
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
    },
  })
);
```

---

### Fix 3: Check CORS Configuration
File: `server/src/express-app.ts`

Ensure Content-Type is allowed:
```typescript
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],  // ← Must include this
  preflightContinue: false,
  optionsSuccessStatus: 200
}));
```

---

### Fix 4: Check Express JSON Parser
File: `server/src/express-app.ts`

Must be BEFORE route handlers:
```typescript
// Should be HERE, not later
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// THEN routes
app.use('/api/auth', authRoutes);
```

---

## 🧪 Test the Fix

**Step 1:** Restart server
```bash
cd server
npm run dev
```

**Step 2:** Test health endpoint (should always work)
```bash
curl http://localhost:5000/health
```
Expected: `{"status":"ok","timestamp":"2026-01-06T..."}`

**Step 3:** Test login with invalid credentials
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"wrong"}'
```

Expected: 
```json
{"error":"Invalid email or password"}
```

**NOT:**
```
A server error occurred...
<html>...</html>
```

---

## 📋 Verification Checklist

- [ ] Server running on port 5000
- [ ] Health check returns JSON
- [ ] All responses have `Content-Type: application/json`
- [ ] Helmet is configured for JSON APIs
- [ ] CORS allows Content-Type header
- [ ] express.json() is before route handlers
- [ ] Error handler returns JSON not HTML

---

## 🔍 How to Diagnose

### Check Server Logs
Look at the console output when you make a request. You should see:
- Request received
- No error stack traces
- Response sent

### Check Response Headers
```bash
curl -i -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

Look for: `Content-Type: application/json`

NOT: `Content-Type: text/html`

### Check Response Body
The response body should start with `{` and end with `}`

NOT start with `A` or `<`

---

## ✅ Success Criteria

✅ All API endpoints return JSON  
✅ Error responses are JSON objects  
✅ Content-Type header is application/json  
✅ Health check returns valid JSON  
✅ No HTML error pages  

---

## 🛠️ If Still Having Issues

1. **Check server console** for actual error messages
2. **Try testing with curl** to see raw response
3. **Check browser DevTools** (F12) Network tab for actual response
4. **Look for any middleware** that might be intercepting responses
5. **Verify API_URL** in client points to correct server

---

**Priority:** HIGH  
**Impact:** Cannot use API until fixed  
**Time to Fix:** 5-10 minutes  

