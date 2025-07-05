const db = require('./db/database.js');

// Copy of the cleaning function from foodRoutes.js
function cleanIngredientName(raw) {
  if (!raw) return '';
  let cleaned = raw.toLowerCase();
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  cleaned = cleaned.replace(/optional|such as.*?\(.*?\)/g, '');
  cleaned = cleaned.replace(/(^|\s)(\d+[\/\d]*\s*)/g, ' ');
  cleaned = cleaned.replace(/(?<=\s|^)(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lb|grams?|kilograms?|kg|liters?|l|milliliters?|ml|package|can|container|envelope|slice|loaf|pinch|dash|quart|qt|pint|pt|gallon|gal|stick|clove|head|bunch|sprig|piece|sheet|bag|bottle|jar|box|packet|drop|ear|stalk|strip|cube|block|bar)(?=\s|$)/g, '');
  cleaned = cleaned.replace(/\b(sliced|chopped|fresh|dried|mild|to taste|and)\b/g, '');
  cleaned = cleaned.replace(/\b(leaves?|slices?)\b/g, '');
  cleaned = cleaned.replace(/\b(yellow|white|black)\b/g, '');
  cleaned = cleaned.replace(/,\s*$/, '');
  cleaned = cleaned.replace(/^\s*,\s*/, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.trim();
  return cleaned;
}

async function testProactiveFixes() {
  try {
    await db.authenticate();
    
    console.log('🧪 TESTING PROACTIVE CANONICAL FIXES...\n');
    
    // Test with just 3 recipes
    const recipes = await db.query(`
      SELECT DISTINCT r.id, r.title
      FROM "Recipes" r
      ORDER BY r.id
      LIMIT 3
    `, {
      type: db.QueryTypes.SELECT
    });
    
    console.log(`📋 Found ${recipes.length} recipes to test\n`);
    
    for (const recipe of recipes) {
      console.log(`\n🍳 Processing Recipe ${recipe.id}: "${recipe.title}"`);
      
      // Get ingredients for this recipe
      const ingredients = await db.query(`
        SELECT i.id, i.name, i.quantity
        FROM "Ingredients" i
        WHERE i."RecipeId" = :recipeId
        ORDER BY i.name
        LIMIT 5
      `, {
        replacements: { recipeId: recipe.id },
        type: db.QueryTypes.SELECT
      });
      
      if (ingredients.length === 0) {
        console.log(`  ⚠️  No ingredients found`);
        continue;
      }
      
      console.log(`  📊 Found ${ingredients.length} ingredients`);
      
      for (const ingredient of ingredients) {
        console.log(`\n    🥘 Processing: "${ingredient.name}"`);
        
        // Clean the ingredient name
        const cleanedName = cleanIngredientName(ingredient.name);
        console.log(`      Cleaned: "${cleanedName}"`);
        
        // Get canonical mapping
        const mapping = await db.query(`
          SELECT ci.id, ci.name as canonicalname
          FROM "IngredientToCanonicals" itc
          JOIN "CanonicalIngredients" ci ON itc."CanonicalIngredientId" = ci.id
          WHERE itc."messyName" = :cleanedName
          LIMIT 1
        `, {
          replacements: { cleanedName: cleanedName.toLowerCase() },
          type: db.QueryTypes.SELECT
        });
        
        if (mapping.length === 0) {
          console.log(`      ❌ No canonical mapping found`);
          continue;
        }
        
        const canonicalName = mapping[0].canonicalname;
        console.log(`      ✅ Mapped to: "${canonicalName}"`);
        
        // Check product coverage for this canonical
        const productStats = await db.query(`
          SELECT 
            COUNT(*) as totalproducts,
            COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as realproducts,
            COUNT(CASE WHEN "brandOwner" = 'Generic' THEN 1 END) as genericproducts
          FROM "Food"
          WHERE "canonicalTag" = :canonicalName
        `, {
          replacements: { canonicalName: canonicalName },
          type: db.QueryTypes.SELECT
        });
        
        const stats = productStats[0];
        console.log(`      📊 Products: ${stats.totalproducts} total, ${stats.realproducts} real, ${stats.genericproducts} generic`);
        
        // Check if this canonical needs fixing
        if (stats.totalproducts === 0) {
          console.log(`      🔧 NO PRODUCTS - Would search for real products`);
        } else if (stats.realproducts === 0 && stats.genericproducts > 0) {
          console.log(`      🔧 ONLY GENERIC PRODUCTS - Would search for real products`);
        } else if (stats.realproducts > 0) {
          console.log(`      ✅ Has ${stats.realproducts} real products`);
        } else {
          console.log(`      ⚠️  ${stats.totalproducts} products`);
        }
      }
    }
    
    console.log(`\n🧪 TEST COMPLETE!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testProactiveFixes(); 