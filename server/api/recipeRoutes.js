const express = require('express')
const { Op, Sequelize } = require('sequelize');
const router = express.Router()
const Recipe = require('../db/models/Recipe/Recipe')
const Ingredient = require('../db/models/Recipe/Ingredient');
const { Subcategory } = require('../db/models');

// Post request to send allergens to be filtered during api call
router.post('/recipe', async (req,res)=>{
    try {
        const { search, excludeIngredients } = req.body || {};
        const { page = 1, limit = 10 } = req.query;
    
        console.log('search:', search, 'exclude:', excludeIngredients, req.body)

            // Define the search criteria
    const whereClause = {};
    if (search) {
      whereClause.title = {
        [Op.iLike]: `%${search}%`,
      };
    }
    // if (ingredients){
    //   includeClause.model = Ingredient
    //   includeClause.where = {
    //     RecipeId : 
    //   }
    // }

      const recipeResponse = await Recipe.findAll({
        where: whereClause,
        include: [{
          model: Ingredient,
          include: [{
            model: Subcategory,
          }],
          required: true,
        }],
        limit: parseInt(limit, 10)
      })
      // console.log('recipe response:', recipeResponse)
    
        res.json(recipeResponse)

        // return res.json({
        //   totalCount,
        //   totalPages: Math.ceil(totalCount / limit),
        //   currentPage: parseInt(page, 10),
        //   foods,
        // });
      } catch (error) {
        console.error('Error searching for foods:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
})

// GET /api/recipe route for searching recipe
router.get('/recipe', async (req, res) => {
  try {
    const { id } = req.query;
    console.log('looking for:', id)

    const recipe = await Recipe.findByPk(id,{
      include: [{
        model: Ingredient,
        required: false,
      }],
    })

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