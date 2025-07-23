const axios = require('axios');

async function debugProductMatching() {
    console.log('🔍 Debugging Product Matching Issues\n');

    try {
        // Test 1: Check if products exist in database
        console.log('1. Checking if products exist in database...');
        const allProductsResponse = await axios.get('http://localhost:5001/api/product/foods?page=1&limit=5');
        console.log(`   Total products available: ${allProductsResponse.data.totalCount || 'unknown'}`);
        console.log('   Sample products:');
        if (allProductsResponse.data.foods) {
            allProductsResponse.data.foods.slice(0, 3).forEach(product => {
                console.log(`     - ${product.description} (${product.brand || 'No brand'})`);
            });
        }

        // Test 2: Test with a very simple ingredient name
        console.log('\n2. Testing with simple ingredient names...');
        const simpleIngredients = ['sugar', 'flour', 'salt'];
        
        for (const ingredient of simpleIngredients) {
            try {
                console.log(`\n   Testing: "${ingredient}"`);
                
                // First, test without any filtering
                const basicResponse = await axios.post('http://localhost:5001/api/product/by-ingredient', {
                    ingredientName: ingredient,
                    allergens: [],
                    substituteName: null
                });
                
                console.log(`     Basic search: ${basicResponse.data.length} products`);
                
                if (basicResponse.data.length > 0) {
                    console.log('     Sample results:');
                    basicResponse.data.slice(0, 2).forEach(product => {
                        console.log(`       - ${product.description} (${product.brand || 'No brand'})`);
                    });
                }
                
            } catch (error) {
                console.log(`     Error: ${error.message}`);
                if (error.response && error.response.data) {
                    console.log(`     Response: ${JSON.stringify(error.response.data)}`);
                }
            }
        }

        // Test 3: Check canonical ingredient mapping
        console.log('\n3. Checking canonical ingredient mapping...');
        try {
            const canonicalResponse = await axios.get('http://localhost:5001/api/canonical-ingredients');
            console.log(`   Canonical ingredients available: ${canonicalResponse.data.length}`);
            
            if (canonicalResponse.data.length > 0) {
                console.log('   Sample canonical ingredients:');
                canonicalResponse.data.slice(0, 5).forEach(canonical => {
                    console.log(`     - ${canonical.name} (allergens: ${canonical.allergens?.join(', ') || 'none'})`);
                });
            }
        } catch (error) {
            console.log(`   Error accessing canonical ingredients: ${error.message}`);
        }

        // Test 4: Test with a specific product that should exist
        console.log('\n4. Testing with specific product search...');
        try {
            const specificResponse = await axios.post('http://localhost:5001/api/product/foods?search=sugar&page=1&limit=5');
            console.log(`   Direct product search for "sugar": ${specificResponse.data.foods?.length || 0} products`);
            
            if (specificResponse.data.foods && specificResponse.data.foods.length > 0) {
                console.log('   Found products:');
                specificResponse.data.foods.forEach(product => {
                    console.log(`     - ${product.description} (${product.brand || 'No brand'})`);
                });
            }
        } catch (error) {
            console.log(`   Error in direct search: ${error.message}`);
        }

        // Test 5: Check if the enhanced filtering is working correctly
        console.log('\n5. Testing enhanced filtering logic...');
        try {
            // Test with a basic ingredient that should have products
            const testResponse = await axios.post('http://localhost:5001/api/product/by-ingredient', {
                ingredientName: 'sugar',
                allergens: [],
                substituteName: null
            });
            
            console.log(`   Enhanced filtering for "sugar": ${testResponse.data.length} products`);
            
            if (testResponse.data.length === 0) {
                console.log('   ⚠️  No products found - this might indicate the filtering is too restrictive');
            } else {
                console.log('   Sample filtered products:');
                testResponse.data.slice(0, 3).forEach(product => {
                    console.log(`     - ${product.description} (${product.brand || 'No brand'})`);
                });
            }
        } catch (error) {
            console.log(`   Error in enhanced filtering: ${error.message}`);
        }

        console.log('\n🔍 Debug Complete!');
        console.log('\n💡 Recommendations:');
        console.log('- Check if the enhanced filtering logic is too restrictive');
        console.log('- Verify that products have proper canonical tags');
        console.log('- Ensure the ingredient cleaning logic is working correctly');
        console.log('- Consider relaxing the filtering for basic ingredients');

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the debug
debugProductMatching(); 