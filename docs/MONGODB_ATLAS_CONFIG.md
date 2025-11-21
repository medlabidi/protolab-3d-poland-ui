# MongoDB Atlas Configuration Guide

## Current Setup
- **Cluster**: MongoDB Atlas (Cloud)
- **Username**: `Mayssajarboui4_db_user`
- **Password**: `1234567890`
- **Database**: `Protolab`
- **Connection String**: `mongodb+srv://Mayssajarboui4_db_user:1234567890@cluster0.mongodb.net/Protolab?retryWrites=true&w=majority&appName=Cluster0`

## Environment Configuration

The `.env` file has been updated with the MongoDB Atlas connection string.

### Key Environment Variables:
```env
MONGODB_URI=mongodb+srv://Mayssajarboui4_db_user:1234567890@cluster0.mongodb.net/Protolab?retryWrites=true&w=majority&appName=Cluster0
```

## Collections Created

The following collections will be automatically created in MongoDB Atlas when the backend first runs:

### 1. **users**
```json
{
  "_id": ObjectId,
  "name": "string",
  "email": "string (unique)",
  "passwordHash": "string",
  "phone": "string",
  "address": "string",
  "role": "user|admin",
  "createdAt": Date,
  "orders": [ObjectId]
}
```

### 2. **orders**
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "material": "string",
  "color": "string",
  "quality": "string",
  "infill": "number",
  "quantity": "number",
  "notes": "string",
  "status": "pending|printing|qualityCheck|shipped|delivered",
  "estimatedPrice": "number",
  "actualPrice": "number",
  "shippingAddress": {
    "name": "string",
    "street": "string",
    "city": "string",
    "postalCode": "string",
    "country": "string",
    "phone": "string"
  },
  "trackingNumber": "string",
  "createdAt": Date,
  "updatedAt": Date
}
```

### 3. **refreshTokens**
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "token": "string",
  "expiresAt": Date,
  "createdAt": Date
}
```

### 4. **settings**
```json
{
  "_id": ObjectId,
  "key": "string (unique)",
  "value": "any",
  "updatedAt": Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/:id` - Delete user account

### Orders
- `GET /api/orders` - List user orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Cancel order

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/orders` - List all orders
- `GET /api/admin/stats` - Get statistics

## Health Check

Test the connection:
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

## Troubleshooting

### Connection Issues
1. **IP Whitelist**: Make sure your IP address is whitelisted in MongoDB Atlas
2. **Credentials**: Verify username and password are correct
3. **Network**: Ensure you have internet connectivity

### Common Errors
- `MongoServerError: connect ENOTFOUND` - Check internet connection
- `MongoAuthenticationError` - Verify credentials in MONGODB_URI
- `MongoNetworkTimeoutError` - Check IP whitelist in Atlas

## Security Notes

⚠️ **IMPORTANT**: The credentials in `.env` should NOT be committed to version control.

### For Production:
1. Create a dedicated admin user for production
2. Use strong, random passwords (minimum 16 characters)
3. Implement IP whitelist with only necessary IPs
4. Enable encryption at rest and in transit
5. Regular backups (handled by MongoDB Atlas)
6. Monitor database activity and logs

### Best Practices:
- Use `.env.local` for local development (add to .gitignore)
- Store production credentials in secure vaults (AWS Secrets Manager, Azure Key Vault, etc.)
- Rotate credentials regularly
- Use read-only users for applications that only read data
- Enable two-factor authentication on MongoDB Atlas account

## Database Backup & Recovery

MongoDB Atlas provides:
- Automatic daily backups (default 30 days retention)
- On-demand snapshots
- Point-in-time restore (available with M10+ clusters)

To restore:
1. Go to MongoDB Atlas Dashboard
2. Navigate to Project > Backups
3. Click "Restore" on desired backup
4. Follow the restore wizard

## Monitoring

Monitor your database in MongoDB Atlas:
1. **Database Activity**: View real-time query logs
2. **Performance Advisor**: Get optimization suggestions
3. **Alerts**: Set up alerts for connection issues, slow queries, etc.
4. **Metrics**: Monitor storage, connections, operations per second

## Next Steps

1. ✅ Environment variables configured
2. ✅ Database connection string set
3. Run `npm run dev` to start the backend
4. Monitor logs for successful connection
5. Test API endpoints
6. Deploy to production when ready

---

**Last Updated**: November 20, 2025
**Status**: ✅ MongoDB Atlas Integration Complete
