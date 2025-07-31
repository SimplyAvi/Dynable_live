const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const db = require('./db/database');

const COMMON_INGREDIENTS = [
  'milk', 'chicken', 'cheese', 'beef', 'egg', 'yogurt', 'lettuce', 'tomato', 'onion', 'garlic',
  'potato', 'carrot', 'almond', 'shrimp', 'turkey', 'pasta', 'rice', 'bread', 'butter', 'cream',
  'sugar', 'salt', 'oil', 'mayonnaise', 'vinegar', 'honey', 'spinach', 'pepper', 'bacon', 'ham'
];
const MAX_PER_CANONICAL = 50;

function tokenize(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
}

function isPrimaryIngredient(description, canonical) {
  // Primary ingredient should be at the start or in the first 3 words
  const tokens = tokenize(description);
  return tokens.slice(0, 3).includes(canonical.toLowerCase());
}

function isUnambiguous(row) {
  // Exclude if canonical is not in COMMON_INGREDIENTS or not primary
  if (!COMMON_INGREDIENTS.includes(row.canonicalTag)) return false;
  if (!isPrimaryIngredient(row.description, row.canonicalTag)) return false;
  // Exclude if description is too long/complex
  if ((row.description || '').length > 50) return false;
  // Exclude if description contains multiple strong ingredient signals
  let count = 0;
  for (const ing of COMMON_INGREDIENTS) {
    if (row.description.toLowerCase().includes(ing)) count++;
  }
  return count === 1;
}

function getTopKeywords(examples, topN = 10) {
  const freq = {};
  for (const ex of examples) {
    for (const word of tokenize(ex.description)) {
      if (word.length > 2) freq[word] = (freq[word] || 0) + 1;
    }
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, topN).map(([w]) => w);
}

async function main() {
  // 1. Load and filter training data
  const curatedPath = path.join(__dirname, 'audit_successful_mappings_curated.json');
  let curated = JSON.parse(fs.readFileSync(curatedPath, 'utf-8'));
  curated = curated.filter(isUnambiguous);
  if (!curated.length) {
    console.error('No high-quality, unambiguous training data found.');
    process.exit(1);
  }

  // 2. Extract patterns for each canonical
  const canonicalPatterns = {};
  for (const row of curated) {
    if (!canonicalPatterns[row.canonicalTag]) canonicalPatterns[row.canonicalTag] = { examples: [], brands: new Set() };
    canonicalPatterns[row.canonicalTag].examples.push(row);
    if (row.brandOwner) canonicalPatterns[row.canonicalTag].brands.add(row.brandOwner);
  }
  for (const [canonical, data] of Object.entries(canonicalPatterns)) {
    data.keywords = getTopKeywords(data.examples, 10);
    data.brandList = Array.from(data.brands);
    delete data.examples;
    delete data.brands;
  }

  // 3. Apply patterns to unmapped real-brand products
  const unmapped = await db.query(
    "SELECT id, description, \"brandOwner\", \"canonicalTag\" FROM \"IngredientCategorized\" WHERE (\"canonicalTag\" IS NULL OR \"canonicalTag\" = '') AND \"brandOwner\" IS NOT NULL AND \"brandOwner\" != '' AND \"brandOwner\" != 'Generic'",
    { type: Sequelize.QueryTypes.SELECT }
  );

  // 4. Improved scoring and quality controls
  const suggestions = [];
  const canonicalCounts = {};
  for (const prod of unmapped) {
    for (const [canonical, pattern] of Object.entries(canonicalPatterns)) {
      if (!COMMON_INGREDIENTS.includes(canonical)) continue;
      // Score: +2 for primary ingredient at start, +1 for keyword match, +2 for brand match, -2 if canonical is over-common
      let score = 0;
      const tokens = tokenize(prod.description);
      if (tokens[0] === canonical) score += 2;
      if (tokens.slice(0, 3).includes(canonical)) score += 1;
      for (const kw of pattern.keywords) {
        if (tokens.includes(kw)) score++;
      }
      if (pattern.brandList.includes(prod.brandOwner)) score += 2;
      if (["salt", "yogurt", "shrimp"].includes(canonical)) score -= 2; // Penalize over-common canonicals
      // Boost for exact/near-exact match
      if (prod.description.toLowerCase() === canonical) score += 3;
      // Quality controls
      if ((prod.description || '').length > 50) continue;
      let count = 0;
      for (const ing of COMMON_INGREDIENTS) {
        if (prod.description.toLowerCase().includes(ing)) count++;
      }
      if (count !== 1) continue;
      if (score >= 4) {
        canonicalCounts[canonical] = (canonicalCounts[canonical] || 0) + 1;
        if (canonicalCounts[canonical] > MAX_PER_CANONICAL) continue;
        suggestions.push({
          id: prod.id,
          brandOwner: prod.brandOwner,
          description: prod.description,
          suggestedCanonical: canonical,
          score
        });
        break;
      }
    }
    if (suggestions.length >= 500) break;
  }

  // 5. Export for review and validation
  fs.writeFileSync(path.join(__dirname, 'pattern_recognition_mapper_v2_suggestions.json'), JSON.stringify(suggestions, null, 2));
  fs.writeFileSync(path.join(__dirname, 'pattern_recognition_mapper_v2_sample.json'), JSON.stringify(suggestions.slice(0, 50), null, 2));
  // Flag over-mapping
  const overMapped = Object.entries(canonicalCounts).filter(([k, v]) => v > MAX_PER_CANONICAL);
  if (overMapped.length) {
    console.log('Warning: Over-mapped canonicals:', overMapped);
  }
  console.log(`Pattern recognition v2 complete. ${suggestions.length} high-quality suggestions saved to pattern_recognition_mapper_v2_suggestions.json`);
}

main().catch(e => { console.error(e); process.exit(1); }); 