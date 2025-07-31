const { IngredientCategorized } = require('../db/models');
const { Op, Sequelize } = require('sequelize');

async function testImprovedProductMatching() {
  try {
    console.log('=== TESTING IMPROVED PRODUCT MATCHING ===\n');

    // Test 1: Flour products (should prioritize bread, avoid candy)
    console.log('1. Testing flour product matching:');
    const cleanedName = 'flour';
    const searchTerms = [cleanedName, 'wheat'];
    
    // Define ingredient-specific product categories for better matching
    const ingredientCategories = {
      'flour': ['bread', 'tortilla', 'pasta', 'bun', 'muffin', 'biscuit', 'cake', 'cookie', 'pastry'],
      'wheat': ['bread', 'tortilla', 'pasta', 'bun', 'muffin', 'biscuit', 'cake', 'cookie', 'pastry']
    };
    
    // Find relevant categories for this ingredient
    const relevantCategories = [];
    for (const [ingredient, categories] of Object.entries(ingredientCategories)) {
      if (searchTerms.some(term => term.toLowerCase().includes(ingredient))) {
        relevantCategories.push(...categories);
      }
    }
    
    // Build smart search conditions
    const searchConditions = [];
    
    // Priority 1: Exact ingredient match in description (highest priority)
    searchTerms.forEach(term => {
      searchConditions.push({ description: { [Op.iLike]: `%${term}%` } });
    });
    
    // Priority 2: Ingredient in ingredients list (high priority)
    searchTerms.forEach(term => {
      searchConditions.push({ ingredients: { [Op.iLike]: `%${term}%` } });
    });
    
    // Priority 3: Relevant product categories (medium priority)
    if (relevantCategories.length > 0) {
      relevantCategories.forEach(category => {
        searchConditions.push({ description: { [Op.iLike]: `%${category}%` } });
      });
    }
    
    const where = { [Op.or]: searchConditions };
    
    // Filter out candy, snacks, and desserts for non-sweet ingredients
    const sweetRecipeIngredients = ['sugar', 'chocolate', 'candy', 'sweet', 'dessert', 'cake', 'cookie', 'ice cream'];
    const isSweetIngredient = searchTerms.some(term => 
      sweetRecipeIngredients.some(sweet => term.toLowerCase().includes(sweet))
    );
    
    if (!isSweetIngredient) {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(
        Sequelize.literal(`(
          LOWER("description") NOT LIKE '%candy%' AND 
          LOWER("description") NOT LIKE '%chocolate%' AND 
          LOWER("description") NOT LIKE '%m&m%' AND 
          LOWER("description") NOT LIKE '%snack%' AND 
          LOWER("description") NOT LIKE '%dessert%'
        )`)
      );
    }
    
    const products = await IngredientCategorized.findAll({
      where,
      limit: 15
    });

    console.log(`Found ${products.length} flour-related products:`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.brandName || 'No brand'}: ${product.description?.slice(0, 80)}`);
    });

    // Test 2: Check if any M&M products slipped through
    console.log('\n2. Checking for any candy products that might have slipped through:');
    const candyProducts = products.filter(p => 
      p.description?.toLowerCase().includes('candy') ||
      p.description?.toLowerCase().includes('chocolate') ||
      p.description?.toLowerCase().includes('m&m') ||
      p.brandName?.toLowerCase().includes('m&m')
    );
    
    if (candyProducts.length > 0) {
      console.log(`⚠️  Found ${candyProducts.length} candy products that should be filtered out:`);
      candyProducts.forEach(p => {
        console.log(`   - ${p.brandName || 'No brand'}: ${p.description?.slice(0, 60)}`);
      });
    } else {
      console.log('✅ No candy products found - filtering is working correctly!');
    }

    // Test 3: Check for bread products (should be prioritized)
    console.log('\n3. Checking for bread products (should be prioritized):');
    const breadProducts = products.filter(p => 
      p.description?.toLowerCase().includes('bread') ||
      p.description?.toLowerCase().includes('tortilla') ||
      p.description?.toLowerCase().includes('bun') ||
      p.description?.toLowerCase().includes('muffin')
    );
    
    console.log(`Found ${breadProducts.length} bread-related products:`);
    breadProducts.forEach(p => {
      console.log(`   - ${p.brandName || 'No brand'}: ${p.description?.slice(0, 60)}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

testImprovedProductMatching(); 