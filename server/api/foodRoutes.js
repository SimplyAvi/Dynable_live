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

    // Construct the base query
    let baseQuery = `
      SELECT * FROM "Food"
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) FROM "Food"
      WHERE 1=1
    `;
    const replacements = {};

    // Add search criteria to the query
    if (name) {
      baseQuery += ` AND description ILIKE :name`;
      countQuery += ` AND description ILIKE :name`;
      replacements.name = `%${name}%`;
    }

    // Handle exclusion criteria for foods containing certain ingredients
    if (excludeIngredients && Array.isArray(excludeIngredients) && excludeIngredients.length > 0) {
      baseQuery += ` AND "id" NOT IN (
        SELECT "id" FROM "Food" WHERE ` + excludeIngredients.map((_, index) => {
        replacements[`excludeIngredient${index}`] = `%${excludeIngredients[index].toLowerCase()}%`;
        return `ingredients ILIKE :excludeIngredient${index}`;
      }).join(' OR ') + `)`;
      countQuery += ` AND "id" NOT IN (
        SELECT "id" FROM "Food" WHERE ` + excludeIngredients.map((_, index) => {
        return `ingredients ILIKE :excludeIngredient${index}`;
      }).join(' OR ') + `)`;
    }

    // Add pagination to the base query
    baseQuery += ` LIMIT :limit OFFSET :offset`;
    replacements.limit = parseInt(limit, 10);
    replacements.offset = offset;

    // Execute the queries
    const foods = await Food.sequelize.query(baseQuery, {
      replacements,
      type: Sequelize.QueryTypes.SELECT,
    });
    const totalCountResult = await Food.sequelize.query(countQuery, {
      replacements,
      type: Sequelize.QueryTypes.SELECT,
    });

    const totalCount = parseInt(totalCountResult[0].count, 10);

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

router.post('/api/product/subcat', async (req, res) => {
  try {
    const { id, allergens } = req.body || {};
    
    // Check if id is provided and allergens is an array
    if (!id || !Array.isArray(allergens)) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Ensure allergens is an array of strings
    console.log('allergens', Array.isArray(allergens), typeof allergens[0])
    const validAllergens = allergens.map(String);

    // Find one food item with the specified SubcategoryID and excluding certain allergens
    const foodItem = await Food.findAll({
      where: {
        SubcategoryID: id,
        allergens: {
          [Op.not]: {
            [Op.overlap]: validAllergens
          }
        }
      }
    });

    // If no food item found, return an appropriate response
    if (!foodItem) {
      return res.status(404).json({ error: 'No food item found' });
    }

    res.json(foodItem);
  } catch (err) {
    console.error('Error finding food item:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
                [Op.notIn]: allergens
            }
        }
    });

    // If no food item found or it contains excluded allergens, return null
    if (!foodItem) {
        return res.status(500).json({ error: 'Internal server error' });
    }

    res.json(foodItem)
} catch (err) {
    console.error('Error finding food item: here', err);
    throw err;
}
})

module.exports = router;