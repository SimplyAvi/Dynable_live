const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const db = require('./db/database');

// Simple category keywords for demo purposes
const CATEGORY_KEYWORDS = {
  spices: ['cumin', 'coriander', 'paprika', 'turmeric', 'cinnamon', 'nutmeg', 'clove', 'cardamom', 'ginger', 'pepper'],
  grains: ['rice', 'quinoa', 'barley', 'oats', 'wheat', 'corn', 'millet', 'bulgur', 'couscous'],
  beverages: ['tea', 'coffee', 'juice', 'soda', 'wine', 'beer', 'milk', 'smoothie'],
  herbs: ['basil', 'parsley', 'cilantro', 'dill', 'thyme', 'rosemary', 'sage', 'mint', 'oregano', 'chive'],
  nuts: ['almond', 'walnut', 'pecan', 'cashew', 'hazelnut', 'macadamia', 'pistachio', 'peanut'],
  dairy: ['cheese', 'yogurt', 'cream', 'butter', 'milk', 'ghee'],
  fruits: ['apple', 'banana', 'orange', 'lemon', 'lime', 'berry', 'grape', 'melon', 'peach', 'pear'],
  vegetables: ['carrot', 'onion', 'lettuce', 'spinach', 'broccoli', 'cabbage', 'pepper', 'tomato', 'potato', 'zucchini'],
  proteins: ['chicken', 'beef', 'pork', 'egg', 'fish', 'shrimp', 'lamb', 'tofu', 'turkey', 'duck'],
  sweeteners: ['sugar', 'honey', 'maple', 'syrup', 'molasses', 'stevia'],
};

function categorize(ingredient) {
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (ingredient.includes(kw)) return cat;
    }
  }
  return 'other';
}

async function main() {
  // 1. Sample 1,000 unmapped ingredients from recent recipes
  const unmapped = await db.query(
    `SELECT i.name as ingredient
     FROM "RecipeIngredients" i
     LEFT JOIN "IngredientToCanonicals" itc ON LOWER(i.name) = itc."messyName"
     WHERE itc."messyName" IS NULL
     ORDER BY i.id DESC
     LIMIT 1000`,
    { type: Sequelize.QueryTypes.SELECT }
  );
  const ingredients = unmapped.map(r => r.ingredient.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim());

  // 2. Remove those already in CanonicalRecipeIngredients
  const canonicals = await db.query('SELECT name FROM "CanonicalRecipeIngredients"', { type: Sequelize.QueryTypes.SELECT });
  const canonicalSet = new Set(canonicals.map(c => c.name.toLowerCase()));
  const missing = ingredients.filter(i => !canonicalSet.has(i));

  // 3. Frequency analysis
  const freq = {};
  for (const i of missing) freq[i] = (freq[i] || 0) + 1;
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);

  // 4. Category discovery
  const byCategory = {};
  for (const [ingredient, count] of sorted) {
    const cat = categorize(ingredient);
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({ ingredient, count });
  }

  // 5. Suggest new canonicals and estimate mapping potential
  const suggestions = [];
  let totalPotential = 0;
  for (const [cat, items] of Object.entries(byCategory)) {
    const top = items.slice(0, 5); // Top 5 per category
    for (const { ingredient, count } of top) {
      suggestions.push({ category: cat, canonical: ingredient, potential: count });
      totalPotential += count;
    }
  }
  // Prioritize by potential
  suggestions.sort((a, b) => b.potential - a.potential);
  const prioritized = suggestions.slice(0, 50);

  // 6. Implementation plan
  const roadmap = prioritized.map((s, i) => ({
    rank: i + 1,
    canonical: s.canonical,
    category: s.category,
    potential: s.potential,
    expectedCoverage: ((s.potential / ingredients.length) * 100).toFixed(2) + '%'
  }));
  const expectedTotalCoverage = ((totalPotential / ingredients.length) * 100).toFixed(2);

  // 7. Export and summary
  const results = {
    totalUnmapped: ingredients.length,
    prioritizedCanonicals: prioritized,
    roadmap,
    expectedTotalCoverage,
    byCategory,
  };
  fs.writeFileSync(path.join(__dirname, 'analyze_canonical_gaps_results.json'), JSON.stringify(results, null, 2));

  // Console summary
  console.log('=== CANONICAL GAP ANALYSIS SUMMARY ===');
  console.log(`Total unmapped ingredients sampled: ${ingredients.length}`);
  console.log('Top missing canonicals:');
  prioritized.slice(0, 20).forEach((s, i) =>
    console.log(`#${i + 1}: ${s.canonical} (${s.category}) - Potential: ${s.potential}`)
  );
  console.log(`\nExpected coverage improvement if all added: ${expectedTotalCoverage}%`);
  console.log('Implementation roadmap exported to analyze_canonical_gaps_results.json');
}

main().catch(e => { console.error(e); process.exit(1); }); 