import { supabase } from './supabaseClient.js';

// Test the minimal allergen processing on sample products
export const testMinimalAccuracy = async (sampleSize = 20) => {
  console.log('🧪 TESTING MINIMAL ALLERGEN PROCESSING ACCURACY');
  console.log('================================================');
  
  try {
    // Get random sample products
    const { data: products, error } = await supabase
      .from('IngredientCategorized')
      .select('id, description, brandName')
      .neq('brandName', 'generic')
      .limit(sampleSize);
    
    if (error) {
      console.error('❌ Failed to fetch sample products:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`📊 Testing ${products.length} sample products...`);
    console.log('');
    
    let results = [];
    let totalProcessed = 0;
    let totalSafeIndicators = 0;
    
    for (const product of products) {
      console.log(`🔍 Testing Product ID: ${product.id}`);
      console.log(`   Description: ${product.description}`);
      console.log(`   Brand: ${product.brandName}`);
      
      // Test the minimal processing function
      const { data: result, error: processError } = await supabase.rpc(
        'process_product_allergens_minimal_dry_run',
        { product_id: product.id }
      );
      
      if (processError) {
        console.log(`   ❌ Processing failed: ${processError.message}`);
        results.push({
          id: product.id,
          description: product.description,
          success: false,
          error: processError.message
        });
      } else {
        const hasSafeIndicator = result.allergen_free_tags && result.allergen_free_tags.length > 0;
        const safeTags = result.allergen_free_tags || [];
        
        console.log(`   ✅ Processing successful`);
        console.log(`   🏷️  Safe indicators: ${safeTags.length > 0 ? safeTags.join(', ') : 'None'}`);
        console.log(`   📝 Has safe indicator: ${hasSafeIndicator}`);
        
        if (hasSafeIndicator) {
          totalSafeIndicators++;
        }
        
        results.push({
          id: product.id,
          description: product.description,
          success: true,
          hasSafeIndicator,
          safeTags,
          result
        });
      }
      
      totalProcessed++;
      console.log('');
    }
    
    // Summary
    console.log('📊 ACCURACY TEST SUMMARY');
    console.log('========================');
    console.log(`✅ Total products tested: ${totalProcessed}`);
    console.log(`🏷️  Products with safe indicators: ${totalSafeIndicators}`);
    console.log(`📈 Safe indicator rate: ${((totalSafeIndicators / totalProcessed) * 100).toFixed(1)}%`);
    console.log('');
    
    // Show products with safe indicators
    const productsWithSafeIndicators = results.filter(r => r.success && r.hasSafeIndicator);
    if (productsWithSafeIndicators.length > 0) {
      console.log('🎯 PRODUCTS WITH SAFE INDICATORS:');
      console.log('==================================');
      productsWithSafeIndicators.forEach((product, index) => {
        console.log(`${index + 1}. ID: ${product.id}`);
        console.log(`   Description: ${product.description}`);
        console.log(`   Safe tags: ${product.safeTags.join(', ')}`);
        console.log('');
      });
    }
    
    return {
      success: true,
      totalProcessed,
      totalSafeIndicators,
      safeIndicatorRate: (totalSafeIndicators / totalProcessed) * 100,
      results
    };
    
  } catch (error) {
    console.error('❌ Accuracy test failed:', error);
    return { success: false, error: error.message };
  }
};

// Test with real product descriptions that might contain allergens
export const testRealProductAllergens = async () => {
  console.log('🔍 TESTING REAL PRODUCT ALLERGEN DETECTION');
  console.log('===========================================');
  
  try {
    // Search for products that likely contain allergens
    const allergenKeywords = ['bread', 'milk', 'cheese', 'egg', 'nut', 'peanut', 'soy', 'fish', 'shrimp'];
    let totalFound = 0;
    let totalWithAllergens = 0;
    
    for (const keyword of allergenKeywords) {
      console.log(`🔍 Searching for products with "${keyword}":`);
      
      const { data: products, error } = await supabase
        .from('IngredientCategorized')
        .select('id, description, brandName')
        .neq('brandName', 'generic')
        .ilike('description', `%${keyword}%`)
        .limit(5);
      
      if (error) {
        console.log(`   ❌ Search failed: ${error.message}`);
        continue;
      }
      
      console.log(`   📊 Found ${products.length} products`);
      
      for (const product of products) {
        totalFound++;
        console.log(`   - ${product.description}`);
        
        // Check if description contains allergen keywords
        const descriptionLower = product.description.toLowerCase();
        const foundAllergens = [];
        
        if (descriptionLower.includes('bread') || descriptionLower.includes('wheat') || descriptionLower.includes('flour')) {
          foundAllergens.push('gluten');
        }
        if (descriptionLower.includes('milk') || descriptionLower.includes('cheese') || descriptionLower.includes('dairy')) {
          foundAllergens.push('dairy');
        }
        if (descriptionLower.includes('egg')) {
          foundAllergens.push('eggs');
        }
        if (descriptionLower.includes('nut') || descriptionLower.includes('almond') || descriptionLower.includes('walnut')) {
          foundAllergens.push('tree nuts');
        }
        if (descriptionLower.includes('peanut')) {
          foundAllergens.push('peanuts');
        }
        if (descriptionLower.includes('soy')) {
          foundAllergens.push('soy');
        }
        if (descriptionLower.includes('fish') || descriptionLower.includes('salmon') || descriptionLower.includes('tuna')) {
          foundAllergens.push('fish');
        }
        if (descriptionLower.includes('shrimp') || descriptionLower.includes('crab') || descriptionLower.includes('lobster')) {
          foundAllergens.push('shellfish');
        }
        
        if (foundAllergens.length > 0) {
          totalWithAllergens++;
          console.log(`     🚨 Contains allergens: ${foundAllergens.join(', ')}`);
        } else {
          console.log(`     ✅ No obvious allergens detected`);
        }
      }
      console.log('');
    }
    
    console.log('📊 REAL PRODUCT ANALYSIS SUMMARY');
    console.log('================================');
    console.log(`✅ Total products analyzed: ${totalFound}`);
    console.log(`🚨 Products with obvious allergens: ${totalWithAllergens}`);
    console.log(`📈 Allergen detection rate: ${((totalWithAllergens / totalFound) * 100).toFixed(1)}%`);
    
    return {
      success: true,
      totalFound,
      totalWithAllergens,
      detectionRate: (totalWithAllergens / totalFound) * 100
    };
    
  } catch (error) {
    console.error('❌ Real product test failed:', error);
    return { success: false, error: error.message };
  }
};

// Test specific problematic cases with real product IDs
export const testProblematicCases = async () => {
  console.log('🚨 TESTING PROBLEMATIC CASES');
  console.log('=============================');
  
  try {
    // Find real products that might cause false positives
    const testCases = [
      { search: 'coconut', description: 'Coconut oil (should NOT be tagged as tree nut)' },
      { search: 'glucose', description: 'Glucose syrup (should NOT be tagged as gluten)' },
      { search: 'gluten-free', description: 'Gluten-free products (should be tagged)' },
      { search: 'dairy-free', description: 'Dairy-free products (should be tagged)' }
    ];
    
    let correctCount = 0;
    let totalCount = 0;
    
    for (const testCase of testCases) {
      console.log(`🔍 Testing: ${testCase.description}`);
      
      // Find a real product with this keyword
      const { data: products, error } = await supabase
        .from('IngredientCategorized')
        .select('id, description')
        .neq('brandName', 'generic')
        .ilike('description', `%${testCase.search}%`)
        .limit(1);
      
      if (error || !products || products.length === 0) {
        console.log(`   ⚠️  No products found with "${testCase.search}"`);
        continue;
      }
      
      const product = products[0];
      console.log(`   Found: ${product.description}`);
      
      // Test the minimal processing function
      const { data: result, error: processError } = await supabase.rpc(
        'process_product_allergens_minimal_dry_run',
        { product_id: product.id }
      );
      
      if (processError) {
        console.log(`   ❌ Processing failed: ${processError.message}`);
      } else {
        const actualTags = result.allergen_free_tags || [];
        const hasSafeIndicator = actualTags.length > 0;
        
        console.log(`   🏷️  Safe indicators: ${actualTags.length > 0 ? actualTags.join(', ') : 'None'}`);
        
        // Determine if this is correct based on the test case
        let isCorrect = false;
        if (testCase.search === 'coconut' || testCase.search === 'glucose') {
          // Should NOT have safe indicators (these are false positive tests)
          isCorrect = !hasSafeIndicator;
        } else {
          // Should have safe indicators
          isCorrect = hasSafeIndicator;
        }
        
        console.log(`   ${isCorrect ? '✅' : '❌'} Correct: ${isCorrect}`);
        
        if (isCorrect) {
          correctCount++;
        }
        totalCount++;
      }
      console.log('');
    }
    
    console.log('📊 PROBLEMATIC CASES SUMMARY');
    console.log('=============================');
    console.log(`✅ Correct: ${correctCount}/${totalCount}`);
    console.log(`📈 Accuracy: ${totalCount > 0 ? ((correctCount / totalCount) * 100).toFixed(1) : 0}%`);
    
    return {
      success: true,
      correctCount,
      totalCount,
      accuracy: totalCount > 0 ? (correctCount / totalCount) * 100 : 0
    };
    
  } catch (error) {
    console.error('❌ Problematic cases test failed:', error);
    return { success: false, error: error.message };
  }
};

// Test with existing AllergenDerivatives table
export const testWithExistingTables = async () => {
  console.log('📚 TESTING WITH EXISTING TABLES');
  console.log('================================');
  
  try {
    // Get allergens from AllergenDerivatives table
    const { data: allergens, error: allergenError } = await supabase
      .from('AllergenDerivatives')
      .select('allergen')
      .order('allergen');
    
    if (allergenError) {
      console.error('❌ Failed to fetch allergens:', allergenError);
      return { success: false, error: allergenError.message };
    }
    
    // Clean up duplicate allergens
    const uniqueAllergens = [...new Set(allergens.map(a => a.allergen))];
    console.log(`📋 Available allergens (${uniqueAllergens.length} unique): ${uniqueAllergens.join(', ')}`);
    console.log('');
    
    // Test a few products with these allergens
    const { data: products, error: productError } = await supabase
      .from('IngredientCategorized')
      .select('id, description')
      .neq('brandName', 'generic')
      .limit(5);
    
    if (productError) {
      console.error('❌ Failed to fetch products:', productError);
      return { success: false, error: productError.message };
    }
    
    console.log('🔍 Testing products with existing allergen data:');
    console.log('');
    
    for (const product of products) {
      console.log(`Product ID: ${product.id}`);
      console.log(`Description: ${product.description}`);
      
      // Check if description contains any allergens from our table
      const descriptionLower = product.description.toLowerCase();
      const foundAllergens = uniqueAllergens.filter(a => 
        descriptionLower.includes(a.toLowerCase())
      );
      
      console.log(`Found allergens: ${foundAllergens.length > 0 ? foundAllergens.join(', ') : 'None'}`);
      console.log('');
    }
    
    return { success: true, allergens: uniqueAllergens.length, products: products.length };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
};

// Run comprehensive accuracy test
export const runComprehensiveAccuracyTest = async () => {
  console.log('🧪 COMPREHENSIVE ACCURACY TEST');
  console.log('===============================');
  console.log('');
  
  const results = {};
  
  // Test 1: Real product allergen detection
  console.log('🔍 STEP 1: Testing real product allergen detection...');
  results.realProducts = await testRealProductAllergens();
  console.log('');
  
  // Test 2: Problematic cases
  console.log('🚨 STEP 2: Testing problematic cases...');
  results.problematic = await testProblematicCases();
  console.log('');
  
  // Test 3: Existing tables
  console.log('📚 STEP 3: Testing with existing tables...');
  results.existing = await testWithExistingTables();
  console.log('');
  
  // Overall assessment
  console.log('🎯 OVERALL ASSESSMENT');
  console.log('=====================');
  
  if (results.realProducts.success && results.problematic.success) {
    const detectionRate = results.realProducts.detectionRate;
    const problematicAccuracy = results.problematic.accuracy;
    
    console.log(`🔍 Real product detection rate: ${detectionRate.toFixed(1)}%`);
    console.log(`🚨 Problematic cases accuracy: ${problematicAccuracy.toFixed(1)}%`);
    
    if (detectionRate >= 50 && problematicAccuracy >= 80) {
      console.log('✅ RECOMMENDATION: System shows reasonable accuracy');
      console.log('   Can proceed with careful implementation');
    } else if (detectionRate >= 30 && problematicAccuracy >= 60) {
      console.log('⚠️  RECOMMENDATION: Moderate accuracy - proceed with caution');
      console.log('   Consider refining the algorithm');
    } else {
      console.log('❌ RECOMMENDATION: Low accuracy - needs improvement');
      console.log('   Do not proceed with batch processing');
    }
  } else {
    console.log('❌ RECOMMENDATION: Fix errors before proceeding');
  }
  
  return results;
}; 

// Process a minimal batch of products
export const processMinimalBatch = async (batchSize = 50) => {
  console.log('🔄 PROCESSING MINIMAL BATCH');
  console.log('============================');
  console.log(`🎯 Requested batch size: ${batchSize}`);
  
  try {
    // Get products that haven't been processed yet
    const { data: products, error } = await supabase
      .from('IngredientCategorized')
      .select('id, description')
      .neq('brandName', 'generic')
      .eq('processed_for_allergens', false)
      .limit(batchSize);
    
    if (error) {
      console.error('❌ Failed to fetch products:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`📊 Processing ${products.length} products...`);
    console.log(`📊 Available unprocessed products: ${products.length} (requested: ${batchSize})`);
    
    if (products.length < batchSize) {
      console.log(`⚠️  Only ${products.length} products available (less than requested ${batchSize})`);
      console.log(`🔍 This is likely due to Supabase's default 1000 row limit`);
    }
    console.log('');
    
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let safeIndicatorCount = 0;
    
    for (const product of products) {
      console.log(`🔍 Processing ID: ${product.id}`);
      console.log(`   Description: ${product.description.substring(0, 60)}...`);
      
      const { data: result, error: processError } = await supabase.rpc(
        'process_product_allergens_minimal',
        { product_id: product.id }
      );
      
      if (processError) {
        console.log(`   ❌ Failed: ${processError.message}`);
        errorCount++;
      } else {
        const hasSafeIndicator = result.allergen_free_tags && result.allergen_free_tags.length > 0;
        const safeTags = result.allergen_free_tags || [];
        
        console.log(`   ✅ Success`);
        console.log(`   🏷️  Safe indicators: ${safeTags.length > 0 ? safeTags.join(', ') : 'None'}`);
        
        if (hasSafeIndicator) {
          safeIndicatorCount++;
        }
        
        successCount++;
      }
      
      processedCount++;
      console.log('');
    }
    
    console.log('📊 BATCH PROCESSING SUMMARY');
    console.log('============================');
    console.log(`✅ Total processed: ${processedCount}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`🏷️  Products with safe indicators: ${safeIndicatorCount}`);
    console.log(`📈 Success rate: ${((successCount / processedCount) * 100).toFixed(1)}%`);
    console.log(`📈 Safe indicator rate: ${((safeIndicatorCount / processedCount) * 100).toFixed(1)}%`);
    
    if (successCount === processedCount && errorCount === 0) {
      console.log('');
      console.log('🎉 RECOMMENDATION: Batch processing successful!');
      console.log('   Safe to proceed with larger batches.');
    } else if (successCount >= processedCount * 0.9) {
      console.log('');
      console.log('⚠️  RECOMMENDATION: Mostly successful, proceed with caution.');
      console.log('   Consider investigating the errors before scaling up.');
    } else {
      console.log('');
      console.log('❌ RECOMMENDATION: Too many errors, need to fix issues first.');
      console.log('   Do not proceed with larger batches.');
    }
    
    return {
      success: true,
      processedCount,
      successCount,
      errorCount,
      safeIndicatorCount,
      successRate: (successCount / processedCount) * 100,
      safeIndicatorRate: (safeIndicatorCount / processedCount) * 100
    };
    
  } catch (error) {
    console.error('❌ Batch processing failed:', error);
    return { success: false, error: error.message };
  }
};

// Check how many unprocessed products are available
export const checkUnprocessedCount = async () => {
  console.log('🔍 CHECKING UNPROCESSED PRODUCT COUNT');
  console.log('=====================================');
  
  try {
    const { count, error } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact', head: true })
      .neq('brandName', 'generic')
      .eq('processed_for_allergens', false);
    
    if (error) {
      console.error('❌ Failed to count unprocessed products:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`📊 Total unprocessed products: ${count}`);
    console.log(`📊 Supabase default limit: 1000`);
    
    if (count > 1000) {
      console.log(`⚠️  ${count - 1000} products will be skipped due to Supabase limit`);
      console.log(`💡 Solution: Process in chunks of 1000 or use pagination`);
    }
    
    return { success: true, count };
    
  } catch (error) {
    console.error('❌ Count check failed:', error);
    return { success: false, error: error.message };
  }
};