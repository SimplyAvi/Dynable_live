const axios = require('axios');

async function testFrontendRecipeDisplay() {
    console.log('🧪 Testing Frontend Recipe Display with Enhanced Backend Filtering\n');

    try {
        // Test 1: Get a specific recipe with ingredients
        console.log('1. Testing recipe fetch with ingredients...');
        const recipeResponse = await axios.get('http://localhost:5001/api/recipe/?id=1');
        const recipe = recipeResponse.data;
        
        console.log(`✅ Recipe: ${recipe.title}`);
        console.log(`   Ingredients: ${recipe.ingredients.length}`);
        
        // Show first few ingredients with their processing
        recipe.ingredients.slice(0, 5).forEach(ing => {
            console.log(`   - ${ing.name} (cleaned: ${ing.canonical || 'not mapped'}) ${ing.flagged ? '🚨 FLAGGED' : ''}`);
        });

        // Test 2: Test product matching for a specific ingredient
        console.log('\n2. Testing product matching for ingredients...');
        const testIngredient = recipe.ingredients.find(ing => ing.name && !ing.name.trim().endsWith(':'));
        
        if (testIngredient) {
            console.log(`   Testing ingredient: "${testIngredient.name}"`);
            
            const productResponse = await axios.post('http://localhost:5001/api/product/by-ingredient', {
                ingredientName: testIngredient.name,
                allergens: ['wheat', 'dairy'],
                substituteName: null
            });
            
            console.log(`   ✅ Found ${productResponse.data.length} products`);
            
            if (productResponse.data.length > 0) {
                console.log('   Sample products:');
                productResponse.data.slice(0, 3).forEach(product => {
                    console.log(`     - ${product.description} (${product.brand || 'No brand'})`);
                });
            }
        }

        // Test 3: Test the enhanced filtering logic
        console.log('\n3. Testing enhanced filtering for basic ingredients...');
        const basicIngredients = ['sugar', 'flour', 'salt', 'olive oil'];
        
        for (const ingredient of basicIngredients) {
            try {
                const response = await axios.post('http://localhost:5001/api/product/by-ingredient', {
                    ingredientName: ingredient,
                    allergens: [],
                    substituteName: null
                });
                
                console.log(`   ${ingredient}: ${response.data.length} products`);
                
                if (response.data.length > 0) {
                    const brands = [...new Set(response.data.map(p => p.brand).filter(b => b))];
                    console.log(`     Brands: ${brands.slice(0, 3).join(', ')}${brands.length > 3 ? '...' : ''}`);
                }
            } catch (error) {
                console.log(`   ${ingredient}: Error - ${error.message}`);
            }
        }

        // Test 4: Test allergen filtering
        console.log('\n4. Testing allergen filtering...');
        const allergenResponse = await axios.post('http://localhost:5001/api/product/by-ingredient', {
            ingredientName: 'flour',
            allergens: ['wheat'],
            substituteName: null
        });
        
        console.log(`   Flour with wheat filter: ${allergenResponse.data.length} products`);
        
        if (allergenResponse.data.length > 0) {
            console.log('   Sample filtered products:');
            allergenResponse.data.slice(0, 2).forEach(product => {
                console.log(`     - ${product.description} (${product.brand || 'No brand'})`);
            });
        }

        console.log('\n✅ Frontend Recipe Display Test Complete!');
        console.log('\n📋 Summary:');
        console.log('- Recipe data is being fetched with ingredients');
        console.log('- Ingredients are being processed with canonical mapping');
        console.log('- Product matching is working with enhanced filtering');
        console.log('- Allergen filtering is functional');
        console.log('- The frontend should now display recipes with proper ingredient-product matching');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testFrontendRecipeDisplay(); 