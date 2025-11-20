# 📝 Frontend Sign Up & Login Guide

## ✅ Sign Up Form Implementation

The Sign Up form has been successfully implemented to work with the MongoDB database backend.

### Features Implemented

#### 1. **Sign Up Form**
- Name field (required)
- Email field (required, validated)
- Password field (required, minimum 6 characters)
- Confirm Password field (required, must match)
- Real-time validation

#### 2. **Login Form**
- Email field (required)
- Password field (required)
- Forgot password link (placeholder)
- Social login with Google (placeholder)

#### 3. **API Integration**
- Connects to backend: `http://localhost:5000/api/auth`
- Endpoints:
  - `POST /auth/register` - Create new account
  - `POST /auth/login` - Login user

#### 4. **Data Validation**
```typescript
// Sign Up Validation:
✓ All fields required
✓ Email format validation
✓ Password minimum 6 characters
✓ Passwords must match
✓ Error messages with toast notifications
```

#### 5. **Error Handling**
- Field validation on client side
- Server-side error messages displayed
- Connection error handling
- User-friendly error messages with Sonner toast

#### 6. **Success Handling**
- Tokens stored in localStorage:
  - `accessToken` - JWT token for API requests
  - `refreshToken` - Token for refreshing access
  - `user` - User information (JSON)
  - `isLoggedIn` - Login status flag

---

## 🚀 How to Create Your First Account

### Step 1: Ensure Backend is Running
```bash
npm run dev
```
The backend should be running on `http://localhost:5000`

### Step 2: Open Frontend
Frontend will open on `http://localhost:8080`

### Step 3: Navigate to Sign Up
1. Click the "Sign Up" tab on the login page
2. Fill in the form:
   - **Name**: Enter your full name (e.g., "John Doe")
   - **Email**: Enter your email address (e.g., "john@example.com")
   - **Password**: Enter password (minimum 6 characters)
   - **Confirm Password**: Re-enter the same password

### Step 4: Submit Form
Click "Sign Up" button

### Step 5: Verify Account
- ✅ If successful: Redirected to dashboard, account created in MongoDB
- ❌ If failed: Error message shown, fix and try again

---

## 📋 Form Validation Rules

### Name Field
- ✓ Required
- ✓ Any text allowed

### Email Field
- ✓ Required
- ✓ Must be valid email format
- ✓ Must not already exist in database

### Password Field
- ✓ Required
- ✓ Minimum 6 characters
- ✓ Must match confirm password
- ✓ Will be hashed with bcrypt before storing

### Confirm Password
- ✓ Required
- ✓ Must match password field exactly

---

## 🔒 Security Features

### Frontend Security
1. **Password Validation**
   - Minimum 6 characters enforced
   - Password confirmation required
   - Passwords not shown in plain text

2. **Form Validation**
   - Real-time client-side validation
   - Error messages guide user
   - Required fields enforced

3. **Data Handling**
   - Passwords sent via HTTPS in production
   - Form data cleared after successful submission
   - Sensitive data not logged to console

### Backend Security
1. **Password Hashing**
   - bcrypt with 10 salt rounds
   - Passwords never stored in plain text

2. **Token Management**
   - JWT tokens with expiry
   - Refresh token rotation
   - Secure storage in database

3. **User Validation**
   - Email uniqueness check
   - Duplicate account prevention
   - Account already exists check

---

## 🔌 API Integration Details

### Register Endpoint
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response (Success):
{
  "message": "Registration successful",
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "tokens": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}

Response (Error):
{
  "error": "User already exists"
}
```

### Login Endpoint
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response (Success):
{
  "message": "Login successful",
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "tokens": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}

Response (Error):
{
  "error": "Invalid credentials"
}
```

---

## 💾 Database Schema

