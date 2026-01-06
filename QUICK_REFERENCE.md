# 🚀 ProtoLab 3D - Quick Reference Guide

## ✅ WHAT'S BEEN FIXED

### 1. Duplicate Login Page Removed
- ❌ DELETED: `client/src/pages/Login.tsx` (556 lines)
- ✅ KEPT: `client/src/pages/SignIn.tsx` (315 lines)
- Result: Single source of truth for login

### 2. Admin Routes Reorganized
- ❌ MOVED FROM: `server/src/routes/user.routes.ts`
- ✅ MOVED TO: `server/src/routes/admin.routes.ts`
- Result: Proper separation of concerns

### 3. Comprehensive Audit Created
- 📄 `AUDIT_REPORT_COMPLETE.md` - Full analysis
- 📄 `REMEDIATION_GUIDE.md` - Action items
- 📄 `API_CONSOLIDATION_GUIDE.md` - API mapping

---

## 📍 CURRENT ARCHITECTURE

### Pages Structure
```
client/src/pages/
├── Landing.tsx              ✅ Public
├── AboutUs.tsx              ✅ Public
├── Services.tsx             ✅ Public
├── DesignAssistance.tsx     ✅ Public (login redirect)
├── PrivacyPolicy.tsx        ✅ Public
├── SignIn.tsx               ✅ Auth form (SINGLE LOGIN)
├── SignUp.tsx               ✅ Registration
├── ResetPassword.tsx        ✅ Password recovery
├── VerifyEmail.tsx          ✅ Email verification
├── Dashboard.tsx            🔒 Protected (user)
├── NewPrint.tsx             🔒 Protected (order creation)
├── Orders.tsx               🔒 Protected (list)
├── OrderDetails.tsx         🔒 Protected (details)
├── EditOrder.tsx            🔒 Protected (edit)
├── EditProject.tsx          🔒 Protected (project)
├── Settings.tsx             🔒 Protected (profile)
├── Payment.tsx              🔒 Protected
├── Refund.tsx               🔒 Protected
├── Credits.tsx              🔒 Protected
├── Conversations.tsx        🔒 Protected
├── Business.tsx             🔒 Protected
├── NotFound.tsx             ✅ 404
└── admin/
    ├── AdminLogin.tsx       ✅ Public
    ├── AdminDashboard.tsx   🔒 Admin
    ├── AdminOrders.tsx      🔒 Admin
    ├── AdminUsers.tsx       🔒 Admin
    ├── AdminPrinters.tsx    🔒 Admin
    ├── AdminMaterials.tsx   🔒 Admin
    ├── AdminAnalytics.tsx   🔒 Admin
    ├── AdminReports.tsx     🔒 Admin
    ├── AdminNotifications.tsx 🔒 Admin
    └── AdminSettings.tsx    🔒 Admin
```

---

## 🔐 AUTHENTICATION FLOW

```
1. User visits /login or /signin
   ↓
2. SignIn component renders
   ↓
3. POST /api/auth/login with credentials
   ↓
4. Server validates & returns {user, tokens}
   ↓
5. Client stores in localStorage:
   - accessToken (JWT, 15 min expiry)
   - refreshToken (JWT, 30 day expiry)
   - isLoggedIn = true
   ↓
6. Redirect to /dashboard
   ↓
7. Auto-refresh 5 min before expiry
   ↓
8. Logout: POST /api/auth/logout + clear tokens
```

---

## 🗝️ API ROUTES

### Authentication
```
POST   /api/auth/register              - Create account
POST   /api/auth/login                 - Sign in
POST   /api/auth/refresh               - Refresh token
POST   /api/auth/logout                - Sign out
GET    /api/auth/me                    - Current user
PUT    /api/auth/profile               - Update profile
POST   /api/auth/change-password       - Change password
POST   /api/auth/forgot-password       - Request reset
POST   /api/auth/reset-password        - Reset password
GET    /api/auth/verify-email          - Verify email
POST   /api/auth/google                - Google OAuth
```

### User Profile
```
GET    /api/users/me                   - Get profile (protected)
PUT    /api/users/me                   - Update profile (protected)
DELETE /api/users/me                   - Delete account (protected)
```

### Orders
```
POST   /api/orders                     - Create order (protected)
GET    /api/orders/my                  - List user orders (protected)
GET    /api/orders/:id                 - Get order details (protected)
PUT    /api/orders/:id                 - Update order (protected)
DELETE /api/orders/:id                 - Delete order (protected)
PATCH  /api/orders/:id/archive         - Archive order (protected)
PATCH  /api/orders/:id/restore         - Restore order (protected)
```

### Admin
```
GET    /api/admin/orders               - List all orders (admin)
PATCH  /api/admin/orders/:id/status    - Update status (admin)
PATCH  /api/admin/orders/:id/pricing   - Update price (admin)
PATCH  /api/admin/orders/:id/tracking  - Add tracking (admin)
GET    /api/admin/users                - List all users (admin)
GET    /api/admin/users/all            - Get all users (admin)
DELETE /api/admin/users/:id            - Delete user (admin)
GET    /api/admin/settings             - Get settings (admin)
PATCH  /api/admin/settings             - Update settings (admin)
```

### Other
```
GET    /api/credits/balance            - Credits balance (protected)
GET    /api/conversations              - List conversations (protected)
GET    /api/conversations/:id/messages - Get messages (protected)
POST   /api/conversations/:id/messages - Send message (protected)
```

---

## 🔄 ROUTES CONFIGURATION

