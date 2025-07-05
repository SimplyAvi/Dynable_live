const db = require('./db/database.js');

async function improveFinalCoverage() {
  try {
    await db.authenticate();
    const CanonicalIngredient = require('./db/models/CanonicalIngredient.js');
    const IngredientToCanonical = require('./db/models/IngredientToCanonical.js');
    const Food = require('./db/models/Food.js');
    const Recipe = require('./db/models/Recipe/Recipe.js');
    const Ingredient = require('./db/models/Recipe/Ingredient.js');
    
    console.log('🚀 Final coverage improvement...\n');
    
    // Get all recipe ingredients
    const recipes = await Recipe.findAll({
      include: [{
        model: Ingredient,
        as: 'Ingredients'
      }]
    });
    
    console.log(`📋 Processing ${recipes.length} recipes...`);
    
    let totalIngredients = 0;
    let unmappedIngredients = new Set();
    let mappedButNoProducts = new Set();
    
    // Collect all unmapped ingredients
    for (const recipe of recipes) {
      for (const ingredient of recipe.Ingredients) {
        totalIngredients++;
        
        // Clean the ingredient name
        const cleanedName = cleanIngredientName(ingredient.name);
        
        // Check if mapping exists
        const mapping = await IngredientToCanonical.findOne({
          where: { messyName: cleanedName }
        });
        
        if (!mapping) {
          unmappedIngredients.add(cleanedName);
        } else {
          // Get the canonical ingredient
          const canonical = await CanonicalIngredient.findByPk(mapping.CanonicalIngredientId);
          
          if (canonical) {
            // Check if canonical has products
            const productCount = await Food.count({
              where: { canonicalTag: canonical.name }
            });
            
            if (productCount === 0) {
              mappedButNoProducts.add(canonical.name);
            }
          }
        }
      }
    }
    
    console.log(`📊 Analysis complete:`);
    console.log(`  Total ingredients: ${totalIngredients}`);
    console.log(`  Unmapped ingredients: ${unmappedIngredients.size}`);
    console.log(`  Mapped but no products: ${mappedButNoProducts.size}`);
    
    // Add missing canonical ingredients and mappings
    console.log('\n🔧 Adding missing canonical ingredients and mappings...');
    let newCanonicals = 0;
    let newMappings = 0;
    
    for (const ingredientName of unmappedIngredients) {
      // Skip overly long names
      if (ingredientName.length > 100) {
        console.log(`  ⚠️  Skipping overly long ingredient: "${ingredientName}"`);
        continue;
      }
      
      // Create canonical ingredient
      let canonical = await CanonicalIngredient.findOne({
        where: { name: ingredientName }
      });
      
      if (!canonical) {
        canonical = await CanonicalIngredient.create({ name: ingredientName });
        newCanonicals++;
        console.log(`  ✅ Created canonical: "${ingredientName}"`);
      }
      
      // Create mapping
      const existingMapping = await IngredientToCanonical.findOne({
        where: { 
          messyName: ingredientName,
          CanonicalIngredientId: canonical.id
        }
      });
      
      if (!existingMapping) {
        await IngredientToCanonical.create({
          messyName: ingredientName,
          CanonicalIngredientId: canonical.id
        });
        newMappings++;
      }
    }
    
    // Add generic products for canonicals without products
    console.log('\n🛍️  Adding generic products for canonicals without products...');
    let newProducts = 0;
    
    for (const canonicalName of mappedButNoProducts) {
      // Check if generic product already exists
      const existingProduct = await Food.findOne({
        where: { 
          canonicalTag: canonicalName,
          brandOwner: 'Generic'
        }
      });
      
      if (!existingProduct) {
        await Food.create({
          name: `Pure ${canonicalName}`,
          canonicalTag: canonicalName,
          canonicalTagConfidence: 'suggested',
          brandOwner: 'Generic',
          brandName: 'Generic',
          ingredients: canonicalName,
          isPureIngredient: true
        });
        newProducts++;
        console.log(`  ✅ Added generic product for: "${canonicalName}"`);
      }
    }
    
    console.log('\n🎉 Final coverage improvement complete!');
    console.log(`  New canonical ingredients: ${newCanonicals}`);
    console.log(`  New mappings: ${newMappings}`);
    console.log(`  New generic products: ${newProducts}`);
    
    // Final statistics
    console.log('\n📊 Final Statistics:');
    const finalStats = await db.query(`
      SELECT 
        COUNT(DISTINCT r.id) as total_recipes,
        COUNT(DISTINCT i.id) as total_ingredients,
        COUNT(DISTINCT CASE WHEN itc.id IS NOT NULL THEN i.id END) as mapped_ingredients,
        COUNT(DISTINCT CASE WHEN f.id IS NOT NULL THEN i.id END) as ingredients_with_products
      FROM "Recipes" r
      JOIN "Ingredients" i ON r.id = i."RecipeId"
      LEFT JOIN "IngredientToCanonicals" itc ON LOWER(TRIM(REGEXP_REPLACE(i.name, '[^a-zA-Z\\s]', '', 'g'))) = itc."messyName"
      LEFT JOIN "CanonicalIngredients" ci ON itc."CanonicalIngredientId" = ci.id
      LEFT JOIN "Foods" f ON ci.name = f."canonicalTag"
    `, { type: db.QueryTypes.SELECT });
    
    const stats = finalStats[0];
    const mappingCoverage = ((stats.mapped_ingredients / stats.total_ingredients) * 100).toFixed(1);
    const productCoverage = ((stats.ingredients_with_products / stats.total_ingredients) * 100).toFixed(1);
    
    console.log(`  Total recipes: ${stats.total_recipes}`);
    console.log(`  Total ingredients: ${stats.total_ingredients}`);
    console.log(`  Mapped ingredients: ${stats.mapped_ingredients} (${mappingCoverage}%)`);
    console.log(`  Ingredients with products: ${stats.ingredients_with_products} (${productCoverage}%)`);
    
  } catch (error) {
    console.error('❌ Error during final coverage improvement:', error);
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

improveFinalCoverage(); 