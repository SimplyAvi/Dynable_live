// seed.js

// Import necessary modules and models
const { IngredientCategorized, Recipe, RecipeIngredient } = require('../db/models');
const fs = require('fs');
const path = require('path');
const sequelize = require('../db/database');

// Function to read JSON files and seed data
async function seedRecipes() {
  try {
    const jsonDir = path.join(__dirname, 'Data', 'Recipes-and-Ing-list');
    // Read all files in the directory
    const files = fs.readdirSync(jsonDir);
    let totalRecipes = 0
    let totalRecipeIngredients = 0
    // Loop through each file
    for (const file of files) {
      const innerFiles = fs.readdirSync(`${jsonDir}/${file}`);
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
          const name = splitI.slice(1,splitI.length).join(' ')
          const ingredientObj = {
            quantity,
            name,
            RecipeId: recipe.id
          };
          console.log('Creating ingredient:', ingredientObj); // <-- Added logging
          return ingredientObj;
        });
        totalRecipeIngredients+=ingredients.length
        await RecipeIngredient.bulkCreate(ingredients, { validate: true , logging: false });
        // console.log('seeding Ingredient:', ingredients)
      }
      // console.log(`Data seeded from ${file}/${innerFile}`);
    }
      console.log(`Data seeded from ${file}`);
  }
    console.log(`seeded ${totalRecipes}recipes and ${totalRecipeIngredients}ingredients`)
    console.log('All recipes seeded successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

// Seed data
// seedData();
module.exports = seedRecipes
