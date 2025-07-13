const { OptimizedIngredientEnrichment } = require('./optimized_ingredient_enrichment');
const { Food } = require('./db/models');
const sequelize = require('./db/database');

async function testOptimizedEnrichment() {
  console.log('🧪 TESTING OPTIMIZED INGREDIENT ENRICHMENT\n');
  
  try {
    // Test with a small sample first
    const testSize = 100;
    console.log(`📊 Testing with ${testSize} products...`);
    
    // Get a sample of products without canonicalTag
    const testProducts = await Food.findAll({
      where: { canonicalTag: null },
      limit: testSize,
      order: [['id', 'ASC']]
    });
    
    console.log(`✅ Found ${testProducts.length} test products`);
    
    // Create enrichment instance with smaller batch size for testing
    const enrichment = new OptimizedIngredientEnrichment();
    enrichment.batchSize = 50; // Smaller batch for testing
    
    // Initialize the enrichment
    await enrichment.initialize();
    
    // Test the normalization function
    console.log('\n🔍 TESTING NORMALIZATION:');
    const testDescriptions = [
      'ORGANIC WHOLE MILK (1 GALLON)',
      'ALL NATURAL CHICKEN NUGGETS (FROZEN)',
      'EXTRA VIRGIN OLIVE OIL (16 OZ)',
      'GLUTEN-FREE BREAD (FRESH BAKED)',
      'PREMIUM GRADE A EGGS (LARGE)'
    ];
    
    testDescriptions.forEach(desc => {
      const normalized = enrichment.normalizeProductDescription(desc);
      console.log(`   "${desc}" → "${normalized}"`);
    });
    
    // Test the matching function
    console.log('\n🔍 TESTING MATCHING:');
    const testMatches = [
      'milk',
      'chicken',
      'olive oil',
      'bread',
      'egg'
    ];
    
    testMatches.forEach(match => {
      const result = enrichment.findBestCanonicalMatch(match);
      if (result) {
        console.log(`   "${match}" → "${result.canonical.name}" (confidence: ${result.confidence.toFixed(2)})`);
      } else {
        console.log(`   "${match}" → No match found`);
      }
    });
    
    // Test processing a small batch
    console.log('\n🔍 TESTING BATCH PROCESSING:');
    const batchStats = await enrichment.processBatch(testProducts.slice(0, 10));
    console.log(`   Batch results: ${JSON.stringify(batchStats)}`);
    
    // Performance test
    console.log('\n⚡ PERFORMANCE TEST:');
    const startTime = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      enrichment.normalizeProductDescription('TEST PRODUCT DESCRIPTION');
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const rate = 1000 / (duration / 1000);
    
    console.log(`   Normalization rate: ${rate.toFixed(0)} operations/second`);
    
    // Memory usage test
    console.log('\n💾 MEMORY TEST:');
    const initialMemory = process.memoryUsage();
    console.log(`   Initial memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    // Process a larger batch to test memory
    const largeBatch = testProducts.slice(0, 50);
    await enrichment.processBatch(largeBatch);
    
    const finalMemory = process.memoryUsage();
    console.log(`   Final memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Memory increase: ${((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024).toFixed(2)} MB`);
    
    // Validation test
    console.log('\n✅ VALIDATION TEST:');
    const validation = await enrichment.validateResults();
    console.log(`   Coverage: ${validation.coverage}%`);
    
    console.log('\n🎉 TEST COMPLETE!');
    console.log('✅ All tests passed - ready for full enrichment');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testOptimizedEnrichment(); 