#!/bin/bash

echo "🔍 Vercel Deployment Configuration Verification"
echo "================================================"
echo ""

# Check if required files exist
echo "✓ Checking required files..."

files=(
  "vercel.json"
  "api/index.ts"
  "api/health.ts"
  ".vercelignore"
  ".env.example"
  "VERCEL_DEPLOYMENT.md"
  "client/src/config/api.ts"
)

all_good=true
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file MISSING"
    all_good=false
  fi
done

echo ""
echo "✓ Checking package.json scripts..."
if grep -q "vercel-build" package.json; then
  echo "  ✅ vercel-build script found"
else
  echo "  ❌ vercel-build script missing"
  all_good=false
fi

echo ""
echo "✓ Checking for redundant files..."
if [ ! -d "src" ]; then
  echo "  ✅ Old /src folder removed"
else
  echo "  ⚠️  /src folder still exists (should be removed)"
  all_good=false
fi

echo ""
echo "================================================"
if [ "$all_good" = true ]; then
  echo "✅ All checks passed! Ready to deploy to Vercel."
  echo ""
  echo "Next steps:"
  echo "1. Push to GitHub: git push origin main"
  echo "2. Connect to Vercel: https://vercel.com/new"
  echo "3. Add environment variables (see .env.example)"
  echo "4. Deploy!"
else
  echo "⚠️  Some issues found. Please fix before deploying."
fi
