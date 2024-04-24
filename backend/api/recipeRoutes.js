const express = require('express')
const {OP, Sequelize} = require('sequelize')
const router = express.Router()
const axios = require('axios')

// Post request to send allergens to be filtered during api call
router.post('/api/recipe', async (req,res)=>{
    try {
        const { search , excludeIngredients } = req.body || {};
        const { page = 1, limit = 10 } = req.query;
    
        console.log('search:', search, 'exclude:', excludeIngredients, req.body)

         const recipeResponse = await axios.get(`https://api.edamam.com/api/recipes/v2?type=public&q=${search}&app_id=b5bdebe7&app_key=%2020298931767c31f1e76a6473d8cdd7bc`)
        // console.log('recipeResponse:', recipeResponse.data)
    
        res.json(recipeResponse.data)

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

module.exports = router