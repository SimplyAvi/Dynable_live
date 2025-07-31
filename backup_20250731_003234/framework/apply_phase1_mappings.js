const { IngredientCategorized, Ingredient } = require('./db/models');
const { Op } = require('sequelize');
const fs = require('fs');

async function main() {
  console.log('🚀 APPLYING PHASE 1 PRODUCT MAPPINGS\n');
  // 1. Load mappings
  let mappings;
  try {
    mappings = JSON.parse(fs.readFileSync('phase1_obvious_product_mappings_clean.json', 'utf8'));
  } catch (err) {
    console.error('❌ Failed to load phase1_obvious_product_mappings_clean.json:', err.message);
    process.exit(1);
  }
  if (!Array.isArray(mappings) || mappings.length === 0) {
    console.error('❌ No mappings found in JSON.');
    process.exit(1);
  }

  // 2. Count before coverage
  const beforeCoverage = await IngredientCategorized.count({ where: { canonicalTag: { [Op.ne]: null } } });
  let updated = 0;
  let errors = 0;

  // 3. Validate canonicals
  const canonicals = await Ingredient.findAll({ attributes: ['name'] });
  const canonicalSet = new Set(canonicals.map(c => c.name.toLowerCase()));

  // 4. Batch update
  for (let i = 0; i < mappings.length; i++) {
    const { productId, canonical } = mappings[i];
    if (!canonicalSet.has(canonical.toLowerCase())) {
      console.warn(`   [${i + 1}/${mappings.length}] Skipping: Canonical '${canonical}' does not exist.`);
      continue;
    }
    try {
      const [affected] = await IngredientCategorized.update(
        { canonicalTag: canonical, canonicalTagConfidence: 'confident' },
        { where: { id: productId } }
      );
      if (affected > 0) {
        updated++;
      } else {
        errors++;
        console.warn(`   [${i + 1}/${mappings.length}] No product found for id ${productId}`);
      }
    } catch (err) {
      errors++;
      console.error(`   [${i + 1}/${mappings.length}] Error updating product ${productId}:`, err.message);
    }
    if ((i + 1) % 50 === 0) {
      console.log(`   Updated ${updated} of ${i + 1} processed...`);
    }
  }

  // 5. Count after coverage
  const afterCoverage = await IngredientCategorized.count({ where: { canonicalTag: { [Op.ne]: null } } });

  // 6. Results summary
  console.log(`\n✅ Phase 1 mapping application complete.`);
  console.log(`   Successful updates: ${updated}`);
  console.log(`   Errors/skipped: ${errors}`);
  console.log(`   Product coverage before: ${beforeCoverage}`);
  console.log(`   Product coverage after:  ${afterCoverage}`);
  console.log(`   Net coverage improvement: ${afterCoverage - beforeCoverage}`);
}

main(); 