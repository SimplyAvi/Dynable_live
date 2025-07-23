const { IngredientCategorized } = require('../db/models');
const sequelize = require('../db/database');
const { Op, Sequelize } = require('sequelize');

async function testPizzaWheatFilter() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB. Running pizza + wheat filter test...');

    const name = 'pizza';
    const allergen = 'wheat';

    const whereClause = { [Op.and]: [] };
    whereClause[Op.and].push({
      description: { [Op.iRegexp]: `\\y${name}\\y` }
    });
    whereClause[Op.and].push(
      Sequelize.literal(`NOT EXISTS (SELECT 1 FROM unnest(allergens) a WHERE LOWER(a) = '${allergen}')`)
    );

    const products = await IngredientCategorized.findAll({
      where: whereClause,
      order: [['id', 'ASC']],
      limit: 20
    });

    console.log(`Found ${products.length} products for pizza + wheat filter.`);
    products.forEach((p, i) => {
      console.log(`\n#${i + 1}: ${p.description}`);
      console.log('Allergens:', p.allergens);
    });
  } catch (err) {
    console.error('Error running pizza + wheat filter test:', err);
  } finally {
    await sequelize.close();
  }
}

testPizzaWheatFilter(); 