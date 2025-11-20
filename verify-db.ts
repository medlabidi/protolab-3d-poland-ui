#!/usr/bin/env node

/**
 * MongoDB Atlas Connection Verification Script
 * Usage: npm run verify-db
 * 
 * This script tests the MongoDB Atlas connection without starting the full server
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { logger } from './src/config/logger';

const verifyConnection = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/protolab';
  
  console.log('\n📋 MongoDB Atlas Connection Verification');
  console.log('==========================================\n');
  
  // Log masked URI for security
  const maskedUri = mongoUri.replace(/:[^:]*@/, ':****@');
  console.log(`📍 Connection String (masked): ${maskedUri}`);
  
  // Check if URI looks valid
  if (!mongoUri.includes('mongodb')) {
    console.error('\n❌ Invalid MongoDB URI format!');
    console.error('Expected format: mongodb+srv://username:password@cluster.mongodb.net/database');
    console.error(`Got: ${maskedUri}`);
    process.exit(1);
  }
  
  try {
    console.log('\n⏳ Connecting to MongoDB Atlas...\n');
    
    // More lenient timeout settings for initial connection
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,  // Increased from 5000
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,          // Increased from 10000
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    
    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;
    
    console.log('✅ Connection successful!\n');
    console.log('Connection Details:');
    console.log(`  Database Name: ${dbName}`);
    console.log(`  Host: ${host}`);
    console.log(`  State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Check collections
    const collections = await mongoose.connection.db?.listCollections().toArray();
    
    console.log(`\n📚 Collections: ${collections?.length || 0}`);
    if (collections && collections.length > 0) {
      collections.forEach((col) => {
        console.log(`  - ${col.name}`);
      });
    } else {
      console.log('  (No collections yet - they will be created when the server starts)');
    }
    
    // Test write operation
    console.log('\n🔧 Testing write operation...');
    
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('_ConnectionTest', testSchema);
    
    const testDoc = await TestModel.create({ test: `Connected at ${new Date().toISOString()}` });
    console.log('  ✅ Write successful');
    
    // Clean up
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('  ✅ Cleanup successful');
    
    console.log('\n🎉 All tests passed! MongoDB Atlas is ready.\n');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected cleanly\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    
    if (error instanceof Error) {
      console.error(`Error: ${error.message}\n`);
      console.error(`Error Code: ${(error as any).code}\n`);
      
      // Detailed troubleshooting
      if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        console.error('💡 NETWORK ERROR - Possible causes:');
        console.error('  1. No internet connection');
        console.error('  2. DNS resolution failed');
        console.error('  3. Firewall blocking connection');
        console.error('\nSolution: Check your internet connection and firewall settings');
      } else if (error.message.includes('authentication') || error.message.includes('auth')) {
        console.error('💡 AUTHENTICATION ERROR - Possible causes:');
        console.error('  1. Wrong username in MONGODB_URI');
        console.error('  2. Wrong password');
        console.error('  3. Username/password contains special characters');
        console.error('\nSolution: Verify credentials match MongoDB Atlas user');
      } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        console.error('💡 TIMEOUT ERROR - Possible causes:');
        console.error('  1. IP address not whitelisted in MongoDB Atlas');
        console.error('  2. Slow network connection');
        console.error('  3. MongoDB Atlas cluster not responding');
        console.error('\nSolution: Check IP whitelist in MongoDB Atlas Network Access');
      } else if (error.message.includes('Invalid') || error.message.includes('invalid')) {
        console.error('💡 INVALID CONNECTION STRING');
        console.error(`  Current: ${maskedUri}`);
        console.error('  Expected: mongodb+srv://username:password@cluster.mongodb.net/database');
      } else {
        console.error('💡 UNKNOWN ERROR');
        console.error('  Check MONGODB_ATLAS_CONFIG.md for troubleshooting');
      }
    } else {
      console.error(`Error: ${String(error)}\n`);
    }
    
    console.error('\n📖 For help, see: MONGODB_ATLAS_CONFIG.md\n');
    
    process.exit(1);
  }
};

verifyConnection();
