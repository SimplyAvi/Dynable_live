const axios = require('axios');

async function testFrontendMapping() {
  console.log('🧪 Testing Frontend Ingredient Mapping\n');

  // Test cases with different types of ingredients
  const testCases = [
    { name: 'cup boiling water', expected: 'water' },
    { name: 'teaspoons kosher salt', expected: 'kosher salt' },
    { name: 'all purpose flour', expected: 'all-purpose flour' },
    { name: 'store bought hummus', expected: 'hummus' },
    { name: 'baker\'s semi sweet chocolate', expected: 'chocolate' },
    { name: 'double acting baking powder', expected: 'baking powder' },
    { name: 'campbell\'s condensed cream mushroom soup', expected: 'cream of mushroom soup' },
    { name: 'fleischmann\'s rapidrise yeast', expected: 'rapidrise yeast' }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`Testing: "${testCase.name}"`);
      
      const response = await axios.post('http://localhost:5001/api/product/by-ingredient', {
        ingredientName: testCase.name,
        allergens: []
      });

      const productCount = response.data.length;
      console.log(`  ✅ Found ${productCount} products`);
      
      if (productCount > 0) {
        console.log(`  📦 Sample products:`);
        response.data.slice(0, 3).forEach(product => {
          console.log(`    - ${product.brandName || 'Generic'} ${product.description?.slice(0, 50)}...`);
        });
      } else {
        console.log(`  ⚠️  No products found (this might be expected for some ingredients)`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      console.log('');
    }
  }

  // Test a specific recipe to see ingredient mapping
  console.log('🍰 Testing Recipe Ingredient Mapping:');
  try {
    const recipeResponse = await axios.get('http://localhost:5001/api/recipe/?id=1');
    const recipe = recipeResponse.data;
    
    console.log(`Recipe: ${recipe.title}`);
    console.log('RecipeIngredients:');
    
    for (const ingredient of recipe.ingredients) {
      console.log(`  - ${ingredient.name} (canonical: ${ingredient.canonical || 'none'})`);
      
      // Test product mapping for this ingredient
      try {
        const productResponse = await axios.post('http://localhost:5001/api/product/by-ingredient', {
          ingredientName: ingredient.name,
          allergens: []
        });
        
        console.log(`    Products found: ${productResponse.data.length}`);
        if (productResponse.data.length > 0) {
          console.log(`    Sample: ${productResponse.data[0].brandName || 'Generic'} ${productResponse.data[0].description?.slice(0, 40)}...`);
        }
      } catch (error) {
        console.log(`    Error getting products: ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`Error testing recipe: ${error.message}`);
  }
}

testFrontendMapping().catch(console.error); 