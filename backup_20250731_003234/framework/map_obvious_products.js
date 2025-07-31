const { IngredientCategorized, Ingredient, sequelize } = require('./db/models');
const { Op } = require('sequelize');
const fs = require('fs');

// Curated list of high-priority canonicals (edit as needed)
const TARGET_CANONICALS = [
  'oil', 'pepper', 'kale', 'sausage', 'apples', 'limes', 'strawberries', 'vinaigrette', 'syrup', 'dough', 'oranges', 'mixture', 'rub', 'paper', 'eggs', 'milk', 'bread', 'cheese', 'flour', 'butter', 'onion', 'garlic', 'spinach', 'carrots', 'potatoes', 'chicken', 'beef', 'pork', 'fish', 'rice', 'beans', 'tomato', 'lettuce', 'bacon', 'ham', 'turkey', 'yogurt', 'cream', 'mayonnaise', 'mustard', 'vinegar', 'honey', 'almonds', 'walnuts', 'cashews', 'peanuts', 'broccoli', 'cauliflower', 'zucchini', 'cucumber', 'celery', 'corn', 'peas', 'mushrooms', 'bell pepper', 'chili', 'cilantro', 'basil', 'parsley', 'thyme', 'rosemary', 'sage', 'oregano', 'dill', 'mint', 'lemon', 'lime', 'orange', 'grapes', 'blueberries', 'raspberries', 'blackberries', 'pear', 'peach', 'plum', 'cherry', 'watermelon', 'cantaloupe', 'pineapple', 'mango', 'avocado', 'eggplant', 'squash', 'pumpkin', 'sweet potato', 'asparagus', 'artichoke', 'beet', 'radish', 'turnip', 'parsnip', 'leek', 'shallot', 'scallion', 'chive', 'ginger', 'turmeric', 'cinnamon', 'nutmeg', 'clove', 'cardamom', 'coriander', 'cumin', 'fennel', 'anise', 'sesame', 'sunflower', 'pumpkin seed', 'chia', 'flax', 'quinoa', 'barley', 'oats', 'wheat', 'rye', 'spelt', 'millet', 'buckwheat', 'amaranth', 'teff', 'sorghum', 'farro', 'bulgur', 'couscous', 'polenta', 'grits', 'rice flour', 'cornmeal', 'semolina', 'tapioca', 'arrowroot', 'potato starch', 'cornstarch', 'soy', 'tofu', 'tempeh', 'seitan', 'miso', 'edamame', 'lentil', 'chickpea', 'pea protein', 'seeds', 'nuts', 'legumes', 'greens', 'herbs', 'spices', 'seasoning', 'blend', 'mix', 'stock', 'broth', 'bouillon', 'base', 'paste', 'sauce', 'dressing', 'spread', 'dip', 'jam', 'jelly', 'preserve', 'relish', 'chutney', 'compote', 'curd', 'marmalade', 'salsa', 'guacamole', 'hummus', 'pesto', 'tapenade', 'aioli', 'tzatziki', 'raita', 'romesco', 'harissa', 'chimichurri', 'gremolata', 'ponzu', 'teriyaki', 'hoisin', 'sriracha', 'gochujang', 'wasabi', 'tahini', 'nut butter', 'peanut butter', 'almond butter', 'cashew butter', 'sunflower butter', 'hazelnut spread', 'chocolate spread', 'caramel', 'fudge', 'marshmallow', 'nougat', 'toffee', 'brittle', 'praline', 'truffle', 'bonbon', 'candy', 'confection', 'sweet', 'dessert', 'pastry', 'cake', 'cookie', 'biscuit', 'cracker', 'wafer', 'bar', 'granola', 'cereal', 'muesli', 'trail mix', 'snack', 'chip', 'popcorn', 'pretzel', 'rice cake', 'puff', 'crisp', 'crouton', 'breadstick', 'flatbread', 'pita', 'naan', 'tortilla', 'wrap', 'bun', 'roll', 'bagel', 'muffin', 'scone', 'brioche', 'croissant', 'danish', 'strudel', 'turnover', 'tart', 'pie', 'galette', 'clafoutis', 'souffle', 'pudding', 'custard', 'flan', 'creme brulee', 'mousse', 'parfait', 'trifle', 'eclair', 'profiterole', 'cream puff', 'choux', 'beignet', 'fritter', 'doughnut', 'babka', 'kugel', 'blintz', 'crepe', 'pancake', 'waffle', 'french toast', 'omelet', 'quiche', 'frittata', 'souffle', 'scramble', 'hash', 'latke', 'rosti', 'tortilla espanola', 'tamale', 'empanada', 'samosa', 'pierogi', 'ravioli', 'tortellini', 'agnolotti', 'cappelletti', 'dumpling', 'potsticker', 'gyoza', 'bao', 'bun', 'mantou', 'siu mai', 'har gow', 'wonton', 'spring roll', 'egg roll', 'summer roll', 'rice paper roll', 'lettuce wrap', 'cabbage roll', 'stuffed pepper', 'stuffed squash', 'stuffed eggplant', 'stuffed mushroom', 'stuffed chicken', 'stuffed pork', 'stuffed beef', 'stuffed fish', 'stuffed shell', 'stuffed pasta', 'stuffed bread', 'stuffed pastry', 'stuffed dessert', 'stuffed fruit', 'stuffed vegetable', 'stuffed grain', 'stuffed legume', 'stuffed nut', 'stuffed seed', 'stuffed cheese', 'stuffed tofu', 'stuffed tempeh', 'stuffed seitan', 'stuffed miso', 'stuffed edamame', 'stuffed lentil', 'stuffed chickpea', 'stuffed pea protein', 'stuffed greens', 'stuffed herbs', 'stuffed spices', 'stuffed seasoning', 'stuffed blend', 'stuffed mix', 'stuffed stock', 'stuffed broth', 'stuffed bouillon', 'stuffed base', 'stuffed paste', 'stuffed sauce', 'stuffed dressing', 'stuffed spread', 'stuffed dip', 'stuffed jam', 'stuffed jelly', 'stuffed preserve', 'stuffed relish', 'stuffed chutney', 'stuffed compote', 'stuffed curd', 'stuffed marmalade', 'stuffed salsa', 'stuffed guacamole', 'stuffed hummus', 'stuffed pesto', 'stuffed tapenade', 'stuffed aioli', 'stuffed tzatziki', 'stuffed raita', 'stuffed romesco', 'stuffed harissa', 'stuffed chimichurri', 'stuffed gremolata', 'stuffed ponzu', 'stuffed teriyaki', 'stuffed hoisin', 'stuffed sriracha', 'stuffed gochujang', 'stuffed wasabi', 'stuffed tahini', 'stuffed nut butter', 'stuffed peanut butter', 'stuffed almond butter', 'stuffed cashew butter', 'stuffed sunflower butter', 'stuffed hazelnut spread', 'stuffed chocolate spread', 'stuffed caramel', 'stuffed fudge', 'stuffed marshmallow', 'stuffed nougat', 'stuffed toffee', 'stuffed brittle', 'stuffed praline', 'stuffed truffle', 'stuffed bonbon', 'stuffed candy', 'stuffed confection', 'stuffed sweet', 'stuffed dessert', 'stuffed pastry', 'stuffed cake', 'stuffed cookie', 'stuffed biscuit', 'stuffed cracker', 'stuffed wafer', 'stuffed bar', 'stuffed granola', 'stuffed cereal', 'stuffed muesli', 'stuffed trail mix', 'stuffed snack', 'stuffed chip', 'stuffed popcorn', 'stuffed pretzel', 'stuffed rice cake', 'stuffed puff', 'stuffed crisp', 'stuffed crouton', 'stuffed breadstick', 'stuffed flatbread', 'stuffed pita', 'stuffed naan', 'stuffed tortilla', 'stuffed wrap', 'stuffed bun', 'stuffed roll', 'stuffed bagel', 'stuffed muffin', 'stuffed scone', 'stuffed brioche', 'stuffed croissant', 'stuffed danish', 'stuffed strudel', 'stuffed turnover', 'stuffed tart', 'stuffed pie', 'stuffed galette', 'stuffed clafoutis', 'stuffed souffle', 'stuffed pudding', 'stuffed custard', 'stuffed flan', 'stuffed creme brulee', 'stuffed mousse', 'stuffed parfait', 'stuffed trifle', 'stuffed eclair', 'stuffed profiterole', 'stuffed cream puff', 'stuffed choux', 'stuffed beignet', 'stuffed fritter', 'stuffed doughnut', 'stuffed babka', 'stuffed kugel', 'stuffed blintz', 'stuffed crepe', 'stuffed pancake', 'stuffed waffle', 'stuffed french toast', 'stuffed omelet', 'stuffed quiche', 'stuffed frittata', 'stuffed souffle', 'stuffed scramble', 'stuffed hash', 'stuffed latke', 'stuffed rosti', 'stuffed tortilla espanola', 'stuffed tamale', 'stuffed empanada', 'stuffed samosa', 'stuffed pierogi', 'stuffed ravioli', 'stuffed tortellini', 'stuffed agnolotti', 'stuffed cappelletti', 'stuffed dumpling', 'stuffed potsticker', 'stuffed gyoza', 'stuffed bao', 'stuffed bun', 'stuffed mantou', 'stuffed siu mai', 'stuffed har gow', 'stuffed wonton', 'stuffed spring roll', 'stuffed egg roll', 'stuffed summer roll', 'stuffed rice paper roll', 'stuffed lettuce wrap', 'stuffed cabbage roll', 'stuffed stuffed pepper', 'stuffed stuffed squash', 'stuffed stuffed eggplant', 'stuffed stuffed mushroom', 'stuffed stuffed chicken', 'stuffed stuffed pork', 'stuffed stuffed beef', 'stuffed stuffed fish', 'stuffed stuffed shell', 'stuffed stuffed pasta', 'stuffed stuffed bread', 'stuffed stuffed pastry', 'stuffed stuffed dessert', 'stuffed stuffed fruit', 'stuffed stuffed vegetable', 'stuffed stuffed grain', 'stuffed stuffed legume', 'stuffed stuffed nut', 'stuffed stuffed seed', 'stuffed stuffed cheese', 'stuffed stuffed tofu', 'stuffed stuffed tempeh', 'stuffed stuffed seitan', 'stuffed stuffed miso', 'stuffed stuffed edamame', 'stuffed stuffed lentil', 'stuffed stuffed chickpea', 'stuffed stuffed pea protein', 'stuffed stuffed greens', 'stuffed stuffed herbs', 'stuffed stuffed spices', 'stuffed stuffed seasoning', 'stuffed stuffed blend', 'stuffed stuffed mix', 'stuffed stuffed stock', 'stuffed stuffed broth', 'stuffed stuffed bouillon', 'stuffed stuffed base', 'stuffed stuffed paste', 'stuffed stuffed sauce', 'stuffed stuffed dressing', 'stuffed stuffed spread', 'stuffed stuffed dip', 'stuffed stuffed jam', 'stuffed stuffed jelly', 'stuffed stuffed preserve', 'stuffed stuffed relish', 'stuffed stuffed chutney', 'stuffed stuffed compote', 'stuffed stuffed curd', 'stuffed stuffed marmalade', 'stuffed stuffed salsa', 'stuffed stuffed guacamole', 'stuffed stuffed hummus', 'stuffed stuffed pesto', 'stuffed stuffed tapenade', 'stuffed stuffed aioli', 'stuffed stuffed tzatziki', 'stuffed stuffed raita', 'stuffed stuffed romesco', 'stuffed stuffed harissa', 'stuffed stuffed chimichurri', 'stuffed stuffed gremolata', 'stuffed stuffed ponzu', 'stuffed stuffed teriyaki', 'stuffed stuffed hoisin', 'stuffed stuffed sriracha', 'stuffed stuffed gochujang', 'stuffed stuffed wasabi', 'stuffed stuffed tahini', 'stuffed stuffed nut butter', 'stuffed stuffed peanut butter', 'stuffed stuffed almond butter', 'stuffed stuffed cashew butter', 'stuffed stuffed sunflower butter', 'stuffed stuffed hazelnut spread', 'stuffed stuffed chocolate spread', 'stuffed stuffed caramel', 'stuffed stuffed fudge', 'stuffed stuffed marshmallow', 'stuffed stuffed nougat', 'stuffed stuffed toffee', 'stuffed stuffed brittle', 'stuffed stuffed praline', 'stuffed stuffed truffle', 'stuffed stuffed bonbon', 'stuffed stuffed candy', 'stuffed stuffed confection', 'stuffed stuffed sweet', 'stuffed stuffed dessert', 'stuffed stuffed pastry', 'stuffed stuffed cake', 'stuffed stuffed cookie', 'stuffed stuffed biscuit', 'stuffed stuffed cracker', 'stuffed stuffed wafer', 'stuffed stuffed bar', 'stuffed stuffed granola', 'stuffed stuffed cereal', 'stuffed stuffed muesli', 'stuffed stuffed trail mix', 'stuffed stuffed snack', 'stuffed stuffed chip', 'stuffed stuffed popcorn', 'stuffed stuffed pretzel', 'stuffed stuffed rice cake', 'stuffed stuffed puff', 'stuffed stuffed crisp', 'stuffed stuffed crouton', 'stuffed stuffed breadstick', 'stuffed stuffed flatbread', 'stuffed stuffed pita', 'stuffed stuffed naan', 'stuffed stuffed tortilla', 'stuffed stuffed wrap', 'stuffed stuffed bun', 'stuffed stuffed roll', 'stuffed stuffed bagel', 'stuffed stuffed muffin', 'stuffed stuffed scone', 'stuffed stuffed brioche', 'stuffed stuffed croissant', 'stuffed stuffed danish', 'stuffed stuffed strudel', 'stuffed stuffed turnover', 'stuffed stuffed tart', 'stuffed stuffed pie', 'stuffed stuffed galette', 'stuffed stuffed clafoutis', 'stuffed stuffed souffle', 'stuffed stuffed pudding', 'stuffed stuffed custard', 'stuffed stuffed flan', 'stuffed stuffed creme brulee', 'stuffed stuffed mousse', 'stuffed stuffed parfait', 'stuffed stuffed trifle', 'stuffed stuffed eclair', 'stuffed stuffed profiterole', 'stuffed stuffed cream puff', 'stuffed stuffed choux', 'stuffed stuffed beignet', 'stuffed stuffed fritter', 'stuffed stuffed doughnut', 'stuffed stuffed babka', 'stuffed stuffed kugel', 'stuffed stuffed blintz', 'stuffed stuffed crepe', 'stuffed stuffed pancake', 'stuffed stuffed waffle', 'stuffed stuffed french toast', 'stuffed stuffed omelet', 'stuffed stuffed quiche', 'stuffed stuffed frittata', 'stuffed stuffed souffle', 'stuffed stuffed scramble', 'stuffed stuffed hash', 'stuffed stuffed latke', 'stuffed stuffed rosti', 'stuffed stuffed tortilla espanola', 'stuffed stuffed tamale', 'stuffed stuffed empanada', 'stuffed stuffed samosa', 'stuffed stuffed pierogi', 'stuffed stuffed ravioli', 'stuffed stuffed tortellini', 'stuffed stuffed agnolotti', 'stuffed stuffed cappelletti', 'stuffed stuffed dumpling', 'stuffed stuffed potsticker', 'stuffed stuffed gyoza', 'stuffed stuffed bao', 'stuffed stuffed bun', 'stuffed stuffed mantou', 'stuffed stuffed siu mai', 'stuffed stuffed har gow', 'stuffed stuffed wonton', 'stuffed stuffed spring roll', 'stuffed stuffed egg roll', 'stuffed stuffed summer roll', 'stuffed stuffed rice paper roll', 'stuffed stuffed lettuce wrap', 'stuffed stuffed cabbage roll'];

