#!/bin/bash

echo "🚀 Starting ProtoLab Overnight Test Suite"
echo "=========================================="
echo ""

# Counter for iterations
ITERATION=1
MAX_ITERATIONS=100

# Create results directory
mkdir -p e2e-results

while [ $ITERATION -le $MAX_ITERATIONS ]; do
  echo "🔄 Test Iteration #$ITERATION"
  echo "Started at: $(date)"
  
  # Run tests
  npx playwright test --reporter=html,json
  
  # Save results with timestamp
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  cp playwright-report/index.html e2e-results/report_${TIMESTAMP}.html 2>/dev/null
  
  echo "Completed iteration #$ITERATION at: $(date)"
  echo ""
  
  # Sleep for 30 seconds between iterations
  sleep 30
  
  ITERATION=$((ITERATION + 1))
done

echo "✅ Test suite completed all iterations"
