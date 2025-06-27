const express = require('express')
const { Op, Sequelize } = require('sequelize');
const router = express.Router()
const Recipe = require('../db/models/Recipe/Recipe')
const Ingredient = require('../db/models/Recipe/Ingredient');

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
        WHERE i."RecipeId" = "Recipe"."id"
        AND i."name" ILIKE :allergen${idx}
      )`;
      replacements[`allergen${idx}`] = `%${allergen}%`;
    });

    const sql = `
      SELECT * FROM "Recipes" AS "Recipe"
      WHERE ${where}
      LIMIT :limit OFFSET :offset
    `;

    const recipes = await Recipe.sequelize.query(sql, {
      replacements,
      model: Recipe,
      mapToModel: true,
    });

    res.json(recipes);
  } catch (error) {
    console.error('Error searching for recipes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/recipe route for searching recipe
router.get('/', async (req, res) => {
  try {
    const { id } = req.query;
    console.log('looking for:', id)

    const recipe = await Recipe.findByPk(id)

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    return res.json(recipe)

  } catch (error) {
    console.error('Error searching for recipes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router