const axios = require('axios');

async function testSugarProducts() {
    console.log('🍯 Testing Sugar Products with Canonical Tags\n');

    try {
        // Test 1: Check what products have "sugar" as a canonical tag
        console.log('1. Checking products with "sugar" canonical tag...');
        const response = await axios.get('http://localhost:5001/api/product/foods?page=1&limit=100');
        
        if (response.data.foods) {
            const sugarProducts = response.data.foods.filter(p => 
                p.canonicalTag && p.canonicalTag.toLowerCase().includes('sugar')
            );
            
            console.log(`   Found ${sugarProducts.length} products with "sugar" in canonical tag`);
            
            if (sugarProducts.length > 0) {
                console.log('   Sample sugar products:');
                sugarProducts.slice(0, 10).forEach(product => {
                    console.log(`     - ${product.description} (${product.brandName || 'No brand'})`);
                    console.log(`       Canonical Tag: ${product.canonicalTag}`);
                    console.log(`       Confidence: ${product.canonicalTagConfidence}`);
                });
            }
        }

        // Test 2: Check what canonical tags exist for basic ingredients
        console.log('\n2. Checking canonical tags for basic ingredients...');
        const basicIngredients = ['sugar', 'flour', 'salt', 'milk', 'butter', 'oil', 'egg'];
        
        for (const ingredient of basicIngredients) {
            const ingredientProducts = response.data.foods.filter(p => 
                p.canonicalTag && p.canonicalTag.toLowerCase().includes(ingredient.toLowerCase())
            );
            
            console.log(`   ${ingredient}: ${ingredientProducts.length} products`);
            
            if (ingredientProducts.length > 0) {
                const uniqueTags = [...new Set(ingredientProducts.map(p => p.canonicalTag))];
                console.log(`     Tags: ${uniqueTags.slice(0, 5).join(', ')}${uniqueTags.length > 5 ? '...' : ''}`);
                
                const confidentCount = ingredientProducts.filter(p => p.canonicalTagConfidence === 'confident').length;
                const suggestedCount = ingredientProducts.filter(p => p.canonicalTagConfidence === 'suggested').length;
                const lowCount = ingredientProducts.filter(p => p.canonicalTagConfidence === 'low').length;
                
                console.log(`     Confident: ${confidentCount}, Suggested: ${suggestedCount}, Low: ${lowCount}`);
            }
        }

        // Test 3: Test the API endpoint with different confidence levels
        console.log('\n3. Testing API endpoint with different confidence levels...');
        
        // Test with sugar
        try {
            const sugarResponse = await axios.post('http://localhost:5001/api/product/by-ingredient', {
                ingredientName: 'sugar',
                allergens: [],
                substituteName: null
            });
            
            console.log(`   Sugar API response: ${sugarResponse.data.length} products`);
            
            if (sugarResponse.data.length > 0) {
                console.log('   Sample products:');
                sugarResponse.data.slice(0, 5).forEach(product => {
                    console.log(`     - ${product.description} (${product.brandName || 'No brand'})`);
                    console.log(`       Canonical Tag: ${product.canonicalTag}`);
                    console.log(`       Confidence: ${product.canonicalTagConfidence}`);
                });
            }
        } catch (error) {
            console.log(`   Error testing sugar API: ${error.message}`);
        }

        // Test 4: Check what happens if we relax the filtering
        console.log('\n4. Testing relaxed filtering...');
        
        // Let's see what products contain "sugar" in description
        const sugarInDescription = response.data.foods.filter(p => 
            p.description.toLowerCase().includes('sugar') && 
            p.canonicalTagConfidence === 'confident'
        );
        
        console.log(`   Products with "sugar" in description and confident canonical tag: ${sugarInDescription.length}`);
        
        if (sugarInDescription.length > 0) {
            console.log('   Sample products:');
            sugarInDescription.slice(0, 5).forEach(product => {
                console.log(`     - ${product.description} (${product.brandName || 'No brand'})`);
                console.log(`       Canonical Tag: ${product.canonicalTag}`);
                console.log(`       Confidence: ${product.canonicalTagConfidence}`);
            });
        }

        console.log('\n🔍 Sugar Product Test Complete!');
        console.log('\n💡 Key Findings:');
        console.log('- The filtering is now very strict and only shows confident matches');
        console.log('- Basic ingredients like sugar need to have exact canonical tag matches');
        console.log('- We may need to adjust the canonical tag suggestion system for better coverage');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testSugarProducts(); 