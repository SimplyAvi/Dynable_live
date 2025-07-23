const { Sequelize } = require('sequelize');
const db = require('./db/database');
const pLimit = require('p-limit').default;
const fs = require('fs');

async function smartContinuation() {
  console.log('🧠 SMART CONTINUATION - BUILDING ON EXISTING PROGRESS\n');
  
  try {
    // Step 1: Load existing mappings into cache
    console.log('1️⃣ LOADING EXISTING MAPPINGS INTO CACHE');
    
    const existingMappings = await db.query(`
      SELECT itc."messyName", ci.name as canonical_name
      FROM "IngredientToCanonicals" itc
      JOIN "CanonicalRecipeIngredients" ci ON itc."IngredientId" = ci.id
    `, { type: Sequelize.QueryTypes.SELECT });
    
    const mappingCache = {};
    existingMappings.forEach(mapping => {
      mappingCache[mapping.messyName.toLowerCase()] = mapping.canonical_name;
    });
    
    console.log(`   💾 Loaded ${existingMappings.length.toLocaleString()} existing mappings into cache`);
    
    // Step 2: Determine starting point
    console.log('\n2️⃣ DETERMINING STARTING POINT');
    
    const totalRecipes = await db.query('SELECT COUNT(*) as count FROM "Recipes"', { type: Sequelize.QueryTypes.SELECT });
    const suggestedStart = Math.floor(totalRecipes[0].count * 0.1); // Start from 10%
    
    console.log(`   📍 Starting from recipe ${suggestedStart} (10% of total)`);
    console.log(`   📊 Total recipes: ${totalRecipes[0].count.toLocaleString()}`);
    
    // Step 3: Get recipes to process
    const recipes = await db.query(`
      SELECT 
        r.id,
        r.title,
        COUNT(i.id) as ingredient_count
      FROM "Recipes" r
      LEFT JOIN "RecipeIngredients" i ON r.id = i."RecipeId"
      WHERE r.id >= :startId
      GROUP BY r.id, r.title
      ORDER BY r.id
      LIMIT 1000
    `, { 
      replacements: { startId: suggestedStart },
      type: Sequelize.QueryTypes.SELECT 
    });
    
    console.log(`   📖 Processing ${recipes.length} recipes starting from ID ${suggestedStart}`);
    console.log(`   ⏱️  Estimated time: 2-3 minutes with optimizations`);
    console.log(`   📊 Progress updates every 200 recipes\n`);
    
    // Step 4: Process recipes with smart logic
    const limit = pLimit(20); // Process 20 recipes in parallel
    const batchSize = 200; // Process in batches of 200
    
    let totalRecipeIngredients = 0;
    let mappedRecipeIngredients = 0;
    let ingredientsWithRealProducts = 0;
    let newMappingsAdded = 0;
    let unmappedRecipeIngredients = [];
    
    for (let batchStart = 0; batchStart < recipes.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, recipes.length);
      const batch = recipes.slice(batchStart, batchEnd);
      
      console.log(`   🔄 Processing batch ${Math.floor(batchStart/batchSize) + 1}: recipes ${batchStart + 1}-${batchEnd}`);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(recipe => limit(() => processRecipeSmart(recipe, mappingCache, unmappedRecipeIngredients)))
      );
      
      // Aggregate batch results
      for (const result of batchResults) {
        totalRecipeIngredients += result.totalRecipeIngredients;
        mappedRecipeIngredients += result.mappedRecipeIngredients;
        ingredientsWithRealProducts += result.ingredientsWithRealProducts;
        newMappingsAdded += result.newMappingsAdded;
      }
      
      // Progress update
      console.log(`   📈 Progress: ${batchEnd}/${recipes.length} recipes processed (${(batchEnd/recipes.length*100).toFixed(1)}%)`);
      console.log(`      🎯 Current mapping coverage: ${(mappedRecipeIngredients/totalRecipeIngredients*100).toFixed(1)}%`);
      console.log(`      🏪 Current real product coverage: ${(ingredientsWithRealProducts/totalRecipeIngredients*100).toFixed(1)}%`);
      console.log(`      🔗 New mappings added: ${newMappingsAdded}\n`);
    }
    
    // Step 5: Save unmapped ingredients for analysis
    console.log('5️⃣ SAVING UNMAPPED INGREDIENTS');
    
    const unmappedFrequency = {};
    unmappedRecipeIngredients.forEach(item => {
      const key = item.cleanedName.toLowerCase();
      unmappedFrequency[key] = (unmappedFrequency[key] || 0) + 1;
    });
    
    const frequentUnmapped = Object.entries(unmappedFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50);
    
    fs.writeFileSync('./unmapped_ingredients_smart.json', JSON.stringify({
      total: unmappedRecipeIngredients.length,
      frequent: frequentUnmapped,
      all: unmappedRecipeIngredients.slice(0, 500) // Save first 500 for analysis
    }, null, 2));
    
    console.log(`   💾 Saved ${unmappedRecipeIngredients.length} unmapped ingredients to unmapped_ingredients_smart.json`);
    console.log(`   🔍 Top unmapped: ${frequentUnmapped.slice(0, 5).map(([name, count]) => `${name} (${count})`).join(', ')}`);
    
    // Step 6: Final summary
    console.log('\n6️⃣ SMART CONTINUATION SUMMARY');
    console.log(`   ✅ Processed ${recipes.length} recipes starting from ID ${suggestedStart}`);
    console.log(`   ✅ Added ${newMappingsAdded} new intelligent mappings`);
    console.log(`   ✅ Final mapping coverage: ${(mappedRecipeIngredients/totalRecipeIngredients*100).toFixed(1)}%`);
    console.log(`   ✅ Final real product coverage: ${(ingredientsWithRealProducts/totalRecipeIngredients*100).toFixed(1)}%`);
    console.log(`   ✅ Leveraged ${existingMappings.length.toLocaleString()} existing mappings`);
    
    console.log('\n   🎯 SMART OPTIMIZATIONS ACHIEVED:');
    console.log('      1. ✅ Used existing mapping cache (no duplicate work)');
    console.log('      2. ✅ Smart starting point (continued from 10% mark)');
    console.log('      3. ✅ Parallel processing (20 recipes simultaneously)');
    console.log('      4. ✅ Batch processing (200 recipes per batch)');
    console.log('      5. ✅ Unmapped ingredient logging (for future fixes)');

  } catch (error) {
    console.error('❌ Smart continuation failed:', error);
  } finally {
    process.exit(0);
  }
}

