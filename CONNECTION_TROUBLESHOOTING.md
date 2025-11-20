# MongoDB Atlas Connection Troubleshooting Guide

## Common Connection Errors & Solutions

### Error: ENOTFOUND / getaddrinfo error
**Cause**: Network connectivity issue or DNS resolution problem

**Solutions**:
1. ✅ Check internet connection
2. ✅ Verify DNS settings
3. ✅ Check firewall settings
4. ✅ Verify MONGODB_URI is correct

**Test**:
```bash
ping cluster0.mongodb.net
```

---

### Error: Authentication failed
**Cause**: Wrong username or password in MONGODB_URI

**Solutions**:
1. ✅ Verify username: `Mayssajarboui4_db_user`
2. ✅ Verify password: `1234567890`
3. ✅ Check for special characters (should be URL-encoded)
4. ✅ Verify user exists in MongoDB Atlas

**Expected format**:
```
mongodb+srv://Mayssajarboui4_db_user:1234567890@cluster0.mongodb.net/Protolab?retryWrites=true&w=majority&appName=Cluster0
```

---

### Error: Timeout / ETIMEDOUT
**Cause**: IP address not whitelisted in MongoDB Atlas

**Solutions**:
1. ✅ Go to MongoDB Atlas Dashboard
2. ✅ Click "Network Access" in left menu
3. ✅ Click "Add IP Address"
4. ✅ Choose "Add Current IP Address" or add your IP manually
5. ✅ Wait 1-2 minutes for changes to apply
6. ✅ Try connection again

**Your IP Address**:
```
37.47.122.245/32
```

**Or for development (allow all IPs)**:
```
0.0.0.0/0
```

---

### Error: Connection refused
**Cause**: Wrong cluster or cluster not running

**Solutions**:
1. ✅ Verify cluster name is `Cluster0`
2. ✅ Check cluster is not paused in MongoDB Atlas
3. ✅ Verify using correct connection string format

---

### Error: Invalid connection string
**Cause**: Malformed MONGODB_URI

**Valid Format**:
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority&appName=AppName
```

**Invalid Examples**:
```
mongodb://username:password@cluster.mongodb.net  ❌ Missing +srv
mongodb://cluster0.mongodb.net                    ❌ Missing credentials
mongodb+srv://cluster0.mongodb.net                ❌ Missing credentials
```

---

## Verification Steps

### 1. Check .env File
```bash
# Verify .env contains correct URI
cat .env | grep MONGODB_URI
```

Expected output:
```
MONGODB_URI=mongodb+srv://Mayssajarboui4_db_user:1234567890@cluster0.mongodb.net/Protolab?retryWrites=true&w=majority&appName=Cluster0
```

### 2. Test Connection String
```bash
npm run verify-db
```

### 3. Check MongoDB Atlas Cluster
1. Go to https://cloud.mongodb.com
2. Login to your account
3. Go to "Databases"
4. Look for "Cluster0"
5. Check status (should be green/running)

### 4. Check Network Access
1. Go to https://cloud.mongodb.com
2. Select your project
3. Go to "Network Access"
4. Verify your IP is in the whitelist

### 5. Verify Credentials
1. Go to "Database Access"
2. Look for user "Mayssajarboui4_db_user"
3. Verify password is correct

---

## Quick Diagnostic Commands

### Test if MongoDB Atlas is reachable
```bash
# Test DNS
nslookup cluster0.mongodb.net

# Test connectivity
telnet cluster0.mongodb.net 27017
```

### Check Node.js and packages
```bash
# Verify Node.js version
node --version

# Verify mongoose is installed
npm list mongoose

# Verify dotenv is installed
npm list dotenv
```

### Check environment variables
```bash
# Show MONGODB_URI
echo $env:MONGODB_URI  # PowerShell
# or
echo $MONGODB_URI      # Bash
```

---

## Connection Fix Checklist

- [ ] .env file exists and contains MONGODB_URI
- [ ] MONGODB_URI has correct format (mongodb+srv://...)
- [ ] Username is correct: `Mayssajarboui4_db_user`
- [ ] Password is correct: `1234567890`
- [ ] Database name is correct: `Protolab`
- [ ] Cluster name is correct: `Cluster0`
- [ ] Internet connection is working
- [ ] IP address is whitelisted in MongoDB Atlas
- [ ] MongoDB Atlas cluster is running (not paused)
- [ ] No special characters in password (or properly URL-encoded)

---

## Step-by-Step Connection Fix

### Step 1: Verify .env File
```bash
# Open and check .env
cat .env
```

If missing or wrong, update it:
```env
MONGODB_URI=mongodb+srv://Mayssajarboui4_db_user:1234567890@cluster0.mongodb.net/Protolab?retryWrites=true&w=majority&appName=Cluster0
```

### Step 2: Test Connection
```bash
npm run verify-db
```

Wait for output. If still failing, continue to Step 3.

### Step 3: Check MongoDB Atlas
1. Visit https://cloud.mongodb.com
2. Select your project
3. Go to "Network Access"
4. Check if your IP is whitelisted

### Step 4: Add Your IP (if needed)
1. In "Network Access"
2. Click "Add IP Address"
3. Enter: `0.0.0.0/0` (allow all IPs for development)
   - Or: `37.47.122.245/32` (specific IP)
4. Click "Confirm"
5. Wait 1-2 minutes
6. Try `npm run verify-db` again

### Step 5: Verify Credentials
1. Go to "Database Access"
2. Find user "Mayssajarboui4_db_user"
3. Verify it exists
4. Reset password if needed

### Step 6: Test Again
```bash
npm run verify-db
```

Should see: ✅ Connection successful!

---

## If Still Not Working

### Enable Debug Logging
Create a test file `test-connection.js`:
```javascript
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.set('debug', true); // Enable debug logging

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected'))
  .catch(err => {
    console.error('❌ Error:', err.message);
    console.error('Code:', err.code);
  });
```

Run:
```bash
node test-connection.js
```

### Contact MongoDB Atlas Support
If all steps above don't work:
1. Visit https://support.mongodb.com
2. Create support ticket
3. Include error message and connection string (masked)
4. Include cluster name and IP address

---

## Advanced: Connection Pool Settings

If you get timeout errors even after whitelisting IP:

Update `src/config/database.ts`:
```typescript
await mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 20000,  // Increase timeout
  socketTimeoutMS: 45000,
  connectTimeoutMS: 20000,
  maxPoolSize: 10,
  minPoolSize: 2,
  retryWrites: true,
  w: 'majority',
});
```

---

## Summary

**Most Common Fix**: Whitelist your IP in MongoDB Atlas Network Access

**Quick Test**:
```bash
npm run verify-db
```

**Full Verification**:
1. Check .env file
2. Run verify-db
3. Check MongoDB Atlas IP whitelist
4. Add your IP if needed
5. Wait 1-2 minutes
6. Test again

---

**Still having issues?**
- Review error message carefully
- Check MONGODB_ATLAS_CONFIG.md for detailed setup
- Verify all credentials are correct
- Ensure cluster is running and not paused
