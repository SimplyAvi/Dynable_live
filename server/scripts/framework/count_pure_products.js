const { Sequelize } = require('sequelize');
const db = require('./db/database.js');

async function countPureProducts() {
  try {
    await db.authenticate();
    const IngredientCategorized = require('./db/models/IngredientCategorized.js');
    
    const genericCount = await IngredientCategorized.count({
      where: {
        description: { [Sequelize.Op.iLike]: 'pure %' },
        brandName: 'Generic',
        canonicalTagConfidence: 'confident'
      }
    });
    
    const pigglyCount = await IngredientCategorized.count({
      where: {
        description: { [Sequelize.Op.iLike]: 'pure %' },
        brandName: 'PIGGLY WIGGLY',
        canonicalTagConfidence: 'confident'
      }
    });
    
    console.log('Pure products by brand:');
    console.log(`Generic: ${genericCount}`);
    console.log(`PIGGLY WIGGLY: ${pigglyCount}`);
    
    // Show a few examples of each
    const genericExamples = await IngredientCategorized.findAll({
      where: {
        description: { [Sequelize.Op.iLike]: 'pure %' },
        brandName: 'Generic',
        canonicalTagConfidence: 'confident'
      },
      limit: 5,
      attributes: ['description', 'canonicalTag']
    });
    
    const pigglyExamples = await IngredientCategorized.findAll({
      where: {
        description: { [Sequelize.Op.iLike]: 'pure %' },
        brandName: 'PIGGLY WIGGLY',
        canonicalTagConfidence: 'confident'
      },
      limit: 5,
      attributes: ['description', 'canonicalTag']
    });
    
    console.log('\nGeneric examples:');
    genericExamples.forEach(p => console.log(`  - ${p.description} (${p.canonicalTag})`));
    
    console.log('\nPIGGLY WIGGLY examples:');
    pigglyExamples.forEach(p => console.log(`  - ${p.description} (${p.canonicalTag})`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

countPureProducts(); 