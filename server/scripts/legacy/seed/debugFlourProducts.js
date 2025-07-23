const { IngredientCategorized } = require('../db/models');
const { Op } = require('sequelize');

async function debugFlourProducts() {
  try {
    console.log('=== DEBUGGING FLOUR PRODUCT MATCHING ===\n');

    // Test 1: Check what the current API logic would return for "flour"
    console.log('1. Testing current API logic for "flour":');
    const searchTerms = ['flour', 'wheat'];
    const orConditions = searchTerms.map(term => ({ 
      description: { [Op.iLike]: `%${term}%` } 
    }));
    
    const products = await IngredientCategorized.findAll({
      where: { [Op.or]: orConditions },
      limit: 20
    });

    console.log(`Found ${products.length} products:`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.brandName || 'No brand'}: ${product.description?.slice(0, 80)}`);
    });

    // Test 2: Check if any M&M products contain flour
    console.log('\n2. Checking M&M products for flour content:');
    const mmProducts = await IngredientCategorized.findAll({
      where: {
        [Op.or]: [
          { brandName: { [Op.iLike]: '%m&m%' } },
          { description: { [Op.iLike]: '%m&m%' } }
        ]
      },
      limit: 10
    });

    for (const product of mmProducts) {
      const hasFlourInDesc = product.description?.toLowerCase().includes('flour');
      const hasFlourInRecipeIngredients = product.ingredients?.toLowerCase().includes('flour');
      console.log(`- ${product.brandName || 'No brand'}: ${product.description?.slice(0, 60)}`);
      console.log(`  Has flour in description: ${hasFlourInDesc}`);
      console.log(`  Has flour in ingredients: ${hasFlourInRecipeIngredients}`);
      if (hasFlourInDesc || hasFlourInRecipeIngredients) {
        console.log(`  FULL DESCRIPTION: ${product.description}`);
        console.log(`  INGREDIENTS: ${product.ingredients}`);
      }
    }

    // Test 3: Check what products contain "flour" in ingredients
    console.log('\n3. Products with "flour" in ingredients:');
    const flourInRecipeIngredients = await IngredientCategorized.findAll({
      where: {
        ingredients: { [Op.iLike]: '%flour%' }
      },
      limit: 10
    });

    console.log(`Found ${flourInRecipeIngredients.length} products with flour in ingredients:`);
    flourInRecipeIngredients.forEach((product, index) => {
      console.log(`${index + 1}. ${product.brandName || 'No brand'}: ${product.description?.slice(0, 60)}`);
      console.log(`   RecipeIngredients: ${product.ingredients?.slice(0, 100)}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

debugFlourProducts(); 