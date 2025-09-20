const express = require('express')
const { Op, Sequelize } = require('sequelize');
const router = express.Router()
const Recipe = require('../db/models/Recipe/Recipe')
const RecipeIngredient = require('../db/models/Recipe/RecipeIngredient');
const { IngredientToCanonical, Ingredient, AllergenDerivative, Substitution } = require('../db/models');

// Post request to send allergens to be filtered during api call
router.post('/', async (req, res) => {
  try {
    const { search, excludeRecipeIngredients } = req.body || {};
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Map frontend keys to backend format if needed
    const mappedAllergens = (excludeRecipeIngredients || []).map(a =>
      a.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/_/g, ' ')
    );

    // Build the base query
    let where = '';
    let replacements = { limit: parseInt(limit, 10), offset };

    if (search) {
      where += `"title" ILIKE :search`;
      replacements.search = `%${search}%`;
    } else {
      where += '1=1';
    }

    // Add NOT EXISTS for each allergen
    mappedAllergens.forEach((allergen, idx) => {
      where += ` AND NOT EXISTS (
        SELECT 1 FROM "RecipeIngredients" i
        WHERE i."RecipeId" = r.id
        AND i."name" ILIKE :allergen${idx}
      )`;
      replacements[`allergen${idx}`] = `%${allergen}%`;
    });

    const sql = `
      SELECT r.*, 
             i.id as "ingredient_id", 
             i.name as "ingredient_name", 
             i.quantity as "ingredient_quantity"
      FROM "Recipes" AS r
      LEFT JOIN "RecipeIngredients" AS i ON r.id = i."RecipeId"
      WHERE ${where}
      ORDER BY r.id, i.id
      LIMIT :limit OFFSET :offset
    `;

    const results = await Recipe.sequelize.query(sql, {
      replacements,
      type: Sequelize.QueryTypes.SELECT,
    });

    // Group ingredients by recipe
    const recipesMap = new Map();
    results.forEach(row => {
      if (!recipesMap.has(row.id)) {
        recipesMap.set(row.id, {
          id: row.id,
          title: row.title,
          directions: row.directions,
          source: row.source,
          tags: row.tags,
          url: row.url,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          ingredients: []
        });
      }
      
      if (row.ingredient_id) {
        recipesMap.get(row.id).ingredients.push({
          id: row.ingredient_id,
          name: row.ingredient_name,
          quantity: row.ingredient_quantity
        });
      }
    });

    const recipes = Array.from(recipesMap.values());

    res.json(recipes);
  } catch (error) {
    console.error('Error searching for recipes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/recipe/:id/products - Enhanced server-side ingredient-to-product matching
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { allergens = [], limit = 5 } = req.query;
    
    console.log(`[RECIPE PRODUCTS] Processing recipe ${id} with allergens:`, allergens);
    
    // Get recipe with ingredients
    const sql = `
      SELECT r.*, 
             i.id as "ingredient_id", 
             i.name as "ingredient_name", 
             i.quantity as "ingredient_quantity"
      FROM "Recipes" AS r
      LEFT JOIN "RecipeIngredients" AS i ON r.id = i."RecipeId"
      WHERE r.id = :id
      ORDER BY i.id
    `;

    const results = await Recipe.sequelize.query(sql, {
      replacements: { id },
      type: Sequelize.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Parse allergens
    const userAllergens = Array.isArray(allergens) ? allergens : allergens.split(',').filter(a => a.trim());
    
    // Expand allergens with derivatives
    let expandedAllergens = [];
    if (userAllergens.length > 0) {
      const allSet = new Set(userAllergens.map(a => a.toLowerCase()));
      for (const allergen of userAllergens) {
        const derivatives = await AllergenDerivative.findAll({ where: { allergen: allergen.toLowerCase() } });
        derivatives.forEach(d => allSet.add(d.derivative.toLowerCase()));
      }
      expandedAllergens = Array.from(allSet);
    }

    // Process each ingredient server-side
    const { IngredientCategorized } = require('../db/models');
    const ingredientProducts = await Promise.all(
      results
        .filter(row => row.ingredient_id) // Only process ingredients
        .map(async (row) => {
          const ingredient = {
            id: row.ingredient_id,
            name: row.ingredient_name,
            quantity: row.ingredient_quantity
          };

          // Enhanced server-side ingredient cleaning
          const cleaned = cleanIngredientForMatching(ingredient.name);
          console.log(`[RECIPE PRODUCTS] Ingredient: '${ingredient.name}' -> Cleaned: '${cleaned.canonical}'`);

          // Find matching products with intelligent algorithm
          const products = await findMatchingProducts(cleaned.canonical, {
            limit: parseInt(limit),
            includeAllergenSafe: true,
            userAllergens: expandedAllergens
          });

          // Get substitutes if ingredient has allergens
          let substitutes = [];
          if (expandedAllergens.length > 0 && products.some(p => p.hasAllergens)) {
            substitutes = await getSubstitutes(cleaned.canonical, expandedAllergens);
          }

          return {
            ingredient: ingredient,
            canonical: cleaned.canonical,
            products: products,
            substitutes: substitutes,
            hasAllergens: products.some(p => p.hasAllergens)
          };
        })
    );

    const recipe = {
      id: results[0].id,
      title: results[0].title,
      directions: results[0].directions,
      source: results[0].source,
      tags: results[0].tags,
      url: results[0].url,
      ingredients: ingredientProducts
    };

    console.log(`[RECIPE PRODUCTS] ✅ Processed ${ingredientProducts.length} ingredients for recipe ${id}`);
    res.json({ success: true, data: recipe });

  } catch (error) {
    console.error('[RECIPE PRODUCTS] Error processing recipe products:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/recipe route for searching recipe
router.get('/', async (req, res) => {
  try {
    const { id, userAllergens } = req.query;
    console.log('looking for:', id)

    if (!id) {
      return res.status(400).json({ error: 'Recipe ID is required' });
    }

    // Fetch recipe with ingredients
    const sql = `
      SELECT r.*, 
             i.id as "ingredient_id", 
             i.name as "ingredient_name", 
             i.quantity as "ingredient_quantity"
      FROM "Recipes" AS r
      LEFT JOIN "RecipeIngredients" AS i ON r.id = i."RecipeId"
      WHERE r.id = :id
      ORDER BY i.id
    `;

    const results = await Recipe.sequelize.query(sql, {
      replacements: { id },
      type: Sequelize.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Expand user allergens with derivatives
    let expandedAllergens = [];
    if (userAllergens) {
      const userAllergenArr = Array.isArray(userAllergens) ? userAllergens : userAllergens.split(',');
      const allSet = new Set(userAllergenArr.map(a => a.toLowerCase()));
      for (const allergen of userAllergenArr) {
        const derivatives = await AllergenDerivative.findAll({ where: { allergen: allergen.toLowerCase() } });
        derivatives.forEach(d => allSet.add(d.derivative.toLowerCase()));
      }
      expandedAllergens = Array.from(allSet);
    }

    // Get all canonical ingredients and allergens for fallback
    const allCanonicals = await Ingredient.findAll();
    const canonicalNames = allCanonicals.map(c => c.name.toLowerCase());
    const canonicalAllergenMap = {};
    allCanonicals.forEach(c => {
      canonicalAllergenMap[c.name.toLowerCase()] = c.allergens || [];
    });

    // Group ingredients by recipe and process each
    const recipe = {
      id: results[0].id,
      title: results[0].title,
      directions: results[0].directions,
      source: results[0].source,
      tags: results[0].tags,
      url: results[0].url,
      createdAt: results[0].createdAt,
      updatedAt: results[0].updatedAt,
      ingredients: []
    };

    for (const row of results) {
      if (row.ingredient_id) {
        let flagged = false;
        let canonicalName = null;
        let substitutions = [];
        let messyName = row.ingredient_name;
        let cleanedName = cleanIngredientName(messyName);
        // Try canonical mapping first
        let mapping = await IngredientToCanonical.findOne({ where: { messyName: cleanedName.toLowerCase() } });
        let canonical = null;
        if (mapping) {
          canonical = await Ingredient.findByPk(mapping.IngredientId);
          canonicalName = canonical ? canonical.name : null;
          if (canonical && expandedAllergens.length > 0 && canonical.allergens && canonical.allergens.some(a => expandedAllergens.includes(a.toLowerCase()))) {
            flagged = true;
            const subs = await Substitution.findAll({ where: { IngredientId: canonical.id } });
            substitutions = subs.map(s => ({ substituteName: s.substituteName, notes: s.notes }));
          }
        } else {
          // Fallback: keyword search for canonical ingredient names in cleanedName
          let foundCanonical = null;
          for (const cname of canonicalNames) {
            if (cleanedName.includes(cname)) {
              foundCanonical = cname;
              break;
            }
          }
          if (foundCanonical) {
            canonicalName = foundCanonical;
            const allergens = canonicalAllergenMap[foundCanonical] || [];
            if (expandedAllergens.length > 0 && allergens && allergens.some(a => expandedAllergens.includes(a.toLowerCase()))) {
              flagged = true;
              const fallbackCanonical = allCanonicals.find(c => c.name.toLowerCase() === foundCanonical);
              if (fallbackCanonical) {
                const subs = await Substitution.findAll({ where: { IngredientId: fallbackCanonical.id } });
                substitutions = subs.map(s => ({ substituteName: s.substituteName, notes: s.notes }));
              }
            }
          } else {
            // Fallback: keyword search for allergens in cleanedName
            for (const allergen of expandedAllergens) {
              if (cleanedName.includes(allergen)) {
                flagged = true;
                break;
              }
            }
          }
        }
        // Debug log for each ingredient
        console.log(`[RECIPE DEBUG] Ingredient: '${messyName}' | Cleaned: '${cleanedName}' | Canonical: '${canonicalName}' | Flagged: ${flagged} | Substitutions:`, substitutions);
        recipe.ingredients.push({
          id: row.ingredient_id,
          name: messyName,
          quantity: row.ingredient_quantity,
          canonical: canonicalName,
          flagged,
          substitutions
        });
      }
    }

    return res.json(recipe);

  } catch (error) {
    console.error('Error searching for recipes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/recipe/substitute-products - Get substitute ingredients and their matching products
router.get('/substitute-products', async (req, res) => {
  try {
    const { canonicalIngredient } = req.query;
    const { IngredientCategorized } = require('../db/models');

    if (!canonicalIngredient) {
      return res.status(400).json({ error: 'Canonical ingredient name is required' });
    }

    console.log(`🔍 Looking for substitutes for: ${canonicalIngredient}`);

    // Find the canonical ingredient
    const canonical = await Ingredient.findOne({
      where: { name: canonicalIngredient }
    });

    if (!canonical) {
      return res.status(404).json({ 
        error: `Canonical ingredient '${canonicalIngredient}' not found` 
      });
    }

    // Get all substitutions for this ingredient
    const substitutions = await Substitution.findAll({
      where: { IngredientId: canonical.id }
    });

    if (substitutions.length === 0) {
      return res.json({
        ingredient: canonicalIngredient,
        substitutes: []
      });
    }

    // For each substitute, find matching products
    const substitutesWithProducts = await Promise.all(
      substitutions.map(async (sub) => {
        const substituteName = sub.substituteName;
        
        // Find products that match this substitute
        const products = await IngredientCategorized.findAll({
          where: {
            canonicalTag: substituteName.toLowerCase(),
            canonicalTagConfidence: 'confident'
          },
          limit: 10,
          order: [['description', 'ASC']]
        });

        return {
          substituteName: substituteName, // <-- Fix: use 'substituteName' key
          notes: sub.notes,
          products: products.map(p => ({
            id: p.id,
            description: p.description,
            brandName: p.brandName,
            brandOwner: p.brandOwner
          }))
        };
      })
    );

    // Filter out substitutes that have no products
    const availableSubstitutes = substitutesWithProducts.filter(sub => sub.products.length > 0);

    console.log(`✅ Found ${substitutions.length} total substitutes for '${canonicalIngredient}', ${availableSubstitutes.length} with available products`);

    res.json({
      ingredient: canonicalIngredient,
      substitutes: availableSubstitutes
    });

  } catch (error) {
    console.error('Error fetching substitute products:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced server-side ingredient cleaning function
function cleanIngredientForMatching(rawIngredient) {
  if (!rawIngredient) return { original: '', cleaned: '', canonical: '', searchTerms: [] };
  
  const ingredient = rawIngredient.toLowerCase();
  
  // Remove quantities and measurements
  let cleanedIngredient = ingredient
    .replace(/\d+(\.\d+)?\s*(cups?|tbsp|tsp|oz|lbs?|grams?|ml|liters?)/gi, '')
    .replace(/\b(a|an|the|of|for|with|and|or)\b/gi, '') // Remove articles
    .replace(/\((.*?)\)/g, '') // Remove parenthetical content
    .replace(/,.*$/, '') // Remove everything after first comma
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Extract core ingredient
  const coreIngredient = extractCoreIngredient(cleanedIngredient);
  
  // Generate search terms for fuzzy matching
  const searchTerms = generateSearchTerms(coreIngredient);
  
  return {
    original: rawIngredient,
    cleaned: cleanedIngredient,
    canonical: coreIngredient,
    searchTerms: searchTerms
  };
}

// Extract the core ingredient name
function extractCoreIngredient(ingredient) {
  // Define ingredient categories and patterns
  const patterns = {
    // Dairy
    'milk': /\b(milk|whole milk|2% milk|skim milk)\b/i,
    'cheese': /\b(cheese|cheddar|mozzarella|parmesan|gouda|brie|feta)\b/i,
    'butter': /\b(butter|unsalted butter|salted butter)\b/i,
    'cream': /\b(cream|heavy cream|whipping cream|sour cream)\b/i,
    'yogurt': /\b(yogurt|greek yogurt|plain yogurt)\b/i,
    
    // Produce
    'tomatoes': /\b(tomatoes?|tomato|diced tomatoes|crushed tomatoes)\b/i,
    'onions': /\b(onions?|onion|yellow onion|white onion|red onion)\b/i,
    'garlic': /\b(garlic|garlic cloves?)\b/i,
    'pepper': /\b(pepper|bell pepper|black pepper|white pepper)\b/i,
    'carrots': /\b(carrots?|carrot)\b/i,
    'lettuce': /\b(lettuce|romaine|iceberg|butter lettuce)\b/i,
    'spinach': /\b(spinach|baby spinach)\b/i,
    'basil': /\b(basil|fresh basil)\b/i,
    'parsley': /\b(parsley|fresh parsley|italian parsley)\b/i,
    
    // Pantry
    'flour': /\b(flour|all-purpose flour|wheat flour|bread flour)\b/i,
    'sugar': /\b(sugar|granulated sugar|brown sugar|powdered sugar)\b/i,
    'salt': /\b(salt|sea salt|kosher salt|table salt)\b/i,
    'oil': /\b(oil|olive oil|vegetable oil|canola oil)\b/i,
    'vinegar': /\b(vinegar|balsamic vinegar|apple cider vinegar)\b/i,
    
    // Proteins
    'chicken': /\b(chicken|chicken breast|chicken thigh|ground chicken)\b/i,
    'beef': /\b(beef|ground beef|beef steak|beef roast)\b/i,
    'pork': /\b(pork|pork chop|pork loin|bacon)\b/i,
    'salmon': /\b(salmon|atlantic salmon|pink salmon)\b/i,
    'eggs': /\b(eggs?|egg|large eggs)\b/i,
    
    // Grains
    'rice': /\b(rice|white rice|brown rice|basmati rice)\b/i,
    'pasta': /\b(pasta|spaghetti|penne|rigatoni)\b/i,
    'bread': /\b(bread|sourdough bread|whole wheat bread)\b/i,
    
    // Nuts
    'almonds': /\b(almonds?|almond|sliced almonds)\b/i,
    'walnuts': /\b(walnuts?|walnut|chopped walnuts)\b/i,
    'peanuts': /\b(peanuts?|peanut|peanut butter)\b/i
  };

  for (const [canonical, pattern] of Object.entries(patterns)) {
    if (pattern.test(ingredient)) {
      return canonical;
    }
  }
  
  // Fallback: return the main noun (first significant word)
  const words = ingredient.split(' ').filter(word => 
    word.length > 2 && !['fresh', 'dried', 'organic', 'raw', 'cooked', 'chopped', 'diced'].includes(word)
  );
  
  return words[0] || ingredient;
}

// Generate search terms for fuzzy matching
function generateSearchTerms(canonical) {
  const terms = [canonical];
  
  // Add common variations
  if (canonical.endsWith('s')) {
    terms.push(canonical.slice(0, -1)); // Remove 's'
  } else {
    terms.push(canonical + 's'); // Add 's'
  }
  
  // Add common synonyms
  const synonyms = {
    'tomatoes': ['tomato'],
    'onions': ['onion'],
    'carrots': ['carrot'],
    'almonds': ['almond'],
    'walnuts': ['walnut'],
    'peanuts': ['peanut'],
    'eggs': ['egg']
  };
  
  if (synonyms[canonical]) {
    terms.push(...synonyms[canonical]);
  }
  
  return terms;
}

// Enhanced product matching algorithm
async function findMatchingProducts(ingredientCanonical, options = {}) {
  const {
    limit = 10,
    includeAllergenSafe = true,
    userAllergens = []
  } = options;

  const { IngredientCategorized } = require('../db/models');
  
  console.log(`[PRODUCT MATCHING] Finding products for '${ingredientCanonical}' with ${userAllergens.length} allergens`);

  try {
    // First, try pre-computed canonical mappings
    let products = await getPrecomputedMatches(ingredientCanonical, limit);
    
    // If insufficient results, do real-time fuzzy matching
    if (products.length < limit) {
      const additionalProducts = await fuzzyMatchProducts(ingredientCanonical, limit - products.length);
      products = [...products, ...additionalProducts];
    }

    // Apply allergen filtering and ranking
    const filteredProducts = rankAndFilterProducts(products, {
      userAllergens,
      includeAllergenSafe
    });

    console.log(`[PRODUCT MATCHING] ✅ Found ${filteredProducts.length} products for '${ingredientCanonical}'`);
    return filteredProducts;

  } catch (error) {
    console.error('[PRODUCT MATCHING] Error:', error);
    return [];
  }
}

// Get pre-computed matches from canonical mappings
async function getPrecomputedMatches(canonical, limit) {
  const { IngredientCategorized } = require('../db/models');
  
  try {
    // Try exact canonical tag match first
    let products = await IngredientCategorized.findAll({
      where: {
        canonicalTag: canonical.toLowerCase(),
        canonicalTagConfidence: 'confident'
      },
      limit: limit,
      order: [['description', 'ASC']]
    });

    // If not enough, try partial matches
    if (products.length < limit) {
      const additionalProducts = await IngredientCategorized.findAll({
        where: {
          canonicalTag: {
            [Op.iLike]: `%${canonical}%`
          }
        },
        limit: limit - products.length,
        order: [['description', 'ASC']]
      });
      products = [...products, ...additionalProducts];
    }

    return products.map(p => ({
      id: p.id,
      description: p.description,
      brandName: p.brandName,
      brandOwner: p.brandOwner,
      allergens: p.allergens || [],
      hasAllergens: p.allergens && p.allergens.length > 0,
      canonicalTag: p.canonicalTag,
      confidence: p.canonicalTagConfidence
    }));

  } catch (error) {
    console.error('[PRECOMPUTED MATCHES] Error:', error);
    return [];
  }
}

// Fuzzy matching for ingredients not in canonical mappings
async function fuzzyMatchProducts(ingredient, limit) {
  const { IngredientCategorized } = require('../db/models');
  
  try {
    // Use ILIKE for fuzzy matching
    const products = await IngredientCategorized.findAll({
      where: {
        description: {
          [Op.iLike]: `%${ingredient}%`
        }
      },
      limit: limit,
      order: [['description', 'ASC']]
    });

    return products.map(p => ({
      id: p.id,
      description: p.description,
      brandName: p.brandName,
      brandOwner: p.brandOwner,
      allergens: p.allergens || [],
      hasAllergens: p.allergens && p.allergens.length > 0,
      canonicalTag: p.canonicalTag,
      confidence: 'fuzzy'
    }));

  } catch (error) {
    console.error('[FUZZY MATCHING] Error:', error);
    return [];
  }
}

// Rank and filter products based on allergens and preferences
function rankAndFilterProducts(products, options) {
  const { userAllergens = [], includeAllergenSafe = true } = options;
  
  return products
    .map(product => {
      // Check for allergen conflicts
      const hasConflictingAllergens = userAllergens.length > 0 && 
        product.allergens.some(allergen => 
          userAllergens.includes(allergen.toLowerCase())
        );
      
      // Calculate score based on confidence and allergen safety
      let score = 0;
      if (product.confidence === 'confident') score += 10;
      if (product.confidence === 'fuzzy') score += 5;
      if (!hasConflictingAllergens) score += 5;
      if (product.brandName) score += 2;
      
      return {
        ...product,
        hasConflictingAllergens,
        score
      };
    })
    .filter(product => {
      // Filter out products with conflicting allergens if allergen-safe mode is on
      if (includeAllergenSafe && product.hasConflictingAllergens) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.score - a.score); // Sort by score descending
}

// Get substitutes for allergen-containing ingredients
async function getSubstitutes(canonical, userAllergens) {
  try {
    // Find the canonical ingredient
    const canonicalIngredient = await Ingredient.findOne({
      where: { name: canonical }
    });

    if (!canonicalIngredient) {
      return [];
    }

    // Get all substitutions for this ingredient
    const substitutions = await Substitution.findAll({
      where: { IngredientId: canonicalIngredient.id }
    });

    if (substitutions.length === 0) {
      return [];
    }

    // For each substitute, find matching products
    const substitutesWithProducts = await Promise.all(
      substitutions.map(async (sub) => {
        const substituteName = sub.substituteName;
        
        // Find products that match this substitute
        const { IngredientCategorized } = require('../db/models');
        const products = await IngredientCategorized.findAll({
          where: {
            canonicalTag: substituteName.toLowerCase(),
            canonicalTagConfidence: 'confident'
          },
          limit: 5,
          order: [['description', 'ASC']]
        });

        return {
          substituteName: substituteName,
          notes: sub.notes,
          products: products.map(p => ({
            id: p.id,
            description: p.description,
            brandName: p.brandName,
            brandOwner: p.brandOwner,
            allergens: p.allergens || [],
            hasAllergens: p.allergens && p.allergens.length > 0
          }))
        };
      })
    );

    // Filter out substitutes that have no products
    return substitutesWithProducts.filter(sub => sub.products.length > 0);

  } catch (error) {
    console.error('[SUBSTITUTES] Error:', error);
    return [];
  }
}

function cleanIngredientName(raw) {
  // Remove quantities, units, and parentheticals, keep core name
  // e.g., "1/2 cups all-purpose flour" -> "all-purpose flour"
  if (!raw) return '';
  let cleaned = raw.toLowerCase();
  cleaned = cleaned.replace(/\([^)]*\)/g, ''); // remove parentheticals
  cleaned = cleaned.replace(/\d+[\/\d]*\s*/g, ''); // remove numbers/fractions
  cleaned = cleaned.replace(/\b(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lb|grams?|g|kilograms?|kg|liters?|l|milliliters?|ml|package|can|container|envelope|slice|loaf|pinch|dash|quart|qt|pint|pt|gallon|gal|stick|clove|head|bunch|sprig|piece|sheet|bag|bottle|jar|box|packet|drop|ear|stalk|strip|cube|block|bar|fillet|filet|link|drumstick|wing|leg|thigh|breast|rib|loin|chop|steak|roast|shank|shoulder|neck|tail|foot|tongue|cheek|snout|jowl|hock|trotter|knuckle|tip|bone|skin|fat|marrow|liver|gizzard|heart|kidney|tripe|sweetbread|testicle|oyster|clam|mussel|scallop|shrimp|prawn|crab|lobster|crawfish|fish|roe|egg|yolk|white|shell|meat|muscle|tendon|cartilage|gristle|sinew|membrane|fatback|crackling|rind|peel|zest|pith|core|pit|seed|stone|pod|bean|pea|lentil|chickpea|split|grain|rice|barley|oat|corn|maize|millet|sorghum|teff|quinoa|buckwheat|amaranth|spelt|kamut|triticale|farro|freekeh|bulgur|couscous|semolina|durum|graham|bread|breadcrumb|breading|cracker|biscuit|cookie|cake|pastry|pie|tart|pasta|noodle|macaroni|spaghetti|fettuccine|linguine|penne|rigatoni|ziti|rotini|fusilli|farfalle|orzo|gnocchi|ravioli|tortellini|manicotti|cannelloni|lasagna|vermicelli|capellini|spaghettini|bucatini|tagliatelle|pappardelle|cavatappi|cavatelli|orecchiette|strozzapreti|tortelloni|tortellacci)\b/g, ''); // remove units/words
  cleaned = cleaned.replace(/\s{2,}/g, ' '); // collapse spaces
  cleaned = cleaned.trim();
  return cleaned;
}

module.exports = router