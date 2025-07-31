const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const db = require('./db/database');

function tokenize(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
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
  // 1. Load clean training data
  const curatedPath = path.join(__dirname, 'audit_successful_mappings_curated.json');
  const curated = JSON.parse(fs.readFileSync(curatedPath, 'utf-8'));
  if (!curated.length) {
    console.error('No curated training data found.');
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

  // 4. Generate suggestions with confidence scores
  const suggestions = [];
  for (const prod of unmapped) {
    for (const [canonical, pattern] of Object.entries(canonicalPatterns)) {
      // Score: +1 for each keyword match, +2 for brand match
      let score = 0;
      const words = new Set(tokenize(prod.description));
      for (const kw of pattern.keywords) {
        if (words.has(kw)) score++;
      }
      if (pattern.brandList.includes(prod.brandOwner)) score += 2;
      if (score >= 3) { // Threshold for high-confidence
        suggestions.push({
          id: prod.id,
          brandOwner: prod.brandOwner,
          description: prod.description,
          suggestedCanonical: canonical,
          score
        });
        break; // Only suggest one canonical per product
      }
    }
    if (suggestions.length >= 1000) break;
  }

  // 5. Output suggestions
  fs.writeFileSync(path.join(__dirname, 'pattern_recognition_suggestions.json'), JSON.stringify(suggestions, null, 2));
  console.log(`Pattern recognition complete. ${suggestions.length} suggestions saved to pattern_recognition_suggestions.json`);
}

main().catch(e => { console.error(e); process.exit(1); }); 