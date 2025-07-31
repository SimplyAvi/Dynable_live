const { IngredientCategorized, Ingredient } = require('./db/models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 APPLYING SCALING PRODUCT MAPPINGS\n');
  // 1. Load all batch files
  let mappings = [];
  for (let i = 1; i <= 10; i++) {
    const file = `scale_product_mappings_batch_${i}.json`;
    if (fs.existsSync(file)) {
      const batch = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(batch)) {
        mappings = mappings.concat(batch);
      }
    }
  }
  if (!Array.isArray(mappings) || mappings.length === 0) {
    console.error('❌ No mappings found in batch files.');
    process.exit(1);
  }
  // Remove duplicate productIds (keep first occurrence)
  const seen = new Set();
  mappings = mappings.filter(m => {
    if (seen.has(m.productId)) return false;
    seen.add(m.productId);
    return true;
  });

  // 2. Validate canonicals
  const canonicals = await Ingredient.findAll({ attributes: ['name'] });
  const canonicalSet = new Set(canonicals.map(c => c.name.toLowerCase()));
  mappings = mappings.filter(m => canonicalSet.has(m.canonical.toLowerCase()));

  // 3. Count before coverage
  const beforeCoverage = await IngredientCategorized.count({ where: { canonicalTag: { [Op.ne]: null } } });
  let updated = 0;
  let errors = 0;

  // 4. Batch update in chunks of 500
  for (let i = 0; i < mappings.length; i += 500) {
    const chunk = mappings.slice(i, i + 500);
    const updatePromises = chunk.map(async m => {
      try {
        const [affected] = await IngredientCategorized.update(
          { canonicalTag: m.canonical, canonicalTagConfidence: 'confident' },
          { where: { id: m.productId } }
        );
        if (affected > 0) {
          updated++;
        } else {
          errors++;
        }
      } catch (err) {
        errors++;
      }
    });
    await Promise.all(updatePromises);
    if ((i + 1) % 1000 === 0 || i + 500 >= mappings.length) {
      console.log(`   Updated ${updated} of ${i + chunk.length} processed...`);
    }
  }

  // 5. Count after coverage
  const afterCoverage = await IngredientCategorized.count({ where: { canonicalTag: { [Op.ne]: null } } });

  // 6. Results summary
  console.log(`\n✅ Scaling mapping application complete.`);
  console.log(`   Successful updates: ${updated}`);
  console.log(`   Errors/skipped: ${errors}`);
  console.log(`   Product coverage before: ${beforeCoverage}`);
  console.log(`   Product coverage after:  ${afterCoverage}`);
  console.log(`   Net coverage improvement: ${afterCoverage - beforeCoverage}`);
  if (mappings.length > 0) {
    console.log('\nSample applied mappings:');
    mappings.slice(0, 10).forEach((m, i) => {
      console.log(`   ${i + 1}. "${m.product}" (${m.brand}) → ${m.canonical}`);
    });
  }
}

main(); 