const MAJOR_BRANDS = ['Target Stores', 'Meijer, Inc.', 'Wal-Mart Stores, Inc.', 'Wakefern IngredientCategorized Corporation', 'Kraft Heinz IngredientCategorizeds Company', 'The Hershey Company', 'Tyson IngredientCategorizeds Inc.', 'Safeway, Inc.', 'GENERAL MILLS SALES INC.'];

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

async function main() {
  console.log('🔎 PHASE 1: OBVIOUS PRODUCT MAPPER\n');
  // Get all legitimate canonicals
  const canonicals = await Ingredient.findAll({ attributes: ['name'] });
  const canonicalSet = new Set(canonicals.map(c => normalize(c.name)));
  // Filter target canonicals to those that exist
  const validTargets = TARGET_CANONICALS.filter(c => canonicalSet.has(normalize(c)));

  // Get unmapped real-brand products, prioritize major brands
  const products = await IngredientCategorized.findAll({
    where: {
      brandOwner: { [Op.in]: MAJOR_BRANDS },
      [Op.or]: [
        { canonicalTag: null },
        { canonicalTag: '' }
      ]
    },
    limit: 2000
  });

  let mappings = [];
  let matched = 0;
  let attempted = 0;

  for (const product of products) {
    attempted++;
    const desc = normalize(product.description);
    let found = null;
    for (const canonical of validTargets) {
      if (desc === normalize(canonical) || desc.includes(normalize(canonical))) {
        found = canonical;
        break;
      }
    }
    if (found) {
      // Double-check canonical exists
      if (canonicalSet.has(normalize(found))) {
        mappings.push({
          productId: product.id,
          product: product.description,
          brand: product.brandOwner,
          canonical: found
        });
        matched++;
      }
    }
    if (mappings.length >= 1000) break;
    if (attempted % 200 === 0) {
      console.log(`   Processed ${attempted} products, found ${matched} matches so far...`);
    }
  }

  // Export results
  fs.writeFileSync('phase1_obvious_product_mappings.json', JSON.stringify(mappings, null, 2));
  console.log(`\n✅ Phase 1 mapping complete. ${matched} mappings found out of ${attempted} products.`);
  console.log('   Results exported to phase1_obvious_product_mappings.json');
  if (mappings.length > 0) {
    console.log('\nSample mappings:');
    mappings.slice(0, 10).forEach((m, i) => {
      console.log(`   ${i + 1}. "${m.product}" (${m.brand}) → ${m.canonical}`);
    });
  }
}

main(); 