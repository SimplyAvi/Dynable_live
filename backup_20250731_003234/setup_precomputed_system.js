// 🏭 SETUP PRE-COMPUTED ALLERGEN SYSTEM
// Run this script to set up the industry-standard allergen tagging system

import { supabase } from './src/utils/supabaseClient.js';

console.log('🏭 Setting up pre-computed allergen system...');

// Step 1: Run the database migration
async function runDatabaseMigration() {
  console.log('📊 Running database migration...');
  
  try {
    // Read and execute the SQL migration
    const fs = await import('fs');
    const sqlContent = fs.readFileSync('./precomputed_allergen_system.sql', 'utf8');
    
    // Split into individual statements and execute
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error('Migration error:', error);
        }
      }
    }
    
    console.log('✅ Database migration completed');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

// Step 2: Test the system
async function testSystem() {
  console.log('🧪 Testing pre-computed system...');
  
  try {
    // Test processing a single product
    const { data: testProduct } = await supabase
      .from('IngredientCategorized')
      .select('id, description')
      .limit(1);
    
    if (testProduct && testProduct.length > 0) {
      const productId = testProduct[0].id;
      console.log(`Testing with product ${productId}: ${testProduct[0].description}`);
      
      const result = await supabase.rpc('process_product_allergens', { 
        product_id: productId 
      });
      
      console.log('✅ Single product processing test:', result.data);
    }
    
    // Check system status
    const { data: stats } = await supabase
      .from('IngredientCategorized')
      .select('processed_for_allergens', { count: 'exact' });
    
    const total = stats.length;
    const processed = stats.filter(p => p.processed_for_allergens).length;
    
    console.log(`📊 System status: ${processed}/${total} products processed`);
    
    return true;
  } catch (error) {
    console.error('❌ System test failed:', error);
    return false;
  }
}

// Step 3: Run batch processing
async function runBatchProcessing() {
  console.log('🔄 Running batch processing...');
  
  try {
    const result = await supabase.rpc('batch_process_allergens', {
      batch_size: 50
    });
    
    console.log('✅ Batch processing result:', result.data);
    return true;
  } catch (error) {
    console.error('❌ Batch processing failed:', error);
    return false;
  }
}

// Main setup function
async function setupPrecomputedSystem() {
  console.log('🚀 Starting pre-computed allergen system setup...');
  
  // Step 1: Run migration
  const migrationSuccess = await runDatabaseMigration();
  if (!migrationSuccess) {
    console.error('❌ Setup failed at migration step');
    return;
  }
  
  // Step 2: Test system
  const testSuccess = await testSystem();
  if (!testSuccess) {
    console.error('❌ Setup failed at test step');
    return;
  }
  
  // Step 3: Run batch processing
  const batchSuccess = await runBatchProcessing();
  if (!batchSuccess) {
    console.error('❌ Setup failed at batch processing step');
    return;
  }
  
  console.log('🎉 Pre-computed allergen system setup completed successfully!');
  console.log('✅ You can now use lightning-fast allergen filtering');
  console.log('✅ Run window.verifyPrecomputedSystem() in browser console to check status');
}

// Run setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupPrecomputedSystem().catch(console.error);
}

export { setupPrecomputedSystem }; 