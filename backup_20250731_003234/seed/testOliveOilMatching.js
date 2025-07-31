const { IngredientCategorized } = require('../db/models');
const { Op, Sequelize } = require('sequelize');
const IngredientMatchingRule = require('../db/models/IngredientMatchingRule');

// Helper function from foodRoutes.js
function buildPureIngredientPatterns(ingredient) {
  // Special patterns for sugar to be more strict
  if (ingredient.toLowerCase() === 'sugar') {
    return [
      'sugar', // exact match
      'sugar.', // ends with sugar (with period)
      'sugar,', // ends with sugar (with comma)
      'sugar ', // ends with sugar (with space)
      '100% sugar',
      'pure sugar',
      'granulated sugar',
      'organic sugar',
      'raw sugar',
      'white sugar',
      'brown sugar',
      'powdered sugar',
      'confectioners sugar',
      'cane sugar',
      'beet sugar'
    ];
  }
  
  // Default patterns for other ingredients
  const patterns = [
    `${ingredient}`, // exact match
    `${ingredient}.`, // ends with ingredient (with period)
    `${ingredient},`, // ends with ingredient (with comma)
    `${ingredient} `, // ends with ingredient (with space)
    `100% ${ingredient}`,
    `pure ${ingredient}`,
    `granulated ${ingredient}`,
    `organic ${ingredient}`,
    `raw ${ingredient}`
  ];
  return patterns;
}

async function testOliveOil() {
  try {
    console.log('Testing olive oil matching with API logic...');
    
    // Simulate the API logic
    const cleanedName = 'olive oil';
    const substituteName = null; // No substitute selected
    
    // Check if this is a basic ingredient
    const matchingRule = await IngredientMatchingRule.findOne({
      where: {
        ingredientName: {
          [Op.iLike]: cleanedName
        }
      }
    });
    
    console.log('Matching rule found:', !!matchingRule);
    if (matchingRule) {
      console.log('Rule details:', {
        ingredientName: matchingRule.ingredientName,
        primaryKeywords: matchingRule.primaryKeywords,
        exclusionKeywords: matchingRule.exclusionKeywords,
        exactMatch: matchingRule.exactMatch,
        strictPhrase: matchingRule.strictPhrase,
        isBasicIngredient: matchingRule.isBasicIngredient
      });
    }
    
    const isBasic = matchingRule ? matchingRule.isBasicIngredient : false;
    console.log('Is basic ingredient:', isBasic);
    console.log('No substitute selected:', !substituteName);
    
    let where = {};
    if (isBasic && !substituteName) {
      console.log('Using strict patterns for pure ingredient products');
      // Use strict patterns for pure ingredient products
      const patterns = buildPureIngredientPatterns(cleanedName);
      console.log('Patterns:', patterns);
      where[Sequelize.Op.or] = patterns.map(pattern => ({
        description: { [Sequelize.Op.iLike]: `%${pattern}` }
      }));
      
      // For basic ingredients, be very strict - only allow products that are clearly the pure ingredient
      where[Sequelize.Op.and] = where[Sequelize.Op.and] || [];
      where[Sequelize.Op.and].push(
        Sequelize.literal(`"SubcategoryID" IN (
          SELECT "SubcategoryID" FROM "Subcategories" 
          WHERE "pure_ingredient" = true
        )`)
      );
    } else if (matchingRule && matchingRule.exactMatch) {
      console.log('Using database-driven matching rules');
      // Use database-driven matching rules
      const searchTerms = [cleanedName];
      const orConditions = [];
      for (const term of searchTerms) {
        for (const keyword of matchingRule.primaryKeywords) {
          if (matchingRule.strictPhrase) {
            orConditions.push(
              { description: { [Sequelize.Op.iLike]: keyword } },
              { description: { [Sequelize.Op.iLike]: `${keyword} %` } },
              { description: { [Sequelize.Op.iLike]: `% ${keyword} %` } },
              { description: { [Sequelize.Op.iLike]: `% ${keyword}` } }
            );
          } else {
            orConditions.push({
              description: { [Sequelize.Op.iLike]: `%${keyword}%` }
            });
          }
        }
      }
      
      if (matchingRule.exclusionKeywords && matchingRule.exclusionKeywords.length > 0) {
        const exclusionConditions = matchingRule.exclusionKeywords.map(keyword => ({
          description: { [Sequelize.Op.notILike]: `%${keyword}%` }
        }));
        where[Sequelize.Op.and] = [
          { [Sequelize.Op.or]: orConditions },
          ...exclusionConditions
        ];
      } else {
        where[Sequelize.Op.or] = orConditions;
      }
    } else {
      console.log('Using fallback strict matching logic');
      // Use the original strict matching logic for other ingredients
      const searchTerms = [cleanedName];
      where[Sequelize.Op.or] = searchTerms.map(term => [
        { description: { [Sequelize.Op.iLike]: term } },
        { description: { [Sequelize.Op.iLike]: `${term}%` } }
      ]).flat();
    }
    
    console.log('Final query conditions:', JSON.stringify(where, null, 2));
    
    const products = await IngredientCategorized.findAll({
      where,
      limit: 10,
      order: [['description', 'ASC']]
    });
    
    console.log(`Found ${products.length} products:`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.description}`);
    });
    
    // Check if any products contain "anchovy" or similar
    const anchovyProducts = products.filter(p => 
      p.description.toLowerCase().includes('anchovy') ||
      p.description.toLowerCase().includes('anchovie')
    );
    
    if (anchovyProducts.length > 0) {
      console.log('\n⚠️  Found anchovy products:');
      anchovyProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.description}`);
      });
    } else {
      console.log('\n✅ No anchovy products found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testOliveOil(); 