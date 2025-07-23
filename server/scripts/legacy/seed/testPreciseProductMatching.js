const { IngredientCategorized } = require('../db/models');
const { Op, Sequelize } = require('sequelize');

async function testPreciseProductMatching() {
  try {
    console.log('=== TESTING PRECISE PRODUCT MATCHING ===\n');

    // Test cases for different ingredients
    const testCases = [
      { ingredient: 'flour', expected: ['bread', 'tortilla', 'pasta', 'bun'] },
      { ingredient: 'milk', expected: ['milk', 'cheese', 'yogurt', 'butter'] },
      { ingredient: 'egg', expected: ['egg', 'mayonnaise'] },
      { ingredient: 'butter', expected: ['butter', 'margarine', 'spread'] },
      { ingredient: 'sugar', expected: ['sugar', 'sweetener', 'syrup'] }
    ];

    for (const testCase of testCases) {
      console.log(`\n--- Testing: ${testCase.ingredient.toUpperCase()} ---`);
      
      // Simulate the new precise matching logic
      const ingredientProductRules = {
        'flour': {
          primary: ['bread', 'tortilla', 'pasta', 'bun', 'muffin', 'biscuit', 'cake', 'cookie', 'pastry', 'flour'],
          exclude: ['candy', 'chocolate', 'snack', 'dessert', 'm&m', 'cereal']
        },
        'wheat': {
          primary: ['bread', 'tortilla', 'pasta', 'bun', 'muffin', 'biscuit', 'cake', 'cookie', 'pastry', 'wheat'],
          exclude: ['candy', 'chocolate', 'snack', 'dessert', 'm&m', 'cereal']
        },
        'milk': {
          primary: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy'],
          exclude: ['candy', 'chocolate', 'snack', 'dessert']
        },
        'egg': {
          primary: ['egg', 'mayonnaise'],
          exclude: ['candy', 'chocolate', 'snack', 'dessert']
        },
        'butter': {
          primary: ['butter', 'margarine', 'spread'],
          exclude: ['candy', 'chocolate', 'snack', 'dessert']
        },
        'sugar': {
          primary: ['sugar', 'sweetener', 'syrup', 'honey'],
          exclude: []
        }
      };

      // Find the matching rule
      let bestMatch = null;
      for (const [ingredient, rules] of Object.entries(ingredientProductRules)) {
        if (testCase.ingredient.toLowerCase().includes(ingredient)) {
          bestMatch = rules;
          break;
        }
      }

      if (bestMatch) {
        // Build the query
        const primaryConditions = bestMatch.primary.map(term => ({
          description: { [Op.iLike]: `%${term}%` }
        }));
        
        const where = { [Op.or]: primaryConditions };
        
        // Add exclusion filters
        if (bestMatch.exclude.length > 0) {
          where[Op.and] = where[Op.and] || [];
          const excludeConditions = bestMatch.exclude.map(term => 
            `LOWER("description") NOT LIKE '%${term}%'`
          );
          where[Op.and].push(Sequelize.literal(`(${excludeConditions.join(' AND ')})`));
        }

        const products = await IngredientCategorized.findAll({
          where,
          limit: 10
        });

        console.log(`Found ${products.length} products for ${testCase.ingredient}:`);
        products.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.brandName || 'No brand'}: ${product.description?.slice(0, 60)}`);
        });

        // Check if results contain expected product types
        const foundTypes = products.map(p => p.description?.toLowerCase()).join(' ');
        const hasExpectedTypes = testCase.expected.some(expected => 
          foundTypes.includes(expected.toLowerCase())
        );
        
        if (hasExpectedTypes) {
          console.log(`✅ ${testCase.ingredient}: Found relevant product types`);
        } else {
          console.log(`⚠️  ${testCase.ingredient}: Missing expected product types`);
        }

        // Check for unwanted products
        const unwantedProducts = products.filter(p => 
          p.description?.toLowerCase().includes('candy') ||
          p.description?.toLowerCase().includes('chocolate') ||
          p.description?.toLowerCase().includes('m&m')
        );
        
        if (unwantedProducts.length === 0) {
          console.log(`✅ ${testCase.ingredient}: No unwanted candy/snack products`);
        } else {
          console.log(`⚠️  ${testCase.ingredient}: Found ${unwantedProducts.length} unwanted products`);
          unwantedProducts.forEach(p => {
            console.log(`     - ${p.brandName || 'No brand'}: ${p.description?.slice(0, 50)}`);
          });
        }
      } else {
        console.log(`❌ No matching rule found for ${testCase.ingredient}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testPreciseProductMatching(); 