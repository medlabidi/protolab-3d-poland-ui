const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/protolab3d'
});

const orderId = '8b99297b-7743-42be-9300-571c0cd633e6';

async function checkOrder() {
  try {
    const result = await pool.query(
      'SELECT id, order_number, material, color, layer_height, infill, price, model_volume_cm3, material_weight, print_time FROM orders WHERE id = $1',
      [orderId]
    );
    
    if (result.rows.length > 0) {
      console.log('Order details:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('Order not found');
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkOrder();
