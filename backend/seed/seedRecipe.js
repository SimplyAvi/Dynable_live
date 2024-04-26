// seed.js

// Import necessary modules and models
const fs = require('fs');
const path = require('path');
const sequelize = require('../db/database');
const Recipe = require('../db/models/Recipe/Recipe');

const Ingredients = require('../db/models/Recipe/Ingredients');

// Function to read JSON files and seed data
const seedRecipes = async () => {
  const jsonDir = path.join(__dirname, './Data/Recipes'); // Assuming JSON files are stored in a directory named 'data' within the project
  try {
    // Read all files in the directory
    const files = fs.readdirSync(jsonDir);
    let totalRecipes = 0
    let totalIngredients = 0
    // Loop through each file
    for (const file of files) {
      const innerFiles = fs.readdirSync(`${jsonDir}/${file}`)
      for (const innerFile of innerFiles){
        // console.log('inner file:', innerFile)
      if (innerFile.endsWith('.json')) {
        // Read JSON file
        const data = JSON.parse(fs.readFileSync(`${jsonDir}/${file}/${innerFile}`, 'utf8'));

        // Create recipe record in database
        const recipe = await Recipe.create({
          title: data.title,
          directions: data.directions,
          source: data.source,
          tags: data.tags,
          url: data.url
        },{ validate: true , logging: false });
        totalRecipes++
        // Create ingredient records and associate with recipe
        // ** FOR FUTURE ADD NEW ALGO TO REMOVE QUANTITY IF IT EXISTS**
        // USE QUANTITY 
        const ingredients = data.ingredients.map(ingredient => {
          const splitI = ingredient.split(' ');
          const quantity = splitI[0]
          const name = splitI.slice(1,splitI.length-1).join(' ')
          return {
            quantity,
            name,
            RecipeId: recipe.id
          };
        });
        totalIngredients+=ingredients.length
        await Ingredients.bulkCreate(ingredients, { validate: true , logging: false });
        // console.log('seeding Ingredients:', ingredients)
      }
      // console.log(`Data seeded from ${file}/${innerFile}`);
    }
      // console.log(`Data seeded from ${file}`);
  }
    console.log(`seeded ${totalRecipes}recipes and ${totalIngredients}ingredients`)
    console.log('All recipes seeded successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

// Seed data
// seedData();
module.exports = seedRecipes