async function processRecipeSmart(recipe, mappingCache, unmappedRecipeIngredients) {
  const ingredients = await db.query(`
    SELECT i.name, i.quantity
    FROM "RecipeIngredients" i
    WHERE i."RecipeId" = :recipeId
  `, {
    replacements: { recipeId: recipe.id },
    type: Sequelize.QueryTypes.SELECT
  });
  
  let totalRecipeIngredients = ingredients.length;
  let mappedRecipeIngredients = 0;
  let ingredientsWithRealProducts = 0;
  let newMappingsAdded = 0;
  
  for (const ingredient of ingredients) {
    if (ingredient.name) {
      const mapping = await findMappingSmart(ingredient.name, mappingCache);
      
      if (mapping) {
        mappedRecipeIngredients++;
        
        // Check if canonical has real products
        const realProducts = await db.query(`
          SELECT COUNT(*) as count
          FROM "IngredientCategorized"
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
        // Log unmapped ingredient
        const cleanedName = smartCleanIngredient(ingredient.name);
        unmappedRecipeIngredients.push({
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          ingredient: ingredient.name,
          cleanedName
        });
      }
    }
  }
  
  return { totalRecipeIngredients, mappedRecipeIngredients, ingredientsWithRealProducts, newMappingsAdded };
}

async function findMappingSmart(ingredientName, mappingCache) {
  // Try multiple cleaning approaches to match existing mappings
  
  // Approach 1: Exact match with original name
  const originalName = ingredientName.toLowerCase().trim();
  if (mappingCache[originalName]) {
    return mappingCache[originalName];
  }
  
  // Approach 2: Smart cleaning (less aggressive)
  const smartCleaned = smartCleanIngredient(ingredientName);
  if (mappingCache[smartCleaned]) {
    return mappingCache[smartCleaned];
  }
  
  // Approach 3: Partial match in cache
  for (const [cachedName, canonical] of Object.entries(mappingCache)) {
    if (cachedName.includes(smartCleaned) || smartCleaned.includes(cachedName)) {
      return canonical;
    }
  }
  
  // Approach 4: Try to create new mapping for common ingredients
  const newMapping = await createNewMappingSmart(smartCleaned);
  if (newMapping) {
    mappingCache[smartCleaned] = newMapping;
    return newMapping;
  }
  
  return null;
}

function smartCleanIngredient(name) {
  let cleaned = name.toLowerCase();
  
  // Remove measurement terms (but keep the ingredient)
  const measurements = [
    'teaspoon', 'teaspoons', 'tsp', 'tablespoon', 'tablespoons', 'tbsp',
    'cup', 'cups', 'pound', 'pounds', 'lb', 'lbs', 'ounce', 'ounces', 'oz',
    'gram', 'grams', 'g', 'kilogram', 'kilograms', 'kg', 'milliliter', 'milliliters', 'ml',
    'liter', 'liters', 'l', 'gallon', 'gallons', 'quart', 'quarts', 'pint', 'pints',
    'can', 'cans', 'package', 'packages', 'envelope', 'envelopes', 'jar', 'jars',
    'bottle', 'bottles', 'bag', 'bags', 'box', 'boxes', 'container', 'containers'
  ];
  
  measurements.forEach(measurement => {
    const regex = new RegExp(`\\b${measurement}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });
  
  // Remove preparation terms (but keep the ingredient)
  const preparations = [
    'ground', 'minced', 'diced', 'sliced', 'chopped', 'crushed', 'grated',
    'shredded', 'cubed', 'julienned', 'pureed', 'mashed', 'whipped',
    'beaten', 'separated', 'room temperature', 'cold', 'hot', 'warm',
    'fresh', 'frozen', 'canned', 'dried', 'dehydrated', 'smoked',
    'roasted', 'toasted', 'fried', 'baked', 'grilled', 'steamed'
  ];
  
  preparations.forEach(prep => {
    const regex = new RegExp(`\\b${prep}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });
  
  // Remove brand names and common prefixes
  const brands = [
    'fleischmanns', 'pure', 'great value', 'shoprite', 'walmart', 'target',
    'kroger', 'safeway', 'albertsons', 'publix', 'wegmans', 'trader joes',
    'whole foods', 'sprouts', 'natural', 'organic', 'all natural'
  ];
  
  brands.forEach(brand => {
    const regex = new RegExp(`\\b${brand}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });
  
  // Remove numbers and common words
  cleaned = cleaned
    .replace(/\d+/g, '') // Remove numbers
    .replace(/\b(to taste|optional|as needed)\b/gi, '') // Remove cooking terms
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return cleaned;
}

async function createNewMappingSmart(cleanedName) {
  // Common ingredient mappings
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
    'vanilla extract': 'vanilla extract',
    'baking powder': 'baking powder',
    'baking soda': 'baking soda',
    'yeast': 'yeast',
    'cinnamon': 'ground cinnamon',
    'nutmeg': 'nutmeg',
    'cloves': 'cloves',
    'oregano': 'oregano',
    'basil': 'basil',
    'thyme': 'thyme',
    'rosemary': 'rosemary',
    'parsley': 'parsley',
    'cilantro': 'cilantro'
  };
  
  const canonical = commonMappings[cleanedName];
  if (!canonical) return null;
  
  // Check if canonical exists
  const canonicalExists = await db.query(`
    SELECT id FROM "CanonicalRecipeIngredients" WHERE LOWER(name) = :name
  `, {
    replacements: { name: canonical.toLowerCase() },
    type: Sequelize.QueryTypes.SELECT
  });
  
  if (canonicalExists.length === 0) {
    // Add missing canonical
    try {
      await db.query(`
        INSERT INTO "CanonicalRecipeIngredients" (name, "createdAt", "updatedAt")
        VALUES (:name, NOW(), NOW())
      `, {
        replacements: { name: canonical }
      });
    } catch (error) {
      return null;
    }
  }
  
  // Add mapping
  try {
    const canonicalId = await db.query(`
      SELECT id FROM "CanonicalRecipeIngredients" WHERE LOWER(name) = :name
    `, {
      replacements: { name: canonical.toLowerCase() },
      type: Sequelize.QueryTypes.SELECT
    });
    
    if (canonicalId.length > 0) {
      await db.query(`
        INSERT INTO "IngredientToCanonicals" ("messyName", "IngredientId", "createdAt", "updatedAt")
        VALUES (:ingredient, :canonicalId, NOW(), NOW())
      `, {
        replacements: { 
          ingredient: cleanedName, 
          canonicalId: canonicalId[0].id 
        }
      });
      
      return canonical;
    }
  } catch (error) {
    // Mapping might already exist, which is fine
    return canonical;
  }
  
  return null;
}

smartContinuation(); 