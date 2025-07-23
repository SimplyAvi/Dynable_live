const db = require('./db/database.js');

async function testRealVsGenericProducts() {
  try {
    await db.authenticate();
    const Recipe = require('./db/models/Recipe/Recipe.js');
    const Ingredient = require('./db/models/Recipe/Ingredient.js');
    const Ingredient = require('./db/models/Ingredient.js');
    const IngredientToCanonical = require('./db/models/IngredientToCanonical.js');
    const IngredientCategorized = require('./db/models/IngredientCategorized.js');
    
    console.log('🛍️  Testing Real vs Generic Products...\n');
    
    // Test some common ingredients that should have real products
    const testRecipeIngredients = [
      'salt',
      'sugar', 
      'eggs',
      'milk',
      'flour',
      'butter',
      'olive oil',
      'cheese',
      'tomato',
      'onion'
    ];
    
    console.log('📋 Testing Common RecipeIngredients:\n');
    
    for (const ingredientName of testRecipeIngredients) {
      console.log(`🥘 Testing: "${ingredientName}"`);
      
      // Find canonical ingredient
      const canonical = await Ingredient.findOne({
        where: { name: ingredientName }
      });
      
      if (!canonical) {
        console.log(`  ❌ No canonical found for "${ingredientName}"`);
        continue;
      }
      
      console.log(`  ✅ Canonical: "${canonical.name}"`);
      
      // Get all products for this canonical
      const allProducts = await IngredientCategorized.findAll({
        where: { canonicalTag: canonical.name },
        order: [
          [db.Sequelize.literal(`CASE WHEN "brandOwner" = 'Generic' THEN 1 ELSE 0 END`), 'ASC'],
          ['brandOwner', 'ASC'],
          ['description', 'ASC']
        ],
        limit: 10
      });
      
      if (allProducts.length === 0) {
        console.log(`  ⚠️  No products found`);
      } else {
        const realProducts = allProducts.filter(p => p.brandOwner !== 'Generic');
        const genericProducts = allProducts.filter(p => p.brandOwner === 'Generic');
        
        console.log(`  📊 Total products: ${allProducts.length}`);
        console.log(`  🏪 Real products: ${realProducts.length}`);
        console.log(`  🏷️  Generic products: ${genericProducts.length}`);
        
        if (realProducts.length > 0) {
          console.log(`  ✅ Top real products:`);
          realProducts.slice(0, 3).forEach((product, index) => {
            const brand = product.brandOwner || product.brandName || 'Unknown';
            console.log(`    ${index + 1}. ${product.description} - ${brand}`);
          });
        }
        
        if (genericProducts.length > 0) {
          console.log(`  🏷️  Generic products:`);
          genericProducts.slice(0, 2).forEach((product, index) => {
            console.log(`    ${index + 1}. ${product.description} - Generic`);
          });
        }
      }
      console.log('');
    }
    
    // Test specific recipes to see what products are shown
    console.log('\n📋 Testing Recipe Products:\n');
    
    const testRecipeIds = [17, 20005, 20006]; // Whaler Fish Sandwich + others
    
    for (const recipeId of testRecipeIds) {
      console.log(`\n🍽️  Recipe ID: ${recipeId}`);
      
      const recipe = await Recipe.findByPk(recipeId, {
        include: [{
          model: Ingredient,
          as: 'RecipeIngredients'
        }]
      });
      
      if (!recipe) {
        console.log(`  ❌ Recipe not found`);
        continue;
      }
      
      console.log(`  Recipe: "${recipe.name || 'Unnamed Recipe'}"`);
      
      // Test first 5 ingredients
      const testRecipeIngredients = recipe.RecipeIngredients.slice(0, 5);
      
      for (const ingredient of testRecipeIngredients) {
        const cleanedName = cleanIngredientName(ingredient.name);
        console.log(`\n    🥘 "${ingredient.name}"`);
        console.log(`       Cleaned: "${cleanedName}"`);
        
        // Check mapping
        const mapping = await IngredientToCanonical.findOne({
          where: { messyName: cleanedName }
        });
        
        if (mapping) {
          const canonical = await Ingredient.findByPk(mapping.IngredientId);
          
          if (canonical) {
            console.log(`       ✅ Mapped to: "${canonical.name}"`);
            
            // Get products (prioritizing real over generic)
            const products = await IngredientCategorized.findAll({
              where: { canonicalTag: canonical.name },
              order: [
                [db.Sequelize.literal(`CASE WHEN "brandOwner" = 'Generic' THEN 1 ELSE 0 END`), 'ASC'],
                ['brandOwner', 'ASC'],
                ['description', 'ASC']
              ],
              limit: 5
            });
            
            if (products.length > 0) {
              const realProducts = products.filter(p => p.brandOwner !== 'Generic');
              const genericProducts = products.filter(p => p.brandOwner === 'Generic');
              
              console.log(`       🛍️  Found ${products.length} products (${realProducts.length} real, ${genericProducts.length} generic):`);
              
                             products.forEach((product, index) => {
                 const brand = product.brandOwner || product.brandName || 'Unknown';
                 const isGeneric = product.brandOwner === 'Generic' ? ' (Generic)' : '';
                 console.log(`         ${index + 1}. ${product.description} - ${brand}${isGeneric}`);
               });
            } else {
              console.log(`       ⚠️  No products found`);
            }
          }
        } else {
          console.log(`       ❌ No mapping found`);
        }
      }
    }
    
    // Overall statistics
    console.log('\n📊 Overall Product Statistics:\n');
    
    const totalProducts = await IngredientCategorized.count();
    const genericProducts = await IngredientCategorized.count({ where: { brandOwner: 'Generic' } });
    const realProducts = totalProducts - genericProducts;
    
    console.log(`Total products in database: ${totalProducts}`);
    console.log(`Real products: ${realProducts} (${((realProducts/totalProducts)*100).toFixed(1)}%)`);
    console.log(`Generic products: ${genericProducts} (${((genericProducts/totalProducts)*100).toFixed(1)}%)`);
    
    // Check canonical coverage
    const canonicalsWithRealProducts = await db.query(`
      SELECT COUNT(DISTINCT "canonicalTag") as count
      FROM "IngredientCategorizeds" 
      WHERE "brandOwner" != 'Generic' AND "canonicalTag" IS NOT NULL
    `, { type: db.QueryTypes.SELECT });
    
    const totalCanonicals = await Ingredient.count();
    
    console.log(`\nCanonical ingredients with real products: ${canonicalsWithRealProducts[0].count}/${totalCanonicals} (${((canonicalsWithRealProducts[0].count/totalCanonicals)*100).toFixed(1)}%)`);
    
    console.log('\n🎯 Assessment:');
    if (realProducts > genericProducts) {
      console.log('✅ Good: More real products than generic products');
    } else {
      console.log('⚠️  Warning: More generic products than real products');
    }
    
    if (canonicalsWithRealProducts[0].count > totalCanonicals * 0.5) {
      console.log('✅ Good: Most canonical ingredients have real products');
    } else {
      console.log('⚠️  Warning: Many canonical ingredients only have generic products');
    }
    
  } catch (error) {
    console.error('❌ Error during product testing:', error);
  } finally {
    process.exit(0);
  }
}

function cleanIngredientName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-zA-Z\s]/g, '') // Remove non-alphabetic characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

testRealVsGenericProducts(); 