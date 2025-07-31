const { IngredientCategorized, Ingredient } = require('./db/models');
const { Op } = require('sequelize');
const fs = require('fs');

// Clean, focused canonical list (30-50 high-priority basics)
const TARGET_CANONICALS = [
  'oil', 'pepper', 'kale', 'eggs', 'milk', 'bread', 'cheese', 'flour', 'butter',
  'chicken', 'beef', 'pork', 'fish', 'rice', 'beans', 'onion', 'garlic', 'tomato',
  'lettuce', 'bacon', 'sausage', 'yogurt', 'cream', 'oranges', 'apples', 'limes',
  'strawberries', 'spinach', 'carrots', 'potatoes'
];

const MAJOR_BRANDS = [
  'Target Stores', 'Meijer, Inc.', 'Wal-Mart Stores, Inc.', 'Wakefern IngredientCategorized Corporation',
  'Kraft Heinz IngredientCategorizeds Company', 'The Hershey Company', 'Tyson IngredientCategorizeds Inc.', 'Safeway, Inc.',
  'GENERAL MILLS SALES INC.'
];

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

async function main() {
  console.log('🔎 PHASE 1: OBVIOUS PRODUCT MAPPER (CLEAN LIST)\n');
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
    limit: 1000
  });

  let mappings = [];
  let matched = 0;
  let attempted = 0;

  for (const product of products) {
    attempted++;
    const desc = normalize(product.description);
    let found = null;
    for (const canonical of validTargets) {
      const normCanonical = normalize(canonical);
      if (desc === normCanonical || desc.includes(normCanonical)) {
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
  fs.writeFileSync('phase1_obvious_product_mappings_clean.json', JSON.stringify(mappings, null, 2));
  console.log(`\n✅ Phase 1 mapping complete. ${matched} mappings found out of ${attempted} products.`);
  console.log('   Results exported to phase1_obvious_product_mappings_clean.json');
  if (mappings.length > 0) {
    console.log('\nSample mappings:');
    mappings.slice(0, 10).forEach((m, i) => {
      console.log(`   ${i + 1}. "${m.product}" (${m.brand}) → ${m.canonical}`);
    });
  }
}

main(); 