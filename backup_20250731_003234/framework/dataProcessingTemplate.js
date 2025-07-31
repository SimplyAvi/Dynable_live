/*
 * DATASET CONTEXT:
 * - 243,108 products
 * - 61,382 canonical ingredients
 * - 683,784 recipe ingredients
 * - 73,322 recipes
 * 
 * ALWAYS: Use bulk operations, process in chunks, add progress tracking
 */

const { Sequelize } = require('sequelize');
const db = require('../../db/database');
const { 
  processor, 
  processInChunks, 
  bulkUpdate, 
  bulkInsert, 
  queryWithPagination, 
  streamProcess, 
  withPerformanceMonitoring,
  getDatasetStats,
  validateOperation 
} = require('./largeDatasetUtils');

// Configuration
const CONFIG = {
  chunkSize: 1000,
  dryRun: false, // Set to true for testing
  progressInterval: 100,
  logLevel: 'info'
};

// Initialize processor with config
const dataProcessor = new processor.constructor(CONFIG);

async function main() {
  console.log('🚀 Starting data processing script...');
  
  try {
    // 1. Get dataset statistics
    console.log('\n📊 DATASET STATISTICS:');
    const stats = await getDatasetStats();
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`  ${table}: ${count.toLocaleString()}`);
    });
    
    // 2. Validate operation (optional)
    const validationRules = {
      'Products with canonical tags': 'SELECT COUNT(*) as count FROM "IngredientCategorized" WHERE "canonicalTag" IS NOT NULL',
      'Products without canonical tags': 'SELECT COUNT(*) as count FROM "IngredientCategorized" WHERE "canonicalTag" IS NULL',
      'Valid canonical ingredients': 'SELECT COUNT(*) as count FROM "Ingredients" WHERE LENGTH(name) >= 3'
    };
    
    await validateOperation('Data Quality Check', validationRules);
    
    // 3. Process data with performance monitoring
    await withPerformanceMonitoring('Main Processing', async () => {
      // Example: Process products in chunks
      const products = await queryWithPagination(
        'SELECT id, description, "canonicalTag" FROM "IngredientCategorized" WHERE "canonicalTag" IS NULL',
        { pageSize: 1000 }
      );
      
      console.log(`\n🔄 Processing ${products.length.toLocaleString()} products...`);
      
      const results = await processInChunks(products, async (chunk, offset, total) => {
        const updates = [];
        let successful = 0;
        let failed = 0;
        const errors = [];
        
        for (const product of chunk) {
          try {
            // Your processing logic here
            // Example: Update canonical tags
            const update = {
              set: { canonicalTag: 'example_tag' },
              where: { id: product.id }
            };
            updates.push(update);
            successful++;
          } catch (error) {
            failed++;
            errors.push({ product: product.id, error: error.message });
          }
        }
        
        // Bulk update if we have updates
        if (updates.length > 0) {
          await bulkUpdate('IngredientCategorized', updates);
        }
        
        return { successful, failed, errors };
      }, { chunkSize: CONFIG.chunkSize });
      
      console.log(`\n✅ Processing complete!`);
      console.log(`📊 Results: ${results.successful} successful, ${results.failed} failed`);
      
      return results;
    });
    
    // 4. Final validation
    console.log('\n🔍 Final validation...');
    await validateOperation('Post-Processing Check', validationRules);
    
  } catch (error) {
    console.error('❌ Error during processing:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Example: Stream processing for very large datasets
async function streamProcessingExample() {
  console.log('🌊 Stream processing example...');
  
  await streamProcess(
    'SELECT id, description FROM "IngredientCategorized"',
    async (batch, offset, total) => {
      // Process each batch
      const results = batch.map(product => ({
        id: product.id,
        processed: true
      }));
      
      return { successful: batch.length, failed: 0 };
    },
    { batchSize: 500 }
  );
}

// Example: Bulk operations
async function bulkOperationsExample() {
  console.log('📦 Bulk operations example...');
  
  // Bulk insert example
  const newRecords = [
    { name: 'example_ingredient_1', category: 'vegetable' },
    { name: 'example_ingredient_2', category: 'fruit' }
  ];
  
  await bulkInsert('Ingredients', newRecords);
  
  // Bulk update example
  const updates = [
    { set: { category: 'updated' }, where: { id: 1 } },
    { set: { category: 'updated' }, where: { id: 2 } }
  ];
  
  await bulkUpdate('Ingredients', updates);
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  streamProcessingExample,
  bulkOperationsExample
}; 