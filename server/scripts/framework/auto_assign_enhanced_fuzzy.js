const fs = require('fs');
const path = require('path');
const { IngredientToCanonical } = require('./db/models');

async function autoAssignEnhancedFuzzy() {
  console.log('🚀 Auto-Assigning High-Confidence Fuzzy Suggestions');
  console.log('====================================================');

  // 1. Read enhanced_fuzzy_suggestions.json
  const suggestionsPath = path.join(__dirname, 'enhanced_fuzzy_suggestions.json');
  if (!fs.existsSync(suggestionsPath)) {
    console.error('❌ enhanced_fuzzy_suggestions.json not found');
    return;
  }
  const suggestions = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8'));
  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    console.log('No suggestions to assign.');
    return;
  }
  console.log(`🔍 Found ${suggestions.length} high-confidence suggestions`);

  // 2. Preload all existing IngredientToCanonical mappings (messyName, IngredientId)
  const existingMappings = await IngredientToCanonical.findAll({
    attributes: ['messyName', 'IngredientId']
  });
  const mappingSet = new Set(existingMappings.map(m => `${m.messyName.toLowerCase()}|${m.IngredientId}`));

  // 3. Prepare new mappings
  const toInsert = [];
  for (const s of suggestions) {
    const messyName = s.messyName.trim();
    const IngredientId = s.IngredientId;
    if (!messyName || !IngredientId) continue;
    const key = `${messyName.toLowerCase()}|${IngredientId}`;
    if (mappingSet.has(key)) continue; // Already mapped
    toInsert.push({ messyName, IngredientId });
  }
  console.log(`📝 Prepared ${toInsert.length} new mappings to insert.`);

  // 4. Show before stats
  const beforeCount = await IngredientToCanonical.count();
  console.log(`📊 Before: ${beforeCount} total mappings`);

  // 5. Batch insert
  if (toInsert.length > 0) {
    await IngredientToCanonical.bulkCreate(toInsert, { ignoreDuplicates: true });
    console.log(`✅ Inserted ${toInsert.length} new mappings.`);
  } else {
    console.log('No new mappings to insert.');
  }

  // 6. Show after stats
  const afterCount = await IngredientToCanonical.count();
  console.log(`📊 After: ${afterCount} total mappings`);
  const delta = afterCount - beforeCount;
  console.log(`➕ Net new mappings: ${delta}`);

  // 7. Coverage impact (estimate)
  if (delta > 0) {
    console.log(`🎉 Coverage improved by ${delta} new high-confidence mappings!`);
  } else {
    console.log('No coverage improvement (all were already mapped).');
  }

  // 8. Log details
  if (toInsert.length > 0) {
    console.log('\n📝 Details of new mappings:');
    for (const m of toInsert.slice(0, 20)) {
      console.log(`  - ${m.messyName} → IngredientId: ${m.IngredientId}`);
    }
    if (toInsert.length > 20) {
      console.log(`  ...and ${toInsert.length - 20} more.`);
    }
  }

  console.log('\n🚦 Auto-assignment complete.');
}

if (require.main === module) {
  autoAssignEnhancedFuzzy().catch(e => {
    console.error('❌ Error in auto-assignment:', e);
  });
}

module.exports = { autoAssignEnhancedFuzzy }; 