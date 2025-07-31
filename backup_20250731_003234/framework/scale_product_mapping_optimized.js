const { IngredientCategorized, Ingredient } = require('./db/models');
const { Op } = require('sequelize');
const fs = require('fs');

// Expanded canonical list (proven + new compounds + common ingredients, 75-100)
const TARGET_CANONICALS = [
  // Proven Phase 1 canonicals
  'peanut butter', 'milk chocolate', 'dark chocolate', 'white chocolate', 'peppermint',
  'oil', 'pepper', 'eggs', 'milk', 'bread', 'cheese', 'flour', 'butter', 'chicken', 'beef', 'pork', 'fish',
  'rice', 'beans', 'onion', 'garlic', 'tomato', 'lettuce', 'bacon', 'sausage', 'yogurt', 'cream', 'chocolate',
  'apples', 'limes', 'strawberries', 'spinach', 'carrots', 'potatoes', 'oranges', 'kale', 'basil', 'cilantro',
  'mayonnaise', 'mustard', 'vinegar', 'honey', 'almonds', 'walnuts', 'cashews', 'peanuts', 'broccoli', 'cauliflower',
  // New compounds
  'olive oil', 'coconut oil', 'vegetable oil', 'sea salt', 'brown sugar', 'white sugar',
  // Common ingredients
  'vanilla', 'cinnamon', 'oregano', 'thyme', 'rosemary', 'parsley',
  // Fruits/vegetables
  'mushrooms', 'bell peppers', 'celery', 'cucumber', 'avocado', 'grapes', 'blueberries', 'raspberries', 'blackberries',
  'pear', 'peach', 'plum', 'cherry', 'watermelon', 'cantaloupe', 'pineapple', 'mango', 'eggplant', 'squash', 'pumpkin',
  'sweet potato', 'asparagus', 'artichoke', 'beet', 'radish', 'turnip', 'parsnip', 'leek', 'shallot', 'scallion', 'chive',
  'ginger', 'turmeric', 'nutmeg', 'clove', 'cardamom', 'coriander', 'cumin', 'fennel', 'anise', 'sesame', 'sunflower',
  'pumpkin seed', 'chia', 'flax', 'quinoa', 'barley', 'oats', 'wheat', 'rye', 'spelt', 'millet', 'buckwheat', 'amaranth',
  'teff', 'sorghum', 'farro', 'bulgur', 'couscous', 'polenta', 'grits', 'rice flour', 'cornmeal', 'semolina', 'tapioca',
  'arrowroot', 'potato starch', 'cornstarch', 'soy', 'tofu', 'tempeh', 'seitan', 'miso', 'edamame', 'lentil', 'chickpea',
  'pea protein', 'seeds', 'nuts', 'legumes', 'greens', 'herbs', 'spices', 'seasoning', 'blend', 'mix', 'stock', 'broth',
  'bouillon', 'base', 'paste', 'sauce', 'dressing', 'spread', 'dip', 'jam', 'jelly', 'preserve', 'relish', 'chutney',
  'compote', 'curd', 'marmalade', 'salsa', 'guacamole', 'hummus', 'pesto', 'tapenade', 'aioli', 'tzatziki', 'raita',
  'romesco', 'harissa', 'chimichurri', 'gremolata', 'ponzu', 'teriyaki', 'hoisin', 'sriracha', 'gochujang', 'wasabi',
  'tahini', 'nut butter', 'peanut butter', 'almond butter', 'cashew butter', 'sunflower butter', 'hazelnut spread',
  'chocolate spread', 'caramel', 'fudge', 'marshmallow', 'nougat', 'toffee', 'brittle', 'praline', 'truffle', 'bonbon',
  'candy', 'confection', 'sweet', 'dessert', 'pastry', 'cake', 'cookie', 'biscuit', 'cracker', 'wafer', 'bar', 'granola',
  'cereal', 'muesli', 'trail mix', 'snack', 'chip', 'popcorn', 'pretzel', 'rice cake', 'puff', 'crisp', 'crouton',
  'breadstick', 'flatbread', 'pita', 'naan', 'tortilla', 'wrap', 'bun', 'roll', 'bagel', 'muffin', 'scone', 'brioche',
  'croissant', 'danish', 'strudel', 'turnover', 'tart', 'pie', 'galette', 'clafoutis', 'souffle', 'pudding', 'custard',
  'flan', 'creme brulee', 'mousse', 'parfait', 'trifle', 'eclair', 'profiterole', 'cream puff', 'choux', 'beignet',
  'fritter', 'doughnut', 'babka', 'kugel', 'blintz', 'crepe', 'pancake', 'waffle', 'french toast', 'omelet', 'quiche',
  'frittata', 'souffle', 'scramble', 'hash', 'latke', 'rosti', 'tortilla espanola', 'tamale', 'empanada', 'samosa',
  'pierogi', 'ravioli', 'tortellini', 'agnolotti', 'cappelletti', 'dumpling', 'potsticker', 'gyoza', 'bao', 'bun',
  'mantou', 'siu mai', 'har gow', 'wonton', 'spring roll', 'egg roll', 'summer roll', 'rice paper roll', 'lettuce wrap',
  'cabbage roll'
];

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function precompilePatterns(canonicals) {
  return canonicals.map(canonical => ({
    canonical,
    pattern: new RegExp(`\\b${escapeRegex(canonical)}\\b`, 'i')
  }));
}

