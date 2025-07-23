const db = require('./db/database');

async function checkBasicIngredients() {
  try {
    const result = await db.query(`
      SELECT "name", "canonicalTag", "isPureIngredient" 
      FROM "Food" 
      WHERE "canonicalTagConfidence" = 'confident' 
      AND ("canonicalTag" = 'yeast' OR "canonicalTag" = 'egg' OR "canonicalTag" = 'cornmeal' OR "canonicalTag" = 'parsley' OR "canonicalTag" = 'fish' OR "canonicalTag" = 'canola oil' OR "canonicalTag" = 'romaine lettuce') 
      ORDER BY "canonicalTag", "name"
    `, { type: require('sequelize').QueryTypes.SELECT });

    console.log('Basic ingredient products:');
    result.forEach(r => {
      console.log(`  - ${r.canonicalTag}: ${r.name} (pure: ${r.isPureIngredient})`);
    });

    // Also check for egg products
    const eggResult = await db.query(`
      SELECT "name", "canonicalTag", "isPureIngredient" 
      FROM "Food" 
      WHERE "canonicalTagConfidence" = 'confident' 
      AND "canonicalTag" LIKE '%egg%'
      ORDER BY "name"
    `, { type: require('sequelize').QueryTypes.SELECT });

    console.log('\nEgg-related products:');
    eggResult.forEach(r => {
      console.log(`  - ${r.canonicalTag}: ${r.name} (pure: ${r.isPureIngredient})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBasicIngredients(); 