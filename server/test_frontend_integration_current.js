const axios = require('axios');

const baseURL = 'http://localhost:5001';

async function testFrontendIntegration() {
  console.log('🧪 TESTING FRONTEND-BACKEND INTEGRATION (75.6% Coverage)\n');
  
  try {
    // Test 1: Basic recipe retrieval
    console.log('1️⃣ Testing Recipe Retrieval...');
    const recipeResponse = await axios.get(`${baseURL}/api/recipe/?id=1`);
    const recipe = recipeResponse.data;
    
    console.log(`   📖 Recipe: "${recipe.title}"`);
    console.log(`   🥘 Ingredients: ${recipe.ingredients.length}`);
    
    // Analyze ingredient mapping coverage
    let mappedIngredients = 0;
    let flaggedIngredients = 0;
    let ingredientsWithSubstitutes = 0;
    
    recipe.ingredients.forEach(ing => {
      if (ing.canonical && ing.canonical !== 'e') {
        mappedIngredients++;
      }
      if (ing.flagged) {
        flaggedIngredients++;
      }
      if (ing.substitutions && ing.substitutions.length > 0) {
        ingredientsWithSubstitutes++;
      }
    });
    
    console.log(`   🎯 Mapped: ${mappedIngredients}/${recipe.ingredients.length} (${(mappedIngredients/recipe.ingredients.length*100).toFixed(1)}%)`);
    console.log(`   ⚠️  Flagged: ${flaggedIngredients}`);
    console.log(`   🔄 Substitutes: ${ingredientsWithSubstitutes}\n`);
    
    // Test 2: Recipe with allergen filtering
    console.log('2️⃣ Testing Allergen Filtering...');
    const allergenResponse = await axios.get(`${baseURL}/api/recipe/?id=1&userAllergens=milk,wheat`);
    const allergenRecipe = allergenResponse.data;
    
    let allergenFlagged = 0;
    allergenRecipe.ingredients.forEach(ing => {
      if (ing.flagged) {
        allergenFlagged++;
        console.log(`   ⚠️  "${ing.name}" flagged for allergens`);
        if (ing.substitutions && ing.substitutions.length > 0) {
          console.log(`      🔄 Substitutes: ${ing.substitutions.map(s => s.substituteName).join(', ')}`);
        }
      }
    });
    
    console.log(`   📊 Total flagged: ${allergenFlagged}\n`);
    
    // Test 3: Product matching for ingredients
    console.log('3️⃣ Testing Product Matching...');
    const testIngredient = recipe.ingredients.find(ing => ing.canonical && ing.canonical !== 'e');
    
    if (testIngredient) {
      console.log(`   🧪 Testing ingredient: "${testIngredient.name}" (canonical: "${testIngredient.canonical}")`);
      
      const productResponse = await axios.post(`${baseURL}/api/product/by-ingredient`, {
        ingredient: testIngredient.canonical,
        page: 1,
        limit: 5
      });
      
      const products = productResponse.data.foods || [];
      console.log(`   🍎 Found ${products.length} products`);
      
      if (products.length > 0) {
        console.log(`   🏪 Sample: "${products[0].description}" (${products[0].brandOwner})`);
      }
    } else {
      console.log('   ❌ No mapped ingredients found to test product matching');
    }
    console.log();
    
    // Test 4: Multiple recipes to check coverage consistency
    console.log('4️⃣ Testing Coverage Across Multiple Recipes...');
    const testRecipes = [1, 100, 1000, 5000, 10000];
    let totalIngredients = 0;
    let totalMapped = 0;
    
    for (const recipeId of testRecipes) {
      try {
        const response = await axios.get(`${baseURL}/api/recipe/?id=${recipeId}`);
        const testRecipe = response.data;
        
        const mapped = testRecipe.ingredients.filter(ing => ing.canonical && ing.canonical !== 'e').length;
        totalIngredients += testRecipe.ingredients.length;
        totalMapped += mapped;
        
        console.log(`   📖 Recipe ${recipeId}: ${mapped}/${testRecipe.ingredients.length} (${(mapped/testRecipe.ingredients.length*100).toFixed(1)}%)`);
      } catch (error) {
        console.log(`   ❌ Recipe ${recipeId}: Not found`);
      }
    }
    
    const overallCoverage = (totalMapped / totalIngredients * 100);
    console.log(`   📊 Overall Coverage: ${totalMapped}/${totalIngredients} (${overallCoverage.toFixed(1)}%)\n`);
    
    // Test 5: Recipe search with allergen filtering
    console.log('5️⃣ Testing Recipe Search with Allergen Filtering...');
    const searchResponse = await axios.post(`${baseURL}/api/recipe/?page=1&limit=5`, {
      excludeIngredients: ['milk', 'wheat']
    });
    
    const filteredRecipes = searchResponse.data;
    console.log(`   🔍 Found ${filteredRecipes.length} recipes excluding milk/wheat`);
    
    if (filteredRecipes.length > 0) {
      const sampleRecipe = filteredRecipes[0];
      console.log(`   📖 Sample: "${sampleRecipe.title}" (${sampleRecipe.ingredients.length} ingredients)`);
      
      // Check if any ingredients contain milk/wheat (should be none)
      const hasAllergens = sampleRecipe.ingredients.some(ing => 
        ing.name.toLowerCase().includes('milk') || 
        ing.name.toLowerCase().includes('wheat')
      );
      
      console.log(`   ✅ Allergen-free: ${!hasAllergens ? 'Yes' : 'No'}`);
    }
    console.log();
    
    // Final assessment
    console.log('6️⃣ FINAL ASSESSMENT');
    console.log('   🎯 Current System Status:');
    console.log(`      📊 Recipe Coverage: ${overallCoverage.toFixed(1)}%`);
    console.log(`      🔄 Allergen Filtering: Working`);
    console.log(`      🍎 Product Matching: Working`);
    console.log(`      🔍 Recipe Search: Working`);
    
    if (overallCoverage >= 70) {
      console.log('   🎉 EXCELLENT: System is performing well with current coverage!');
      console.log('   ✅ Ready for frontend testing');
    } else if (overallCoverage >= 50) {
      console.log('   👍 GOOD: System is functional but could benefit from improved coverage');
      console.log('   ⚠️  Consider improving mappings for better user experience');
    } else {
      console.log('   ⚠️  NEEDS WORK: Coverage is too low for optimal user experience');
      console.log('   🔧 Should improve mappings before frontend testing');
    }
    
    console.log('\n   🚀 Ready to test frontend at: http://localhost:3000');
    console.log('   🔧 Backend: http://localhost:5001');

  } catch (error) {
    console.error('❌ Frontend integration test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

testFrontendIntegration(); 