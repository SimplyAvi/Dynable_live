const express = require('express');
const { Op, Sequelize } = require('sequelize');
const router = express.Router();
const Food = require('../db/models/Food');
const { Subcategory } = require('../db/models');

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
router.get('/product', async (req, res) => {
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
    
    // Ensure allergens is an array
    if (!Array.isArray(allergens)) {
      return res.status(400).json({ error: 'Invalid allergens data' });
    }

    // Find one food item with a name similar to the given name
    const foodItem = await Food.findOne({
        where: {
            description: {
                [Op.iLike]: `%${name}%`  // Using iLike for case-insensitive search
            },
            [Op.and]: [
                Sequelize.literal('"allergens" IS NOT NULL'),  // Ensure allergens field exists
                Sequelize.literal(`NOT ("allergens" && ARRAY[:allergens]::varchar[])`)  // Check for allergen overlap
            ]
        },
        replacements: { allergens },
        limit: 1
    });

    // If no food item found or it contains excluded allergens, return error
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