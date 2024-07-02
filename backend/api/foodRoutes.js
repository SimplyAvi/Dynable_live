const express = require('express');
const { Op, Sequelize } = require('sequelize');
const router = express.Router();
const Food = require('../db/models/Food');
const { Subcategory } = require('../db/models');

// GET /api/foods route for searching foods
router.get('/api/foods', async (req, res) => {
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

router.post('/api/foods', async (req, res) => {
  try {
    const { name, excludeIngredients } = req.body || {};
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // console.log('name:', name, 'exclude:', excludeIngredients, req.body)

    // Define the search criteria
    const whereClause = {};
    if (name) {
      whereClause.description = {
        [Op.iLike]: `%${name}%`,
      };
    }

    // Define the exclusion criteria for foods containing certain ingredients
    const excludedFoodIds = [];
    if (excludeIngredients && Array.isArray(excludeIngredients) && excludeIngredients.length > 0) {
      // Find the IDs of foods that contain excluded ingredients
      const excludedFoods = await Food.findAll({
        attributes: ['id'],
        where: {
          [Op.or]: excludeIngredients.map(excludedIngredient => {
            return Sequelize.where(
              Sequelize.col('ingredients'),
              'ILIKE',
              `%${excludedIngredient.toLowerCase()}%`
            );
          }),
        },
      });
      excludedFoodIds.push(...excludedFoods.map(food => food.id));
    }

   // Perform the query with pagination and exclusion criteria
    const foods = await Food.findAll({
      where: {
        ...whereClause,
        id: {
          [Op.notIn]: excludedFoodIds,
        },
      },
      offset,
      limit: parseInt(limit, 10),
    });

    // Get the total count of foods for pagination
    const totalCount = await Food.count({
      where: {
        ...whereClause,
        id: {
          [Op.notIn]: excludedFoodIds,
        },
      },
    });

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

// GET /api/foods route for searching foods
router.get('/api/product', async (req, res) => {
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

router.post('/api/product/subcat', async (req,res)=>{
  try {
    const {id, allergens} = req.body || {}
    // Find one food item with the specified subcategoryId
    const foodItem = await Food.findOne({
        where: {
            SubcategoryID: id,
            allergens: {
                [Sequelize.Op.notIn]: allergens
            }
        }
    });

    // If no food item found or it contains excluded allergens, return null
    if (!foodItem) {
        return null;
    }
    res.json(foodItem)
} catch (err) {
    console.error('Error finding food item:', err);
    throw err;
}
})

router.post('/api/product/nosubcat', async (req,res)=>{
  try {
    const {name, allergens} = req.body || {}
    // Find one food item with a name similar to the given name
    const foodItem = await Food.findOne({
        where: {
            description: {
                [Op.like]: `%${name}%`
            },
            allergens: {
                [Op.overlap]: [], // Ensure the allergens array is defined
                [Op.notIn]: excludedAllergens
            }
        }
    });

    // If no food item found or it contains excluded allergens, return null
    if (!foodItem) {
        return null;
    }

    res.json(foodItem)
} catch (err) {
    console.error('Error finding food item:', err);
    throw err;
}
})

module.exports = router;