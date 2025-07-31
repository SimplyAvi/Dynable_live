const fs = require('fs');
const path = require('path');
const { IngredientToCanonical } = require('./db/models');

async function countRemainingUnmapped() {
  // 1. Read unmapped_ingredients.txt
  const unmappedPath = path.join(__dirname, 'unmapped_ingredients.txt');
  if (!fs.existsSync(unmappedPath)) {
    console.error('❌ unmapped_ingredients.txt not found');
    return;
  }
  const unmappedLines = fs.readFileSync(unmappedPath, 'utf8').split('\n').filter(Boolean);
  const totalUnmapped = unmappedLines.length;

  // 2. Load existing mappings
  const existingMappings = await IngredientToCanonical.findAll({ attributes: ['messyName'] });
  const mappedSet = new Set(existingMappings.map(m => m.messyName.toLowerCase()));
  const totalMapped = mappedSet.size;

  // 3. Load already processed from enhanced_fuzzy_suggestions.json
  const suggestionsPath = path.join(__dirname, 'enhanced_fuzzy_suggestions.json');
  let alreadyProcessedSet = new Set();
  let totalProcessed = 0;
  if (fs.existsSync(suggestionsPath)) {
    const suggestions = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8'));
    for (const s of suggestions) {
      alreadyProcessedSet.add(s.messyName.toLowerCase());
    }
    totalProcessed = alreadyProcessedSet.size;
  }

  // 4. Calculate remaining unmapped
  let remainingSet = new Set();
  for (const line of unmappedLines) {
    const name = line.trim().toLowerCase();
    if (!name) continue;
    if (!mappedSet.has(name) && !alreadyProcessedSet.has(name)) {
      remainingSet.add(name);
    }
  }
  const totalRemaining = remainingSet.size;

  // 5. Recommendation for next batch size
  let batchRecommendation = '';
  if (totalRemaining > 50000) {
    batchRecommendation = 'Suggest: Process next 10,000 ingredients.';
  } else if (totalRemaining > 20000) {
    batchRecommendation = 'Suggest: Process next 5,000 ingredients.';
  } else {
    batchRecommendation = 'Suggest: Process all remaining ingredients.';
  }

  // 6. Quick stats
  const estTime = ((totalRemaining / 10000) * 33).toFixed(1); // 33 min per 10k
  const estMatches = Math.round(totalRemaining * 0.46); // 46% success rate

  console.log('===== Unmapped Ingredient Stats =====');
  console.log(`Total in unmapped_ingredients.txt: ${totalUnmapped.toLocaleString()}`);
  console.log(`Existing mappings: ${totalMapped.toLocaleString()}`);
  console.log(`Already processed (suggestions): ${totalProcessed.toLocaleString()}`);
  console.log(`Total remaining unmapped: ${totalRemaining.toLocaleString()}`);
  console.log(batchRecommendation);
  console.log(`Estimated processing time: ~${estTime} min`);
  console.log(`Expected new matches: ~${estMatches.toLocaleString()}`);
  console.log('======================================');
}

if (require.main === module) {
  countRemainingUnmapped();
}

module.exports = { countRemainingUnmapped }; 