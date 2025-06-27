const express = require('express')
const { Op, Sequelize } = require('sequelize');
const router = express.Router()
// const Recipe = require('../db/models/Recipe/Recipe')
// const Ingredient = require('../db/models/Recipe/Ingredient');
const { Category, Subcategory } = require('../db/models');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour


// Example code for get request for Catagory
// From Chatgpt, changed the pathing to miminc the data path "API/"
router.get('/foodCategories', async (req, res) => {
    const cacheKey = 'categoryHierarchy';
    try {
        const cachedHierarchy = cache.get(cacheKey);
        if (cachedHierarchy) {
            console.log('Serving from cache');
            return res.json(cachedHierarchy);
        }

        console.log('Fetching from database and building hierarchy');
        const categories = await Category.findAll({
            include: [{
                model: Subcategory,
                as: 'subcategories'
            }]
        });

        const hierarchy = categories.map(category => ({
            ...category.toJSON(),
            children: category.subcategories.map(sub => sub.toJSON())
        }));
        
        cache.set(cacheKey, hierarchy);
        res.json(hierarchy);

    } catch (error) {
        console.error('Error fetching food categories:', error);
        res.status(500).json({ error: 'An error occurred while fetching the food categories' });
    }
});

module.exports = router;  
    
    
    
    
// Example code for post request to filter out certain Category with restrictions

    
