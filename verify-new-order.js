const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyNewOrder() {
  const orderId = '8b99297b-7743-42be-9300-571c0cd633e6';
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  VERIFICATION: New Order Data');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log(`📦 Order: ${order.order_number}`);
  console.log(`   Price: ${order.price} PLN`);
  console.log(`   Material: ${order.material} - ${order.color}`);
  console.log(`   Quality: ${order.layer_height}mm`);
  console.log(`   Infill: ${order.infill}%`);
  console.log(`   Quantity: ${order.quantity}\n`);
  
  console.log('📊 Stored Calculation Data:');
  console.log(`   Material Weight: ${order.material_weight || 'NULL'} grams`);
  console.log(`   Print Time: ${order.print_time || 'NULL'} minutes`);
  console.log(`   Model Volume: ${order.model_volume_cm3 || 'NULL'} cm³\n`);
  
  if (order.model_volume_cm3) {
    console.log('✅ SUCCESS: model_volume_cm3 is stored!');
    console.log('   This order can be edited with EXACT price calculation.\n');
  } else {
    console.log('❌ WARNING: model_volume_cm3 is NULL');
    console.log('   This means NewPrint.tsx did not send modelVolume.');
    console.log('   Check if modelAnalysis.volumeCm3 exists.\n');
  }
  
  // Calculate what the edited price would be with reduced settings
  if (order.model_volume_cm3) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SIMULATION: Price with Reduced Settings');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const baseVolume = order.model_volume_cm3;
    const density = 1.24; // PLA
    
    // Original: Draft (0.3mm) + 10% infill
    const origInfill = 10;
    const origSpeed = 15;
    const origEffectiveVol = baseVolume * (1 + origInfill / 100);
    const origWeight = origEffectiveVol * density;
    const origTime = Math.max(0.25, origEffectiveVol / origSpeed);
    
    console.log(`Original Settings (Current):`);
    console.log(`  Quality: Draft (0.3mm) - Speed: ${origSpeed} cm³/h`);
    console.log(`  Infill: ${origInfill}%`);
    console.log(`  Weight: ${Math.round(origWeight)}g`);
    console.log(`  Time: ${Math.round(origTime * 60)}min`);
    console.log(`  Price: ${order.price} PLN\n`);
    
    // Change to: Ultra (0.1mm) + 100% infill
    const newInfill = 100;
    const newSpeed = 3;
    const newEffectiveVol = baseVolume * (1 + newInfill / 100);
    const newWeight = newEffectiveVol * density;
    const newTime = Math.max(0.25, newEffectiveVol / newSpeed);
    
    console.log(`If Changed to Ultra + 100% (INCREASE):`);
    console.log(`  Quality: Ultra (0.1mm) - Speed: ${newSpeed} cm³/h`);
    console.log(`  Infill: ${newInfill}%`);
    console.log(`  Weight: ${Math.round(newWeight)}g (${Math.round((newWeight/origWeight)*100)}% of original)`);
    console.log(`  Time: ${Math.round(newTime * 60)}min (${Math.round((newTime/origTime)*100)}% of original)`);
    console.log(`  Expected: Price will INCREASE significantly\n`);
    
    const weightIncrease = Math.round(((newWeight - origWeight) / origWeight) * 100);
    const timeIncrease = Math.round(((newTime - origTime) / origTime) * 100);
    
    console.log(`Changes:`);
    console.log(`  Weight: +${weightIncrease}% (more material needed)`);
    console.log(`  Time: +${timeIncrease}% (slower printing speed)`);
    console.log(`  Result: Higher labor cost + material cost\n`);
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  MANUAL TEST INSTRUCTIONS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('1. Open EditOrder page in browser');
  console.log('   (Already open at orders/.../edit)\n');
  
  console.log('2. VERIFY: Original Price = New Price = 7.05 PLN');
  console.log('   (No automatic recalculation on load)\n');
  
  console.log('3. Change to HIGHER settings:');
  console.log('   - Quality: Ultra (0.1mm)');
  console.log('   - Infill: 100% - Solid');
  console.log('   ✅ Price should INCREASE\n');
  
  console.log('4. Change back to ORIGINAL settings:');
  console.log('   - Quality: Draft (0.3mm)');
  console.log('   - Infill: 10% - Light');
  console.log('   ✅ Price should return to EXACTLY 7.05 PLN\n');
  
  console.log('═══════════════════════════════════════════════════════════\n');
}

verifyNewOrder();
