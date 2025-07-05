const { Sequelize } = require('sequelize');
const db = require('./db/database.js');

async function testAaronBurger() {
  try {
    await db.authenticate();
    const Food = require('./db/models/Food.js');
    const IngredientToCanonical = require('./db/models/IngredientToCanonical.js');
    
    console.log('🍔 Testing Aaron\'s Missouri Burger ingredient: "1 pound lean ground beef"');
    
    // Test the ingredient name cleaning
    const ingredientName = '1 pound lean ground beef';
    const cleanedName = ingredientName.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log(`Original: "${ingredientName}"`);
    console.log(`Cleaned: "${cleanedName}"`);
    
    // Check if we have a mapping for this ingredient
    const mapping = await IngredientToCanonical.findOne({
      where: { messyName: cleanedName }
    });
    
    if (mapping) {
      console.log(`✅ Found mapping: "${cleanedName}" -> "${mapping.canonicalName}"`);
    } else {
      console.log(`❌ No mapping found for "${cleanedName}"`);
    }
    
    // Check for products with canonical tag "beef, ground"
    const groundBeefProducts = await Food.findAll({
      where: {
        canonicalTag: 'beef, ground',
        brandName: { [Sequelize.Op.ne]: 'Generic' }
      },
      limit: 10,
      attributes: ['description', 'brandName', 'canonicalTag']
    });
    
    console.log(`\n📦 Found ${groundBeefProducts.length} real ground beef products:`);
    groundBeefProducts.forEach(product => {
      console.log(`  - ${product.description} (${product.brandName})`);
    });
    
    // Check for lean ground beef specifically
    const leanGroundBeef = await Food.findAll({
      where: {
        description: { [Sequelize.Op.iLike]: '%lean%ground beef%' },
        brandName: { [Sequelize.Op.ne]: 'Generic' }
      },
      limit: 5,
      attributes: ['description', 'brandName', 'canonicalTag']
    });
    
    console.log(`\n📦 Found ${leanGroundBeef.length} lean ground beef products:`);
    leanGroundBeef.forEach(product => {
      console.log(`  - ${product.description} (${product.brandName})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testAaronBurger(); 