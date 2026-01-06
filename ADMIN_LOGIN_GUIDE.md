# 🔐 ADMIN LOGIN - COMPLETE GUIDE

## Login Credentials

```
Email:    mahmoud@protolab.info
Password: 000000
```

## Server Status

✅ **Backend Server:** Running on port 5000  
✅ **Frontend Server:** Running on port 8080  
✅ **Database:** Supabase connected  
✅ **Email Service:** Enabled (Resend)

---

## 🚀 Quick Access

### Option 1: Web Login Interface
1. Open: **http://localhost:8080/admin/login**
2. Enter credentials:
   - Email: `mahmoud@protolab.info`
   - Password: `000000`
3. Click "Login" button
4. You'll be redirected to the admin dashboard

### Option 2: API Login Test
**POST** `http://localhost:5000/api/auth/login`

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mahmoud@protolab.info",
    "password": "000000"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "3e02500a-9e15-408b-8f14-50bc31552a91",
    "email": "mahmoud@protolab.info",
    "role": "admin"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📊 Admin Dashboard Access

After successful login, you'll have access to:

| Page | URL | Features |
|------|-----|----------|
| **Dashboard** | `/admin` | Overview, statistics, recent orders |
| **Orders** | `/admin/orders` | 109 orders (note: currently mock data) |
| **Users** | `/admin/users` | 7 users (note: currently mock data) |
| **Printers** | `/admin/printers` | Fleet monitoring (4 printers) |
| **Materials** | `/admin/materials` | Inventory (5+ materials) |
| **Analytics** | `/admin/analytics` | Business metrics & KPIs |
| **Reports** | `/admin/reports` | Report generation |
| **Notifications** | `/admin/notifications` | Notification center |
| **Settings** | `/admin/settings` | System configuration |

---

## 🔑 Authentication System

### Token System
- **Access Token:** 15-minute expiry
- **Refresh Token:** 7-day expiry
- **Token Type:** JWT (JSON Web Token)
- **Storage:** localStorage (client-side)

### Authentication Flow

```
1. User submits email + password
   ↓
2. Backend validates credentials
   ↓
3. Generate JWT tokens
   ↓
4. Return access + refresh tokens
   ↓
5. Frontend stores tokens in localStorage
   ↓
6. Subsequent API calls include access token in Authorization header
   ↓
7. When access token expires, use refresh token to get new one
```

### Security Features

✅ Role-based access control (Admin only)  
✅ JWT token encryption  
✅ HTTP-only cookie storage available  
✅ CORS protection  
✅ Rate limiting (200 requests per 900 seconds)  
✅ Security headers enabled  

---

## ⚠️ Important Notes

### Current Data Status

⚠️ **Database Data Issues Found:**
- **Users:** 0 records in database (auth uses hardcoded check)
- **Orders:** 0 records in database (shows mock data: 109 orders)
- **Materials:** 23 records with corrupted fields
- **Printers:** 2 records with incomplete data

🔍 See [SUPABASE_DATA_STATUS.md](SUPABASE_DATA_STATUS.md) for full database audit.

### What's Working

✅ Admin authentication flow  
✅ Token generation and validation  
✅ Role-based access control  
✅ Protected routes  
✅ API endpoints responding  
✅ Email service configured  
✅ CORS setup  
✅ Security middleware  

### What Needs Attention

⚠️ Database population (users, orders, payments table)  
⚠️ Replace mock data with real queries  
⚠️ Fix materials table corruption  
⚠️ Token refresh endpoint has issues  

---

## 🛠️ Troubleshooting

### "Cannot connect to server"
```
Error: Server not running on port 5000
Solution: npm run dev:server
```

### "Invalid credentials"
```
Error: Email or password incorrect
Check:
  • Email: mahmoud@protolab.info
  • Password: 000000
  • User exists in Supabase
```

### "CORS error"
```
Error: Cross-Origin Request Blocked
Check:
  • Frontend running on port 8080
  • Backend running on port 5000
  • CORS headers configured
```

### "Token expired"
```
Error: 401 Unauthorized after 15 minutes
Solution: Automatic refresh token request (should happen automatically)
```

---

## 📱 Test Pages

### Admin Login Test Form
File: `admin-login-test.html`  
Access: Open file in browser with running server

### Login Test Script
File: `test-login-admin.js`  
Run: `node test-login-admin.js`

### Database Check Script
File: `check-supabase-data.js`  
Run: `node check-supabase-data.js`

---

## 🔗 Related Documents

- [ADMIN_DASHBOARD_GUIDE.md](ADMIN_DASHBOARD_GUIDE.md) - Complete dashboard overview
- [SUPABASE_DATA_STATUS.md](SUPABASE_DATA_STATUS.md) - Database audit and issues
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Production deployment
- [SECURITY_FIXES.md](SECURITY_FIXES.md) - Security configuration

---

## 📞 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Clear tokens |

### Admin Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/orders` | Get all orders |
| GET | `/api/admin/users` | Get all users |
| GET | `/api/admin/settings` | Get settings |
| PATCH | `/api/admin/orders/:id/status` | Update order status |

---

## ✅ Verification Checklist

- [x] Backend server running on port 5000
- [x] Frontend server running on port 8080
- [x] Supabase connected
- [x] Admin credentials configured
- [x] JWT token generation working
- [x] Protected routes set up
- [x] CORS enabled for auth requests
- [ ] Database populated with real data
- [ ] Token refresh endpoint fixed
- [ ] Production environment variables set

---

**Last Updated:** January 6, 2026  
**Status:** ✅ Authentication Working | ⚠️ Database Needs Data

To login now:
1. Ensure server is running: `npm run dev:server`
2. Open: http://localhost:8080/admin/login
3. Use credentials above
4. Access the admin dashboard!
