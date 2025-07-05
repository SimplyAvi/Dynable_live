const express = require('express');
const { Op, Sequelize } = require('sequelize');
const router = express.Router();
const Food = require('../db/models/Food');
const { Subcategory } = require('../db/models');
const IngredientToCanonical = require('../db/models/IngredientToCanonical');
const CanonicalIngredient = require('../db/models/CanonicalIngredient');
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
    const foods = await Food.findAll({
      where: whereClause,
      offset,
      limit: parseInt(limit, 10),
    });

    // Get the total count of foods for pagination
    const totalCount = await Food.count({ where: whereClause });

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
    const { excludeIngredients } = req.body || {};
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

    if (excludeIngredients && Array.isArray(excludeIngredients) && excludeIngredients.length > 0) {
      const lowerCaseAllergens = excludeIngredients.map(a => a.toLowerCase());
      const notExistsClauses = lowerCaseAllergens.map(
        allergen => Sequelize.literal(`NOT EXISTS (SELECT 1 FROM unnest(allergens) a WHERE LOWER(a) = '${allergen}')`)
      );
      whereClause[Op.and].push(...notExistsClauses);
    }
    
    // Debug log: print the whereClause and query params
    console.log('Final whereClause:', whereClause);
    console.log('Query params:', { name, excludeIngredients, page, limit });

    const { count, rows } = await Food.findAndCountAll({
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

    const product = await Food.findByPk(id)

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
    
    const foodItem =  await Food.sequelize.query(
      `SELECT * FROM "Food" WHERE "SubcategoryID" = :id AND NOT "allergens" && ARRAY[:allergens]::varchar[] LIMIT 1`,
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
      SELECT * FROM "Food"
      WHERE "description" ILIKE :name
        AND ("allergens" IS NULL OR NOT ("allergens" && ARRAY[:allergens]::varchar[]))
      LIMIT 1
    `;
    const foodItems = await Food.sequelize.query(sql, {
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

// POST /api/product/by-ingredient
router.post('/by-ingredient', async (req, res) => {
  try {
    const { ingredientName, allergens, substituteName } = req.body;
    if (!ingredientName) {
      return res.status(400).json({ error: 'ingredientName is required' });
    }
    
    // Clean the ingredient name (same logic as recipe processing)
    const cleanedName = cleanIngredientName(ingredientName);
    
    // Try to map to canonical ingredient
    let canonical = null;
    let aliases = [];
    const mapping = await IngredientToCanonical.findOne({ where: { messyName: cleanedName.toLowerCase() } });
    if (mapping) {
      const canonicalObj = await CanonicalIngredient.findByPk(mapping.CanonicalIngredientId);
      if (canonicalObj) {
        canonical = canonicalObj.name;
        aliases = canonicalObj.aliases || [];
      }
    }

    // Build canonicalTag search set
    let canonicalTags = [];
    if (canonical) canonicalTags.push(canonical.toLowerCase());
    if (aliases && aliases.length > 0) canonicalTags = canonicalTags.concat(aliases.map(a => a.toLowerCase()));
    canonicalTags = [...new Set(canonicalTags.filter(Boolean))];

    // If no canonical mapping, fallback to cleanedName
    if (canonicalTags.length === 0) canonicalTags = [cleanedName.toLowerCase()];

    // If a substitute is picked, use its canonical mapping instead
    if (substituteName) {
      const cleanedSubstitute = cleanIngredientName(substituteName);
      const subMapping = await IngredientToCanonical.findOne({ where: { messyName: cleanedSubstitute.toLowerCase() } });
      if (subMapping) {
        const subCanonicalObj = await CanonicalIngredient.findByPk(subMapping.CanonicalIngredientId);
        if (subCanonicalObj) {
          canonicalTags = [subCanonicalObj.name.toLowerCase()];
          if (subCanonicalObj.aliases && subCanonicalObj.aliases.length > 0) {
            canonicalTags = canonicalTags.concat(subCanonicalObj.aliases.map(a => a.toLowerCase()));
          }
          canonicalTags = [...new Set(canonicalTags.filter(Boolean))];
        }
      } else {
        canonicalTags = [cleanedSubstitute.toLowerCase()];
      }
    }

    // ENHANCED filtering logic - prioritize confident canonical tags and filter out false positives
    let where = {
      [Sequelize.Op.or]: [
        // First priority: confident canonical tag matches (actual ingredients)
        {
          canonicalTag: { [Sequelize.Op.in]: canonicalTags },
          canonicalTagConfidence: 'confident'
        },
        // Second priority: suggested canonical tag matches (likely ingredients)
        {
          canonicalTag: { [Sequelize.Op.in]: canonicalTags },
          canonicalTagConfidence: 'suggested'
        },
        // Third priority: low confidence matches (include these for now)
        {
          canonicalTag: { [Sequelize.Op.in]: canonicalTags },
          canonicalTagConfidence: 'low'
        }
      ]
    };

    // For basic ingredients, be very strict about what we consider an actual ingredient
    const basicIngredients = ['sugar', 'salt', 'flour', 'milk', 'butter', 'oil', 'yeast', 'egg', 'cheese'];
    const isBasicIngredient = basicIngredients.some(basic => 
      canonicalTags.some(tag => tag.includes(basic.toLowerCase()))
    );

    // For flour substitutes, be very strict about what we consider pure flour
    const flourSubstitutes = ['rice flour', 'almond flour', 'coconut flour', 'oat flour', 'gluten-free flour blend'];
    const isFlourSubstitute = flourSubstitutes.some(flour => 
      canonicalTags.some(tag => tag.includes(flour.toLowerCase()))
    );

    if (isBasicIngredient || isFlourSubstitute) {
      // For basic ingredients and flour substitutes, only include pure ingredients
      where[Sequelize.Op.and] = where[Sequelize.Op.and] || [];
      where[Sequelize.Op.and].push(
        Sequelize.literal('"SubcategoryID" IS NOT NULL AND EXISTS (SELECT 1 FROM "Subcategories" s WHERE s."SubcategoryID" = "Food"."SubcategoryID" AND s."is_basic_ingredient" = true)')
      );
    }

    // Allergen filtering - only apply when a substitute is selected (for recipe ingredients)
    // BUT don't filter out the substitute itself if it contains allergens
    if (substituteName && allergens && Array.isArray(allergens) && allergens.length > 0) {
      // Don't apply allergen filtering when a substitute is selected
      // The user is explicitly choosing this substitute, so they know it contains allergens
      console.log('Substitute selected, skipping allergen filtering for:', substituteName);
    } else if (allergens && Array.isArray(allergens) && allergens.length > 0) {
      // Apply allergen filtering only when no substitute is selected
      where[Sequelize.Op.and] = where[Sequelize.Op.and] || [];
      where[Sequelize.Op.and].push(
        Sequelize.literal(`("allergens" IS NULL OR NOT EXISTS (
          SELECT 1 FROM unnest("allergens") a WHERE LOWER(a) = ANY(ARRAY[${allergens.map(a => `'${a.toLowerCase()}'`).join(',')}])
        ))`)
      );
    }

    // Query for matching products with a reasonable limit
    const products = await Food.findAll({
      where,
      order: [
        // Prioritize real products (non-Generic) over generic ones
        [Sequelize.literal('CASE WHEN "brandName" != \'Generic\' THEN 0 ELSE 1 END'), 'ASC'],
        // Then prioritize products with confident canonical tags
        [Sequelize.literal('CASE WHEN "canonicalTagConfidence" = \'confident\' THEN 0 WHEN "canonicalTagConfidence" = \'suggested\' THEN 1 ELSE 2 END'), 'ASC'],
        ['description', 'ASC']
      ],
      limit: 20 // Limit results to avoid overwhelming the frontend
    });

    res.json(products);
  } catch (error) {
    console.error('Error in /api/product/by-ingredient:', error);
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

    const { count, rows } = await Food.findAndCountAll({
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