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

async function proactiveCanonicalFixes() {
  try {
    await db.authenticate();
    
    console.log('🚀 PROACTIVE CANONICAL FIXES - PROCESSING RECIPES...\n');
    
    // Get all recipes
    const recipes = await db.query(`
      SELECT DISTINCT r.id, r.title
      FROM "Recipes" r
      ORDER BY r.id
      LIMIT 100
    `, {
      type: db.QueryTypes.SELECT
    });
    
    console.log(`📋 Found ${recipes.length} recipes to process\n`);
    
    let totalRecipesProcessed = 0;
    let totalCanonicalsFixed = 0;
    let totalProductsUpdated = 0;
    
    for (const recipe of recipes) {
      console.log(`\n🍳 Processing Recipe ${recipe.id}: "${recipe.title}"`);
      
      // Get ingredients for this recipe
      const ingredients = await db.query(`
        SELECT i.id, i.name, i.quantity
        FROM "Ingredients" i
        WHERE i."RecipeId" = :recipeId
        ORDER BY i.name
      `, {
        replacements: { recipeId: recipe.id },
        type: db.QueryTypes.SELECT
      });
      
      if (ingredients.length === 0) {
        console.log(`  ⚠️  No ingredients found`);
        continue;
      }
      
      console.log(`  📊 Found ${ingredients.length} ingredients`);
      
      let recipeCanonicalsFixed = 0;
      let recipeProductsUpdated = 0;
      
      for (const ingredient of ingredients) {
        // Clean the ingredient name
        const cleanedName = cleanIngredientName(ingredient.name);
        
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
          console.log(`  ❌ "${ingredient.name}" (${cleanedName}) - No canonical mapping`);
          continue;
        }
        
        const canonicalName = mapping[0].canonicalname;
        
        // Debug: Check if canonicalName is defined
        if (!canonicalName) {
          console.log(`  ❌ "${ingredient.name}" - Canonical name is undefined`);
          continue;
        }
        
        console.log(`  🔍 Checking products for canonical: "${canonicalName}"`);
        
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
        
        // Check if this canonical needs fixing
        if (stats.totalproducts === 0) {
          console.log(`  🔧 "${ingredient.name}" (${canonicalName}) - NO PRODUCTS`);
          const updated = await fixCanonicalWithNoProducts(canonicalName, ingredient.name);
          if (updated > 0) {
            recipeCanonicalsFixed++;
            recipeProductsUpdated += updated;
          }
        } else if (stats.realproducts === 0 && stats.genericproducts > 0) {
          console.log(`  🔧 "${ingredient.name}" (${canonicalName}) - ONLY GENERIC PRODUCTS (${stats.genericproducts})`);
          const updated = await fixCanonicalWithOnlyGenericProducts(canonicalName, ingredient.name);
          if (updated > 0) {
            recipeCanonicalsFixed++;
            recipeProductsUpdated += updated;
          }
        } else if (stats.realproducts > 0) {
          console.log(`  ✅ "${ingredient.name}" (${canonicalName}) - ${stats.realproducts} real products`);
        } else {
          console.log(`  ⚠️  "${ingredient.name}" (${canonicalName}) - ${stats.totalproducts} products`);
        }
      }
      
      if (recipeCanonicalsFixed > 0) {
        console.log(`  🎉 Fixed ${recipeCanonicalsFixed} canonicals, updated ${recipeProductsUpdated} products`);
        totalCanonicalsFixed += recipeCanonicalsFixed;
        totalProductsUpdated += recipeProductsUpdated;
      }
      
      totalRecipesProcessed++;
      
      // Progress update every 10 recipes
      if (totalRecipesProcessed % 10 === 0) {
        console.log(`\n📊 PROGRESS: ${totalRecipesProcessed}/${recipes.length} recipes processed`);
        console.log(`   🎯 Total canonicals fixed: ${totalCanonicalsFixed}`);
        console.log(`   🏪 Total products updated: ${totalProductsUpdated}\n`);
      }
    }
    
    console.log(`\n🎉 PROACTIVE FIXES COMPLETE!`);
    console.log(`  📋 Recipes processed: ${totalRecipesProcessed}`);
    console.log(`  🎯 Canonicals fixed: ${totalCanonicalsFixed}`);
    console.log(`  🏪 Products updated: ${totalProductsUpdated}`);
    console.log(`  📊 Average fixes per recipe: ${(totalCanonicalsFixed / totalRecipesProcessed).toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

async function fixCanonicalWithNoProducts(canonicalName, ingredientName) {
  try {
    console.log(`    🔍 Searching for real products matching "${canonicalName}"...`);
    
    // Search for products that might match this canonical
    const searchPatterns = [
      `%${canonicalName}%`,
      `%${ingredientName}%`,
      `%${canonicalName.replace(/\s+/g, '%')}%`
    ];
    
    let totalUpdated = 0;
    
    for (const pattern of searchPatterns) {
      const products = await db.query(`
        SELECT id, description, "brandOwner", "canonicalTag"
        FROM "Food"
        WHERE "brandOwner" != 'Generic'
          AND LOWER("description") LIKE :pattern
          AND ("canonicalTag" IS NULL OR "canonicalTag" IN ('salt', 'sugar', 'milk', 'flour'))
        LIMIT 10
      `, {
        replacements: { pattern: pattern.toLowerCase() },
        type: db.QueryTypes.SELECT
      });
      
      if (products.length > 0) {
        console.log(`    📦 Found ${products.length} potential products for pattern "${pattern}"`);
        
        for (const product of products) {
          try {
            await db.query(`
              UPDATE "Food"
              SET "canonicalTag" = :canonicalName, "canonicalTagConfidence" = 'suggested'
              WHERE id = :productId
            `, {
              replacements: {
                canonicalName,
                productId: product.id
              }
            });
            
            console.log(`      ✅ Updated: "${product.description}" (${product.brandOwner})`);
            console.log(`         ${product.canonicalTag || 'null'} → ${canonicalName}`);
            totalUpdated++;
            
          } catch (updateError) {
            console.log(`      ❌ Error updating product ${product.id}: ${updateError.message}`);
          }
        }
      }
    }
    
    if (totalUpdated === 0) {
      console.log(`    ⚠️  No suitable real products found for "${canonicalName}"`);
    }
    
    return totalUpdated;
    
  } catch (error) {
    console.log(`    ❌ Error fixing canonical "${canonicalName}": ${error.message}`);
    return 0;
  }
}

async function fixCanonicalWithOnlyGenericProducts(canonicalName, ingredientName) {
  try {
    console.log(`    🔍 Searching for real products to replace generics for "${canonicalName}"...`);
    
    // Search for products that might match this canonical but aren't tagged yet
    const searchPatterns = [
      `%${canonicalName}%`,
      `%${ingredientName}%`,
      `%${canonicalName.replace(/\s+/g, '%')}%`
    ];
    
    let totalUpdated = 0;
    
    for (const pattern of searchPatterns) {
      const products = await db.query(`
        SELECT id, description, "brandOwner", "canonicalTag"
        FROM "Food"
        WHERE "brandOwner" != 'Generic'
          AND LOWER("description") LIKE :pattern
          AND ("canonicalTag" IS NULL OR "canonicalTag" IN ('salt', 'sugar', 'milk', 'flour'))
        LIMIT 15
      `, {
        replacements: { pattern: pattern.toLowerCase() },
        type: db.QueryTypes.SELECT
      });
      
      if (products.length > 0) {
        console.log(`    📦 Found ${products.length} potential real products for pattern "${pattern}"`);
        
        for (const product of products) {
          try {
            await db.query(`
              UPDATE "Food"
              SET "canonicalTag" = :canonicalName, "canonicalTagConfidence" = 'suggested'
              WHERE id = :productId
            `, {
              replacements: {
                canonicalName,
                productId: product.id
              }
            });
            
            console.log(`      ✅ Updated: "${product.description}" (${product.brandOwner})`);
            console.log(`         ${product.canonicalTag || 'null'} → ${canonicalName}`);
            totalUpdated++;
            
          } catch (updateError) {
            console.log(`      ❌ Error updating product ${product.id}: ${updateError.message}`);
          }
        }
      }
    }
    
    if (totalUpdated === 0) {
      console.log(`    ⚠️  No additional real products found for "${canonicalName}"`);
    }
    
    return totalUpdated;
    
  } catch (error) {
    console.log(`    ❌ Error fixing canonical "${canonicalName}": ${error.message}`);
    return 0;
  }
}

proactiveCanonicalFixes(); 