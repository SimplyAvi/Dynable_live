const sequelize = require('../db/database');

async function debugAllergenFilterResults() {
  console.log('--- Debugging Allergen Filter Results (Raw SQL) ---');
  try {
    // Use a raw SQL query to check for products with 'bread' or 'pizza' and 'wheat' in allergens (case-insensitive)
    const [results] = await sequelize.query(`
      SELECT id, description, ingredients, allergens
      FROM "IngredientCategorized"
      WHERE (description ILIKE '%bread%' OR description ILIKE '%pizza%')
        AND EXISTS (
          SELECT 1 FROM unnest(allergens) a WHERE LOWER(a) = 'wheat'
        )
      LIMIT 10;
    `);

    if (!results.length) {
      console.log('No products found with "bread" or "pizza" in the description and "wheat" in allergens.');
    } else {
      results.forEach((product, idx) => {
        console.log(`\nProduct #${idx + 1}`);
        console.log('ID:', product.id);
        console.log('Description:', product.description);
        console.log('RecipeIngredients:', product.ingredients);
        console.log('Allergens:', product.allergens);
      });
    }
  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

debugAllergenFilterResults(); 