#!/usr/bin/env node

/**
 * Analyze E2E test results and generate human-readable feedback
 * Usage: node e2e/analyze-results.js
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '..', 'test-results');
const RESULTS_FILE = path.join(RESULTS_DIR, 'results.json');

console.log('🔍 Analyzing E2E Test Results\n');
console.log('='.repeat(50));

if (!fs.existsSync(RESULTS_FILE)) {
  console.log('\n❌ No results file found. Run tests first: npx playwright test');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));

// Parse results
const suites = results.suites || [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let skippedTests = 0;
const failures = [];

function traverseSuites(suite) {
  if (suite.specs) {
    suite.specs.forEach(spec => {
      totalTests++;
      const test = spec.tests?.[0];
      const result = test?.results?.[0];
      
      if (result?.status === 'passed') {
        passedTests++;
      } else if (result?.status === 'failed') {
        failedTests++;
        failures.push({
          title: spec.title,
          suite: suite.title,
          error: result.error?.message || 'Unknown error',
          duration: result.duration
        });
      } else if (result?.status === 'skipped') {
        skippedTests++;
      }
    });
  }
  
  if (suite.suites) {
    suite.suites.forEach(traverseSuites);
  }
}

suites.forEach(traverseSuites);

// Print summary
console.log(`\n📊 Test Summary\n`);
console.log(`Total Tests:   ${totalTests}`);
console.log(`✅ Passed:     ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
console.log(`❌ Failed:     ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
console.log(`⏭️  Skipped:    ${skippedTests}`);
console.log(`\nTest Duration: ${(results.stats?.duration / 1000).toFixed(1)}s`);

// Print failures with context
if (failures.length > 0) {
  console.log(`\n\n🚨 ISSUES DETECTED (${failures.length})\n`);
  console.log('='.repeat(50));
  
  failures.forEach((failure, index) => {
    console.log(`\n${index + 1}. ${failure.suite} → ${failure.title}`);
    console.log(`   Duration: ${(failure.duration / 1000).toFixed(2)}s`);
    console.log(`\n   ${failure.error}`);
    console.log(`\n   ${'─'.repeat(48)}`);
  });
  
  // Generate Copilot-ready feedback
  console.log('\n\n📋 COPY THIS TO COPILOT:\n');
  console.log('='.repeat(50));
  console.log('\nI ran E2E tests on ProtoLab and found the following issues:\n');
  
  failures.forEach((failure, index) => {
    console.log(`${index + 1}. **${failure.title}**`);
    console.log(`   - Test: ${failure.suite}`);
    console.log(`   - Error: ${failure.error}`);
    console.log('');
  });
  
  console.log('Please analyze these issues and suggest fixes.\n');
  
} else {
  console.log('\n\n✅ ALL TESTS PASSED!\n');
  console.log('The platform is working as expected. No issues detected.');
}

// Check for patterns
if (failures.length > 0) {
  const errorTypes = {};
  failures.forEach(f => {
    const errorKey = f.error.split(':')[0];
    errorTypes[errorKey] = (errorTypes[errorKey] || 0) + 1;
  });
  
  console.log('\n📈 Error Patterns:\n');
  Object.entries(errorTypes).forEach(([error, count]) => {
    console.log(`   ${error}: ${count} occurrence(s)`);
  });
}

console.log('\n' + '='.repeat(50));
console.log('\n💡 Next Steps:');
if (failures.length > 0) {
  console.log('   1. Copy the "COPY THIS TO COPILOT" section above');
  console.log('   2. Paste it into GitHub Copilot Chat');
  console.log('   3. Let Copilot analyze and fix the issues');
  console.log('   4. Re-run tests to verify fixes');
} else {
  console.log('   1. All tests passed! ✨');
  console.log('   2. Consider running overnight tests for stress testing');
  console.log('   3. Review test coverage for new features');
}

console.log('\n📊 View detailed report: npx playwright show-report\n');

// Exit with appropriate code
process.exit(failures.length > 0 ? 1 : 0);
