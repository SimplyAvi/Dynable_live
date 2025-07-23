const fs = require('fs');
const path = require('path');
const { IngredientToCanonical, IngredientCategorized } = require('./db/models');

async function autoAssignHighConfidence() {
  console.log('🚀 Auto-Assigning High-Confidence Enhanced Suggestions');
  console.log('======================================================');

  // 1. Read enhanced_suggestions.json and filter for high confidence
  const suggestionsPath = path.join(__dirname, 'enhanced_suggestions.json');
  if (!fs.existsSync(suggestionsPath)) {
    console.error('❌ enhanced_suggestions.json not found');
    return;
  }
  const suggestions = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8'));
  const highConfidence = suggestions.filter(s => s.confidenceLevel === 'high' && s.canonicalName && s.messyName);
  console.log(`🔍 Found ${highConfidence.length} high-confidence suggestions`);
  if (highConfidence.length === 0) {
    console.log('No high-confidence suggestions to assign.');
    return;
  }

  // 2. Preload all Ingredient name to id
  const canonicals = await require('./db/models/Ingredient').findAll({
    attributes: ['id', 'name']
  });
  const canonicalMap = new Map();
  for (const c of canonicals) {
    canonicalMap.set(c.name.toLowerCase(), c.id);
  }

  // 3. Preload all existing IngredientToCanonical mappings (messyName, canonicalId)
  const existingMappings = await IngredientToCanonical.findAll({
    attributes: ['messyName', 'IngredientId']
  });
  const mappingSet = new Set(existingMappings.map(m => `${m.messyName.toLowerCase()}|${m.IngredientId}`));

  // 4. Prepare new mappings
  const toInsert = [];
  for (const s of highConfidence) {
    const messyName = s.messyName.trim();
    const canonicalName = s.canonicalName.trim().toLowerCase();
    const IngredientId = canonicalMap.get(canonicalName);
    if (!IngredientId) {
      console.warn(`⚠️  Canonical not found for: ${canonicalName}`);
      continue;
    }
    const key = `${messyName.toLowerCase()}|${IngredientId}`;
    if (mappingSet.has(key)) {
      continue; // Already mapped
    }
    toInsert.push({ messyName, IngredientId });
  }
  console.log(`📝 Prepared ${toInsert.length} new mappings to insert.`);

  // 5. Show before stats
  const beforeCount = await IngredientToCanonical.count();
  console.log(`📊 Before: ${beforeCount} total mappings`);

  // 6. Batch insert
  if (toInsert.length > 0) {
    await IngredientToCanonical.bulkCreate(toInsert, { ignoreDuplicates: true });
    console.log(`✅ Inserted ${toInsert.length} new mappings.`);
  } else {
    console.log('No new mappings to insert.');
  }

  // 7. Show after stats
  const afterCount = await IngredientToCanonical.count();
  console.log(`📊 After: ${afterCount} total mappings`);
  const delta = afterCount - beforeCount;
  console.log(`➕ Net new mappings: ${delta}`);

  // 8. Coverage impact (estimate)
  // Optionally, you could run a coverage audit script here, but for now, just log the delta
  if (delta > 0) {
    console.log(`🎉 Coverage improved by ${delta} new high-confidence mappings!`);
  } else {
    console.log('No coverage improvement (all were already mapped).');
  }

  // 9. Log details
  if (toInsert.length > 0) {
    console.log('\n📝 Details of new mappings:');
    for (const m of toInsert) {
      console.log(`  - ${m.messyName} → IngredientId: ${m.IngredientId}`);
    }
  }

  console.log('\n🚦 Auto-assignment complete.');
}

if (require.main === module) {
  autoAssignHighConfidence().catch(e => {
    console.error('❌ Error in auto-assignment:', e);
  });
}

module.exports = { autoAssignHighConfidence }; 