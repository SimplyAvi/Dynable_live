const { Sequelize } = require('sequelize');
const db = require('../../db/database');

// Invalid canonical ingredients to clean up
const INVALID_CANONICALS = {
  // Completely invalid - DELETE immediately
  deleteImmediately: ['pie', 'up', 'ounces'],
  
  // Preparation methods - need to remap aliases first
  preparationMethods: ['chopped', 'diced', 'drained', 'melted', 'quartered', 'sliced'],
  
  // Complex cases - need special handling
  complexCases: ['ice'] // Split into 'ice cream' and 'ice cubes'
};

// Common ingredient mappings for preparation methods
const INGREDIENT_MAPPINGS = {
  // Common ingredients that appear in preparation method aliases
  'onion': ['onions', 'onion'],
  'tomato': ['tomatoes', 'tomato'],
  'garlic': ['garlic'],
  'parsley': ['parsley'],
  'basil': ['basil'],
  'cilantro': ['cilantro', 'coriander'],
  'walnut': ['walnuts', 'walnut'],
  'almond': ['almonds', 'almond'],
  'pecan': ['pecans', 'pecan'],
  'hazelnut': ['hazelnuts', 'hazelnut'],
  'pistachio': ['pistachios', 'pistachio'],
  'date': ['dates', 'date'],
  'apricot': ['apricots', 'apricot'],
  'celery': ['celery'],
  'shallot': ['shallots', 'shallot'],
  'chive': ['chives', 'chive'],
  'thyme': ['thyme'],
  'oregano': ['oregano'],
  'rosemary': ['rosemary'],
  'sage': ['sage'],
  'mint': ['mint'],
  'dill': ['dill'],
  'tarragon': ['tarragon'],
  'bay': ['bay leaf', 'bay leaves'],
  'nutmeg': ['nutmeg'],
  'cinnamon': ['cinnamon'],
  'ginger': ['ginger'],
  'turmeric': ['turmeric'],
  'paprika': ['paprika'],
  'cayenne': ['cayenne'],
  'black pepper': ['black pepper', 'pepper'],
  'salt': ['salt'],
  'sugar': ['sugar'],
  'flour': ['flour'],
  'butter': ['butter'],
  'oil': ['oil', 'olive oil'],
  'vinegar': ['vinegar'],
  'lemon': ['lemon', 'lemons'],
  'lime': ['lime', 'limes'],
  'orange': ['orange', 'oranges'],
  'apple': ['apple', 'apples'],
  'banana': ['banana', 'bananas'],
  'strawberry': ['strawberry', 'strawberries'],
  'blueberry': ['blueberry', 'blueberries'],
  'raspberry': ['raspberry', 'raspberries'],
  'carrot': ['carrot', 'carrots'],
  'potato': ['potato', 'potatoes'],
  'sweet potato': ['sweet potato', 'sweet potatoes'],
  'spinach': ['spinach'],
  'kale': ['kale'],
  'lettuce': ['lettuce'],
  'cucumber': ['cucumber', 'cucumbers'],
  'bell pepper': ['bell pepper', 'bell peppers'],
  'jalapeño': ['jalapeño', 'jalapeños'],
  'mushroom': ['mushroom', 'mushrooms'],
  'eggplant': ['eggplant', 'aubergine'],
  'zucchini': ['zucchini', 'courgette'],
  'squash': ['squash'],
  'pumpkin': ['pumpkin'],
  'corn': ['corn'],
  'peas': ['peas'],
  'green bean': ['green bean', 'green beans'],
  'asparagus': ['asparagus'],
  'broccoli': ['broccoli'],
  'cauliflower': ['cauliflower'],
  'brussels sprout': ['brussels sprout', 'brussels sprouts'],
  'cabbage': ['cabbage'],
  'radish': ['radish', 'radishes'],
  'beet': ['beet', 'beets'],
  'turnip': ['turnip', 'turnips'],
  'rutabaga': ['rutabaga'],
  'parsnip': ['parsnip', 'parsnips'],
  'leek': ['leek', 'leeks'],
  'scallion': ['scallion', 'scallions', 'green onion'],
  'chicken': ['chicken'],
  'beef': ['beef'],
  'pork': ['pork'],
  'lamb': ['lamb'],
  'turkey': ['turkey'],
  'duck': ['duck'],
  'fish': ['fish'],
  'salmon': ['salmon'],
  'tuna': ['tuna'],
  'shrimp': ['shrimp'],
  'crab': ['crab'],
  'lobster': ['lobster'],
  'clam': ['clam', 'clams'],
  'mussel': ['mussel', 'mussels'],
  'oyster': ['oyster', 'oysters'],
  'scallop': ['scallop', 'scallops'],
  'milk': ['milk'],
  'cream': ['cream'],
  'yogurt': ['yogurt'],
  'cheese': ['cheese'],
  'egg': ['egg', 'eggs'],
  'rice': ['rice'],
  'pasta': ['pasta'],
  'bread': ['bread'],
  'tortilla': ['tortilla', 'tortillas'],
  'bean': ['bean', 'beans'],
  'lentil': ['lentil', 'lentils'],
  'chickpea': ['chickpea', 'chickpeas'],
  'quinoa': ['quinoa'],
  'oat': ['oat', 'oats'],
  'barley': ['barley'],
  'wheat': ['wheat'],
  'cornmeal': ['cornmeal'],
  'polenta': ['polenta'],
  'couscous': ['couscous'],
  'bulgur': ['bulgur'],
  'farro': ['farro'],
  'freekeh': ['freekeh'],
  'millet': ['millet'],
  'sorghum': ['sorghum'],
  'teff': ['teff'],
  'amaranth': ['amaranth'],
  'buckwheat': ['buckwheat'],
  'spelt': ['spelt'],
  'kamut': ['kamut'],
  'emmer': ['emmer'],
  'einkorn': ['einkorn'],
  'triticale': ['triticale'],
  'rye': ['rye'],
  'sorghum': ['sorghum'],
  'millet': ['millet'],
  'teff': ['teff'],
  'amaranth': ['amaranth'],
  'buckwheat': ['buckwheat'],
  'spelt': ['spelt'],
  'kamut': ['kamut'],
  'emmer': ['emmer'],
  'einkorn': ['einkorn'],
  'triticale': ['triticale'],
  'rye': ['rye']
};

