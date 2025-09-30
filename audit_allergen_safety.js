#!/usr/bin/env node

/**
 * 🚨 ALLERGEN SAFETY AUDIT SCRIPT
 * 
 * This script performs a comprehensive safety audit of the allergen system
 * to ensure no false positives and no unsafe ingredients are shown.
 * 
 * CRITICAL: This is for food safety - incorrect allergen filtering can be dangerous!
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

console.log('🚨 ALLERGEN SAFETY AUDIT STARTING...\n');

async function auditAllergenSafety() {
  try {
    console.log('📊 STEP 1: Analyzing allergen data in database...\n');
    
    // 1. Get all unique allergens in database
    const { data: allergenData, error: allergenError } = await supabase
      .from('IngredientCategorized')
      .select('allergens')
      .not('allergens', 'is', null);
    
    if (allergenError) {
      console.error('❌ Error fetching allergen data:', allergenError);
      return;
    }
    
    // Extract all unique allergens
    const allAllergens = new Set();
    allergenData.forEach(item => {
      if (item.allergens && Array.isArray(item.allergens)) {
        item.allergens.forEach(allergen => allAllergens.add(allergen));
      }
    });
    
    console.log(`📈 Found ${allAllergens.size} unique allergens in database:`);
    console.log(Array.from(allAllergens).sort());
    console.log('');
    
    // 2. Check for dangerous safety phrases
    console.log('🔍 STEP 2: Checking for dangerous safety phrases...\n');
    
    const dangerousPhrases = ['free', 'safe', 'no', 'without', 'clear'];
    const dangerousAllergens = Array.from(allAllergens).filter(allergen => 
      dangerousPhrases.some(phrase => allergen.toLowerCase().includes(phrase))
    );
    
    if (dangerousAllergens.length > 0) {
      console.log('⚠️  WARNING: Found potentially dangerous allergen phrases:');
      dangerousAllergens.forEach(phrase => console.log(`   - "${phrase}"`));
      console.log('   These could cause false positives!\n');
    } else {
      console.log('✅ No dangerous safety phrases found in allergen data\n');
    }
    
    // 3. Test major allergen filtering
    console.log('🧪 STEP 3: Testing major allergen filtering...\n');
    
    const majorAllergens = ['milk', 'eggs', 'fish', 'shellfish', 'treeNuts', 'peanuts', 'wheat', 'soy', 'sesame', 'gluten'];
    
    for (const allergen of majorAllergens) {
      console.log(`Testing "${allergen}" filtering...`);
      
      // Get products that should be excluded (contain this allergen)
      const { data: excludedProducts, error: excludedError } = await supabase
        .from('IngredientCategorized')
        .select('id, description, allergens')
        .contains('allergens', [allergen])
        .limit(5);
      
      if (excludedError) {
        console.log(`   ❌ Error testing ${allergen}:`, excludedError.message);
        continue;
      }
      
      console.log(`   📊 Found ${excludedProducts.length} products containing "${allergen}"`);
      if (excludedProducts.length > 0) {
        console.log(`   📝 Sample products that should be excluded:`);
        excludedProducts.slice(0, 3).forEach(product => {
          console.log(`      - "${product.description}" (allergens: ${JSON.stringify(product.allergens)})`);
        });
      }
      console.log('');
    }
    
    // 4. Check for potential false positives
    console.log('🔍 STEP 4: Checking for potential false positives...\n');
    
    // Look for products that might be incorrectly tagged
    const { data: suspiciousProducts, error: suspiciousError } = await supabase
      .from('IngredientCategorized')
      .select('id, description, allergens')
      .or('description.ilike.%dairy-free%,description.ilike.%lactose-free%,description.ilike.%gluten-free%')
      .not('allergens', 'is', null);
    
    if (suspiciousError) {
      console.log('❌ Error checking for suspicious products:', suspiciousError.message);
    } else {
      console.log(`📊 Found ${suspiciousProducts.length} products claiming to be allergen-free but tagged with allergens:`);
      suspiciousProducts.slice(0, 5).forEach(product => {
        console.log(`   - "${product.description}" (allergens: ${JSON.stringify(product.allergens)})`);
      });
      console.log('');
    }
    
    // 5. Test filtering logic
    console.log('🧪 STEP 5: Testing filtering logic...\n');
    
    // Test that filtering actually works
    const testAllergen = 'milk';
    console.log(`Testing filtering with "${testAllergen}"...`);
    
    // Get total products
    const { count: totalCount } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact', head: true });
    
    // Get products that should be excluded
    const { count: excludedCount } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact', head: true })
      .contains('allergens', [testAllergen]);
    
    // Get products that should be shown (no milk)
    const { count: safeCount } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact', head: true })
      .not('allergens', 'cs', `{${testAllergen}}`);
    
    console.log(`   📊 Total products: ${totalCount}`);
    console.log(`   🚫 Products with "${testAllergen}": ${excludedCount}`);
    console.log(`   ✅ Safe products (no "${testAllergen}"): ${safeCount}`);
    console.log(`   🧮 Math check: ${excludedCount + safeCount} = ${totalCount} (should match)`);
    console.log('');
    
    // 6. Safety recommendations
    console.log('🎯 SAFETY RECOMMENDATIONS:\n');
    
    if (dangerousAllergens.length > 0) {
      console.log('1. ⚠️  IMMEDIATE: Remove dangerous safety phrases from allergen data');
      console.log('   These could cause false positives and are unsafe!\n');
    }
    
    if (suspiciousProducts.length > 0) {
      console.log('2. 🔍 REVIEW: Check products claiming to be allergen-free but tagged with allergens');
      console.log('   These might be incorrectly tagged or have hidden allergens\n');
    }
    
    console.log('3. 🧪 TESTING: Implement automated allergen safety testing');
    console.log('   - Test each major allergen for proper exclusion');
    console.log('   - Verify no false positives in results');
    console.log('   - Check for products that should be excluded but aren\'t\n');
    
    console.log('4. 📊 MONITORING: Set up ongoing allergen data monitoring');
    console.log('   - Track allergen detection accuracy');
    console.log('   - Monitor for new dangerous phrases');
    console.log('   - Regular safety audits\n');
    
    console.log('✅ ALLERGEN SAFETY AUDIT COMPLETE');
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
  }
}

// Run the audit
auditAllergenSafety();
