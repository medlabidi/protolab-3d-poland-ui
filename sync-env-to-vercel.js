#!/usr/bin/env node
/**
 * Vercel Environment Variables Sync Script
 * 
 * This script reads your local .env file and syncs the environment variables
 * to your Vercel project automatically.
 * 
 * Usage:
 *   node sync-env-to-vercel.js
 *   node sync-env-to-vercel.js --production
 *   node sync-env-to-vercel.js --preview
 * 
 * Prerequisites:
 *   1. Install Vercel CLI: npm i -g vercel
 *   2. Login to Vercel: vercel login
 *   3. Link your project: vercel link
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Server-side environment variables that need to be synced to Vercel
// These are sensitive and should NOT be in vercel.json
const SERVER_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'SUPABASE_BUCKET_TEMP',
  'SUPABASE_BUCKET_JOBS',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN',
  'RESEND_API_KEY',
  'FROM_EMAIL',
  'ADMIN_EMAIL',
  'EMAIL_MODE',
  'CORS_ORIGIN',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
];

// Parse .env file
function parseEnvFile(filePath) {
  const envVars = {};
  
  if (!fs.existsSync(filePath)) {
    console.error(`Error: ${filePath} not found`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }

  return envVars;
}

// Get target environment from args
const args = process.argv.slice(2);
let target = 'production'; // default

if (args.includes('--preview')) {
  target = 'preview';
} else if (args.includes('--development')) {
  target = 'development';
}

console.log(`\n🔄 Syncing environment variables to Vercel (${target})...\n`);

// Read the .env file
const envPath = path.join(__dirname, '.env');
const envVars = parseEnvFile(envPath);

// Calculate production URLs
const VERCEL_URL = process.env.VERCEL_URL || 'protolab-3d-poland-ui.vercel.app';
const FRONTEND_URL = `https://${VERCEL_URL}`;
const BACKEND_URL = `https://${VERCEL_URL}/api`;

// Add production-specific overrides
const productionOverrides = {
  NODE_ENV: 'production',
  FRONTEND_URL: FRONTEND_URL,
  BACKEND_URL: BACKEND_URL,
  CORS_ORIGIN: FRONTEND_URL,
};

// Merge with overrides for production
const finalEnvVars = { ...envVars, ...productionOverrides };

// Sync each variable
let successCount = 0;
let errorCount = 0;

for (const varName of SERVER_ENV_VARS) {
  const value = finalEnvVars[varName];
  
  if (!value) {
    console.log(`⚠️  Skipping ${varName} (not set in .env)`);
    continue;
  }

  try {
    // Remove existing variable first (ignore errors if it doesn't exist)
    try {
      execSync(`vercel env rm ${varName} ${target} -y`, { stdio: 'pipe' });
    } catch (e) {
      // Variable might not exist, that's OK
    }

    // Add the variable
    execSync(`echo "${value}" | vercel env add ${varName} ${target}`, {
      stdio: 'pipe',
      shell: true,
    });
    
    console.log(`✅ ${varName}`);
    successCount++;
  } catch (error) {
    console.error(`❌ ${varName}: ${error.message}`);
    errorCount++;
  }
}

// Also add the production URLs
const urlVars = ['FRONTEND_URL', 'BACKEND_URL', 'NODE_ENV'];
for (const varName of urlVars) {
  const value = productionOverrides[varName];
  
  try {
    try {
      execSync(`vercel env rm ${varName} ${target} -y`, { stdio: 'pipe' });
    } catch (e) {}

    execSync(`echo "${value}" | vercel env add ${varName} ${target}`, {
      stdio: 'pipe',
      shell: true,
    });
    
    console.log(`✅ ${varName} = ${value}`);
    successCount++;
  } catch (error) {
    console.error(`❌ ${varName}: ${error.message}`);
    errorCount++;
  }
}

console.log(`\n📊 Summary: ${successCount} synced, ${errorCount} failed\n`);

if (errorCount === 0) {
  console.log('✨ All environment variables synced successfully!');
  console.log('\nNext steps:');
  console.log('  1. Deploy: vercel --prod');
  console.log('  2. Or push to GitHub for automatic deployment');
} else {
  console.log('⚠️  Some variables failed to sync. Check the errors above.');
  process.exit(1);
}
