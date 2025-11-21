# ❌ MongoDB Connection Error - ENOTFOUND - Solution

## Problem Identified
```
Error: querySrv ENOTFOUND _mongodb._tcp.cluster0.mongodb.net
```

This is a **DNS resolution error**, which means your computer cannot reach MongoDB Atlas.

---

## Causes & Solutions

### 1. ✅ No Internet Connection
**Check your internet:**
```bash
# Test if you can reach the internet
ping 8.8.8.8
```

If this fails:
- Check WiFi connection
- Check if ISP is down
- Restart router

### 2. ✅ DNS Resolution Issue
**Test DNS resolution:**
```bash
# Try to resolve MongoDB cluster
nslookup cluster0.mongodb.net

# Or using ping
ping cluster0.mongodb.net
```

**If DNS fails:**
- Try different DNS servers:
  - Google DNS: 8.8.8.8
  - Cloudflare DNS: 1.1.1.1

**Change DNS on Windows:**
1. Settings → Network & Internet → WiFi
2. Click your network → Properties
3. Find DNS settings
4. Set to: 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare)

### 3. ✅ Firewall/Network Blocking
**Check firewall:**
- Windows Defender Firewall might be blocking Node.js
- Corporate proxy might be blocking MongoDB Atlas
- VPN might be interfering

**Solutions:**
- Disable firewall temporarily to test
- Add Node.js to firewall exceptions
- Try different network (mobile hotspot)
- Check corporate proxy settings

### 4. ✅ MongoDB Atlas Status
**Verify cluster is running:**
1. Go to https://cloud.mongodb.com
2. Login to your account
3. Select project → Databases
4. Look for "Cluster0"
5. Check status (should be green/RUNNING)

If paused:
- Click "Resume" button
- Wait 1-2 minutes
- Try connection again

### 5. ✅ Connection String Verification
**Current connection string:**
```
mongodb+srv://Mayssajarboui4_db_user:1234567890@cluster0.mongodb.net/protolab?retryWrites=true&w=majority&appName=Cluster0
```

**Verify each part:**
- ✅ Username: `Mayssajarboui4_db_user`
- ✅ Password: `1234567890`
- ✅ Database: `protolab` (lowercase)
- ✅ Cluster: `cluster0`
- ✅ Options: `retryWrites=true&w=majority&appName=Cluster0`

---

## Quick Fix Checklist

- [ ] Internet is connected and working
- [ ] Can reach google.com
- [ ] DNS resolution works (`ping 8.8.8.8`)
- [ ] Can resolve cluster0.mongodb.net
- [ ] MongoDB Atlas cluster is RUNNING (not paused)
- [ ] IP is whitelisted in Network Access
- [ ] Firewall is not blocking Node.js
- [ ] Not behind corporate proxy

---

## Step-by-Step Fix

### Step 1: Test Internet
```bash
ping 8.8.8.8
```

If fails: **Fix your internet connection first**

### Step 2: Test DNS
```bash
nslookup cluster0.mongodb.net
```

Expected output: Shows IP address (e.g., `35.201.123.45`)

If fails: Your DNS is broken. Try:
```bash
# Switch to Google DNS
netsh interface ipv4 set dnsservers name="WiFi" static 8.8.8.8
netsh interface ipv4 add dnsservers name="WiFi" 8.8.4.4 index=2

# Test again
nslookup cluster0.mongodb.net
```

### Step 3: Test Connection
```bash
npm run verify-db
```

If still fails, check Step 4.

### Step 4: Verify Cluster Status
1. Go to https://cloud.mongodb.com
2. Login → Select Project → Databases
3. Check "Cluster0" status
4. If paused → Click "Resume"
5. Wait 1-2 minutes
6. Try `npm run verify-db` again

### Step 5: Check IP Whitelist
1. Go to https://cloud.mongodb.com
2. Network Access
3. Verify your IP is whitelisted
4. If not → Click "Add IP Address"

---

## Alternative: Use Local MongoDB (Temporary)

If MongoDB Atlas is not accessible, use local MongoDB temporarily:

### Install MongoDB Locally
```bash
# For Windows, download from:
# https://www.mongodb.com/try/download/community

# Or use Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Update .env
```env
# Temporarily use local MongoDB
MONGODB_URI=mongodb://localhost:27017/protolab
```

### Test Connection
```bash
npm run verify-db
```

Once you fix the MongoDB Atlas connection, switch back to the Atlas URI.

---

## DNS Troubleshooting on Windows

### Using Command Prompt (Administrator):
```bash
# Clear DNS cache
ipconfig /flushdns

# Renew DNS settings
ipconfig /release
ipconfig /renew

# Test DNS
nslookup cluster0.mongodb.net
```

### Using PowerShell (Administrator):
```powershell
# Flush DNS
Clear-DnsClientCache

# Set DNS servers
Set-DnsClientServerAddress -InterfaceAlias "WiFi" -ServerAddresses ("8.8.8.8","8.8.4.4")

# Test
Test-NetConnection -ComputerName cluster0.mongodb.net -Port 27017
```

---

## Network Diagnostic Report

Run this to generate diagnostic info:

```bash
# Create diagnostic script
echo "=== Network Diagnostics ===" > diagnostic.txt
echo "Internet:" >> diagnostic.txt
ping -c 1 8.8.8.8 >> diagnostic.txt 2>&1
echo "" >> diagnostic.txt
echo "DNS:" >> diagnostic.txt
nslookup cluster0.mongodb.net >> diagnostic.txt 2>&1
echo "" >> diagnostic.txt
echo "MongoDB Cluster:" >> diagnostic.txt
nslookup _mongodb._tcp.cluster0.mongodb.net >> diagnostic.txt 2>&1
echo "" >> diagnostic.txt
echo "Node Version:" >> diagnostic.txt
node --version >> diagnostic.txt
echo "" >> diagnostic.txt
echo "MongoDB URI:" >> diagnostic.txt
echo $MONGODB_URI >> diagnostic.txt
cat diagnostic.txt
```

---

## MongoDB Atlas Admin Check

Verify account and cluster in MongoDB Atlas:

1. **Login**: https://cloud.mongodb.com
2. **Check Project**: Default Project
3. **Check Cluster**: Cluster0 (RUNNING status)
4. **Check Database Access**: User exists with your username
5. **Check Network Access**: Your IP whitelisted

---

## Still Having Issues?

### Enable Debug Logging
Create `test-db-debug.js`:
```javascript
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.set('debug', true);

console.log('URI:', process.env.MONGODB_URI);
console.log('Attempting connection...');

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log('✅ Connected!'))
  .catch(err => {
    console.error('❌ Error:');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('Full error:', err);
  });
```

Run:
```bash
node test-db-debug.js
```

### Contact Support
If none of this works:
1. Check MongoDB Atlas status: https://status.mongodb.com/
2. Create support ticket: https://support.mongodb.com/
3. Include:
   - Error message
   - Your IP address
   - Cluster name
   - Connection string (masked)

---

## Summary

**Most Likely Causes** (in order):
1. ❌ Internet not connected
2. ❌ DNS not resolving cluster0.mongodb.net
3. ❌ Firewall blocking MongoDB connection
4. ❌ MongoDB Atlas cluster is paused
5. ❌ IP not whitelisted

**Quick Fix**:
```bash
# Check internet
ping 8.8.8.8

# Check DNS
nslookup cluster0.mongodb.net

# Resume cluster in MongoDB Atlas if paused

# Test connection
npm run verify-db
```

---

**Database Name**: `protolab` (lowercase)  
**Status**: Waiting for network connectivity  
**Next Action**: Fix internet/DNS then test again
