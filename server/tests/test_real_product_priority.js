const db = require('./db/database.js');

async function testRealProductPriority() {
  try {
    await db.authenticate();
    
    console.log('🧪 TESTING REAL PRODUCT PRIORITY...\n');
    
    // Test canonicals that were just updated
    const testCanonicals = [
      'gelatin',
      'pie filling', 
      'pound cake',
      'sweetened condensed milk',
      'diced tomatoes',
      'worcestershire sauce',
      'semi-sweet chocolate',
      'whipped topping'
    ];
    
    for (const canonical of testCanonicals) {
      console.log(`\n📊 Testing "${canonical}":`);
      
      // Get products for this canonical, ordered by brandOwner (Generic last)
      const products = await db.query(`
        SELECT id, description, "brandOwner", "canonicalTag", "canonicalTagConfidence"
        FROM "IngredientCategorized"
        WHERE "canonicalTag" = :canonical
        ORDER BY 
          CASE WHEN "brandOwner" = 'Generic' THEN 1 ELSE 0 END,
          "brandOwner",
          description
        LIMIT 10
      `, {
        replacements: { canonical },
        type: db.QueryTypes.SELECT
      });
      
      if (products.length === 0) {
        console.log(`  ❌ No products found for "${canonical}"`);
        continue;
      }
      
      const realProducts = products.filter(p => p.brandOwner !== 'Generic');
      const genericProducts = products.filter(p => p.brandOwner === 'Generic');
      
      console.log(`  📋 Total products: ${products.length}`);
      console.log(`  🏪 Real products: ${realProducts.length}`);
      console.log(`  🏷️  Generic products: ${genericProducts.length}`);
      
      if (realProducts.length > 0) {
        console.log(`  ✅ Top real products:`);
        realProducts.slice(0, 3).forEach((p, i) => {
          console.log(`    ${i + 1}. "${p.description}" (${p.brandOwner})`);
        });
      }
      
      if (genericProducts.length > 0) {
        console.log(`  ⚠️  Generic fallbacks:`);
        genericProducts.slice(0, 2).forEach((p, i) => {
          console.log(`    ${i + 1}. "${p.description}" (${p.brandOwner})`);
        });
      }
    }
    
    // Test a specific recipe to see the improvement
    console.log(`\n🍕 TESTING RECIPE INTEGRATION:`);
    
    // Test Aaron's Missouri Burger recipe
    const recipeId = 1; // Aaron's Missouri Burger
    
    const recipe = await db.query(`
      SELECT r.id, r.name, r.description
      FROM "Recipe" r
      WHERE r.id = :recipeId
    `, {
      replacements: { recipeId },
      type: db.QueryTypes.SELECT
    });
    
    if (recipe.length > 0) {
      console.log(`\n📋 Recipe: "${recipe[0].name}"`);
      
      const ingredients = await db.query(`
        SELECT i.id, i.name, i.cleanedName, i."canonicalIngredientId"
        FROM "RecipeIngredients" i
        WHERE i."recipeId" = :recipeId
        ORDER BY i.name
      `, {
        replacements: { recipeId },
        type: db.QueryTypes.SELECT
      });
      
      console.log(`\n🥘 RecipeIngredients (${ingredients.length}):`);
      
      for (const ingredient of ingredients) {
        // Get canonical info
        const canonical = await db.query(`
          SELECT ci.name as canonicalName
          FROM "Ingredient" ci
          WHERE ci.id = :canonicalId
        `, {
          replacements: { canonicalId: ingredient.canonicalIngredientId },
          type: db.QueryTypes.SELECT
        });
        
        const canonicalName = canonical.length > 0 ? canonical[0].canonicalName : 'None';
        
        // Get product count
        const productCount = await db.query(`
          SELECT COUNT(*) as count
          FROM "IngredientCategorized"
          WHERE "canonicalTag" = :canonicalName
        `, {
          replacements: { canonicalName },
          type: db.QueryTypes.SELECT
        });
        
        const realProductCount = await db.query(`
          SELECT COUNT(*) as count
          FROM "IngredientCategorized"
          WHERE "canonicalTag" = :canonicalName
            AND "brandOwner" != 'Generic'
        `, {
          replacements: { canonicalName },
          type: db.QueryTypes.SELECT
        });
        
        console.log(`  📊 "${ingredient.name}"`);
        console.log(`     Canonical: "${canonicalName}"`);
        console.log(`     Products: ${productCount[0].count} total, ${realProductCount[0].count} real`);
        
        if (realProductCount[0].count > 0) {
          // Show top real product
          const topProduct = await db.query(`
            SELECT description, "brandOwner"
            FROM "IngredientCategorized"
            WHERE "canonicalTag" = :canonicalName
              AND "brandOwner" != 'Generic'
            ORDER BY "brandOwner", description
            LIMIT 1
          `, {
            replacements: { canonicalName },
            type: db.QueryTypes.SELECT
          });
          
          if (topProduct.length > 0) {
            console.log(`     Top product: "${topProduct[0].description}" (${topProduct[0].brandOwner})`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testRealProductPriority(); 