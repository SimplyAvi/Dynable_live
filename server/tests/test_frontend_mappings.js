const { Sequelize } = require('sequelize');
const db = require('./db/database.js');

async function testFrontendMappings() {
  try {
    await db.authenticate();
    
    const IngredientToCanonical = require('./db/models/IngredientToCanonical.js');
    const Ingredient = require('./db/models/Ingredient.js');
    const IngredientCategorized = require('./db/models/IngredientCategorized.js');
    
    const frontendCleanedRecipeIngredients = [
      'ground beef',
      'onion powder',
      'honey mustard',
      'garlic powder',
      'pepper',
      'salt',
      'sugar',
      'olive oil',
      'swiss cheese',
      'hamburger buns'
    ];
    
    console.log('🔍 Testing frontend-cleaned ingredient mappings:');
    
    for (const ingredient of frontendCleanedRecipeIngredients) {
      const mapping = await IngredientToCanonical.findOne({ 
        where: { messyName: ingredient.toLowerCase() } 
      });
      
      if (mapping) {
        const canonical = await Ingredient.findByPk(mapping.IngredientId);
        console.log(`✅ ${ingredient} -> ${canonical.name}`);
        
        // Check products
        const products = await IngredientCategorized.findAll({
          where: {
            canonicalTag: canonical.name.toLowerCase(),
            canonicalTagConfidence: 'confident'
          }
        });
        console.log(`   Products found: ${products.length}`);
      } else {
        console.log(`❌ ${ingredient} -> NO MAPPING`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testFrontendMappings(); 