const { IngredientCategorized } = require('../db/models');

async function checkWheatInPizza() {
  console.log('Starting debug script: Checking for wheat in pizza products...');
  try {
    // Find one product that is a "pizza" and contains "wheat" in its ingredients
    const pizzaWithWheat = await IngredientCategorized.findOne({
      where: {
        description: {
          [IngredientCategorized.sequelize.Op.iLike]: '%pizza%',
        },
        ingredients: {
          [IngredientCategorized.sequelize.Op.iLike]: '%wheat%',
        }
      }
    });

    if (pizzaWithWheat) {
      console.log('Found a matching product:');
      console.log('-------------------------');
      console.log('ID:', pizzaWithWheat.id);
      console.log('Description:', pizzaWithWheat.description);
      console.log('RecipeIngredients snippet:', pizzaWithWheat.ingredients.substring(0, 100) + '...');
      console.log('Allergens Array in DB:', pizzaWithWheat.allergens);
      console.log('-------------------------');

      if (pizzaWithWheat.allergens && pizzaWithWheat.allergens.map(a => a.toLowerCase()).includes('wheat')) {
        console.log('CONCLUSION: The "Wheat" tag is CORRECTLY present. The issue is likely in the backend API query.');
      } else {
        console.log('CONCLUSION: The "Wheat" tag is MISSING. The issue is in the `AddAllergyTags.js` seeding script.');
      }
    } else {
      console.log('Could not find a pizza product containing "wheat" in the database to test.');
    }

  } catch (error) {
    console.error('An error occurred during the debug script:', error);
  } finally {
    await IngredientCategorized.sequelize.close();
    console.log('Database connection closed.');
  }
}

checkWheatInPizza(); 