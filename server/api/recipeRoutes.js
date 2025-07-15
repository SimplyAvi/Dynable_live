const express = require('express')
const { Op, Sequelize } = require('sequelize');
const router = express.Router()
const Recipe = require('../db/models/Recipe/Recipe')
const Ingredient = require('../db/models/Recipe/Ingredient');
const { IngredientToCanonical, CanonicalIngredient, AllergenDerivative, Substitution } = require('../db/models');

// Post request to send allergens to be filtered during api call
router.post('/', async (req, res) => {
  try {
    const { search, excludeIngredients } = req.body || {};
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Map frontend keys to backend format if needed
    const mappedAllergens = (excludeIngredients || []).map(a =>
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
        SELECT 1 FROM "Ingredients" i
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
      LEFT JOIN "Ingredients" AS i ON r.id = i."RecipeId"
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
      LEFT JOIN "Ingredients" AS i ON r.id = i."RecipeId"
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
    const allCanonicals = await CanonicalIngredient.findAll();
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
          canonical = await CanonicalIngredient.findByPk(mapping.CanonicalIngredientId);
          canonicalName = canonical ? canonical.name : null;
          if (canonical && expandedAllergens.length > 0 && canonical.allergens && canonical.allergens.some(a => expandedAllergens.includes(a.toLowerCase()))) {
            flagged = true;
            const subs = await Substitution.findAll({ where: { CanonicalIngredientId: canonical.id } });
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
                const subs = await Substitution.findAll({ where: { CanonicalIngredientId: fallbackCanonical.id } });
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
    const { Food } = require('../db/models');

    if (!canonicalIngredient) {
      return res.status(400).json({ error: 'Canonical ingredient name is required' });
    }

    console.log(`🔍 Looking for substitutes for: ${canonicalIngredient}`);

    // Find the canonical ingredient
    const canonical = await CanonicalIngredient.findOne({
      where: { name: canonicalIngredient }
    });

    if (!canonical) {
      return res.status(404).json({ 
        error: `Canonical ingredient '${canonicalIngredient}' not found` 
      });
    }

    // Get all substitutions for this ingredient
    const substitutions = await Substitution.findAll({
      where: { CanonicalIngredientId: canonical.id }
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
        const products = await Food.findAll({
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