const express = require('express');
const router = express.Router();
const { IngredientCategorized, Ingredient, Substitution } = require('../db/models');
const { Op } = require('sequelize');
const { cleanIngredientName } = require('./foodRoutes');

// Enhanced substitute products endpoint leveraging existing smart patterns
router.get('/substitute-products', async (req, res) => {
  try {
    const { canonicalIngredient, allergens } = req.query;
    
    console.log('🔍 Looking for substitutes for:', canonicalIngredient);
    
    if (!canonicalIngredient) {
      return res.status(400).json({ error: 'canonicalIngredient is required' });
    }

    // 1. Find the canonical ingredient
    const canonical = await Ingredient.findOne({
      where: { name: canonicalIngredient }
    });

    if (!canonical) {
      console.log('❌ Canonical ingredient not found:', canonicalIngredient);
      return res.json({ ingredient: canonicalIngredient, substitutes: [] });
    }

    // 2. Get substitutes using existing smart patterns
    const substitutions = await Substitution.findAll({
      where: { IngredientId: canonical.id },
      order: [['substituteName', 'ASC']]
    });

    console.log(`✅ Found ${substitutions.length} total substitutes for '${canonicalIngredient}'`);

    // 3. Build substitute products using existing confidence and allergen patterns
    const substituteProducts = [];
    let totalProductsFound = 0;

    for (const substitution of substitutions) {
      console.log(`   Looking for products with canonical tag: "${substitution.substituteName}"`);
      
      // Use existing smart patterns: confidence filtering + allergen filtering
      let whereClause = {
        canonicalTag: substitution.substituteName,
        canonicalTagConfidence: 'confident' // Use existing confidence system
      };

      // Apply existing allergen filtering if allergens provided
      if (allergens && Array.isArray(allergens) && allergens.length > 0) {
        const allergenLiteral = require('sequelize').literal(`("allergens" IS NULL OR NOT EXISTS (
          SELECT 1 FROM unnest("allergens") a WHERE LOWER(a) = ANY(ARRAY[${allergens.map(a => `'${a.toLowerCase()}'`).join(',')}])
        ))`);
        whereClause = {
          [Op.and]: [whereClause, allergenLiteral]
        };
      }

      const products = await IngredientCategorized.findAll({
        where: whereClause,
        order: [['description', 'ASC']],
        limit: 10
      });

      console.log(`   Found ${products.length} products for "${substitution.substituteName}"`);

      if (products.length > 0) {
        substituteProducts.push({
          substituteName: substitution.substituteName,
          notes: substitution.notes,
          products: products.map(p => ({
            id: p.id,
            description: p.description,
            shortDescription: p.shortDescription,
            canonicalTag: p.canonicalTag,
            canonicalTagConfidence: p.canonicalTagConfidence
          }))
        });
        totalProductsFound += products.length;
      }
    }

    console.log(`✅ Found ${substituteProducts.length} substitutes with available products, ${totalProductsFound} total products`);

    res.json({
      ingredient: canonicalIngredient,
      substitutes: substituteProducts,
      totalSubstitutes: substitutions.length,
      substitutesWithProducts: substituteProducts.length,
      totalProducts: totalProductsFound
    });

  } catch (error) {
    console.error('Error in substitute-products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced substitute lookup with smart description matching
router.post('/smart-substitute-lookup', async (req, res) => {
  try {
    const { ingredientName, allergens } = req.body;
    
    if (!ingredientName) {
      return res.status(400).json({ error: 'ingredientName is required' });
    }

    // Use existing cleanIngredientName function for smart matching
    const cleanedName = cleanIngredientName(ingredientName);
    console.log(`🔍 Smart substitute lookup for: "${ingredientName}" → "${cleanedName}"`);

    // Find canonical ingredient using existing patterns
    let canonical = cleanedName;
    const canonicalIngredient = await Ingredient.findOne({
      where: { name: canonical }
    });

    if (!canonicalIngredient) {
      console.log('❌ No canonical ingredient found for:', cleanedName);
      return res.json({ 
        ingredient: ingredientName, 
        canonicalIngredient: null,
        substitutes: [] 
      });
    }

    // Get substitutes using existing substitution patterns
    const substitutions = await Substitution.findAll({
      where: { IngredientId: canonicalIngredient.id },
      order: [['substituteName', 'ASC']]
    });

    // Build response with existing smart patterns
    const substitutes = [];
    let totalProducts = 0;

    for (const substitution of substitutions) {
      // Use existing confidence and allergen filtering
      let whereClause = {
        canonicalTag: substitution.substituteName,
        canonicalTagConfidence: 'confident'
      };

      if (allergens && Array.isArray(allergens) && allergens.length > 0) {
        const allergenLiteral = require('sequelize').literal(`("allergens" IS NULL OR NOT EXISTS (
          SELECT 1 FROM unnest("allergens") a WHERE LOWER(a) = ANY(ARRAY[${allergens.map(a => `'${a.toLowerCase()}'`).join(',')}])
        ))`);
        whereClause = {
          [Op.and]: [whereClause, allergenLiteral]
        };
      }

      const products = await IngredientCategorized.findAll({
        where: whereClause,
        order: [['description', 'ASC']],
        limit: 5
      });

      substitutes.push({
        substituteName: substitution.substituteName,
        notes: substitution.notes,
        productCount: products.length,
        products: products.map(p => ({
          id: p.id,
          description: p.description,
          shortDescription: p.shortDescription,
          canonicalTag: p.canonicalTag,
          confidence: p.canonicalTagConfidence
        }))
      });

      totalProducts += products.length;
    }

    console.log(`✅ Smart lookup found ${substitutes.length} substitutes with ${totalProducts} total products`);

    res.json({
      ingredient: ingredientName,
      canonicalIngredient: canonicalIngredient.name,
      substitutes: substitutes,
      totalSubstitutes: substitutions.length,
      substitutesWithProducts: substitutes.filter(s => s.productCount > 0).length,
      totalProducts: totalProducts
    });

  } catch (error) {
    console.error('Error in smart-substitute-lookup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 