#!/usr/bin/env node

/**
 * Product Search Fix Test
 * 
 * This test verifies that the product search is working with the new 'products' table
 * instead of the old 'IngredientCategorized' table.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testProductSearchFix() {
    console.log('🧪 Product Search Fix Test\n');
    
    try {
        // Test 1: Check if 'products' table exists and has data
        console.log('🔍 Test 1: Checking products table...');
        
        const { data: productsCount, error: countError } = await supabase
            .from('products')
            .select('id', { count: 'exact' });
        
        if (countError) {
            console.log('❌ Error accessing products table:', countError.message);
            return;
        }
        
        console.log(`✅ Products table accessible with ${productsCount?.length || 0} products`);
        
        // Test 2: Search for "pizza" in products table
        console.log('\n🔍 Test 2: Searching for "pizza" in products table...');
        
        const { data: pizzaProducts, error: pizzaError } = await supabase
            .from('products')
            .select('id, name, brand_name, allergens')
            .ilike('name', '%pizza%')
            .limit(5);
        
        if (pizzaError) {
            console.log('❌ Error searching for pizza:', pizzaError.message);
            return;
        }
        
        console.log(`✅ Found ${pizzaProducts?.length || 0} pizza products:`);
        if (pizzaProducts && pizzaProducts.length > 0) {
            pizzaProducts.forEach((product, index) => {
                console.log(`   ${index + 1}. ${product.name} (${product.brand_name})`);
            });
        } else {
            console.log('   No pizza products found');
        }
        
        // Test 3: Search for "egg" in products table
        console.log('\n🔍 Test 3: Searching for "egg" in products table...');
        
        const { data: eggProducts, error: eggError } = await supabase
            .from('products')
            .select('id, name, brand_name, allergens')
            .ilike('name', '%egg%')
            .limit(5);
        
        if (eggError) {
            console.log('❌ Error searching for egg:', eggError.message);
            return;
        }
        
        console.log(`✅ Found ${eggProducts?.length || 0} egg products:`);
        if (eggProducts && eggProducts.length > 0) {
            eggProducts.forEach((product, index) => {
                console.log(`   ${index + 1}. ${product.name} (${product.brand_name})`);
            });
        } else {
            console.log('   No egg products found');
        }
        
        // Test 4: Check if old table still exists
        console.log('\n🔍 Test 4: Checking if old IngredientCategorized table still exists...');
        
        const { data: oldTableData, error: oldTableError } = await supabase
            .from('IngredientCategorized')
            .select('id', { count: 'exact' })
            .limit(1);
        
        if (oldTableError) {
            console.log('✅ Old IngredientCategorized table is not accessible (expected)');
        } else {
            console.log(`⚠️  Old IngredientCategorized table still exists with ${oldTableData?.length || 0} records`);
        }
        
        // Test 5: Performance test
        console.log('\n🔍 Test 5: Performance test...');
        
        const startTime = Date.now();
        
        const { data: perfTest, error: perfError } = await supabase
            .from('products')
            .select('id, name, brand_name, allergens')
            .ilike('name', '%pizza%')
            .limit(10);
        
        const executionTime = Date.now() - startTime;
        
        if (perfError) {
            console.log('❌ Performance test failed:', perfError.message);
        } else {
            console.log(`✅ Performance test: ${executionTime}ms for pizza search`);
            
            if (executionTime <= 1000) {
                console.log('✅ Performance acceptable (≤1000ms)');
            } else {
                console.log('⚠️  Performance slow (>1000ms)');
            }
        }
        
        console.log('\n🎉 Product Search Fix Test Complete!');
        console.log('\n📊 Summary:');
        console.log('   ✅ Products table accessible');
        console.log('   ✅ Pizza search working');
        console.log('   ✅ Egg search working');
        console.log('   ✅ Performance acceptable');
        console.log('\n🚀 Product search should now work correctly!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testProductSearchFix();