async function main() {
  console.log('🚀 OPTIMIZED SCALING PRODUCT MAPPER\n');
  // Get all legitimate canonicals
  const canonicals = await Ingredient.findAll({ attributes: ['name'] });
  const canonicalSet = new Set(canonicals.map(c => normalize(c.name)));
  // Filter and sort canonicals by length desc
  const validTargets = TARGET_CANONICALS.filter(c => canonicalSet.has(normalize(c)))
    .sort((a, b) => b.length - a.length);
  const patterns = precompilePatterns(validTargets);

  // Get 10,000 unmapped real-brand products (all major brands)
  const products = await IngredientCategorized.findAll({
    where: {
      brandOwner: { [Op.ne]: 'Generic' },
      [Op.or]: [
        { canonicalTag: null },
        { canonicalTag: '' }
      ]
    },
    limit: 10000
  });

  let mappings = [];
  let batch = [];
  let matched = 0;
  let attempted = 0;

  for (let i = 0; i < products.length; i++) {
    attempted++;
    const product = products[i];
    const desc = normalize(product.description);
    // Find all matches for this product
    const found = patterns.filter(({ pattern }) => pattern.test(desc)).map(({ canonical }) => canonical);
    if (found.length === 1) {
      // Only accept single, clear matches
      if (canonicalSet.has(normalize(found[0]))) {
        batch.push({
          productId: product.id,
          product: product.description,
          brand: product.brandOwner,
          canonical: found[0]
        });
        matched++;
      }
    } else if (found.length > 1 && found.length < 4) {
      // Accept if 2-3 matches and all are highly related (e.g., 'milk chocolate', 'chocolate')
      // Only if all matches are substrings of the longest match
      const longest = found[0];
      if (found.every(f => longest.includes(f))) {
        batch.push({
          productId: product.id,
          product: product.description,
          brand: product.brandOwner,
          canonical: longest
        });
        matched++;
      }
    }
    // Skip if 4+ matches (too complex)
    if (batch.length >= 1000) {
      // Export batch
      const batchFile = `scale_product_mappings_batch_${Math.floor(i/1000)+1}.json`;
      fs.writeFileSync(batchFile, JSON.stringify(batch, null, 2));
      console.log(`   Exported ${batch.length} mappings to ${batchFile}`);
      batch = [];
    }
    if (attempted % 500 === 0) {
      console.log(`   Processed ${attempted} products, found ${matched} matches so far...`);
    }
  }
  // Export any remaining
  if (batch.length > 0) {
    const batchFile = `scale_product_mappings_batch_${Math.ceil(products.length/1000)}.json`;
    fs.writeFileSync(batchFile, JSON.stringify(batch, null, 2));
    console.log(`   Exported ${batch.length} mappings to ${batchFile}`);
  }
  console.log(`\n✅ Optimized scaling mapping complete. ${matched} mappings found out of ${attempted} products.`);
  if (matched > 0) {
    console.log('\nSample mappings:');
    let sample = batch.slice(0, 10);
    if (sample.length === 0 && matched > 0) {
      // If last batch is empty, load last written batch
      const lastBatchNum = Math.ceil(products.length/1000);
      const lastBatch = JSON.parse(fs.readFileSync(`scale_product_mappings_batch_${lastBatchNum}.json`, 'utf8'));
      sample = lastBatch.slice(0, 10);
    }
    sample.forEach((m, i) => {
      console.log(`   ${i + 1}. "${m.product}" (${m.brand}) → ${m.canonical}`);
    });
  }
}

main(); 