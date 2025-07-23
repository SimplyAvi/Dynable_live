const db = require('./db/database');
const { IngredientToCanonical, Ingredient, Ingredient } = require('./db/models');
const fs = require('fs');

// Whitelist of valid ingredient terms (expand as needed)
const VALID_INGREDIENTS = [
  // Core staples
  'salt', 'sugar', 'flour', 'egg', 'milk', 'butter', 'oil', 'cheese', 'yogurt', 'cream', 'water',
  // Proteins
  'chicken', 'beef', 'pork', 'fish', 'shrimp', 'salmon', 'tuna', 'egg', 'tofu', 'tempeh', 'seitan',
  // Grains & starches
  'rice', 'pasta', 'bread', 'oats', 'quinoa', 'barley', 'couscous', 'cornmeal', 'polenta', 'tortilla',
  // Vegetables
  'onion', 'garlic', 'carrot', 'potato', 'lettuce', 'spinach', 'kale', 'broccoli', 'cauliflower', 'cabbage',
  'zucchini', 'squash', 'pumpkin', 'tomato', 'bell pepper', 'jalapeno', 'eggplant', 'celery', 'mushroom',
  'peas', 'green bean', 'asparagus', 'leek', 'shallot', 'fennel', 'artichoke', 'beet', 'turnip', 'parsnip',
  'radish', 'sweet potato', 'yam', 'brussels sprout', 'chard', 'collard green', 'arugula', 'endive', 'bok choy',
  // Fruits
  'apple', 'banana', 'lemon', 'lime', 'orange', 'strawberry', 'blueberry', 'raspberry', 'blackberry', 'grape',
  'peach', 'pear', 'plum', 'apricot', 'cherry', 'pineapple', 'mango', 'papaya', 'kiwi', 'melon', 'watermelon',
  'cantaloupe', 'honeydew', 'pomegranate', 'fig', 'date', 'raisin', 'cranberry', 'coconut', 'avocado',
  // Legumes, nuts, seeds
  'bean', 'chickpea', 'lentil', 'pea', 'soybean', 'edamame', 'peanut', 'almond', 'walnut', 'cashew', 'pecan',
  'hazelnut', 'macadamia', 'pistachio', 'pine nut', 'sunflower seed', 'pumpkin seed', 'chia seed', 'flax seed', 'sesame seed',
  // Dairy & alternatives
  'mozzarella', 'parmesan', 'cheddar', 'feta', 'ricotta', 'cream cheese', 'sour cream', 'buttermilk', 'ghee',
  'almond milk', 'soy milk', 'oat milk', 'coconut milk',
  // Fats & oils
  'olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'sesame oil', 'grapeseed oil', 'peanut oil', 'butter', 'margarine',
  // Sweeteners
  'honey', 'maple syrup', 'molasses', 'agave nectar', 'brown sugar', 'powdered sugar',
  // Spices & herbs
  'black pepper', 'white pepper', 'cayenne', 'paprika', 'chili powder', 'cumin', 'coriander', 'turmeric', 'ginger',
  'cinnamon', 'nutmeg', 'clove', 'allspice', 'cardamom', 'mustard', 'dill', 'basil', 'oregano', 'thyme', 'rosemary',
  'sage', 'parsley', 'cilantro', 'mint', 'bay leaf', 'tarragon', 'marjoram', 'chive', 'fennel seed', 'anise', 'herbes de provence',
  // Condiments & sauces
  'mayonnaise', 'mustard', 'ketchup', 'soy sauce', 'tamari', 'sriracha', 'hot sauce', 'barbecue sauce', 'vinegar',
  'balsamic vinegar', 'apple cider vinegar', 'red wine vinegar', 'rice vinegar', 'white vinegar', 'worcestershire sauce',
  'fish sauce', 'oyster sauce', 'hoisin sauce', 'teriyaki sauce', 'pesto', 'hummus', 'tahini', 'guacamole', 'salsa', 'relish',
  // Baking & flavoring
  'yeast', 'baking powder', 'baking soda', 'vanilla extract', 'almond extract', 'cocoa powder', 'chocolate', 'chocolate chip',
  // Miscellaneous
  'broth', 'stock', 'bouillon', 'gelatin', 'cornstarch', 'arrowroot', 'panko', 'breadcrumbs', 'crouton', 'granola', 'muesli',
  'nut butter', 'peanut butter', 'almond butter', 'cashew butter', 'jam', 'jelly', 'marmalade', 'curd', 'compote', 'ice cream',
  'sherbet', 'sorbet', 'whipped cream', 'pudding', 'custard', 'marshmallow', 'tofu', 'tempeh', 'seitan',
  'clove', 'garam masala', 'cajun seasoning',
];

