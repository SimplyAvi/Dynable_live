const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const db = require('./db/database');

function isQuestionableMapping(description, canonicalTag) {
  // Simple heuristic: description must contain canonicalTag (case-insensitive, word boundary)
  if (!canonicalTag) return true;
  const regex = new RegExp(`\\b${canonicalTag.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
  return !regex.test(description);
}

async function main() {
  const results = {};
  // 1. Sample 100 mapped real-brand products
  const sample = await db.query(
    "SELECT id, description, \"brandOwner\", \"canonicalTag\" FROM \"IngredientCategorized\" WHERE \"canonicalTag\" IS NOT NULL AND \"canonicalTag\" != '' AND \"brandOwner\" IS NOT NULL AND \"brandOwner\" != '' AND \"brandOwner\" != 'Generic' ORDER BY RANDOM() LIMIT 100",
    { type: Sequelize.QueryTypes.SELECT }
  );
  results.sample = sample;
  // Flag questionable mappings
  const questionable = sample.filter(row => isQuestionableMapping(row.description, row.canonicalTag));
  const highConfidence = sample.filter(row => !isQuestionableMapping(row.description, row.canonicalTag));
  results.questionable = questionable;
  results.highConfidence = highConfidence;

  // 2. Group by canonicalTag
  const byCanonical = {};
  sample.forEach(row => {
    if (!byCanonical[row.canonicalTag]) byCanonical[row.canonicalTag] = [];
    byCanonical[row.canonicalTag].push(row);
  });
  results.byCanonical = {};
  Object.entries(byCanonical).forEach(([canonical, rows]) => {
    results.byCanonical[canonical] = {
      count: rows.length,
      topDescriptions: rows.slice(0, 5).map(r => r.description),
      brands: [...new Set(rows.map(r => r.brandOwner))]
    };
  });
  // Flag over-mapping
  results.overMappedCanonicals = Object.entries(results.byCanonical)
    .filter(([canonical, data]) => data.count > 10)
    .map(([canonical, data]) => ({ canonical, count: data.count }));

  // 3. Quality metrics
  results.metrics = {
    canonicalDistribution: Object.fromEntries(Object.entries(results.byCanonical).map(([k, v]) => [k, v.count])),
    brandDiversity: Object.fromEntries(Object.entries(results.byCanonical).map(([k, v]) => [k, v.brands.length])),
    questionableCount: questionable.length,
    highConfidenceCount: highConfidence.length
  };

  // 4. Export clean dataset
  fs.writeFileSync(path.join(__dirname, 'audit_successful_mappings.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(__dirname, 'audit_successful_mappings_curated.json'), JSON.stringify(highConfidence, null, 2));
  console.log('Audit complete. Results saved to audit_successful_mappings.json and audit_successful_mappings_curated.json');
}

main().catch(e => { console.error(e); process.exit(1); }); 