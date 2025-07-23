const { IngredientCategorized, Ingredient } = require('./db/models');
const { Op } = require('sequelize');
const fs = require('fs');

// Enhanced canonical list (compounds + basics)
const TARGET_CANONICALS = [
  'peanut butter', 'milk chocolate', 'dark chocolate', 'white chocolate', 'peppermint',
  'oil', 'pepper', 'eggs', 'milk', 'bread', 'cheese', 'flour', 'butter', 'chicken', 'beef', 'pork', 'fish',
  'rice', 'beans', 'onion', 'garlic', 'tomato', 'lettuce', 'bacon', 'sausage', 'yogurt', 'cream', 'chocolate',
  'apples', 'limes', 'strawberries', 'spinach', 'carrots', 'potatoes', 'oranges', 'kale', 'basil', 'cilantro',
  'mayonnaise', 'mustard', 'vinegar', 'honey', 'almonds', 'walnuts', 'cashews', 'peanuts', 'broccoli', 'cauliflower'
];

const MAJOR_BRANDS = [
  'Target Stores', 'Meijer, Inc.', 'Wal-Mart Stores, Inc.', 'Wakefern IngredientCategorized Corporation',
  'Kraft Heinz IngredientCategorizeds Company', 'The Hershey Company', 'Tyson IngredientCategorizeds Inc.', 'Safeway, Inc.',
  'GENERAL MILLS SALES INC.'
];

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findCanonicalMatch(desc, canonicals) {
  for (const canonical of canonicals) {
    const pattern = new RegExp(`\\b${escapeRegex(canonical)}\\b`, 'i');
    if (pattern.test(desc)) {
      return canonical;
    }
  }
  return null;
}

async function main() {
  console.log('🔄 ROLLING BACK PREVIOUS PHASE 1 MAPPINGS...');
  // Rollback: reset canonicalTag for previous confident mappings
  const resetCount = await IngredientCategorized.update(
    { canonicalTag: null, canonicalTagConfidence: null },
    { where: { canonicalTagConfidence: 'confident' } }
  );
  console.log(`   Reset ${resetCount[0]} previous confident mappings.\n`);

  // Get all legitimate canonicals
  const canonicals = await Ingredient.findAll({ attributes: ['name'] });
  const canonicalSet = new Set(canonicals.map(c => normalize(c.name)));
  // Filter and sort canonicals by length desc
  const validTargets = TARGET_CANONICALS.filter(c => canonicalSet.has(normalize(c)))
    .sort((a, b) => b.length - a.length);

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
    const found = findCanonicalMatch(desc, validTargets);
    if (found) {
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
  fs.writeFileSync('phase1_refined_mappings.json', JSON.stringify(mappings, null, 2));
  console.log(`\n✅ Refined Phase 1 mapping complete. ${matched} mappings found out of ${attempted} products.`);
  console.log('   Results exported to phase1_refined_mappings.json');
  if (mappings.length > 0) {
    console.log('\nSample mappings:');
    mappings.slice(0, 10).forEach((m, i) => {
      console.log(`   ${i + 1}. "${m.product}" (${m.brand}) → ${m.canonical}`);
    });
  }
}

main(); 