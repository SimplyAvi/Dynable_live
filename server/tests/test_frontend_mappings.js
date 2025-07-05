const { Sequelize } = require('sequelize');
const db = require('./db/database.js');

async function testFrontendMappings() {
  try {
    await db.authenticate();
    
    const IngredientToCanonical = require('./db/models/IngredientToCanonical.js');
    const CanonicalIngredient = require('./db/models/CanonicalIngredient.js');
    const Food = require('./db/models/Food.js');
    
    const frontendCleanedIngredients = [
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
    
    for (const ingredient of frontendCleanedIngredients) {
      const mapping = await IngredientToCanonical.findOne({ 
        where: { messyName: ingredient.toLowerCase() } 
      });
      
      if (mapping) {
        const canonical = await CanonicalIngredient.findByPk(mapping.CanonicalIngredientId);
        console.log(`✅ ${ingredient} -> ${canonical.name}`);
        
        // Check products
        const products = await Food.findAll({
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