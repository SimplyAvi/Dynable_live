const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testMappingPerformance() {
    console.log('🧪 Testing Mapping System Performance...\n');
    
    // Test 1: Check ProductCanonical table stats
    console.log('📊 ProductCanonical Table Statistics:');
    try {
        const { data: products, error } = await supabase
            .from('ProductCanonical')
            .select('id, canonical_product_name, product_ids');
        
        if (error) {
            console.error('❌ Error:', error);
        } else {
            console.log(`✅ Total canonical products: ${products.length}`);
            
            // Show some examples
            console.log('\n📋 Sample Canonical Products:');
            products.slice(0, 10).forEach(product => {
                console.log(`  • "${product.canonical_product_name}" (${product.product_ids?.length || 0} products)`);
            });
            
            // Calculate average products per canonical
            const totalProductIds = products.reduce((sum, p) => sum + (p.product_ids?.length || 0), 0);
            const avgProductsPerCanonical = totalProductIds / products.length;
            console.log(`📈 Average products per canonical: ${avgProductsPerCanonical.toFixed(1)}`);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
    
    // Test 2: Performance test - simulate recipe lookup
    console.log('\n⚡ Performance Test - Recipe Lookup Simulation:');
    
    const testIngredients = [
        'tomatoes',
        'onions',
        'garlic',
        'olive oil',
        'flour',
        'milk',
        'cheese',
        'chicken',
        'beef',
        'pasta'
    ];
    
    const startTime = Date.now();
    let totalMatches = 0;
    
    for (const ingredient of testIngredients) {
        const ingredientStart = Date.now();
        
        try {
            // Simulate recipe lookup: find products for ingredient
            const { data: matches, error } = await supabase
                .from('ProductCanonical')
                .select('canonical_product_name, product_ids')
                .ilike('canonical_product_name', `%${ingredient}%`);
            
            const ingredientTime = Date.now() - ingredientStart;
            const matchCount = matches?.reduce((sum, m) => sum + (m.product_ids?.length || 0), 0) || 0;
            totalMatches += matchCount;
            
            console.log(`  • "${ingredient}": ${matchCount} products found in ${ingredientTime}ms`);
            
        } catch (error) {
            console.log(`  • "${ingredient}": Error - ${error.message}`);
        }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`\n📊 Performance Summary:`);
    console.log(`  • Total lookup time: ${totalTime}ms`);
    console.log(`  • Average per ingredient: ${(totalTime / testIngredients.length).toFixed(1)}ms`);
    console.log(`  • Total products found: ${totalMatches}`);
    console.log(`  • Products per ingredient: ${(totalMatches / testIngredients.length).toFixed(1)}`);
    
    // Test 3: Check for camelCase compliance
    console.log('\n🔍 CamelCase Compliance Check:');
    try {
        const { data: products, error } = await supabase
            .from('ProductCanonical')
            .select('canonical_product_name')
            .limit(100);
        
        if (error) {
            console.error('❌ Error:', error);
        } else {
            let camelCaseCount = 0;
            let nonCamelCaseCount = 0;
            
            products.forEach(product => {
                const name = product.canonical_product_name;
                // Check if it's camelCase (starts with lowercase, can contain uppercase)
                const isCamelCase = /^[a-z][a-zA-Z0-9]*$/.test(name);
                
                if (isCamelCase) {
                    camelCaseCount++;
                } else {
                    nonCamelCaseCount++;
                    console.log(`  ❌ Non-camelCase: "${name}"`);
                }
            });
            
            console.log(`✅ CamelCase compliant: ${camelCaseCount}`);
            console.log(`❌ Non-camelCase: ${nonCamelCaseCount}`);
            
            if (nonCamelCaseCount === 0) {
                console.log('🎉 All checked products are camelCase compliant!');
            }
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
    
    console.log('\n🎉 Mapping System Performance Test Complete!');
}

testMappingPerformance().catch(console.error); 