async function cleanupInvalidCanonicals() {
  console.log('🧹 CLEANING UP INVALID CANONICAL INGREDIENTS\n');
  
  try {
    // Step 1: Delete completely invalid canonical ingredients
    console.log('1️⃣ DELETING COMPLETELY INVALID CANONICALS...');
    const deleteResult = await db.query(
      'DELETE FROM "Ingredients" WHERE name IN (:names)',
      {
        replacements: { names: INVALID_CANONICALS.deleteImmediately },
        type: Sequelize.QueryTypes.DELETE
      }
    );
    console.log(`✅ Deleted ${deleteResult[1]} completely invalid canonical ingredients\n`);

    // Step 2: Handle preparation methods - remap aliases first
    console.log('2️⃣ HANDLING PREPARATION METHODS...');
    
    for (const prepMethod of INVALID_CANONICALS.preparationMethods) {
      console.log(`\n📋 Processing "${prepMethod}"...`);
      
      // Get all IngredientToCanonicals mappings for this preparation method
      const mappings = await db.query(
        'SELECT id, "messyName", "CanonicalIngredientId" FROM "IngredientToCanonicals" WHERE "CanonicalIngredientId" IN (SELECT id FROM "Ingredients" WHERE name = :prepMethod)',
        {
          replacements: { prepMethod },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      console.log(`Found ${mappings.length} mappings for "${prepMethod}"`);
      
      let remappedCount = 0;
      let deletedCount = 0;
      
      for (const mapping of mappings) {
        const messyName = mapping.messyName.toLowerCase();
        
        // Try to extract the actual ingredient from the messy name
        const actualIngredient = extractActualIngredient(messyName, prepMethod);
        
        if (actualIngredient) {
          // Find the correct canonical ingredient
          const correctCanonical = await findCorrectCanonical(actualIngredient);
          
          if (correctCanonical) {
            // Update the mapping to point to the correct canonical
            await db.query(
              'UPDATE "IngredientToCanonicals" SET "CanonicalIngredientId" = :newCanonicalId WHERE id = :mappingId',
              {
                replacements: { 
                  newCanonicalId: correctCanonical.id, 
                  mappingId: mapping.id 
                },
                type: Sequelize.QueryTypes.UPDATE
              }
            );
            remappedCount++;
            console.log(`  ✅ "${messyName}" → "${correctCanonical.name}"`);
          } else {
            // Delete mapping if we can't find a proper canonical
            await db.query(
              'DELETE FROM "IngredientToCanonicals" WHERE id = :mappingId',
              {
                replacements: { mappingId: mapping.id },
                type: Sequelize.QueryTypes.DELETE
              }
            );
            deletedCount++;
            console.log(`  ❌ "${messyName}" → DELETED (no proper canonical found)`);
          }
        } else {
          // Delete mapping if we can't extract ingredient
          await db.query(
            'DELETE FROM "IngredientToCanonicals" WHERE id = :mappingId',
            {
              replacements: { mappingId: mapping.id },
              type: Sequelize.QueryTypes.DELETE
            }
          );
          deletedCount++;
          console.log(`  ❌ "${messyName}" → DELETED (could not extract ingredient)`);
        }
      }
      
      console.log(`  📊 Remapped: ${remappedCount}, Deleted: ${deletedCount}`);
      
      // Now delete the preparation method canonical
      await db.query(
        'DELETE FROM "Ingredients" WHERE name = :prepMethod',
        {
          replacements: { prepMethod },
          type: Sequelize.QueryTypes.DELETE
        }
      );
      console.log(`  🗑️ Deleted "${prepMethod}" canonical ingredient`);
    }

    // Step 3: Handle complex cases (ice)
    console.log('\n3️⃣ HANDLING COMPLEX CASES...');
    
    if (INVALID_CANONICALS.complexCases.includes('ice')) {
      await handleIceCase();
    }

    // Step 4: Summary
    console.log('\n📊 CLEANUP SUMMARY:');
    console.log('✅ Deleted completely invalid canonicals');
    console.log('✅ Remapped preparation method aliases');
    console.log('✅ Handled complex cases');
    console.log('✅ Ready to run suggestProductCanonicalTags.js');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await db.close();
  }
}

function extractActualIngredient(messyName, prepMethod) {
  // Remove the preparation method from the messy name
  const cleanedName = messyName.replace(new RegExp(`\\b${prepMethod}\\b`, 'gi'), '').trim();
  
  // Remove common words that aren't ingredients
  const commonWords = ['and', 'or', 'with', 'for', 'the', 'a', 'an', 'of', 'in', 'on', 'to', 'from', 'by', 'at'];
  const words = cleanedName.split(' ').filter(word => 
    word.length > 0 && !commonWords.includes(word.toLowerCase())
  );
  
  return words.join(' ');
}

async function findCorrectCanonical(ingredientName) {
  // First, try exact match
  let canonical = await db.query(
    'SELECT id, name FROM "Ingredients" WHERE LOWER(name) = LOWER(:name)',
    {
      replacements: { name: ingredientName },
      type: Sequelize.QueryTypes.SELECT
    }
  );
  
  if (canonical.length > 0) {
    return canonical[0];
  }
  
  // Try singular/plural variations
  const variations = getIngredientVariations(ingredientName);
  for (const variation of variations) {
    canonical = await db.query(
      'SELECT id, name FROM "Ingredients" WHERE LOWER(name) = LOWER(:name)',
      {
        replacements: { name: variation },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (canonical.length > 0) {
      return canonical[0];
    }
  }
  
  // Try to find in our mapping dictionary
  for (const [canonicalName, aliases] of Object.entries(INGREDIENT_MAPPINGS)) {
    if (aliases.some(alias => alias.toLowerCase() === ingredientName.toLowerCase())) {
      canonical = await db.query(
        'SELECT id, name FROM "Ingredients" WHERE LOWER(name) = LOWER(:name)',
        {
          replacements: { name: canonicalName },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      if (canonical.length > 0) {
        return canonical[0];
      }
    }
  }
  
  return null;
}

function getIngredientVariations(ingredientName) {
  const variations = [ingredientName];
  
  // Add singular/plural variations
  if (ingredientName.endsWith('s')) {
    variations.push(ingredientName.slice(0, -1)); // Remove 's'
  } else {
    variations.push(ingredientName + 's'); // Add 's'
  }
  
  return variations;
}

async function handleIceCase() {
  console.log('📋 Processing "ice" complex case...');
  
  // Check what products are mapped to "ice"
  const iceProducts = await db.query(
    'SELECT id, description, "canonicalTag" FROM "IngredientCategorized" WHERE "canonicalTag" = \'ice\'',
    {
      type: Sequelize.QueryTypes.SELECT
    }
  );
  
  console.log(`Found ${iceProducts.length} products mapped to "ice"`);
  
  // Create new canonical ingredients if they don't exist
  const newCanonicals = ['ice cream', 'ice cubes'];
  
  for (const canonicalName of newCanonicals) {
    const exists = await db.query(
      'SELECT id FROM "Ingredients" WHERE name = :name',
      {
        replacements: { name: canonicalName },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (exists.length === 0) {
      await db.query(
        'INSERT INTO "Ingredients" (name) VALUES (:name)',
        {
          replacements: { name: canonicalName },
          type: Sequelize.QueryTypes.INSERT
        }
      );
      console.log(`  ✅ Created new canonical: "${canonicalName}"`);
    }
  }
  
  // Categorize products
  let iceCreamCount = 0;
  let iceCubesCount = 0;
  let otherCount = 0;
  
  for (const product of iceProducts) {
    const desc = product.description.toLowerCase();
    
    if (desc.includes('ice cream') || desc.includes('vanilla ice cream') || desc.includes('chocolate ice cream')) {
      await db.query(
        'UPDATE "IngredientCategorized" SET "canonicalTag" = \'ice cream\' WHERE id = :id',
        {
          replacements: { id: product.id },
          type: Sequelize.QueryTypes.UPDATE
        }
      );
      iceCreamCount++;
    } else if (desc.includes('ice cube') || desc.includes('ice block')) {
      await db.query(
        'UPDATE "IngredientCategorized" SET "canonicalTag" = \'ice cubes\' WHERE id = :id',
        {
          replacements: { id: product.id },
          type: Sequelize.QueryTypes.UPDATE
        }
      );
      iceCubesCount++;
    } else {
      // Reset to null for unclear cases
      await db.query(
        'UPDATE "IngredientCategorized" SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL WHERE id = :id',
        {
          replacements: { id: product.id },
          type: Sequelize.QueryTypes.UPDATE
        }
      );
      otherCount++;
    }
  }
  
  console.log(`  📊 Ice cream: ${iceCreamCount}, Ice cubes: ${iceCubesCount}, Other: ${otherCount}`);
  
  // Delete the generic "ice" canonical
  await db.query(
    'DELETE FROM "Ingredients" WHERE name = \'ice\'',
    {
      type: Sequelize.QueryTypes.DELETE
    }
  );
  console.log(`  🗑️ Deleted generic "ice" canonical ingredient`);
}

// Run the cleanup
cleanupInvalidCanonicals().catch(console.error); 