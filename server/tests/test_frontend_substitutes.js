const axios = require('axios');

async function testFrontendSubstituteLogic() {
    console.log('🧪 Testing Frontend Substitute Logic\n');

    const testCases = [
        {
            ingredientName: 'milk, cow',
            substituteName: 'almond milk',
            description: 'Testing almond milk substitute for cow milk'
        },
        {
            ingredientName: 'flour, wheat',
            substituteName: 'rice flour',
            description: 'Testing rice flour substitute for wheat flour'
        },
        {
            ingredientName: 'egg, chicken',
            substituteName: 'tofu',
            description: 'Testing tofu substitute for eggs'
        }
    ];

    for (const testCase of testCases) {
        console.log(`🔍 ${testCase.description}`);
        try {
            const response = await axios.post('http://localhost:5001/api/product/by-ingredient', {
                ingredientName: testCase.ingredientName,
                allergens: ['milk', 'wheat', 'eggs'], // Include common allergens
                substituteName: testCase.substituteName
            });

            console.log(`   ✅ Found ${response.data.length} products for "${testCase.substituteName}":`);
            response.data.forEach((product, index) => {
                console.log(`      ${index + 1}. ${product.description}`);
            });
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        console.log('');
    }

    console.log('🎉 Frontend substitute logic test complete!');
}

testFrontendSubstituteLogic().catch(console.error); 