### User Routes (Protected)
```typescript
// server/src/routes/user.routes.ts
GET    /api/users/me         → userController.getMe()
PUT    /api/users/me         → userController.updateMe()
DELETE /api/users/me         → userController.deleteMe()
```

### Admin Routes (Admin Protected)
```typescript
// server/src/routes/admin.routes.ts
GET    /api/admin/orders     → adminController.getAllOrders()
PATCH  /api/admin/orders/:id/status → adminController.updateOrderStatus()
PATCH  /api/admin/orders/:id/pricing → adminController.updateOrderPricing()
PATCH  /api/admin/orders/:id/tracking → adminController.updateOrderTracking()
GET    /api/admin/users      → adminController.getAllUsers()
GET    /api/admin/users/all  → userController.getAllUsers()
DELETE /api/admin/users/:id  → userController.deleteUser()
GET    /api/admin/settings   → adminController.getSettings()
PATCH  /api/admin/settings   → adminController.updateSettings()
```

---

## 🔒 PROTECTION MECHANISMS

### Frontend Protection
```tsx
// ProtectedRoute - Requires authentication
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

// AdminProtectedRoute - Requires admin role
<Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
```

### Backend Protection
```typescript
// authenticate middleware - Checks JWT
router.use(authenticate);

// requireAdmin middleware - Checks role === 'admin'
router.use(requireAdmin);
```

---

## 🛠️ DEVELOPMENT COMMANDS

### Start Development
```bash
npm run dev              # Both client and server
npm run dev:client      # Client only (port 8080)
npm run dev:server      # Server only (port 5000)
```

### Testing
```bash
npm run test            # Unit tests
npm run test:e2e        # End-to-end tests
npm run test:e2e:ui     # E2E with UI
npm run test:coverage   # Coverage report
```

### Deployment
```bash
npm run build           # Build for production
npm run deploy          # Deploy to Vercel
```

---

## 📋 COMMON ISSUES & FIXES

### Issue: Login not working
```
1. Check /api/auth/login responds
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"pass"}'

2. Verify user exists in database
3. Check password is hashed correctly
4. Verify JWT secret is set in .env
```

### Issue: Admin pages not accessible
```
1. Verify user role = 'admin' in database
2. Check token contains role
3. Verify AdminProtectedRoute checks role
4. Check admin.routes.ts has requireAdmin middleware
```

### Issue: Token expiry/refresh issues
```
1. Check tokenRefresh.ts is initialized
2. Verify refresh endpoint works
3. Check localStorage has refreshToken
4. Verify refresh token not expired in DB
```

### Issue: CORS errors
```
1. Check cors() middleware in express-app.ts
2. Verify allowedOrigins includes client URL
3. Check API_URL in client config
4. Ensure credentials: true for auth requests
```

---

## 📚 FILE LOCATIONS

| Purpose | File Path |
|---------|-----------|
| Auth Controller | `server/src/controllers/auth.controller.ts` |
| Admin Controller | `server/src/controllers/admin.controller.ts` |
| Auth Routes | `server/src/routes/auth.routes.ts` |
| Admin Routes | `server/src/routes/admin.routes.ts` |
| User Routes | `server/src/routes/user.routes.ts` |
| Protected Route | `client/src/components/ProtectedRoute.tsx` |
| Admin Protected Route | `client/src/components/AdminProtectedRoute.tsx` |
| Login Component | `client/src/pages/SignIn.tsx` |
| Token Refresh | `client/src/utils/tokenRefresh.ts` |
| App Routes | `client/src/App.tsx` |

---

## 🎯 KEY METRICS

- **Total Pages:** 26 user pages + 10 admin pages = 36 pages
- **Protected Routes:** 23 user routes + 9 admin routes = 32 protected
- **Public Routes:** 4 pages
- **API Endpoints:** 43-45 endpoints
- **Auth Methods:** Email/Password + Google OAuth
- **Role Types:** user, admin
- **Token Expiry:** Access 15min, Refresh 30days

---

## ✨ BEST PRACTICES

### Adding New Protected Routes
```tsx
// 1. Create component in client/src/pages/
// 2. Add to App.tsx with protection:
<Route path="/new-page" element={<ProtectedRoute><NewPage /></ProtectedRoute>} />
// 3. Component will redirect to /signin if not logged in
```

### Adding New Admin Routes
```tsx
// 1. Create component in client/src/pages/admin/
// 2. Add to App.tsx with admin protection:
<Route path="/admin/new" element={<AdminProtectedRoute><AdminNew /></AdminProtectedRoute>} />
// 3. Component will redirect to /admin/login if not admin
```

### Adding New API Endpoints
```typescript
// 1. Create controller method
// 2. Add route in appropriate routes file
// 3. Add authentication/admin check if needed
router.get('/path', authenticate, controller.method);
// 4. Test with curl or Postman
// 5. Update client API calls
```

---

## 🚀 NEXT STEPS

1. **Test the changes**
   ```bash
   npm run dev
   # Test login, dashboard, admin pages
   ```

2. **Verify routes work**
   ```bash
   # Check that /login still works
   # Check /signin works
   # Check admin routes accessible
   ```

3. **Review audit documents**
   - Read `AUDIT_REPORT_COMPLETE.md` for full details
   - Check `API_CONSOLIDATION_GUIDE.md` for API decisions
   - Follow `REMEDIATION_GUIDE.md` for next steps

4. **Plan API consolidation**
   - Decide: Keep server, deprecate Vercel?
   - Update team on decision
   - Document in README.md

---

**Last Updated:** January 6, 2026  
**Maintainer:** ProtoLab Development Team  
**Questions?** Check audit documents or contact dev team  

