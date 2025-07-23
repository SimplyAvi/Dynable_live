const fs = require('fs');
const path = require('path');
const { IngredientToCanonical } = require('./db/models');

function getMemoryUsageMB() {
  const mem = process.memoryUsage();
  return (mem.rss / 1024 / 1024).toFixed(1);
}

async function autoAssignEnhancedFuzzyMassive() {
  console.log('🚀 Auto-Assigning Massive Fuzzy Suggestions');
  console.log('====================================================');
  const startTime = Date.now();

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

  // 3. Prepare new mappings, validate, and skip duplicates
  const toInsert = [];
  let checked = 0;
  for (const s of suggestions) {
    checked++;
    if (checked % 1000 === 0) {
      const mem = getMemoryUsageMB();
      console.log(`Checked ${checked}/${suggestions.length} | To insert: ${toInsert.length} | Mem: ${mem}MB`);
    }
    const messyName = s.messyName && s.messyName.trim();
    const IngredientId = s.IngredientId;
    if (!messyName || !IngredientId) continue;
    const key = `${messyName.toLowerCase()}|${IngredientId}`;
    if (mappingSet.has(key)) continue; // Already mapped
    toInsert.push({ messyName, IngredientId });
  }
  console.log(`📝 Prepared ${toInsert.length} new mappings to insert (after duplicate removal).`);

  // 4. Show before stats
  const beforeCount = await IngredientToCanonical.count();
  console.log(`📊 Before: ${beforeCount} total mappings`);

  // 5. Batch insert in chunks for memory efficiency
  const batchSize = 1000;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    try {
      await IngredientToCanonical.bulkCreate(batch, { ignoreDuplicates: true });
      inserted += batch.length;
      const mem = getMemoryUsageMB();
      console.log(`Inserted ${inserted}/${toInsert.length} | Mem: ${mem}MB`);
    } catch (err) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, err);
    }
  }

  // 6. Show after stats
  const afterCount = await IngredientToCanonical.count();
  const delta = afterCount - beforeCount;
  console.log(`📊 After: ${afterCount} total mappings`);
  console.log(`➕ Net new mappings: ${delta}`);

  // 7. Coverage impact (estimate)
  if (delta > 0) {
    console.log(`🎉 Coverage improved by ${delta} new high-confidence mappings!`);
  } else {
    console.log('No coverage improvement (all were already mapped).');
  }

  // 8. Log details
  if (toInsert.length > 0) {
    console.log('\n📝 Sample of new mappings:');
    for (const m of toInsert.slice(0, 20)) {
      console.log(`  - ${m.messyName} → IngredientId: ${m.IngredientId}`);
    }
    if (toInsert.length > 20) {
      console.log(`  ...and ${toInsert.length - 20} more.`);
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n⏱️  Total time: ${totalElapsed}s | Mem: ${getMemoryUsageMB()}MB`);
  console.log('\n🚦 Massive auto-assignment complete.');
}

if (require.main === module) {
  autoAssignEnhancedFuzzyMassive().catch(e => {
    console.error('❌ Error in auto-assignment:', e);
  });
}

module.exports = { autoAssignEnhancedFuzzyMassive }; 