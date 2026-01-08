/**
 * Test Script: Maintenance API
 * Usage: node test-maintenance-api.js
 * Description: Script pour tester les endpoints API de maintenance
 */

const baseUrl = process.env.API_URL || 'http://localhost:8080';

console.log('🧪 Testing Maintenance API\n');
console.log(`Base URL: ${baseUrl}\n`);

// Fonction utilitaire pour les requêtes
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

// Test 1: GET /api/maintenance/insights
async function testGetInsights() {
  console.log('📊 Test 1: GET /api/maintenance/insights');
  console.log('─'.repeat(50));
  
  const result = await fetchAPI('/api/maintenance/insights');
  
  if (result.error) {
    console.log('❌ Error:', result.error);
    return;
  }
  
  console.log(`✅ Status: ${result.status}`);
  console.log(`📈 Total Printers: ${result.data.data?.summary?.printerCount || 0}`);
  console.log(`💰 Monthly Cost: ${result.data.data?.summary?.totalMonthly || 0} PLN`);
  console.log(`📅 Annual Projection: ${result.data.data?.summary?.totalAnnual || 0} PLN`);
  console.log(`🔴 Overdue: ${result.data.data?.summary?.overdueCount || 0}`);
  console.log(`🟡 Upcoming: ${result.data.data?.summary?.upcomingCount || 0}`);
  console.log();
}

// Test 2: GET /api/maintenance/logs
async function testGetLogs() {
  console.log('📝 Test 2: GET /api/maintenance/logs');
  console.log('─'.repeat(50));
  
  const result = await fetchAPI('/api/maintenance/logs?limit=5');
  
  if (result.error) {
    console.log('❌ Error:', result.error);
    return;
  }
  
  console.log(`✅ Status: ${result.status}`);
  console.log(`📋 Logs Count: ${result.data.count || 0}`);
  
  if (result.data.data && result.data.data.length > 0) {
    console.log('\nFirst log:');
    const log = result.data.data[0];
    console.log(`  - Type: ${log.maintenance_type}`);
    console.log(`  - Cost: ${log.cost} PLN`);
    console.log(`  - Date: ${new Date(log.maintenance_date).toLocaleDateString()}`);
    console.log(`  - Printer: ${log.printer?.name || 'N/A'}`);
  }
  console.log();
}

// Test 3: GET /api/maintenance/logs avec filtres
async function testGetLogsFiltered() {
  console.log('🔍 Test 3: GET /api/maintenance/logs (filtered)');
  console.log('─'.repeat(50));
  
  const result = await fetchAPI('/api/maintenance/logs?maintenance_type=emergency&limit=3');
  
  if (result.error) {
    console.log('❌ Error:', result.error);
    return;
  }
  
  console.log(`✅ Status: ${result.status}`);
  console.log(`🚨 Emergency Logs: ${result.data.count || 0}`);
  
  if (result.data.data && result.data.data.length > 0) {
    result.data.data.forEach((log, i) => {
      console.log(`\n  ${i + 1}. ${log.printer?.name || 'Unknown'}`);
      console.log(`     Cost: ${log.cost} PLN`);
      console.log(`     Description: ${log.description || 'N/A'}`);
    });
  }
  console.log();
}

// Test 4: POST /api/maintenance/logs (simulation)
async function testPostLog() {
  console.log('➕ Test 4: POST /api/maintenance/logs (simulation)');
  console.log('─'.repeat(50));
  console.log('⚠️  Skipped: Requires valid printer_id');
  console.log('   To test manually:');
  console.log(`
   curl -X POST ${baseUrl}/api/maintenance/logs \\
     -H "Content-Type: application/json" \\
     -d '{
       "printer_id": "YOUR_PRINTER_UUID",
       "maintenance_type": "routine",
       "cost": 75.00,
       "description": "Test maintenance",
       "status": "completed"
     }'
  `);
  console.log();
}

// Test 5: Vérifier structure response
async function testResponseStructure() {
  console.log('🔬 Test 5: Response Structure Validation');
  console.log('─'.repeat(50));
  
  const result = await fetchAPI('/api/maintenance/insights');
  
  if (result.error) {
    console.log('❌ Error:', result.error);
    return;
  }
  
  const checks = [
    { field: 'success', exists: !!result.data.success },
    { field: 'data', exists: !!result.data.data },
    { field: 'data.insights', exists: Array.isArray(result.data.data?.insights) },
    { field: 'data.summary', exists: !!result.data.data?.summary },
    { field: 'timestamp', exists: !!result.data.timestamp },
  ];
  
  console.log('Structure checks:');
  checks.forEach(check => {
    console.log(`  ${check.exists ? '✅' : '❌'} ${check.field}`);
  });
  console.log();
}

// Test 6: Performance
async function testPerformance() {
  console.log('⚡ Test 6: Performance Check');
  console.log('─'.repeat(50));
  
  const start = Date.now();
  await fetchAPI('/api/maintenance/insights');
  const duration = Date.now() - start;
  
  console.log(`⏱️  Response Time: ${duration}ms`);
  console.log(`${duration < 1000 ? '✅' : '⚠️'} ${duration < 1000 ? 'Fast' : 'Slow'} (threshold: 1000ms)`);
  console.log();
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🚀 Starting Maintenance API Tests\n');
  console.log('='.repeat(50));
  console.log();
  
  try {
    await testGetInsights();
    await testGetLogs();
    await testGetLogsFiltered();
    await testPostLog();
    await testResponseStructure();
    await testPerformance();
    
    console.log('='.repeat(50));
    console.log('✅ All tests completed!\n');
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run tests
runAllTests();
