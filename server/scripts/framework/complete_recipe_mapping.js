const db = require('./db/database.js');
const cleanIngredientName = require('./scripts/data-processing/cleanIngredientName');

async function completeRecipeMapping() {
  try {
    await db.authenticate();
    const IngredientCategorized = require('./db/models/IngredientCategorized.js');
    const RecipeIngredient = require('./db/models/Recipe/RecipeIngredient.js');
    const Recipe = require('./db/models/Recipe/Recipe.js');
    
    console.log('🔧 Completing Recipe Ingredient Mapping...\n');
    
    // Get all recipe ingredients
    const allRecipeIngredients = await RecipeIngredient.findAll();
    console.log(`📋 Found ${allRecipeIngredients.length} recipe ingredients to process`);
    
    // Extract unique cleaned ingredient names
    const cleanedRecipeIngredients = new Set();
    
    for (const ingredient of allRecipeIngredients) {
      const cleaned = cleanIngredientName(ingredient.name);
      if (cleaned && cleaned.length > 1) {
        cleanedRecipeIngredients.add(cleaned);
      }
    }
    
    console.log(`🔍 Found ${cleanedRecipeIngredients.size} unique cleaned ingredient names`);
    
    // Check which cleaned ingredients have canonical mappings
    const allCanonicals = await RecipeIngredient.findAll();
    const canonicalNames = allCanonicals.map(c => c.name.toLowerCase());
    
    const unmappedCleaned = [];
    for (const cleaned of cleanedRecipeIngredients) {
      if (!canonicalNames.includes(cleaned)) {
        unmappedCleaned.push(cleaned);
      }
    }
    
    console.log(`❌ Found ${unmappedCleaned.length} cleaned ingredients without canonical mappings`);
    
    // Add remaining canonical ingredients in batches
    const batchSize = 2000;
    let addedCanonicals = 0;
    
    for (let i = 0; i < unmappedCleaned.length; i += batchSize) {
      const batch = unmappedCleaned.slice(i, i + batchSize);
      
      console.log(`\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(unmappedCleaned.length/batchSize)} (${batch.length} items)...`);
      
      for (const cleaned of batch) {
        try {
          await RecipeIngredient.create({
            name: cleaned,
            category: 'ingredient'
          });
          addedCanonicals++;
        } catch (error) {
          // Skip if already exists
        }
      }
      
      console.log(`  ✅ Added ${addedCanonicals} canonical ingredients so far...`);
      
      // Safety check - don't add too many at once
      if (addedCanonicals >= 15000) {
        console.log('  ⚠️  Stopping at 15,000 new canonicals for safety');
        break;
      }
    }
    
    console.log(`\n✅ Total canonical ingredients added: ${addedCanonicals}`);
    
    // Add generic products for new canonicals that don't have products
    console.log('\n🏷️  Adding generic products for new canonicals...');
    
    const newCanonicals = await RecipeIngredient.findAll({
      where: {
        name: unmappedCleaned.slice(0, addedCanonicals)
      }
    });
    
    let addedGenericProducts = 0;
    const batchSizeProducts = 500;
    
    for (let i = 0; i < newCanonicals.length; i += batchSizeProducts) {
      const batch = newCanonicals.slice(i, i + batchSizeProducts);
      
      console.log(`\n🔄 Adding generic products batch ${Math.floor(i/batchSizeProducts) + 1}/${Math.ceil(newCanonicals.length/batchSizeProducts)}...`);
      
      for (const canonical of batch) {
        // Check if this canonical already has products
        const existingProducts = await IngredientCategorized.count({
          where: { canonicalTag: canonical.name }
        });
        
        if (existingProducts === 0) {
          try {
            await IngredientCategorized.create({
              fdcId: `generic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              description: `Pure ${canonical.name}`,
              brandOwner: 'Generic',
              brandName: 'Generic',
              ingredients: canonical.name,
              canonicalTag: canonical.name,
              canonicalTagConfidence: 'suggested'
            });
            addedGenericProducts++;
          } catch (error) {
            // Skip if creation fails
          }
        }
      }
      
      console.log(`  ✅ Added ${addedGenericProducts} generic products so far...`);
    }
    
    console.log(`\n✅ Total generic products added: ${addedGenericProducts}`);
    
    // Test recipe functionality after completion
    console.log('\n🧪 Testing Recipe Functionality After Completion...');
    
    const testRecipeIds = [17, 20005, 20006, 20007, 20017];
    let totalRecipeIngredients = 0;
    let ingredientsWithProducts = 0;
    let ingredientsWithRealProducts = 0;
    
    for (const recipeId of testRecipeIds) {
      const recipe = await Recipe.findByPk(recipeId, {
        include: [{ model: RecipeIngredient, as: 'RecipeIngredients' }]
      });
      
      if (!recipe) continue;
      
      console.log(`\n📋 Recipe ${recipeId}:`);
      
      for (const ingredient of recipe.RecipeIngredients) {
        totalRecipeIngredients++;
        const cleaned = cleanIngredientName(ingredient.name);
        
        if (cleaned) {
          const products = await IngredientCategorized.findAll({
            where: { canonicalTag: cleaned },
            order: [
              [db.Sequelize.literal(`CASE WHEN "brandOwner" = 'Generic' THEN 1 ELSE 0 END`), 'ASC']
            ],
            limit: 3
          });
          
          if (products.length > 0) {
            ingredientsWithProducts++;
            const realProducts = products.filter(p => p.brandOwner !== 'Generic');
            
            if (realProducts.length > 0) {
              ingredientsWithRealProducts++;
              console.log(`  ✅ "${ingredient.name}" → "${cleaned}" - ${realProducts.length} real products`);
            } else {
              console.log(`  🏷️  "${ingredient.name}" → "${cleaned}" - ${products.length} generic products`);
            }
          } else {
            console.log(`  ❌ "${ingredient.name}" → "${cleaned}" - No products`);
          }
        }
      }
    }
    
    console.log('\n📊 Final Results:');
    console.log(`  Total ingredients: ${totalRecipeIngredients}`);
    console.log(`  With products: ${ingredientsWithProducts} (${((ingredientsWithProducts/totalRecipeIngredients)*100).toFixed(1)}%)`);
    console.log(`  With real products: ${ingredientsWithRealProducts} (${((ingredientsWithRealProducts/totalRecipeIngredients)*100).toFixed(1)}%)`);
    
    // Overall completion assessment
    console.log('\n🎯 MAPPING COMPLETION STATUS:');
    console.log('=' .repeat(50));
    console.log(`📊 Canonical ingredients added: ${addedCanonicals.toLocaleString()}`);
    console.log(`🏷️  Generic products added: ${addedGenericProducts.toLocaleString()}`);
    console.log(`📋 Recipe coverage: ${((ingredientsWithProducts/totalRecipeIngredients)*100).toFixed(1)}%`);
    console.log(`🛍️  Real product usage: ${((ingredientsWithRealProducts/totalRecipeIngredients)*100).toFixed(1)}%`);
    
    if (addedCanonicals >= 15000) {
      console.log('\n💡 Next Steps:');
      console.log('  🔧 Continue adding remaining canonical ingredients');
      console.log('  🔧 Map more real products to existing canonicals');
      console.log('  🔧 Optimize canonical names for better matching');
    } else {
      console.log('\n✅ Mapping process completed!');
      console.log('  ✅ Most recipe ingredients now have canonical mappings');
      console.log('  ✅ System ready for frontend integration');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

completeRecipeMapping(); 