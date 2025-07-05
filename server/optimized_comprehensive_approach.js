const { Sequelize } = require('sequelize');
const db = require('./db/database');
const pLimit = require('p-limit').default;
const fs = require('fs');

async function optimizedComprehensiveApproach() {
  console.log('🚀 OPTIMIZED COMPREHENSIVE APPROACH\n');
  
  try {
    // Step 1: Load progress from previous run
    console.log('1️⃣ LOADING PROGRESS & SETUP');
    
    let startFromRecipe = 0;
    let existingStats = { totalIngredients: 0, mappedIngredients: 0, ingredientsWithRealProducts: 0 };
    
    if (fs.existsSync('./progress.json')) {
      const progress = JSON.parse(fs.readFileSync('./progress.json', 'utf8'));
      startFromRecipe = progress.lastProcessedRecipe || 0;
      existingStats = progress.stats || existingStats;
      console.log(`   📍 Resuming from recipe ${startFromRecipe}`);
      console.log(`   📊 Previous stats: ${existingStats.mappedIngredients}/${existingStats.totalIngredients} mapped (${(existingStats.mappedIngredients/existingStats.totalIngredients*100).toFixed(1)}%)`);
    }
    
    // Get all recipes
    const recipes = await db.query(`
      SELECT 
        r.id,
        r.title,
        COUNT(i.id) as ingredient_count
      FROM "Recipes" r
      LEFT JOIN "Ingredients" i ON r.id = i."RecipeId"
      GROUP BY r.id, r.title
      ORDER BY r.id
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`   📖 Processing ALL ${recipes.length} recipes (starting from ${startFromRecipe})`);
    console.log(`   ⏱️  Estimated time: 2-3 minutes with optimizations`);
    console.log(`   📊 Progress updates every 500 recipes\n`);
    
    // Initialize caches
    const realProductCache = {};
    const canonicalMappingCache = {};
    const unmappedIngredients = [];
    
    // Step 2: Process recipes in parallel batches
    const limit = pLimit(20); // Process 20 recipes in parallel
    const batchSize = 500; // Process in batches of 500
    
    let totalIngredients = existingStats.totalIngredients;
    let mappedIngredients = existingStats.mappedIngredients;
    let ingredientsWithRealProducts = existingStats.ingredientsWithRealProducts;
    let newMappingsAdded = 0;
    
    for (let batchStart = startFromRecipe; batchStart < recipes.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, recipes.length);
      const batch = recipes.slice(batchStart, batchEnd);
      
      console.log(`   🔄 Processing batch ${Math.floor(batchStart/batchSize) + 1}: recipes ${batchStart + 1}-${batchEnd}`);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(recipe => limit(() => processRecipe(recipe, realProductCache, canonicalMappingCache, unmappedIngredients)))
      );
      
      // Aggregate batch results
      for (const result of batchResults) {
        totalIngredients += result.totalIngredients;
        mappedIngredients += result.mappedIngredients;
        ingredientsWithRealProducts += result.ingredientsWithRealProducts;
        newMappingsAdded += result.newMappingsAdded;
      }
      
      // Progress update
      console.log(`   📈 Progress: ${batchEnd}/${recipes.length} recipes processed (${(batchEnd/recipes.length*100).toFixed(1)}%)`);
      console.log(`      🎯 Current mapping coverage: ${(mappedIngredients/totalIngredients*100).toFixed(1)}%`);
      console.log(`      🏪 Current real product coverage: ${(ingredientsWithRealProducts/totalIngredients*100).toFixed(1)}%`);
      console.log(`      🔗 New mappings added: ${newMappingsAdded}\n`);
      
      // Save progress
      const progress = {
        lastProcessedRecipe: batchEnd,
        stats: { totalIngredients, mappedIngredients, ingredientsWithRealProducts },
        timestamp: new Date().toISOString()
      };
      fs.writeFileSync('./progress.json', JSON.stringify(progress, null, 2));
    }
    
    // Step 3: Save unmapped ingredients for later analysis
    console.log('3️⃣ SAVING UNMAPPED INGREDIENTS');
    
    const unmappedFrequency = {};
    unmappedIngredients.forEach(item => {
      const key = item.cleanedName.toLowerCase();
      unmappedFrequency[key] = (unmappedFrequency[key] || 0) + 1;
    });
    
    const frequentUnmapped = Object.entries(unmappedFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 100);
    
    fs.writeFileSync('./unmapped_ingredients.json', JSON.stringify({
      total: unmappedIngredients.length,
      frequent: frequentUnmapped,
      all: unmappedIngredients.slice(0, 1000) // Save first 1000 for analysis
    }, null, 2));
    
    console.log(`   💾 Saved ${unmappedIngredients.length} unmapped ingredients to unmapped_ingredients.json`);
    console.log(`   🔍 Top unmapped: ${frequentUnmapped.slice(0, 5).map(([name, count]) => `${name} (${count})`).join(', ')}`);
    
    // Step 4: Final summary
    console.log('\n4️⃣ OPTIMIZED APPROACH SUMMARY');
    console.log(`   ✅ Processed ALL ${recipes.length} recipes`);
    console.log(`   ✅ Added ${newMappingsAdded} intelligent ingredient mappings`);
    console.log(`   ✅ Final mapping coverage: ${(mappedIngredients/totalIngredients*100).toFixed(1)}%`);
    console.log(`   ✅ Final real product coverage: ${(ingredientsWithRealProducts/totalIngredients*100).toFixed(1)}%`);
    console.log(`   ✅ Cached ${Object.keys(realProductCache).length} canonical product checks`);
    console.log(`   ✅ Cached ${Object.keys(canonicalMappingCache).length} canonical mappings`);
    
    console.log('\n   🎯 OPTIMIZATIONS ACHIEVED:');
    console.log('      1. ✅ Parallel processing (20 recipes simultaneously)');
    console.log('      2. ✅ Caching canonical lookups (no repeated DB queries)');
    console.log('      3. ✅ Batch processing (500 recipes per batch)');
    console.log('      4. ✅ Progress persistence (can resume if interrupted)');
    console.log('      5. ✅ Unmapped ingredient logging (for future fixes)');
    
    // Clean up progress file
    if (fs.existsSync('./progress.json')) {
      fs.unlinkSync('./progress.json');
    }

  } catch (error) {
    console.error('❌ Optimized approach failed:', error);
    console.log('   💡 Progress saved - you can resume by running this script again');
  } finally {
    process.exit(0);
  }
}

async function processRecipe(recipe, realProductCache, canonicalMappingCache, unmappedIngredients) {
  const ingredients = await db.query(`
    SELECT i.name, i.quantity
    FROM "Ingredients" i
    WHERE i."RecipeId" = :recipeId
  `, {
    replacements: { recipeId: recipe.id },
    type: Sequelize.QueryTypes.SELECT
  });
  
  let totalIngredients = ingredients.length;
  let mappedIngredients = 0;
  let ingredientsWithRealProducts = 0;
  let newMappingsAdded = 0;
  
  for (const ingredient of ingredients) {
    if (ingredient.name) {
      const mapping = await intelligentIngredientMapping(ingredient.name, canonicalMappingCache);
      
      if (mapping) {
        mappedIngredients++;
        
        // Check cache first, then DB if needed
        if (!(mapping in realProductCache)) {
          const realProducts = await db.query(`
            SELECT COUNT(*) as count
            FROM "Food"
            WHERE "canonicalTag" = :canonicalName
              AND "brandOwner" != 'Generic'
          `, {
            replacements: { canonicalName: mapping },
            type: Sequelize.QueryTypes.SELECT
          });
          
          realProductCache[mapping] = realProducts[0].count;
        }
        
        if (realProductCache[mapping] > 0) {
          ingredientsWithRealProducts++;
        }
      } else {
        // Log unmapped ingredient
        const cleanedName = intelligentCleanIngredient(ingredient.name);
        unmappedIngredients.push({
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          ingredient: ingredient.name,
          cleanedName
        });
      }
    }
  }
  
  return { totalIngredients, mappedIngredients, ingredientsWithRealProducts, newMappingsAdded };
}

async function intelligentIngredientMapping(ingredientName, canonicalMappingCache) {
  const cleanedName = intelligentCleanIngredient(ingredientName);
  
  // Check cache first
  if (canonicalMappingCache[cleanedName]) {
    return canonicalMappingCache[cleanedName];
  }
  
  // Try exact match
  const exactMatch = await findCanonicalMapping(cleanedName);
  if (exactMatch) {
    canonicalMappingCache[cleanedName] = exactMatch;
    return exactMatch;
  }
  
  // Try partial match
  const partialMatch = await findPartialCanonicalMapping(cleanedName);
  if (partialMatch) {
    canonicalMappingCache[cleanedName] = partialMatch;
    return partialMatch;
  }
  
  // Try to create new mapping
  const newMapping = await createNewMapping(cleanedName);
  if (newMapping) {
    canonicalMappingCache[cleanedName] = newMapping;
    return newMapping;
  }
  
  canonicalMappingCache[cleanedName] = null;
  return null;
}

function intelligentCleanIngredient(name) {
  let cleaned = name.toLowerCase();
  
  // Remove measurement terms
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
  
  // Remove preparation terms
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

async function findCanonicalMapping(cleanedName) {
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
  
  return null;
}

async function findPartialCanonicalMapping(cleanedName) {
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

async function createNewMapping(cleanedName) {
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
    } catch (error) {
      return null;
    }
  }
  
  // Add mapping
  try {
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

optimizedComprehensiveApproach(); 