// Noise words and patterns
const NOISE_PATTERNS = [
  /^\d+([\/\d]*)?$/, // numbers or fractions
  /\b(cup|cups|tablespoon|tablespoons|tbsp|teaspoon|teaspoons|tsp|oz|ounce|ounces|lb|pound|pounds|g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|package|can|container|envelope|slice|loaf|pinch|dash|quart|qt|pint|pt|gallon|gal|stick|clove|head|bunch|sprig|piece|sheet|bag|bottle|jar|box|packet|drop|ear|stalk|strip|cube|block|bar|fluid ounces?|fl oz)\b/,
  /\b(sliced|chopped|fresh|dried|mild|to taste|and|drained|rinsed|peeled|seeded|halved|quartered|shredded|grated|minced|mashed|crushed|diced|cubed|julienned|optional|with juice|with syrup|with liquid|in juice|in syrup|in liquid|powdered|sweetened|unsweetened|raw|cooked|baked|roasted|steamed|boiled|fried|blanched|toasted|softened|melted|room temperature|cold|warm|hot|refrigerated|frozen|thawed|defrosted|prepared|beaten|whipped|stiff|soft|firm|fine|coarse|crumbled|broken|pieces|chunks|strips|sticks|spears|tips|ends|whole|large|small|medium|extra large|extra small|thin|thick|lean|fatty|boneless|skinless|bone-in|with skin|without skin|with bone|without bone|center cut|end cut|trimmed|untrimmed|pitted|unpitted|seedless|with seeds|without seeds|cored|uncored|stemmed|destemmed|deveined|unveined|cleaned|uncleaned|split|unsplit|shelled|unshelled|hulled|unhulled|generous|about|approximately|or more|as needed|for serving|for garnish)\b/,
  /\b(cooking|organic|natural|fresh|pure|homemade|store-bought|prepared|mix|blend|variety|assorted|assortment|selection|combination|medley|miscellaneous|various|other|ingredient|product|food|item|thing|stuff|portion|serving|batch|lot|amount|quantity|portion|serving|batch|lot|amount|quantity)\b/
];

// Helper to singularize simple plurals
function singularize(word) {
  if (word.endsWith('es')) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

function isLowValueMapping(messyName) {
  // Clean and split messyName into words
  const cleaned = messyName.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  // If ANY word (or its singular) is in VALID_INGREDIENTS, keep it
  for (const word of words) {
    if (
      VALID_INGREDIENTS.includes(word) ||
      VALID_INGREDIENTS.includes(singularize(word))
    ) {
      return false; // Not low value, keep
    }
  }

  // If the whole phrase matches a valid ingredient, keep
  if (
    VALID_INGREDIENTS.includes(cleaned.trim()) ||
    VALID_INGREDIENTS.includes(singularize(cleaned.trim()))
  ) {
    return false;
  }

  // If ALL words are noise, remove
  let allNoise = true;
  for (const word of words) {
    let isNoise = false;
    for (const pattern of NOISE_PATTERNS) {
      if (pattern.test(word)) {
        isNoise = true;
        break;
      }
    }
    if (!isNoise) {
      allNoise = false;
      break;
    }
  }
  return allNoise;
}

function sampleForReview(toRemove, toKeep, removeSampleSize = 50, keepSampleSize = 50) {
  function getRandomSample(arr, n) {
    const result = [];
    const taken = new Set();
    while (result.length < Math.min(n, arr.length)) {
      const idx = Math.floor(Math.random() * arr.length);
      if (!taken.has(idx)) {
        result.push(arr[idx]);
        taken.add(idx);
      }
    }
    return result;
  }
  const removeSample = getRandomSample(toRemove, removeSampleSize);
  const keepSample = getRandomSample(toKeep, keepSampleSize);
  console.log('\n=== SAMPLE OF MAPPINGS MARKED FOR REMOVAL ===');
  removeSample.forEach((m, i) => {
    console.log(`${i + 1}. ${m.messyName} => ${m.IngredientId}`);
  });
  console.log('\n=== SAMPLE OF MAPPINGS MARKED TO KEEP ===');
  keepSample.forEach((m, i) => {
    console.log(`${i + 1}. ${m.messyName} => ${m.IngredientId}`);
  });
  console.log('\nReview these samples before proceeding with the full cleanup.');
}

async function cleanupLowValueMappings({ dryRun = false } = {}) {
  await db.authenticate();
  const allMappings = await IngredientToCanonical.findAll();
  const toRemove = [];
  const toKeep = [];
  for (const mapping of allMappings) {
    if (isLowValueMapping(mapping.messyName)) {
      toRemove.push(mapping);
    } else {
      toKeep.push(mapping);
    }
  }
  // Show samples for manual review before proceeding
  sampleForReview(toRemove, toKeep);
  // Log removals
  const logLines = toRemove.map(m => `REMOVE: "${m.messyName}" → CanonicalID: ${m.IngredientId}`);
  fs.writeFileSync('low_value_mappings_removed.log', logLines.join('\n'));
  if (dryRun) {
    console.log(`\n[DRY RUN] No mappings were deleted. The following would be removed:`);
    console.log(logLines.slice(0, 50).join('\n'));
    if (logLines.length > 50) {
      console.log(`...and ${logLines.length - 50} more. See low_value_mappings_removed.log for full list.`);
    }
  } else {
    // Remove from DB
    for (const mapping of toRemove) {
      await mapping.destroy();
    }
  }
  // Stats after cleanup
  const total = toKeep.length + toRemove.length;
  const removed = toRemove.length;
  const kept = toKeep.length;
  const percentRemoved = ((removed / total) * 100).toFixed(1);
  const percentKept = ((kept / total) * 100).toFixed(1);
  console.log(`\nCleanup complete!`);
  console.log(`  Total mappings: ${total}`);
  console.log(`  Removed: ${removed} (${percentRemoved}%)`);
  console.log(`  Kept: ${kept} (${percentKept}%)`);
  console.log(`  Log saved to: low_value_mappings_removed.log`);
  if (dryRun) {
    console.log('  [DRY RUN] No changes were made to the database.');
  }
}

if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');
  cleanupLowValueMappings({ dryRun }).then(() => process.exit(0));
} 