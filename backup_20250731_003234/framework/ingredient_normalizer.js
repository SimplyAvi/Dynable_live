const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const db = require('./db/database');

const MEASUREMENTS = [
  'teaspoon', 'teaspoons', 'tablespoon', 'tablespoons', 'cup', 'cups', 'pound', 'pounds', 'ounce', 'ounces',
  'tbsp', 'tsp', 'oz', 'lb', 'lbs', 'g', 'kg', 'ml', 'l', 'quart', 'quarts', 'pint', 'pints', 'gallon', 'gallons'
];
const FRACTIONS = ['1/2', '1/3', '1/4', '2/3', '3/4', '1/8', '3/8', '5/8', '7/8'];
const SPELLING_FIXES = {
  'allpurpose': 'all-purpose',
  'whitesugar': 'white sugar',
  'oliveoil': 'olive oil',
  'all purpose': 'all-purpose',
  'mozzarellacheese': 'mozzarella cheese',
  'buttermelted': 'butter melted',
  'shreddedmozzarella': 'shredded mozzarella',
  'gratedzucchini': 'grated zucchini',
  'sugarcookies': 'sugar cookies',
  'eggsbeaten': 'eggs beaten',
  'largeeggs': 'large eggs',
  'zucchinisliced': 'zucchini sliced',
};

function normalize(ingredient) {
  let s = ingredient.toLowerCase();
  // Remove numbers and fractions
  s = s.replace(/\b\d+\b/g, ' ');
  FRACTIONS.forEach(frac => {
    s = s.replace(new RegExp(frac, 'g'), ' ');
  });
  // Remove measurements
  MEASUREMENTS.forEach(m => {
    s = s.replace(new RegExp(`\\b${m}\\b`, 'g'), ' ');
  });
  // Remove extra spaces and punctuation
  s = s.replace(/[^a-z0-9\- ]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  // Spelling fixes
  Object.entries(SPELLING_FIXES).forEach(([bad, good]) => {
    s = s.replace(new RegExp(bad, 'g'), good);
  });
  return s;
}

async function main() {
  // 1. Load unmapped ingredients from gap analysis
  const gapPath = path.join(__dirname, 'analyze_canonical_gaps_results.json');
  const gapData = JSON.parse(fs.readFileSync(gapPath, 'utf-8'));
  const unmapped = [];
  Object.values(gapData.byCategory).forEach(arr => arr.forEach(obj => unmapped.push(obj.ingredient)));
  // Deduplicate
  const uniqueUnmapped = Array.from(new Set(unmapped));

  // 2. Normalize
  const normalized = uniqueUnmapped.map(i => ({ original: i, normalized: normalize(i) }));

  // 3. Match against canonicals
  const canonicals = await db.query('SELECT name FROM "CanonicalRecipeIngredients"', { type: Sequelize.QueryTypes.SELECT });
  const canonicalSet = new Set(canonicals.map(c => c.name.toLowerCase()));
  const beforeMapped = uniqueUnmapped.filter(i => canonicalSet.has(i)).length;
  const afterMapped = normalized.filter(n => canonicalSet.has(n.normalized)).length;
  const newMappings = normalized.filter(n => canonicalSet.has(n.normalized) && !canonicalSet.has(n.original));

  // 4. Export results
  const results = {
    totalUnmapped: uniqueUnmapped.length,
    beforeMapped,
    afterMapped,
    coverageImprovement: ((afterMapped - beforeMapped) / uniqueUnmapped.length * 100).toFixed(2) + '%',
    newMappings,
    normalized,
  };
  fs.writeFileSync(path.join(__dirname, 'ingredient_normalizer_results.json'), JSON.stringify(results, null, 2));

  // Console summary
  console.log('=== INGREDIENT NORMALIZATION SUMMARY ===');
  console.log(`Total unmapped: ${uniqueUnmapped.length}`);
  console.log(`Mapped before normalization: ${beforeMapped}`);
  console.log(`Mapped after normalization: ${afterMapped}`);
  console.log(`Coverage improvement: ${results.coverageImprovement}`);
  console.log(`New mappings found: ${newMappings.length}`);
  console.log('Results exported to ingredient_normalizer_results.json');
}

main().catch(e => { console.error(e); process.exit(1); }); 