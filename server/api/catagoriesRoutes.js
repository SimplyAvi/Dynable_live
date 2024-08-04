const express = require('express')
const { Op, Sequelize } = require('sequelize');
const router = express.Router()
// const Recipe = require('../db/models/Recipe/Recipe')
// const Ingredient = require('../db/models/Recipe/Ingredient');
const { Category } = require('../db/models');


// Example code for get request for Catagory
// From Chatgpt, changed the pathing to miminc the data path "API/"
router.get('/api/foodCategories', async (req, res) => {
      console.log('hello')
      try {
    //   From Chat GPT, changed the catagory to match the contstns on the top
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the food categories' });
  }
});

module.exports = router;  
    
    
    
    
// Example code for post request to filter out certain Category with restrictions

    
