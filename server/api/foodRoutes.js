const express = require('express');
const { Op, Sequelize } = require('sequelize');
const router = express.Router();
const IngredientCategorized = require('../db/models/IngredientCategorized');
const { Subcategory } = require('../db/models');
const IngredientToCanonical = require('../db/models/IngredientToCanonical');
const Ingredient = require('../db/models/Ingredient');
const IngredientMatchingRule = require('../db/models/IngredientMatchingRule');
const SubstituteMapping = require('../db/models/SubstituteMapping');

// GET /api/foods route for searching foods
router.get('/foods', async (req, res) => {
  try {
    const { name, page = 1, limit = 10, } = req.query;
    const offset = (page - 1) * limit; // Assuming you'll send the search query as a query parameter

    // Define the search criteria
    const whereClause = {};
    if (name) {
      whereClause.description = {
        [Op.iLike]: `%${name}%`,
      };
    }

    // Perform the query with pagination
    const foods = await IngredientCategorized.findAll({
      where: whereClause,
      offset,
      limit: parseInt(limit, 10),
    });

    // Get the total count of foods for pagination
    const totalCount = await IngredientCategorized.count({ where: whereClause });

    return res.json({
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page, 10),
      foods,
    });
  } catch (error) {
    console.error('Error searching for foods:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/foods', async (req, res) => {
  try {
    const { excludeRecipeIngredients } = req.body || {};
    const { name, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { [Op.and]: [] };

    // **Explicitly require a name for the search**
    if (name && name.trim() !== '') {
      whereClause[Op.and].push({
        description: { [Op.iRegexp]: `\\y${name}\\y` } // Use word boundary regex
      });
    } else {
      // If no search name is provided, return no results.
      return res.json({ totalCount: 0, totalPages: 0, currentPage: parseInt(page, 10), foods: [] });
    }

    if (excludeRecipeIngredients && Array.isArray(excludeRecipeIngredients) && excludeRecipeIngredients.length > 0) {
      const lowerCaseAllergens = excludeRecipeIngredients.map(a => a.toLowerCase());
      const notExistsClauses = lowerCaseAllergens.map(
        allergen => Sequelize.literal(`NOT EXISTS (SELECT 1 FROM unnest(allergens) a WHERE LOWER(a) = '${allergen}')`)
      );
      whereClause[Op.and].push(...notExistsClauses);
    }
    
    // Debug log: print the whereClause and query params
    console.log('Final whereClause:', whereClause);
    console.log('Query params:', { name, excludeRecipeIngredients, page, limit });

    const { count, rows } = await IngredientCategorized.findAndCountAll({
      where: whereClause,
      offset,
      limit: parseInt(limit, 10),
      order: [['id', 'ASC']]
    });

    return res.json({
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      foods: rows,
    });
  } catch (error) {
    console.error('Error searching for foods:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/foods route for searching foods
router.get('/', async (req, res) => {
  try {
    const { id } = req.query;
    console.log('looking for:', id)

    const product = await IngredientCategorized.findByPk(id)

    if (!product) {
      return res.status(404).json({ error: 'Item not found' });
    }
    return res.json(product)

  } catch (error) {
    console.error('Error searching for foods:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/product/subcat', async (req,res)=>{
  try {
    const { id, allergens } = req.body || {}
    
    // Check if id and allergens are provided
   if (!id || !Array.isArray(allergens)) {
     return res.status(400).json({ error: 'Invalid input data' });
   }

   // Ensure allergens is an array of strings
   const validAllergens = allergens.map(String);

   // Log the allergens for debugging purposes
   console.log('Valid allergens:', validAllergens);

    // Find one food item with the specified subcategoryId
    
    const foodItem =  await IngredientCategorized.sequelize.query(
      `SELECT * FROM "IngredientCategorized" WHERE "SubcategoryID" = :id AND NOT "allergens" && ARRAY[:allergens]::varchar[] LIMIT 1`,
      {
        replacements: { id, allergens: validAllergens },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    // If no food item found or it contains excluded allergens, return null
    if (!foodItem) {
        return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(foodItem)
} catch (err) {
    console.error('Error finding food item: there', err);
    throw err;
}
})

/**
 * POST /api/product/nosubcat
 * 
 * Changes made to fix allergen array handling:
 * 1. Added input validation to ensure allergens is an array
 * 2. Modified the allergens query to use Sequelize.literal for PostgreSQL array operations
 *    - Original approach using Op.overlap and Op.notIn was causing "values.map is not a function" error
 *    - New approach uses PostgreSQL's native array overlap operator (&&) through Sequelize.literal
 * 3. Added limit: 1 to ensure single result
 * 4. Changed Op.like to Op.iLike for case-insensitive search
 * 
 * The changes maintain the original Sequelize ORM approach while fixing the array operation issue.
 * This is preferred over using raw SQL queries to maintain consistency with the rest of the codebase.
 */
router.post('/product/nosubcat', async (req,res)=>{
  try {
    const {name, allergens} = req.body || {}
    if (!Array.isArray(allergens)) {
      return res.status(400).json({ error: 'Invalid allergens data' });
    }

    // Use a raw SQL query for allergen filtering
    const sql = `
      SELECT * FROM "IngredientCategorized"
      WHERE "description" ILIKE :name
        AND ("allergens" IS NULL OR NOT ("allergens" && ARRAY[:allergens]::varchar[]))
      LIMIT 1
    `;
    const foodItems = await IngredientCategorized.sequelize.query(sql, {
      replacements: { name: `%${name}%`, allergens },
      type: Sequelize.QueryTypes.SELECT,
    });
    const foodItem = foodItems[0];
    if (!foodItem) {
      // Instead of 404, return a helpful message and found: false
      return res.status(200).json({ found: false, message: 'No matching food item found' });
    }
    res.json({ ...foodItem, found: true });
  } catch (err) {
    console.error('Error finding food item: here', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
})

// Helper: build strict patterns for pure ingredient products
function buildPureIngredientPatterns(ingredient) {
  // Special patterns for sugar to be more strict
  if (ingredient.toLowerCase() === 'sugar') {
    return [
      'sugar', // exact match
      'sugar.', // ends with sugar (with period)
      'sugar,', // ends with sugar (with comma)
      'sugar ', // ends with sugar (with space)
      '100% sugar',
      'pure sugar',
      'granulated sugar',
      'organic sugar',
      'raw sugar',
      'white sugar',
      'brown sugar',
      'powdered sugar',
      'confectioners sugar',
      'cane sugar',
      'beet sugar'
    ];
  }
  
  // Default patterns for other ingredients
  const patterns = [
    `${ingredient}`, // exact match
    `${ingredient}.`, // ends with ingredient (with period)
    `${ingredient},`, // ends with ingredient (with comma)
    `${ingredient} `, // ends with ingredient (with space)
    `100% ${ingredient}`,
    `pure ${ingredient}`,
    `granulated ${ingredient}`,
    `organic ${ingredient}`,
    `raw ${ingredient}`
  ];
  return patterns;
}

// Helper: identify processed food descriptions
function isProcessedIngredientCategorized(description) {
  const processedKeywords = [
    'cookies', 'cookie', 'crackers', 'cracker', 'chips', 'popcorn', 
    'candy', 'gum', 'chocolate', 'cake', 'pie', 'bars', 'snack',
    'cereal', 'granola', 'trail mix', 'energy bar', 'protein bar',
    'frozen dinner', 'meal', 'soup', 'sauce', 'dressing', 'marinade',
    'seasoning mix', 'spice blend', 'flavored', 'sweetened'
  ];
  const desc = description.toLowerCase();
  return processedKeywords.some(keyword => desc.includes(keyword));
}

// Replace the /by-ingredient route with a clean, simple version
router.post('/by-ingredient', async (req, res) => {
  // === ALLERGEN DEBUG ===
  console.log('=== ALLERGEN DEBUG ===');
  console.log('Request body:', req.body);
  const { ingredientName, allergens, substituteName } = req.body;
  console.log('ingredientName:', ingredientName);
  console.log('allergens:', allergens);
  console.log('allergens type:', typeof allergens);
  console.log('allergens array check:', Array.isArray(allergens));

  try {
    if (!ingredientName) {
      return res.status(400).json({ error: 'ingredientName is required' });
    }

    // Clean the ingredient name
    const cleanedName = cleanIngredientName(ingredientName);

    // Try to map to canonical ingredient
    let canonical = cleanedName;
    const mappingObj = await IngredientToCanonical.findOne({ 
      where: { messyName: cleanedName.toLowerCase() } 
    });
    if (mappingObj) {
      const canonicalObj = await Ingredient.findByPk(mappingObj.IngredientId);
      if (canonicalObj) {
        canonical = canonicalObj.name;
      }
    }
    if (canonical.toLowerCase() === 'egg') {
      canonical = 'eggs'; // Use plural to match database
    }

    const escapedCanonical = canonical.toLowerCase().replace(/'/g, "''"); // Escape single quotes for SQL

    let where = {
      [Sequelize.Op.and]: [
        Sequelize.literal('array_length("canonicalTags", 1) = 1'),
        Sequelize.literal(`"canonicalTags"[1] = '${escapedCanonical}'`),
        { brandName: { [Sequelize.Op.ne]: 'Generic' } }
      ]
    };

    // === API DEBUG ===
    console.log('=== API DEBUG ===');
    console.log('canonical:', canonical);
    console.log('where clause:', JSON.stringify(where, null, 2));

    // === ALLERGEN CONDITION CHECK ===
    console.log('=== ALLERGEN CONDITION CHECK ===');
    console.log('substituteName:', substituteName);
    console.log('allergens:', allergens);
    console.log('allergens isArray:', Array.isArray(allergens));
    console.log('allergens length:', allergens?.length);
    console.log('Condition result:', (!substituteName && allergens && Array.isArray(allergens) && allergens.length > 0));

    // Fix allergen filtering to be case-insensitive
    if (!substituteName && allergens && Array.isArray(allergens) && allergens.length > 0) {
      // === ADDING ALLERGEN FILTER ===
      console.log('=== ADDING ALLERGEN FILTER ===');
      console.log('where before:', where);
      const allergenLiteral = Sequelize.literal(`("allergens" IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest("allergens") a WHERE LOWER(a) = ANY(ARRAY[${allergens.map(a => `'${a.toLowerCase()}'`).join(',')}])
      ))`);
      console.log('allergen literal:', allergenLiteral);
      where[Sequelize.Op.and] = where[Sequelize.Op.and] || [];
      where[Sequelize.Op.and].push(allergenLiteral);
      console.log('where after:', where);
    }

    // Query for products with SQL logging
    const products = await IngredientCategorized.findAll({
      where,
      include: [{
        model: Subcategory,
        where: { pure_ingredient: true },
        required: true
      }],
      logging: console.log, // Show SQL
      order: [['description', 'ASC']],
      limit: 100
    });

    console.log('Products found:', products.length);

    // Prepare response metadata
    const mappingStatus = 'mapped'; // Placeholder, set real logic if available
    const mappingConfidence = 'confident'; // Placeholder, set real logic if available
    const brandPriority = undefined; // Placeholder, set real logic if available
    const fallbackPath = [];
    const mappingReason = undefined;
    const totalFound = products.length;
    const realBrandCount = undefined; // Placeholder, set real logic if available
    const topBrands = undefined; // Placeholder, set real logic if available
    const formattedProducts = products.map(p => p.toJSON());

    // Enhanced API response with metadata
    res.json({
      ingredient: ingredientName,
      mappingStatus,
      confidence: mappingConfidence,
      canonicalIngredient: canonical,
      brandPriority,
      products: formattedProducts,
      fallbackPath,
      mappingReason,
      coverageStats: { totalFound, realBrandCount, topBrands }
    });
  } catch (error) {
    console.error('Error in /by-ingredient:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/product/search?name=...&page=...&limit=...&allergens=allergen1,allergen2
router.get('/search', async (req, res) => {
  try {
    const { name = '', page = 1, limit = 10, allergens = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = name
      ? { description: { [Sequelize.Op.iLike]: `%${name}%` } }
      : {};

    // Allergen filtering
    if (allergens) {
      const allergenArr = allergens.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
      if (allergenArr.length > 0) {
        where[Sequelize.Op.and] = where[Sequelize.Op.and] || [];
        where[Sequelize.Op.and].push(
          Sequelize.literal(`("allergens" IS NULL OR NOT EXISTS (
            SELECT 1 FROM unnest("allergens") a WHERE LOWER(a) = ANY(ARRAY[${allergenArr.map(a => `'${a}'`).join(',')}])
          ))`)
        );
      }
    }

    const { count, rows } = await IngredientCategorized.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['description', 'ASC']]
    });
    res.json({
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      foods: rows
    });
  } catch (error) {
    console.error('Error in /api/product/search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function cleanIngredientName(raw) {
  // Remove quantities, units, and parentheticals, keep core name
  // e.g., "1/2 cups all-purpose flour" -> "all-purpose flour"
  if (!raw) return '';
  let cleaned = raw.toLowerCase();
  
  // Remove parentheticals and optional text
  cleaned = cleaned.replace(/\([^)]*\)/g, ''); // remove parentheticals
  cleaned = cleaned.replace(/optional|such as.*?\(.*?\)/g, ''); // remove optional text
  
  // Remove numbers and fractions only at the start or after whitespace
  cleaned = cleaned.replace(/(^|\s)(\d+[\/\d]*\s*)/g, ' '); // remove numbers/fractions at start or after space
  
  // Remove measurement units (but NOT ingredient names like egg, eggs, bread, fish, etc.)
  // Remove 'g' as a unit to avoid altering 'eggs'
  cleaned = cleaned.replace(/(?<=\s|^)(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lb|grams?|kilograms?|kg|liters?|l|milliliters?|ml|package|can|container|envelope|slice|loaf|pinch|dash|quart|qt|pint|pt|gallon|gal|stick|clove|head|bunch|sprig|piece|sheet|bag|bottle|jar|box|packet|drop|ear|stalk|strip|cube|block|bar)(?=\s|$)/g, ''); // only units
  
  // Remove preparation and descriptor terms
  cleaned = cleaned.replace(/\b(sliced|chopped|fresh|dried|mild|to taste|and|drained|rinsed|peeled|seeded|halved|quartered|shredded|grated|zested|minced|mashed|crushed|diced|cubed|julienned|optional|with juice|with syrup|with liquid|in juice|in syrup|in liquid|powdered|sweetened|unsweetened|raw|cooked|baked|roasted|steamed|boiled|fried|blanched|toasted|softened|melted|room temperature|cold|warm|hot|refrigerated|frozen|thawed|defrosted|prepared|beaten|whipped|stiff|soft|firm|fine|coarse|crumbled|broken|pieces|chunks|strips|sticks|spears|tips|ends|whole|large|small|medium|extra large|extra small|thin|thick|lean|fatty|boneless|skinless|bone-in|with skin|without skin|with bone|without bone|center cut|end cut|trimmed|untrimmed|pitted|unpitted|seedless|with seeds|without seeds|cored|uncored|stemmed|destemmed|deveined|unveined|cleaned|uncleaned|split|unsplit|shelled|unshelled|hulled|unhulled|deveined|unveined|deveined|unveined|deveined|unveined)\b/g, '');
  
  // Remove count words
  cleaned = cleaned.replace(/\b(leaves?|slices?|pieces?|chunks?|strips?|sticks?|spears?|tips?|ends?)\b/g, '');
  
  // Remove color descriptors
  cleaned = cleaned.replace(/\b(yellow|white|black|red|green|orange|purple|brown|golden|pink|blue|rainbow)\b/g, '');
  
  // Remove trailing commas and extra whitespace
  cleaned = cleaned.replace(/,\s*$/, ''); // remove trailing commas
  cleaned = cleaned.replace(/^\s*,\s*/, ''); // remove leading commas
  cleaned = cleaned.replace(/\s{2,}/g, ' '); // collapse spaces
  cleaned = cleaned.trim();
  
  return cleaned;
}

module.exports = router;
module.exports.cleanIngredientName = cleanIngredientName;