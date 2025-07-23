const { IngredientCategorized, sequelize } = require('../db/models');
const { Op } = require('sequelize');

async function checkAllergenTagging() {
  console.log('Starting debug script: Checking for "Wheat" tag on products with "wheat flour"...');
  try {
    const productWithWheatFlour = await IngredientCategorized.findOne({
      where: {
        ingredients: {
          [Op.iLike]: '%wheat flour%',
        }
      }
    });

    if (productWithWheatFlour) {
      console.log('Found a matching product:');
      console.log('-------------------------');
      console.log('ID:', productWithWheatFlour.id);
      console.log('Description:', productWithWheatFlour.description);
      console.log('RecipeIngredients snippet:', productWithWheatFlour.ingredients.substring(0, 150) + '...');
      console.log('Allergens Array in DB:', productWithWheatFlour.allergens);
      console.log('-------------------------');

      if (productWithWheatFlour.allergens && productWithWheatFlour.allergens.map(a => a.toLowerCase()).includes('wheat')) {
        console.log('CONCLUSION: The "Wheat" tag is CORRECTLY present. The issue is likely in the backend API query.');
      } else {
        console.log('CONCLUSION: The "Wheat" tag is MISSING. The issue is in the `AddAllergyTags.js` seeding script.');
      }
    } else {
      console.log('Could not find a product containing "wheat flour" in the database to test.');
    }

  } catch (error) {
    console.error('An error occurred during the debug script:', error);
  } finally {
    if (sequelize) {
        await sequelize.close();
        console.log('Database connection closed.');
    }
  }
}

checkAllergenTagging(); 