import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'server', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listAllOrders() {
  console.log('📋 LISTE DE TOUS LES ORDRES DISPONIBLES\n');
  console.log('='.repeat(80));
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, user_id, file_name, status, payment_status, price, created_at')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('\n❌ Erreur:', error.message);
    return;
  }
  
  if (!orders || orders.length === 0) {
    console.log('\n⚠️  Aucun ordre trouvé dans la base de données');
    console.log('\n💡 Créer un ordre de test avec: node create-test-order.js');
    return;
  }
  
  console.log(`\n✅ ${orders.length} ordre(s) trouvé(s)\n`);
  
  orders.forEach((order, index) => {
    console.log(`${index + 1}. ORDRE #${index + 1}`);
    console.log(`   ${'─'.repeat(76)}`);
    console.log(`   📦 ID:              ${order.id}`);
    console.log(`   👤 User ID:         ${order.user_id}`);
    console.log(`   📄 File:            ${order.file_name || 'N/A'}`);
    console.log(`   📊 Status:          ${order.status}`);
    console.log(`   💳 Payment:         ${order.payment_status}`);
    console.log(`   💰 Price:           ${order.price} PLN`);
    console.log(`   📅 Created:         ${new Date(order.created_at).toLocaleString()}`);
    console.log(`\n   🔗 URLs de Test:`);
    console.log(`      User:   http://localhost:8080/orders/${order.id}`);
    console.log(`      Admin:  http://localhost:8080/admin/orders/${order.id}`);
    console.log(`      API:    http://localhost:5000/api/admin/orders/${order.id}`);
    console.log('\n');
  });
  
  console.log('='.repeat(80));
  console.log(`\n📊 RÉSUMÉ`);
  console.log(`   Total ordres: ${orders.length}`);
  
  // Count by status
  const statusCounts = {};
  orders.forEach(o => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  
  console.log(`\n   Par statut:`);
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`      ${status}: ${count}`);
  });
  
  // Count by payment
  const paymentCounts = {};
  orders.forEach(o => {
    paymentCounts[o.payment_status] = (paymentCounts[o.payment_status] || 0) + 1;
  });
  
  console.log(`\n   Par paiement:`);
  Object.entries(paymentCounts).forEach(([status, count]) => {
    console.log(`      ${status}: ${count}`);
  });
  
  // Total revenue
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
  console.log(`\n   💰 Revenu total: ${totalRevenue.toFixed(2)} PLN`);
  
  console.log('\n' + '='.repeat(80));
  
  // Export for testing
  console.log('\n📋 IDS POUR TESTS (copier-coller):');
  console.log('\n```javascript');
  console.log('const testOrderIds = [');
  orders.forEach((o, i) => {
    const comma = i < orders.length - 1 ? ',' : '';
    console.log(`  "${o.id}"${comma}`);
  });
  console.log('];');
  console.log('```\n');
  
  // Export curl commands
  console.log('📋 COMMANDES CURL POUR TESTS:');
  console.log('\n```bash');
  console.log('# Remplacer <TOKEN> par votre JWT token\n');
  orders.slice(0, 3).forEach((o, i) => {
    console.log(`# Test ordre #${i + 1}`);
    console.log(`curl -X GET "http://localhost:5000/api/admin/orders/${o.id}" \\`);
    console.log(`  -H "Authorization: Bearer <TOKEN>"\n`);
  });
  console.log('```\n');
}

listAllOrders()
  .then(() => {
    console.log('✅ Liste complète\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  });
