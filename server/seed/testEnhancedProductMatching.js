const axios = require('axios');

async function testEnhancedProductMatching() {
    const baseURL = 'http://localhost:5001/api/product/by-ingredient';
    
    console.log('🧪 Testing Enhanced Product Matching Logic\n');
    
    const tests = [
        // Test 1: Basic ingredients with strict matching
        {
            name: 'Salt - should only show salt products',
            payload: { ingredientName: 'salt', allergens: [] },
            expected: 'Should exclude sauces, seasonings, mixes'
        },
        {
            name: 'Sugar - should only show sugar products',
            payload: { ingredientName: 'sugar', allergens: [] },
            expected: 'Should exclude candy, chocolate, cookies'
        },
        {
            name: 'Yeast - should only show yeast products',
            payload: { ingredientName: 'yeast', allergens: [] },
            expected: 'Should exclude bread, dough, mixes'
        },
        
        // Test 2: Substitute-specific filtering
        {
            name: 'Gluten-free flour substitute',
            payload: { 
                ingredientName: 'flour', 
                allergens: ['wheat'],
                substituteName: 'gluten-free flour'
            },
            expected: 'Should show only gluten-free flour products'
        },
        {
            name: 'Almond milk substitute',
            payload: { 
                ingredientName: 'milk', 
                allergens: ['milk'],
                substituteName: 'almond milk'
            },
            expected: 'Should show only almond milk products'
        },
        {
            name: 'Soy milk substitute',
            payload: { 
                ingredientName: 'milk', 
                allergens: ['milk'],
                substituteName: 'soy milk'
            },
            expected: 'Should show only soy milk products'
        },
        {
            name: 'Coconut oil substitute',
            payload: { 
                ingredientName: 'butter', 
                allergens: ['milk'],
                substituteName: 'coconut oil'
            },
            expected: 'Should show only coconut oil products'
        },
        
        // Test 3: Specific flour types
        {
            name: 'All-purpose flour',
            payload: { ingredientName: 'all-purpose flour', allergens: [] },
            expected: 'Should show only all-purpose flour, exclude bread/cake flour'
        },
        {
            name: 'Bread flour',
            payload: { ingredientName: 'bread flour', allergens: [] },
            expected: 'Should show only bread flour, exclude all-purpose/cake flour'
        },
        
        // Test 4: Milk types
        {
            name: 'Whole milk',
            payload: { ingredientName: 'whole milk', allergens: [] },
            expected: 'Should show only whole milk, exclude skim/2%'
        },
        {
            name: 'Skim milk',
            payload: { ingredientName: 'skim milk', allergens: [] },
            expected: 'Should show only skim milk, exclude whole/2%'
        },
        
        // Test 5: Butter types
        {
            name: 'Unsalted butter',
            payload: { ingredientName: 'unsalted butter', allergens: [] },
            expected: 'Should show only unsalted butter, exclude salted'
        },
        {
            name: 'Salted butter',
            payload: { ingredientName: 'salted butter', allergens: [] },
            expected: 'Should show only salted butter, exclude unsalted'
        }
    ];
    
    for (const test of tests) {
        console.log(`\n📋 ${test.name}`);
        console.log(`Expected: ${test.expected}`);
        
        try {
            const response = await axios.post(baseURL, test.payload);
            const products = response.data;
            
            console.log(`✅ Found ${products.length} products`);
            
            if (products.length > 0) {
                console.log('Sample products:');
                products.slice(0, 3).forEach((product, index) => {
                    console.log(`  ${index + 1}. ${product.brandName || 'No brand'} - ${product.description}`);
                });
                
                if (products.length > 3) {
                    console.log(`  ... and ${products.length - 3} more`);
                }
            } else {
                console.log('  No products found');
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.response?.data?.error || error.message}`);
        }
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('- Basic ingredients (salt, sugar, yeast) should show only exact matches');
    console.log('- Substitute searches should filter to specific substitute types');
    console.log('- Specific ingredient types should exclude other variants');
    console.log('- Allergen filtering should still work for substitute searches');
}

// Run the test
testEnhancedProductMatching().catch(console.error); 