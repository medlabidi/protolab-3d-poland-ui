# ProtoLab Backend - MongoDB Atlas Integration Guide

## Quick Start

### 1. Environment Setup
The `.env` file has been created with MongoDB Atlas credentials:

```bash
MONGODB_URI=mongodb+srv://Mayssajarboui4_db_user:1234567890@cluster0.mongodb.net/Protolab?retryWrites=true&w=majority&appName=Cluster0
```

### 2. Verify Database Connection
Before starting the server, verify MongoDB Atlas connectivity:

```bash
npm run verify-db
```

Expected output:
```
✅ Connection successful!
Connection Details:
  Database Name: Protolab
  Host: cluster0.mongodb.net
  State: Connected
```

### 3. Start the Backend Server

**Option A - Development mode with hot reload:**
```bash
npm run dev:server
```

**Option B - Production build and run:**
```bash
npm run build:server
npm start
```

### 4. Test API Health
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-20T00:00:00.000Z"
}
```

## Available API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### User Profile
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile information
- `DELETE /api/users/:id` - Delete account

### Orders
- `GET /api/orders` - List all user orders
- `POST /api/orders` - Create new print order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Cancel order

### Admin (requires admin role)
- `GET /api/admin/users` - List all users
- `GET /api/admin/orders` - List all orders
- `GET /api/admin/stats` - Get system statistics

## Database Collections

The following MongoDB collections are automatically created:

### users
Stores user account information and authentication data

### orders
Stores 3D print orders and their status

### refreshTokens
Stores JWT refresh tokens for session management

### settings
Stores application configuration and settings

## Environment Variables

### Required for MongoDB Atlas
- `MONGODB_URI` - MongoDB connection string with credentials

### Optional Configuration
- `JWT_ACCESS_SECRET` - Secret for access token (change in production)
- `JWT_REFRESH_SECRET` - Secret for refresh token (change in production)
- `CORS_ORIGIN` - Frontend URL for CORS (default: http://localhost:8080)
- `S3_ENDPOINT` - S3/MinIO endpoint for file uploads
- `RATE_LIMIT_MAX_REQUESTS` - Rate limit per window

## Troubleshooting

### Connection Issues

**Error: connect ENOTFOUND**
- Check internet connection
- Verify MongoDB Atlas cluster is running

**Error: authentication failed**
- Verify username and password in MONGODB_URI
- Check user has access to the database

**Error: timeout**
- IP may not be whitelisted in MongoDB Atlas
- Go to MongoDB Atlas Dashboard → Network Access
- Add your IP address to the IP whitelist

### Server Won't Start

1. Check Node.js version (requires 16+)
   ```bash
   node --version
   ```

2. Verify dependencies are installed
   ```bash
   npm install
   ```

3. Check port 5000 is not in use
   ```bash
   netstat -ano | findstr :5000  # Windows
   lsof -i :5000                  # macOS/Linux
   ```

4. Review logs for detailed error messages
   ```bash
   npm run dev:server
   ```

## Security Best Practices

⚠️ **Important for Production:**

1. **Never commit .env to version control**
   - Add `.env` to `.gitignore`
   - Use environment variable management for production

2. **Rotate credentials regularly**
   - Change passwords every 90 days
   - Create separate accounts for dev and production

3. **Use strong secrets**
   - JWT_ACCESS_SECRET: minimum 32 characters
   - JWT_REFRESH_SECRET: minimum 32 characters

4. **Enable encryption**
   - MongoDB Atlas encryption at rest
   - TLS/SSL for connections

5. **Monitor access**
   - Enable MongoDB Atlas activity logging
   - Set up alerts for suspicious activity

6. **Backup strategy**
   - Enable automatic backups in MongoDB Atlas
   - Test restore procedures regularly

## Deployment Checklist

- [ ] Update JWT secrets to strong random values
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database cluster
- [ ] Set CORS_ORIGIN to production domain
- [ ] Enable SSL/TLS certificates
- [ ] Set up environment variables in hosting platform
- [ ] Configure IP whitelist in MongoDB Atlas for deployment server
- [ ] Enable backup retention and snapshot policies
- [ ] Set up monitoring and alerting
- [ ] Configure logging aggregation
- [ ] Test all API endpoints in production
- [ ] Set up CI/CD pipeline

## Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev:server

# Build for production
npm run build:server

# Start production server
npm start

# Verify database connection
npm run verify-db

# Run from root directory
npm run dev:server     # Development
npm run build:server   # Build
```

## Additional Resources

- **MongoDB Atlas Documentation**: https://docs.mongodb.com/atlas/
- **Express.js Guide**: https://expressjs.com/
- **Mongoose Documentation**: https://mongoosejs.com/
- **JWT Auth Best Practices**: https://tools.ietf.org/html/rfc7519

## Support

For issues or questions:
1. Check MONGODB_ATLAS_CONFIG.md for detailed setup instructions
2. Review error logs for specific error messages
3. Verify environment variables are correctly set
4. Ensure MongoDB Atlas cluster is running and accessible

---

**Last Updated**: November 20, 2025
**Status**: ✅ MongoDB Atlas Integration Complete