### User Collection in MongoDB
```typescript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  passwordHash: String (hashed with bcrypt),
  role: String (default: "user"),
  phone: String (optional),
  address: String (optional),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## 🧪 Testing the Sign Up

### Test Case 1: Successful Registration
```
Name: Test User
Email: test@example.com
Password: password123
Confirm: password123
Expected: Account created, redirect to dashboard
```

### Test Case 2: Email Already Exists
```
Name: Test User 2
Email: test@example.com (same as Test Case 1)
Password: password123
Confirm: password123
Expected: Error "User already exists"
```

### Test Case 3: Passwords Don't Match
```
Name: Test User
Email: test2@example.com
Password: password123
Confirm: password456
Expected: Error "Passwords do not match"
```

### Test Case 4: Password Too Short
```
Name: Test User
Email: test3@example.com
Password: pass
Confirm: pass
Expected: Error "Password must be at least 6 characters"
```

### Test Case 5: Missing Field
```
Name: (empty)
Email: test4@example.com
Password: password123
Confirm: password123
Expected: Error "All fields are required"
```

---

## 📱 Frontend Sign Up Code

### Location
```
src/pages/Login.tsx
```

### Key Functions

#### handleSignup()
```typescript
const handleSignup = async (e: React.FormEvent) => {
  // 1. Validate all fields
  // 2. Check password match
  // 3. Check password length
  // 4. Call API register endpoint
  // 5. Store tokens in localStorage
  // 6. Redirect to dashboard
}
```

#### State Management
```typescript
// Form inputs
const [signupName, setSignupName] = useState("");
const [signupEmail, setSignupEmail] = useState("");
const [signupPassword, setSignupPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

// Loading state
const [isLoading, setIsLoading] = useState(false);
```

---

## 🔗 Connected Components

### Login.tsx
- Main login/signup page
- Form handling
- API integration

### useLanguage Hook
- Language context provider
- Multi-language support (EN/PL)
- Translation keys: `t.login.*`

### LanguageContext.tsx
- Global language state
- EN/PL language switching

### Toast Notifications (Sonner)
- Error messages
- Success messages
- User feedback

---

## 🐛 Common Issues & Solutions

### Issue: "Connection refused"
**Cause**: Backend not running
**Solution**: 
```bash
npm run dev
```

### Issue: "User already exists"
**Cause**: Email already registered
**Solution**: Use a different email address

### Issue: "All fields are required"
**Cause**: One or more fields empty
**Solution**: Fill all fields

### Issue: "Passwords do not match"
**Cause**: Password and confirm password different
**Solution**: Ensure both fields are exactly the same

### Issue: "Password must be at least 6 characters"
**Cause**: Password too short
**Solution**: Use a password with 6+ characters

### Issue: Stuck on loading
**Cause**: Backend not responding / MongoDB not connected
**Solution**: 
1. Check backend is running: `npm run dev`
2. Test MongoDB: `npm run verify-db`

---

## 📊 User Flow Diagram

```
User visits /login
    ↓
Clicks "Sign Up" tab
    ↓
Fills in form:
  - Name
  - Email
  - Password
  - Confirm Password
    ↓
Clicks "Sign Up" button
    ↓
Frontend validates:
  - All fields present ✓
  - Passwords match ✓
  - Password length ≥ 6 ✓
    ↓
Sends POST to /auth/register
    ↓
Backend processes:
  - Check email not exists ✓
  - Hash password ✓
  - Create user in MongoDB ✓
  - Generate JWT tokens ✓
    ↓
Response with:
  - User info
  - Access token
  - Refresh token
    ↓
Frontend stores tokens:
  - localStorage.accessToken
  - localStorage.refreshToken
  - localStorage.user
  - localStorage.isLoggedIn
    ↓
Redirect to /dashboard
    ↓
Success! ✅
```

---

## 🎯 Next Steps

1. ✅ Backend running (`npm run dev`)
2. ✅ MongoDB whitelisted and connected (`npm run verify-db`)
3. 📝 Create your first account using Sign Up form
4. 🔐 Login with your credentials
5. 📊 Access dashboard with user data
6. ⚙️ Update profile settings
7. 📦 Create orders

---

## 📚 Related Files

### Frontend
- `src/pages/Login.tsx` - Sign up/login page
- `src/contexts/LanguageContext.tsx` - Language provider
- `src/lib/translations.ts` - Translation keys

### Backend
- `src/controllers/auth.controller.ts` - Auth controller
- `src/services/auth.service.ts` - Auth logic
- `src/models/User.ts` - User schema
- `src/routes/auth.routes.ts` - Auth routes

### Configuration
- `.env` - Environment variables
- `src/config/database.ts` - Database connection

---

## ✨ Features Included

- ✅ Form validation (client & server)
- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ Refresh token rotation
- ✅ Error handling & messages
- ✅ Loading states
- ✅ Redirect on success
- ✅ Multi-language support
- ✅ Dark mode support
- ✅ Toast notifications

---

**Your Sign Up is ready to use! Create your first account now! 🎉**

