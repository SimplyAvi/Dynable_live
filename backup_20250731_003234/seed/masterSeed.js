const db = require('../db/database');
const { IngredientCategorized } = require('../db/models');
const seedRecipes = require('./seedRecipe');
const seedCategories = require('./seedCategories');
const assignSubcategories = require('./AssignSubcategories');
const addAllergenTags = require('./AddAllergyTags');

async function masterSeed() {
  console.log('Starting master seed process...');
  console.time('masterSeed');
  
  try {
    // 1. Reset the database
    await db.sync({ force: true });
    console.log('Database synced! All data cleared.');

    // 2. Seed Categories and Subcategories
    await seedCategories();
    console.log('Seeded categories and subcategories.');

    // 3. Seed IngredientCategorized Products from data files
    console.log('Seeding food products...');
    let totalSeeded = 0;
    for (let i = 38; i <= 47; i++) {
      const foodArr = require(`./Data/Products/split_${i}.js`);
      const foods = await IngredientCategorized.bulkCreate(foodArr, { validate: true, logging: false });
      totalSeeded += foods.length;
      console.log(`  - Seeded split_${i}.js (${foods.length} products)`);
    }
    console.log(`Seeded a total of ${totalSeeded} products!`);

    // 4. Assign Subcategories to Products
    await assignSubcategories();
    console.log('Assigned subcategories to products.');

    // 5. Add Allergen Tags to Products
    await addAllergenTags();
    console.log('Added allergen tags to products.');

    // 6. Seed Recipes
    await seedRecipes();
    console.log('Seeded recipes.');

  } catch (err) {
    console.error('An error occurred during the master seed process:');
    console.error(err);
    process.exitCode = 1;
  } finally {
    console.log('Closing database connection...');
    await db.close();
    console.log('Database connection closed.');
  }
  
  console.timeEnd('masterSeed');
  console.log('Master seed process completed successfully!');
}

// Run the seeder if this file is executed directly
if (module === require.main) {
  masterSeed();
}

module.exports = masterSeed; 