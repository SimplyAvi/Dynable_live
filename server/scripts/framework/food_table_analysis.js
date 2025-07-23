const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const db = require('./db/database');

async function main() {
  const results = {};
  console.log('🔍 Starting IngredientCategorized Table Comprehensive Analysis...');

  // 1. IngredientCategorized Table Structure Analysis
  console.log('\n1️⃣ IngredientCategorized Table Structure Analysis');
  const sample = await db.query(`SELECT id, description, "canonicalTag", "brandOwner", "shortDescription" FROM "IngredientCategorized" ORDER BY RANDOM() LIMIT 50`, { type: Sequelize.QueryTypes.SELECT });
  results.foodSample = sample;
  // Analyze canonicalTag population patterns
  const canonicalTagPatterns = sample.reduce((acc, row) => {
    const tag = row.canonicalTag || '';
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});
  results.canonicalTagPatterns = canonicalTagPatterns;
  // Data types and field lengths
  results.fieldTypes = {
    id: typeof sample[0]?.id,
    description: typeof sample[0]?.description,
    canonicalTag: typeof sample[0]?.canonicalTag,
    brandOwner: typeof sample[0]?.brandOwner,
    shortDescription: typeof sample[0]?.shortDescription,
  };
  results.fieldLengths = {
    description: Math.max(...sample.map(r => (r.description || '').length)),
    canonicalTag: Math.max(...sample.map(r => (r.canonicalTag || '').length)),
    brandOwner: Math.max(...sample.map(r => (r.brandOwner || '').length)),
    shortDescription: Math.max(...sample.map(r => (r.shortDescription || '').length)),
  };
  console.log('   Sampled 50 IngredientCategorized records.');

  // 2. canonicalTag Coverage Analysis
  console.log('\n2️⃣ canonicalTag Coverage Analysis');
  const { total } = (await db.query(`SELECT COUNT(*) as total FROM "IngredientCategorized"`, { type: Sequelize.QueryTypes.SELECT }))[0];
  const { nonNull } = (await db.query(`SELECT COUNT(*) as nonNull FROM "IngredientCategorized" WHERE "canonicalTag" IS NOT NULL AND "canonicalTag" != ''`, { type: Sequelize.QueryTypes.SELECT }))[0];
  const { nullOrEmpty } = (await db.query(`SELECT COUNT(*) as nullOrEmpty FROM "IngredientCategorized" WHERE "canonicalTag" IS NULL OR "canonicalTag" = ''`, { type: Sequelize.QueryTypes.SELECT }))[0];
  results.canonicalTagCoverage = {
    total,
    nonNull,
    nullOrEmpty,
    percentWithCanonical: ((nonNull / total) * 100).toFixed(2),
    percentWithoutCanonical: ((nullOrEmpty / total) * 100).toFixed(2),
  };
  console.log(`   Total: ${total}, With canonicalTag: ${nonNull}, Without: ${nullOrEmpty}`);

  // 3. Brand Distribution Analysis
  console.log('\n3️⃣ Brand Distribution Analysis');
  const brandCounts = await db.query(`SELECT "brandOwner", COUNT(*) as count FROM "IngredientCategorized" GROUP BY "brandOwner" ORDER BY count DESC`, { type: Sequelize.QueryTypes.SELECT });
  const genericCount = brandCounts.find(b => b.brandOwner === 'Generic')?.count || 0;
  const realBrands = brandCounts.filter(b => b.brandOwner && b.brandOwner !== 'Generic' && b.brandOwner !== '').sort((a, b) => b.count - a.count);
  results.brandDistribution = {
    totalBrands: brandCounts.length,
    genericCount,
    realBrandCount: realBrands.reduce((sum, b) => sum + Number(b.count), 0),
    top20RealBrands: realBrands.slice(0, 20),
  };
  // Sample products
  const genericSample = await db.query(`SELECT id, description, "brandOwner", "canonicalTag" FROM "IngredientCategorized" WHERE "brandOwner" = 'Generic' LIMIT 5`, { type: Sequelize.QueryTypes.SELECT });
  const realSample = await db.query(`SELECT id, description, "brandOwner", "canonicalTag" FROM "IngredientCategorized" WHERE "brandOwner" != 'Generic' AND "brandOwner" IS NOT NULL AND "brandOwner" != '' LIMIT 5`, { type: Sequelize.QueryTypes.SELECT });
  results.brandSamples = { genericSample, realSample };
  console.log('   Brand distribution and samples collected.');

  // 4. Product-Canonical Matching Opportunities
  console.log('\n4️⃣ Product-Canonical Matching Opportunities');
  const keywords = ['tomato', 'chicken', 'cheese', 'milk', 'egg', 'beef', 'onion', 'garlic', 'potato', 'carrot'];
  const keywordMatches = {};
  for (const k of keywords) {
    keywordMatches[k] = await db.query(`SELECT id, description, "brandOwner", "canonicalTag" FROM "IngredientCategorized" WHERE LOWER(description) LIKE :kw LIMIT 10`, {
      replacements: { kw: `%${k}%` },
      type: Sequelize.QueryTypes.SELECT
    });
  }
  results.keywordMatches = keywordMatches;
  console.log('   Keyword-based product samples collected.');

  // 5. Data Quality Assessment
  console.log('\n5️⃣ Data Quality Assessment');
  // Unmapped products
  const unmappedSample = await db.query(`SELECT id, description, "brandOwner" FROM "IngredientCategorized" WHERE "canonicalTag" IS NULL OR "canonicalTag" = '' LIMIT 20`, { type: Sequelize.QueryTypes.SELECT });
  results.unmappedSample = unmappedSample;
  // Suggest canonicalTag assignments for common products
  const suggestions = [];
  for (const k of keywords) {
    for (const prod of keywordMatches[k]) {
      if (!prod.canonicalTag || prod.canonicalTag === '') {
        suggestions.push({ id: prod.id, description: prod.description, brandOwner: prod.brandOwner, suggestedCanonical: k });
      }
    }
  }
  results.suggestions = suggestions;
  // Export results
  fs.writeFileSync(path.join(__dirname, 'food_analysis_results.json'), JSON.stringify(results, null, 2));
  console.log('   Data quality assessment and suggestions exported.');

  // 6. Actionable Recommendations
  console.log('\n6️⃣ Actionable Recommendations');
  const recs = [];
  if (results.canonicalTagCoverage.percentWithCanonical < 10) {
    recs.push('Very low canonicalTag coverage. Consider batch-tagging products with clear ingredient keywords.');
  }
  if (results.brandDistribution.genericCount / total > 0.5) {
    recs.push('Majority of products are Generic. Focus on mapping real brand products for higher value.');
  }
  if (suggestions.length > 0) {
    recs.push('There are many unmapped products with clear ingredient keywords. Use these as candidates for auto-tagging.');
  }
  recs.push('Review top 20 real brands for high-impact canonical linking.');
  recs.push('Prioritize products with high-frequency keywords and no canonicalTag.');
  results.recommendations = recs;
  fs.writeFileSync(path.join(__dirname, 'food_analysis_results.json'), JSON.stringify(results, null, 2));
  console.log('   Recommendations generated and saved.');

  console.log('\n✅ IngredientCategorized Table Analysis Complete. Results saved to food_analysis_results.json');
}

main().catch(e => { console.error(e); process.exit(1); }); 