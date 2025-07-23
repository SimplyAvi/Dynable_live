const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const db = require('./db/database');

const BATCH_SIZE = 500;
const COMMON_INGREDIENTS = ['milk', 'chicken', 'cheese', 'egg', 'beef', 'tomato', 'onion', 'garlic', 'potato', 'carrot'];

async function getCanonicalSet() {
  // Load all canonical names for validation
  const canonicals = await db.query('SELECT name FROM "CanonicalRecipeIngredients"', { type: Sequelize.QueryTypes.SELECT });
  return new Set(canonicals.map(c => c.name.toLowerCase()));
}

async function getIngredientCategorizedCoverage() {
  const total = (await db.query('SELECT COUNT(*) as total FROM "IngredientCategorized"', { type: Sequelize.QueryTypes.SELECT }))[0].total;
  const withCanonical = (await db.query("SELECT COUNT(*) as count FROM \"IngredientCategorized\" WHERE \"canonicalTag\" IS NOT NULL AND \"canonicalTag\" != ''", { type: Sequelize.QueryTypes.SELECT }))[0].count;
  return { total, withCanonical, percent: ((withCanonical / total) * 100).toFixed(2) };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  console.log(`\nBatch Canonical Tagger (${dryRun ? 'DRY RUN' : 'LIVE'})\n`);

  // 1. Load suggestions
  const analysisPath = path.join(__dirname, 'food_analysis_results.json');
  if (!fs.existsSync(analysisPath)) {
    console.error('food_analysis_results.json not found. Run the analysis script first.');
    process.exit(1);
  }
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
  // Use all valid suggestions (not just common ingredients)
  const suggestions = (analysis.suggestions || []).filter(s => s.suggestedCanonical);
  if (suggestions.length === 0) {
    console.log('No valid suggestions found.');
    process.exit(0);
  }

  // 2. Validate canonical names
  const canonicalSet = await getCanonicalSet();
  const validSuggestions = suggestions.filter(s => canonicalSet.has(s.suggestedCanonical.toLowerCase()));
  console.log(`Loaded ${validSuggestions.length} valid suggestions for tagging.`);

  // 3. Include all brands (real and Generic)
  const realBrandSuggestions = validSuggestions.filter(s => s.brandOwner && s.brandOwner !== 'Generic');
  // const realBrandSuggestions = validSuggestions; // Include all brands
  // Remove products that already have a canonicalTag
  const ids = realBrandSuggestions.map(s => s.id);
  const alreadyTagged = await db.query(
    "SELECT id FROM \"IngredientCategorized\" WHERE id IN (:ids) AND \"canonicalTag\" IS NOT NULL AND \"canonicalTag\" != ''",
    { replacements: { ids }, type: Sequelize.QueryTypes.SELECT }
  );
  const alreadyTaggedSet = new Set(alreadyTagged.map(r => r.id));
  const toUpdate = realBrandSuggestions.filter(s => !alreadyTaggedSet.has(s.id));
  console.log(`Filtered to ${toUpdate.length} unmapped real-brand products.`);

  // Enhanced reporting: breakdown by canonical and brand type
  const canonicalBreakdown = {};
  toUpdate.forEach(s => {
    canonicalBreakdown[s.suggestedCanonical] = (canonicalBreakdown[s.suggestedCanonical] || 0) + 1;
  });
  console.log('\nBreakdown by canonical:');
  Object.entries(canonicalBreakdown).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log(`\nTargeting only real, purchasable products (non-Generic brands).`);

  // 4. Show before stats
  const before = await getIngredientCategorizedCoverage();
  console.log(`\nBefore: ${before.withCanonical}/${before.total} products mapped (${before.percent}%)`);

  // 5. Batch update
  let updated = 0;
  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const batch = toUpdate.slice(i, i + BATCH_SIZE);
    if (dryRun) {
      console.log(`\n[DRY RUN] Would update ${batch.length} products in batch ${i/BATCH_SIZE+1}`);
      batch.forEach(s => console.log(`  ID: ${s.id} | Brand: ${s.brandOwner} | Canonical: ${s.suggestedCanonical} | Desc: ${s.description.substring(0,60)}`));
    } else {
      const queries = batch.map(s =>
        db.query('UPDATE "IngredientCategorized" SET "canonicalTag" = :canonical WHERE id = :id', {
          replacements: { canonical: s.suggestedCanonical, id: s.id },
          type: Sequelize.QueryTypes.UPDATE
        })
      );
      await Promise.all(queries);
      updated += batch.length;
      console.log(`Updated ${batch.length} products in batch ${i/BATCH_SIZE+1}`);
    }
  }

  // 6. After stats
  const after = await getIngredientCategorizedCoverage();
  console.log(`\nAfter: ${after.withCanonical}/${after.total} products mapped (${after.percent}%)`);
  console.log(`\nProjected improvement: +${(after.withCanonical - before.withCanonical)} products, +${(after.percent - before.percent).toFixed(2)}% coverage`);

  // 7. Export updated list
  if (!dryRun) {
    const updatedIds = toUpdate.map(s => s.id);
    const updatedProducts = await db.query('SELECT id, description, "brandOwner", "canonicalTag" FROM "IngredientCategorized" WHERE id IN (:ids)', {
      replacements: { ids: updatedIds },
      type: Sequelize.QueryTypes.SELECT
    });
    fs.writeFileSync(path.join(__dirname, 'batch_tagged_products.json'), JSON.stringify(updatedProducts, null, 2));
    // Export detailed breakdown
    fs.writeFileSync(path.join(__dirname, 'batch_tagged_breakdown.json'), JSON.stringify({ canonicalBreakdown }, null, 2));
    console.log('Exported updated products to batch_tagged_products.json');
    console.log('Exported breakdown to batch_tagged_breakdown.json');
  }

  console.log('\nBatch canonical tagging complete.');
  if (dryRun) {
    console.log('Run again without --dry-run to apply changes.');
  }
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}

// Usage:
//   node server/batch_canonical_tagger.js --dry-run   # Preview changes
//   node server/batch_canonical_tagger.js             # Apply updates 