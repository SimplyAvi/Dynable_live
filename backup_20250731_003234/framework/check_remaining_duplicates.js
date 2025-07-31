const db = require('./db/database');

async function checkRemainingDuplicates() {
  console.log('🔍 CHECKING REMAINING DUPLICATE CANONICALS\n');
  
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');
    
    // Check total canonicals
    const totalCanonicals = await db.query(`
      SELECT COUNT(*) as count
      FROM "CanonicalRecipeIngredients"
    `, { type: db.QueryTypes.SELECT });
    
    console.log(`📊 Total canonicals: ${totalCanonicals[0].count}`);
    
    // Check total mappings
    const totalMappings = await db.query(`
      SELECT COUNT(*) as count
      FROM "IngredientToCanonicals"
    `, { type: db.QueryTypes.SELECT });
    
    console.log(`📊 Total mappings: ${totalMappings[0].count}`);
    
    // Find remaining duplicates
    const remainingDuplicates = await db.query(`
      SELECT 
        ci.name as "canonicalName",
        COUNT(itc.id) as "mappingCount"
      FROM "CanonicalRecipeIngredients" ci
      JOIN "IngredientToCanonicals" itc ON ci.id = itc."IngredientId"
      GROUP BY ci.id, ci.name
      HAVING COUNT(itc.id) > 1
      ORDER BY COUNT(itc.id) DESC
      LIMIT 20
    `, { type: db.QueryTypes.SELECT });
    
    console.log(`\n🔍 Remaining duplicate canonicals: ${remainingDuplicates.length}`);
    
    if (remainingDuplicates.length > 0) {
      console.log(`\n📋 Top remaining duplicates:`);
      remainingDuplicates.forEach((item, index) => {
        console.log(`  ${index + 1}. "${item.canonicalName}": ${item.mappingCount} mappings`);
      });
    }
    
    // Check for exact name duplicates
    const exactNameDuplicates = await db.query(`
      SELECT 
        name,
        COUNT(*) as count
      FROM "CanonicalRecipeIngredients"
      GROUP BY name
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `, { type: db.QueryTypes.SELECT });
    
    console.log(`\n🔍 Exact name duplicates: ${exactNameDuplicates.length}`);
    
    if (exactNameDuplicates.length > 0) {
      console.log(`\n📋 Exact name duplicates:`);
      exactNameDuplicates.forEach((item, index) => {
        console.log(`  ${index + 1}. "${item.name}": ${item.count} instances`);
      });
    }
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.close();
  }
}

checkRemainingDuplicates(); 