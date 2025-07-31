const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testFrontendFiltering() {
    console.log('🧪 TESTING FRONTEND ALLERGEN FILTERING');
    console.log('=======================================\n');

    try {
        // Simulate frontend sending allergens
        const frontendAllergens = ['milk', 'treeNuts']; // Frontend now sends camelCase
        console.log('Frontend sending allergens:', frontendAllergens);

        // Test the simplified filtering function logic
        const { data: products, error } = await supabase
            .from('IngredientCategorized')
            .select('id, description, allergens')
            .limit(100);

        if (error) {
            console.error('❌ Error fetching products:', error);
            return;
        }

        // Apply the same filtering logic as our simplified function
        const withAllergens = products.filter(p => 
            p.allergens && Array.isArray(p.allergens) && p.allergens.length > 0
        );

        console.log(`📊 Found ${withAllergens.length} products with allergens`);

        // Test filtering with camelCase allergens
        const filteredProducts = withAllergens.filter(product => {
            return !frontendAllergens.some(selectedAllergen => 
                product.allergens.some(productAllergen => 
                    productAllergen.toLowerCase() === selectedAllergen.toLowerCase()
                )
            );
        });

        console.log(`✅ Filtered products: ${filteredProducts.length} safe products (excluded ${withAllergens.length - filteredProducts.length})`);

        // Show some examples
        if (filteredProducts.length > 0) {
            console.log('📋 Sample safe products:');
            filteredProducts.slice(0, 5).forEach(p => {
                console.log(`  - ID: ${p.id}, Allergens: ${JSON.stringify(p.allergens)}`);
            });
        }

        // Test specific allergen filtering
        console.log('\n🎯 Testing specific allergen filtering:');
        
        // Test milk filtering
        const withoutMilk = withAllergens.filter(p => !p.allergens.includes('milk') && !p.allergens.includes('Milk'));
        console.log(`🥛 Products without milk: ${withoutMilk.length} (excluded ${withAllergens.length - withoutMilk.length})`);

        // Test treeNuts filtering
        const withoutTreeNuts = withAllergens.filter(p => 
            !p.allergens.includes('treeNuts') && 
            !p.allergens.includes('Tree Nuts') && 
            !p.allergens.includes('treenuts')
        );
        console.log(`🌰 Products without treeNuts: ${withoutTreeNuts.length} (excluded ${withAllergens.length - withoutTreeNuts.length})`);

        // Test both allergens
        const withoutBoth = withAllergens.filter(p => 
            !p.allergens.some(a => ['milk', 'Milk', 'treeNuts', 'Tree Nuts', 'treenuts'].includes(a))
        );
        console.log(`🚫 Products without milk OR treeNuts: ${withoutBoth.length} (excluded ${withAllergens.length - withoutBoth.length})`);

        console.log('\n🎉 FRONTEND FILTERING TESTS COMPLETED!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testFrontendFiltering(); 