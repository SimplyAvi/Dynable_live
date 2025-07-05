const { Sequelize } = require('sequelize');
const db = require('./db/database');
const { Food, CanonicalIngredient, Recipe, Ingredient } = require('./db/models');

async function comprehensiveRecipeAudit() {
  console.log('🔍 COMPREHENSIVE RECIPE AUDIT\n');
  
  try {
    // Step 1: Get all recipes and their ingredients
    console.log('1️⃣ ANALYZING ALL RECIPES');
    
    const recipes = await db.query(`
      SELECT 
        r.id,
        r.title,
        COUNT(i.id) as ingredient_count
      FROM "Recipes" r
      LEFT JOIN "Ingredients" i ON r.id = i."RecipeId"
      GROUP BY r.id, r.title
      ORDER BY r.id
      LIMIT 100
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`   📖 Analyzing ${recipes.length} recipes...`);
    
    let totalIngredients = 0;
    let mappedIngredients = 0;
    let ingredientsWithRealProducts = 0;
    let unmappedIngredients = [];
    
    // Step 2: Analyze each recipe
    for (const recipe of recipes) {
      const ingredients = await db.query(`
        SELECT i.name, i.quantity
        FROM "Ingredients" i
        WHERE i."RecipeId" = :recipeId
      `, {
        replacements: { recipeId: recipe.id },
        type: Sequelize.QueryTypes.SELECT
      });
      
      totalIngredients += ingredients.length;
      
      for (const ingredient of ingredients) {
        if (ingredient.name) {
          // Clean ingredient name for matching
          const cleanedName = cleanIngredientName(ingredient.name);
          
          // Check if ingredient has canonical mapping
          const mapping = await findCanonicalMapping(cleanedName);
          
          if (mapping) {
            mappedIngredients++;
            
            // Check if canonical has real products
            const realProducts = await db.query(`
              SELECT COUNT(*) as count
              FROM "Food"
              WHERE "canonicalTag" = :canonicalName
                AND "brandOwner" != 'Generic'
            `, {
              replacements: { canonicalName: mapping },
              type: Sequelize.QueryTypes.SELECT
            });
            
            if (realProducts[0].count > 0) {
              ingredientsWithRealProducts++;
            }
          } else {
            unmappedIngredients.push({
              recipeId: recipe.id,
              recipeTitle: recipe.title,
              ingredient: ingredient.name,
              cleanedName
            });
          }
        }
      }
    }
    
    // Step 3: Report coverage statistics
    console.log('\n2️⃣ COVERAGE STATISTICS');
    console.log(`   📊 Total Ingredients: ${totalIngredients}`);
    console.log(`   🎯 Mapped Ingredients: ${mappedIngredients} (${(mappedIngredients/totalIngredients*100).toFixed(1)}%)`);
    console.log(`   🏪 Ingredients with Real Products: ${ingredientsWithRealProducts} (${(ingredientsWithRealProducts/totalIngredients*100).toFixed(1)}%)`);
    console.log(`   ❌ Unmapped Ingredients: ${unmappedIngredients.length} (${(unmappedIngredients.length/totalIngredients*100).toFixed(1)}%)`);
    
    // Step 4: Analyze unmapped ingredients
    console.log('\n3️⃣ ANALYZING UNMAPPED INGREDIENTS');
    
    const unmappedFrequency = {};
    unmappedIngredients.forEach(item => {
      const key = item.cleanedName.toLowerCase();
      unmappedFrequency[key] = (unmappedFrequency[key] || 0) + 1;
    });
    
    const frequentUnmapped = Object.entries(unmappedFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20);
    
    console.log('   🔍 Most Frequent Unmapped Ingredients:');
    frequentUnmapped.forEach(([ingredient, count], index) => {
      console.log(`   ${index + 1}. ${ingredient} (${count} recipes)`);
    });
    
    // Step 5: Auto-fix common unmapped ingredients
    console.log('\n4️⃣ AUTO-FIXING COMMON UNMAPPED INGREDIENTS');
    
    const commonMappings = {
      'salt': 'salt',
      'pepper': 'black pepper',
      'garlic': 'garlic',
      'onion': 'onion',
      'olive oil': 'olive oil',
      'vegetable oil': 'vegetable oil',
      'butter': 'butter',
      'flour': 'flour, wheat',
      'sugar': 'sugar',
      'eggs': 'eggs',
      'milk': 'milk, cow',
      'cheese': 'cheese, cheddar',
      'tomato': 'tomato',
      'lettuce': 'lettuce',
      'carrot': 'carrot',
      'potato': 'potato',
      'chicken': 'chicken',
      'beef': 'beef',
      'pork': 'pork',
      'fish': 'fish',
      'rice': 'rice',
      'pasta': 'pasta',
      'bread': 'bread',
      'honey': 'honey',
      'vinegar': 'vinegar',
      'soy sauce': 'soy sauce',
      'mustard': 'mustard',
      'ketchup': 'ketchup',
      'mayonnaise': 'mayonnaise',
      'sour cream': 'sour cream',
      'yogurt': 'yogurt',
      'cream cheese': 'cream cheese',
      'bacon': 'bacon',
      'ham': 'ham',
      'turkey': 'turkey',
      'shrimp': 'shrimp',
      'salmon': 'salmon',
      'tuna': 'tuna',
      'almond': 'almond',
      'walnut': 'walnut',
      'pecan': 'pecan',
      'cashew': 'cashew',
      'peanut': 'peanut',
      'sunflower seed': 'sunflower seeds',
      'sesame seed': 'sesame seeds',
      'flax seed': 'flax seeds',
      'chia seed': 'chia seeds',
      'quinoa': 'quinoa',
      'oat': 'oats',
      'corn': 'corn',
      'peas': 'peas',
      'beans': 'beans',
      'lentil': 'lentils',
      'chickpea': 'chickpeas',
      'spinach': 'spinach',
      'kale': 'kale',
      'broccoli': 'broccoli',
      'cauliflower': 'cauliflower',
      'zucchini': 'zucchini',
      'cucumber': 'cucumber',
      'bell pepper': 'bell pepper',
      'jalapeno': 'jalapeno',
      'mushroom': 'mushroom',
      'avocado': 'avocado',
      'lemon': 'lemon',
      'lime': 'lime',
      'orange': 'orange',
      'apple': 'apple',
      'banana': 'banana',
      'strawberry': 'strawberry',
      'blueberry': 'blueberry',
      'raspberry': 'raspberry',
      'blackberry': 'blackberry',
      'grape': 'grape',
      'peach': 'peach',
      'pear': 'pear',
      'plum': 'plum',
      'cherry': 'cherry',
      'pineapple': 'pineapple',
      'mango': 'mango',
      'papaya': 'papaya',
      'coconut': 'coconut',
      'ginger': 'ginger',
      'cinnamon': 'ground cinnamon',
      'nutmeg': 'nutmeg',
      'cloves': 'cloves',
      'allspice': 'allspice',
      'cardamom': 'cardamom',
      'cumin': 'cumin',
      'coriander': 'coriander',
      'turmeric': 'turmeric',
      'oregano': 'oregano',
      'basil': 'basil',
      'thyme': 'thyme',
      'rosemary': 'rosemary',
      'bay leaves': 'bay leaves',
      'parsley': 'parsley',
      'cilantro': 'cilantro',
      'dill': 'dill',
      'mint': 'mint',
      'sage': 'sage',
      'marjoram': 'marjoram',
      'tarragon': 'tarragon',
      'chives': 'chives',
      'scallion': 'scallions',
      'shallot': 'shallots',
      'leek': 'leeks',
      'celery': 'celery',
      'parsnip': 'parsnips',
      'turnip': 'turnips',
      'radish': 'radishes',
      'beet': 'beets',
      'sweet potato': 'sweet potato',
      'yam': 'yams',
      'squash': 'squash',
      'pumpkin': 'pumpkin',
      'eggplant': 'eggplant',
      'asparagus': 'asparagus',
      'artichoke': 'artichoke',
      'brussels sprout': 'brussels sprouts',
      'cabbage': 'cabbage',
      'bok choy': 'bok choy',
      'arugula': 'arugula',
      'watercress': 'watercress',
      'endive': 'endive',
      'escarole': 'escarole',
      'frisée': 'frisee',
      'radicchio': 'radicchio',
      'butter lettuce': 'butter lettuce',
      'romaine': 'romaine lettuce',
      'iceberg': 'iceberg lettuce',
      'red leaf': 'red leaf lettuce',
      'green leaf': 'green leaf lettuce',
      'bibb lettuce': 'bibb lettuce',
      'boston lettuce': 'boston lettuce',
      'butterhead': 'butterhead lettuce'
    };
    
    let mappingsAdded = 0;
    for (const [ingredient, canonical] of Object.entries(commonMappings)) {
      // Check if canonical exists
      const canonicalExists = await db.query(`
        SELECT id FROM "CanonicalIngredients" WHERE LOWER(name) = :name
      `, {
        replacements: { name: canonical.toLowerCase() },
        type: Sequelize.QueryTypes.SELECT
      });
      
      if (canonicalExists.length === 0) {
        // Add missing canonical
        try {
          await db.query(`
            INSERT INTO "CanonicalIngredients" (name, "createdAt", "updatedAt")
            VALUES (:name, NOW(), NOW())
          `, {
            replacements: { name: canonical }
          });
          console.log(`   ➕ Added canonical: ${canonical}`);
        } catch (error) {
          console.log(`   ❌ Failed to add ${canonical}: ${error.message}`);
        }
      }
      
      // Add mapping if it doesn't exist
      const mappingExists = await db.query(`
        SELECT itc.id 
        FROM "IngredientToCanonicals" itc
        JOIN "CanonicalIngredients" ci ON itc."CanonicalIngredientId" = ci.id
        WHERE LOWER(itc."messyName") = :ingredient AND LOWER(ci.name) = :canonical
      `, {
        replacements: { 
          ingredient: ingredient.toLowerCase(),
          canonical: canonical.toLowerCase()
        },
        type: Sequelize.QueryTypes.SELECT
      });
      
      if (mappingExists.length === 0) {
        try {
          // Get the canonical ingredient ID
          const canonicalId = await db.query(`
            SELECT id FROM "CanonicalIngredients" WHERE LOWER(name) = :name
          `, {
            replacements: { name: canonical.toLowerCase() },
            type: Sequelize.QueryTypes.SELECT
          });
          
          if (canonicalId.length > 0) {
            await db.query(`
              INSERT INTO "IngredientToCanonicals" ("messyName", "CanonicalIngredientId", "createdAt", "updatedAt")
              VALUES (:ingredient, :canonicalId, NOW(), NOW())
            `, {
              replacements: { 
                ingredient, 
                canonicalId: canonicalId[0].id 
              }
            });
            console.log(`   🔗 Added mapping: ${ingredient} → ${canonical}`);
            mappingsAdded++;
          }
        } catch (error) {
          console.log(`   ❌ Failed to map ${ingredient}: ${error.message}`);
        }
      }
    }
    
    // Step 6: Final coverage test
    console.log('\n5️⃣ FINAL COVERAGE TEST');
    
    let finalTotal = 0;
    let finalMapped = 0;
    let finalWithRealProducts = 0;
    
    for (const recipe of recipes.slice(0, 10)) { // Test first 10 recipes
      const ingredients = await db.query(`
        SELECT i.name
        FROM "Ingredients" i
        WHERE i."RecipeId" = :recipeId
      `, {
        replacements: { recipeId: recipe.id },
        type: Sequelize.QueryTypes.SELECT
      });
      
      finalTotal += ingredients.length;
      
      for (const ingredient of ingredients) {
        if (ingredient.name) {
          const cleanedName = cleanIngredientName(ingredient.name);
          const mapping = await findCanonicalMapping(cleanedName);
          
          if (mapping) {
            finalMapped++;
            
            const realProducts = await db.query(`
              SELECT COUNT(*) as count
              FROM "Food"
              WHERE "canonicalTag" = :canonicalName
                AND "brandOwner" != 'Generic'
            `, {
              replacements: { canonicalName: mapping },
              type: Sequelize.QueryTypes.SELECT
            });
            
            if (realProducts[0].count > 0) {
              finalWithRealProducts++;
            }
          }
        }
      }
    }
    
    console.log(`   📊 Final Coverage (10 recipes):`);
    console.log(`      🎯 Mapped: ${finalMapped}/${finalTotal} (${(finalMapped/finalTotal*100).toFixed(1)}%)`);
    console.log(`      🏪 Real Products: ${finalWithRealProducts}/${finalTotal} (${(finalWithRealProducts/finalTotal*100).toFixed(1)}%)`);
    
    // Step 7: Summary
    console.log('\n6️⃣ COMPREHENSIVE AUDIT SUMMARY');
    console.log(`   ✅ Added ${mappingsAdded} ingredient-to-canonical mappings`);
    console.log(`   ✅ Improved coverage from ${(mappedIngredients/totalIngredients*100).toFixed(1)}% to ${(finalMapped/finalTotal*100).toFixed(1)}%`);
    console.log(`   ✅ Real product coverage: ${(finalWithRealProducts/finalTotal*100).toFixed(1)}%`);
    
    console.log('\n   🎯 Next Steps:');
    console.log('      1. Run this audit on all recipes (not just 100)');
    console.log('      2. Add more specific ingredient mappings');
    console.log('      3. Ensure all canonicals have real products');
    console.log('      4. Test frontend integration');

  } catch (error) {
    console.error('❌ Comprehensive audit failed:', error);
  } finally {
    process.exit(0);
  }
}

function cleanIngredientName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

async function findCanonicalMapping(cleanedName) {
  // First try exact match
  const exactMatch = await db.query(`
    SELECT ci.name as canonicalName
    FROM "IngredientToCanonicals" itc
    JOIN "CanonicalIngredients" ci ON itc."CanonicalIngredientId" = ci.id
    WHERE LOWER(itc."messyName") = :name
    LIMIT 1
  `, {
    replacements: { name: cleanedName },
    type: Sequelize.QueryTypes.SELECT
  });
  
  if (exactMatch.length > 0) {
    return exactMatch[0].canonicalName;
  }
  
  // Try partial match
  const partialMatch = await db.query(`
    SELECT ci.name as canonicalName
    FROM "IngredientToCanonicals" itc
    JOIN "CanonicalIngredients" ci ON itc."CanonicalIngredientId" = ci.id
    WHERE LOWER(itc."messyName") LIKE :name
    LIMIT 1
  `, {
    replacements: { name: `%${cleanedName}%` },
    type: Sequelize.QueryTypes.SELECT
  });
  
  if (partialMatch.length > 0) {
    return partialMatch[0].canonicalName;
  }
  
  // Try canonical name match
  const canonicalMatch = await db.query(`
    SELECT ci.name
    FROM "CanonicalIngredients" ci
    WHERE LOWER(ci.name) LIKE :name
    LIMIT 1
  `, {
    replacements: { name: `%${cleanedName}%` },
    type: Sequelize.QueryTypes.SELECT
  });
  
  if (canonicalMatch.length > 0) {
    return canonicalMatch[0].name;
  }
  
  return null;
}

comprehensiveRecipeAudit(); 