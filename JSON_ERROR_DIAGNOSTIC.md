# JSON Parsing Error - Diagnostic Guide

## Error: "Unexpected token 'A', "A server e"... is not valid JSON"

This error typically occurs when the client tries to parse a response as JSON, but receives plain text or HTML instead.

---

## 🔍 Common Causes

### 1. **Server Returning HTML Error Pages**
- **Symptom:** Response starts with "A server error" or HTML tags
- **Cause:** Unhandled exception in middleware
- **Solution:** Check error handler middleware

### 2. **API Route Not Found**
- **Symptom:** 404 response with HTML
- **Cause:** Wrong endpoint URL or typo
- **Solution:** Verify endpoint paths match server routes

### 3. **CORS Issues Returning HTML**
- **Symptom:** Response is HTML instead of JSON
- **Cause:** CORS error being displayed as HTML
- **Solution:** Check CORS configuration

### 4. **Helmet Security Middleware**
- **Symptom:** Security headers preventing response
- **Cause:** Helmet blocking certain response types
- **Solution:** Verify helmet configuration

---

## ✅ Diagnostic Checklist

### Server Health
- [ ] Check server is running on port 5000
  ```bash
  curl http://localhost:5000/health
  ```
  Should return: `{"status":"ok","timestamp":"..."}`

### API Endpoint
- [ ] Test endpoint directly
  ```bash
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123"}'
  ```
  Should return JSON, not HTML

### CORS Headers
- [ ] Check response headers
  ```bash
  curl -i -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123"}'
  ```
  Look for: `Content-Type: application/json`

### Body Parser
- [ ] Verify JSON is being parsed correctly
- [ ] Check express.json() middleware is configured
- [ ] Verify Content-Type header is set to application/json

---

## 🔧 How to Fix

### Step 1: Check Error Handler
File: `server/src/middleware/errorHandler.ts`

Ensure ALL responses return JSON:
```typescript
res.status(500).json({ error: 'Internal server error' });
```

NOT:
```typescript
res.send('Internal server error');
```

### Step 2: Check Express Middleware Order
File: `server/src/express-app.ts`

Correct order:
```typescript
1. Helmet (security)
2. CORS
3. Rate limiting
4. Body parsing (JSON)
5. Route handlers
6. Error handling (last)
```

### Step 3: Verify Routes
Check that routes are:
- Returning JSON
- Have proper error handling
- Using async/await with .catch()

### Step 4: Check Content-Type
Ensure client is sending:
```json
{
  "Content-Type": "application/json"
}
```

---

## 🐛 Common Issues to Check

### Issue 1: Missing Error Handler
**File:** `server/src/middleware/errorHandler.ts`

Problem:
```typescript
export const errorHandler = (err, req, res, next) => {
  res.send(err.message);  // ❌ Returns plain text
};
```

Solution:
```typescript
export const errorHandler = (err, req, res, next) => {
  res.status(500).json({ error: err.message });  // ✅ Returns JSON
};
```

### Issue 2: Async Route Not Catching Errors
**File:** `server/src/routes/auth.routes.ts`

Problem:
```typescript
router.post('/login', async (req, res) => {
  const user = await authService.login(...);  // Error not caught
  res.json(user);
});
```

Solution:
```typescript
router.post('/login', async (req, res, next) => {
  try {
    const user = await authService.login(...);
    res.json(user);
  } catch (error) {
    next(error);  // Pass to error handler
  }
});
```

### Issue 3: Routes Not Registered
**File:** `server/src/express-app.ts`

Check that all routes are mounted:
```typescript
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
```

### Issue 4: JSON Response Not Set
**Problem:** Forgetting to set Content-Type

Solution:
```typescript
res.setHeader('Content-Type', 'application/json');
res.json({ success: true });
```

---

## 🧪 Testing the Fix

### Test 1: Health Check
```bash
curl http://localhost:5000/health
# Should return JSON
```

### Test 2: Login Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
# Should return JSON (even if error)
```

### Test 3: Response Headers
```bash
curl -i http://localhost:5000/health | grep -i "content-type"
# Should show: Content-Type: application/json
```

---

## 📝 Files to Review

1. **server/src/middleware/errorHandler.ts**
   - Check that ALL responses use `.json()`

2. **server/src/express-app.ts**
   - Verify middleware order
   - Check route registration
   - Ensure error handler is last

3. **server/src/routes/*.ts**
   - Verify routes use async handlers with try/catch
   - Check all errors are passed to next()

4. **server/src/controllers/*.ts**
   - Verify all methods handle errors
   - Check responses are JSON

5. **client/src/config/api.ts**
   - Verify API_URL is correct
   - Check headers are set properly

---

## 🚀 Quick Fix Steps

1. **Restart server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Test health endpoint:**
   ```bash
   curl http://localhost:5000/health
   ```

3. **Check error logs:**
   - Look at server console output
   - Check for stack traces
   - Note any error messages

4. **Test with correct credentials:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@protolab.info","password":"your_password"}'
   ```

5. **Verify response is JSON:**
   - Should start with `{` not `<` or `A`
   - Should include proper JSON structure

---

## 📞 Getting More Info

To get detailed error information, check:

1. **Server logs:** Look for stack traces in console
2. **Browser console:** Open DevTools (F12) to see full error
3. **Network tab:** Check response body for actual error
4. **Server response:** Use curl to test endpoint directly

---

**Status:** Ready for diagnosis and fixing  
**Last Updated:** January 6, 2026

