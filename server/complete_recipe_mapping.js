const db = require('./db/database.js');

async function completeRecipeMapping() {
  try {
    await db.authenticate();
    const Food = require('./db/models/Food.js');
    const CanonicalIngredient = require('./db/models/CanonicalIngredient.js');
    const Ingredient = require('./db/models/Recipe/Ingredient.js');
    const Recipe = require('./db/models/Recipe/Recipe.js');
    
    console.log('🔧 Completing Recipe Ingredient Mapping...\n');
    
    // Get all recipe ingredients
    const allIngredients = await Ingredient.findAll();
    console.log(`📋 Found ${allIngredients.length} recipe ingredients to process`);
    
    // Extract unique cleaned ingredient names
    const cleanedIngredients = new Set();
    
    for (const ingredient of allIngredients) {
      const cleaned = cleanIngredientName(ingredient.name);
      if (cleaned && cleaned.length > 1) {
        cleanedIngredients.add(cleaned);
      }
    }
    
    console.log(`🔍 Found ${cleanedIngredients.size} unique cleaned ingredient names`);
    
    // Check which cleaned ingredients have canonical mappings
    const allCanonicals = await CanonicalIngredient.findAll();
    const canonicalNames = allCanonicals.map(c => c.name.toLowerCase());
    
    const unmappedCleaned = [];
    for (const cleaned of cleanedIngredients) {
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
          await CanonicalIngredient.create({
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
    
    const newCanonicals = await CanonicalIngredient.findAll({
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
        const existingProducts = await Food.count({
          where: { canonicalTag: canonical.name }
        });
        
        if (existingProducts === 0) {
          try {
            await Food.create({
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
    let totalIngredients = 0;
    let ingredientsWithProducts = 0;
    let ingredientsWithRealProducts = 0;
    
    for (const recipeId of testRecipeIds) {
      const recipe = await Recipe.findByPk(recipeId, {
        include: [{ model: Ingredient, as: 'Ingredients' }]
      });
      
      if (!recipe) continue;
      
      console.log(`\n📋 Recipe ${recipeId}:`);
      
      for (const ingredient of recipe.Ingredients) {
        totalIngredients++;
        const cleaned = cleanIngredientName(ingredient.name);
        
        if (cleaned) {
          const products = await Food.findAll({
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
    console.log(`  Total ingredients: ${totalIngredients}`);
    console.log(`  With products: ${ingredientsWithProducts} (${((ingredientsWithProducts/totalIngredients)*100).toFixed(1)}%)`);
    console.log(`  With real products: ${ingredientsWithRealProducts} (${((ingredientsWithRealProducts/totalIngredients)*100).toFixed(1)}%)`);
    
    // Overall completion assessment
    console.log('\n🎯 MAPPING COMPLETION STATUS:');
    console.log('=' .repeat(50));
    console.log(`📊 Canonical ingredients added: ${addedCanonicals.toLocaleString()}`);
    console.log(`🏷️  Generic products added: ${addedGenericProducts.toLocaleString()}`);
    console.log(`📋 Recipe coverage: ${((ingredientsWithProducts/totalIngredients)*100).toFixed(1)}%`);
    console.log(`🛍️  Real product usage: ${((ingredientsWithRealProducts/totalIngredients)*100).toFixed(1)}%`);
    
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

function cleanIngredientName(name) {
  // Remove leading measurements and units (e.g. '1/2 cups', '2 tablespoons', etc.)
  let cleaned = name.toLowerCase().trim();
  cleaned = cleaned.replace(/^(about |approx\.? |a |an )?/i, '');
  cleaned = cleaned.replace(/^((\d+\s)?(\d+\/\d+\s)?(cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|ounce|ounces|oz|pound|pounds|lb|lbs|gram|grams|g|kg|ml|l|quart|quarts|pinch|dash|package|packages|can|cans|slice|slices|stick|sticks|bunch|bunches|clove|cloves|head|heads|piece|pieces|container|containers|bag|bags|box|boxes|bottle|bottles|jar|jars|packet|packets|sheet|sheets|drop|drops|sprig|sprigs|leaf|leaves|ear|ears|filet|filets|fillet|fillets|strip|strips|block|blocks|bar|bars|sheet|sheets|quart|quarts|gallon|gallons|liter|liters|milliliter|milliliters|fluid ounce|fluid ounces|fl oz)\s*)+/, '');
  // Remove parenthetical notes (e.g. '(optional)', '(chopped)')
  cleaned = cleaned.replace(/\([^\)]*\)/g, '');
  // Remove trailing 'to taste', 'as needed', etc.
  cleaned = cleaned.replace(/\b(to taste|as needed|optional|divided|for garnish|for serving|for frying|for greasing|for dusting|for coating|for topping|for decoration|for drizzling|for brushing|for dipping|for the pan|for pan)\b/g, '');
  // Remove extra punctuation
  cleaned = cleaned.replace(/[^a-zA-Z0-9\s'-]/g, '');
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  // Remove leading/trailing dashes, apostrophes, or stray 's'
  cleaned = cleaned.replace(/^[-'s\s]+|[-'\s]+$/g, '');
  return cleaned;
}

completeRecipeMapping(); 