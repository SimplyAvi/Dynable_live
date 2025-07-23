const axios = require('axios');

// Test the enhanced substitution system
async function testEnhancedSubstitutionSystem() {
  const baseURL = 'http://localhost:5001';
  
  console.log('🧪 TESTING ENHANCED SUBSTITUTION SYSTEM\n');

  // Test cases
  const testCases = [
    { ingredient: 'flour', expectedSubstitutes: ['flour'] },
    { ingredient: 'milk', expectedSubstitutes: ['coconut milk', 'oat milk'] },
    { ingredient: 'egg', expectedSubstitutes: ['sauce', 'tofu'] },
    { ingredient: 'cheese', expectedSubstitutes: ['cheese'] }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.ingredient}`);
    console.log('='.repeat(50));

    try {
      // Test 1: Basic substitute lookup
      console.log('\n📋 Test 1: Basic Substitute Lookup');
      const response1 = await axios.get(`${baseURL}/api/recipe/substitute-products`, {
        params: { canonicalIngredient: testCase.ingredient }
      });
      
      console.log(`✅ Response: ${response1.data.substitutes.length} substitutes found`);
      console.log(`   Total substitutes: ${response1.data.totalSubstitutes}`);
      console.log(`   Substitutes with products: ${response1.data.substitutesWithProducts}`);
      console.log(`   Total products: ${response1.data.totalProducts}`);
      
      if (response1.data.substitutes.length > 0) {
        response1.data.substitutes.forEach(sub => {
          console.log(`   - ${sub.substituteName}: ${sub.products.length} products`);
        });
      }

      // Test 2: Smart substitute lookup with ingredient name
      console.log('\n📋 Test 2: Smart Substitute Lookup');
      const response2 = await axios.post(`${baseURL}/api/recipe/smart-substitute-lookup`, {
        ingredientName: testCase.ingredient
      });
      
      console.log(`✅ Response: ${response2.data.substitutes.length} substitutes found`);
      console.log(`   Canonical ingredient: ${response2.data.canonicalIngredient}`);
      console.log(`   Total substitutes: ${response2.data.totalSubstitutes}`);
      console.log(`   Substitutes with products: ${response2.data.substitutesWithProducts}`);
      console.log(`   Total products: ${response2.data.totalProducts}`);

      // Test 3: Allergen-aware substitution
      console.log('\n📋 Test 3: Allergen-Aware Substitution');
      const response3 = await axios.get(`${baseURL}/api/recipe/substitute-products`, {
        params: { 
          canonicalIngredient: testCase.ingredient,
          allergens: ['milk', 'eggs'] // Test allergen filtering
        }
      });
      
      console.log(`✅ Response: ${response3.data.substitutes.length} substitutes found`);
      console.log(`   Total products (allergen-filtered): ${response3.data.totalProducts}`);

    } catch (error) {
      console.error(`❌ Error testing ${testCase.ingredient}:`, error.response?.data || error.message);
    }
  }

  // Test 4: Edge cases
  console.log('\n🔍 Testing Edge Cases');
  console.log('='.repeat(50));

  const edgeCases = [
    { ingredient: 'nonexistent', description: 'Non-existent ingredient' },
    { ingredient: 'flour', allergens: ['wheat'], description: 'Wheat allergen filtering' },
    { ingredient: 'milk', allergens: ['nuts'], description: 'Nut allergen filtering' }
  ];

  for (const edgeCase of edgeCases) {
    console.log(`\n📋 ${edgeCase.description}`);
    try {
      const response = await axios.get(`${baseURL}/api/recipe/substitute-products`, {
        params: { 
          canonicalIngredient: edgeCase.ingredient,
          allergens: edgeCase.allergens
        }
      });
      
      console.log(`✅ Response: ${response.data.substitutes.length} substitutes found`);
      console.log(`   Total products: ${response.data.totalProducts}`);
      
    } catch (error) {
      console.error(`❌ Error:`, error.response?.data || error.message);
    }
  }

  console.log('\n🎉 Enhanced substitution system testing complete!');
}

// Run the tests
testEnhancedSubstitutionSystem().catch(console.error); 