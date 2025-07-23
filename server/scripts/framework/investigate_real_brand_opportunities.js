const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const db = require('./db/database');

const KEYWORDS = [
  'milk', 'chicken', 'cheese', 'egg', 'beef', 'tomato', 'onion', 'garlic', 'potato', 'carrot',
  'yogurt', 'pasta', 'rice', 'bread', 'fish', 'pork', 'turkey', 'lettuce', 'spinach', 'pepper',
  'apple', 'banana', 'orange', 'strawberry', 'almond', 'walnut', 'cashew', 'oat', 'corn', 'bean',
  'sugar', 'salt', 'oil', 'butter', 'cream', 'sour cream', 'mayonnaise', 'mustard', 'vinegar', 'honey'
];
const MAJOR_BRANDS = [
  'Kraft', 'Nestle', 'General Mills', 'PepsiCo', 'Coca-Cola', 'Tyson', 'Danone', 'Conagra', 'Kellogg',
  'Unilever', 'Hormel', 'Campbell', 'J.M. Smucker', 'Bimbo', 'Mondelez', 'Mars', 'Dole', 'Chobani', 'Dean IngredientCategorizeds', 'Saputo'
];

async function main() {
  const results = {};
  // 1. Analyze the 61 suggestions
  const analysisPath = path.join(__dirname, 'food_analysis_results.json');
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
  const suggestions = (analysis.suggestions || []).filter(s => s.suggestedCanonical);
  const realBrand = suggestions.filter(s => s.brandOwner && s.brandOwner !== 'Generic');
  const generic = suggestions.filter(s => !s.brandOwner || s.brandOwner === 'Generic');
  results.suggestionStats = {
    total: suggestions.length,
    realBrand: realBrand.length,
    generic: generic.length,
    realBrandSample: realBrand.slice(0, 5),
    genericSample: generic.slice(0, 5)
  };
  // Check mapping status
  const realBrandIds = realBrand.map(s => s.id);
  const alreadyMapped = await db.query(
    'SELECT id, "canonicalTag" FROM "IngredientCategorized" WHERE id IN (:ids)',
    { replacements: { ids: realBrandIds }, type: Sequelize.QueryTypes.SELECT }
  );
  const mappedSet = new Set(alreadyMapped.filter(r => r.canonicalTag && r.canonicalTag !== '').map(r => r.id));
  results.realBrandMappingStatus = realBrand.map(s => ({
    id: s.id,
    brandOwner: s.brandOwner,
    description: s.description,
    suggestedCanonical: s.suggestedCanonical,
    alreadyMapped: mappedSet.has(s.id)
  }));

  // 2. Expand food analysis: 100+ products per keyword, real brands only
  const keywordMatches = {};
  for (const k of KEYWORDS) {
    keywordMatches[k] = await db.query(
      "SELECT id, description, \"brandOwner\", \"canonicalTag\" FROM \"IngredientCategorized\" WHERE LOWER(description) LIKE :kw AND \"brandOwner\" IS NOT NULL AND \"brandOwner\" != '' AND \"brandOwner\" != 'Generic' LIMIT 100",
      { replacements: { kw: `%${k}%` }, type: Sequelize.QueryTypes.SELECT }
    );
  }
  results.keywordMatches = keywordMatches;

  // 3. Discover unmapped real-brand products (major brands)
  const majorBrandMatches = {};
  for (const brand of MAJOR_BRANDS) {
    majorBrandMatches[brand] = await db.query(
      "SELECT id, description, \"brandOwner\", \"canonicalTag\" FROM \"IngredientCategorized\" WHERE \"brandOwner\" ILIKE :brand AND (\"canonicalTag\" IS NULL OR \"canonicalTag\" = '') LIMIT 50",
      { replacements: { brand: `%${brand}%` }, type: Sequelize.QueryTypes.SELECT }
    );
  }
  results.majorBrandUnmapped = majorBrandMatches;

  // 4. Broader opportunity assessment
  const totalRealBrand = (await db.query("SELECT COUNT(*) as count FROM \"IngredientCategorized\" WHERE \"brandOwner\" IS NOT NULL AND \"brandOwner\" != '' AND \"brandOwner\" != 'Generic'", { type: Sequelize.QueryTypes.SELECT }))[0].count;
  const unmappedRealBrand = (await db.query("SELECT COUNT(*) as count FROM \"IngredientCategorized\" WHERE (\"canonicalTag\" IS NULL OR \"canonicalTag\" = '') AND \"brandOwner\" IS NOT NULL AND \"brandOwner\" != '' AND \"brandOwner\" != 'Generic'", { type: Sequelize.QueryTypes.SELECT }))[0].count;
  results.realBrandStats = {
    totalRealBrand,
    unmappedRealBrand,
    mappedRealBrand: totalRealBrand - unmappedRealBrand,
    percentMapped: ((totalRealBrand - unmappedRealBrand) / totalRealBrand * 100).toFixed(2),
    percentUnmapped: (unmappedRealBrand / totalRealBrand * 100).toFixed(2)
  };

  fs.writeFileSync(path.join(__dirname, 'investigate_real_brand_opportunities.json'), JSON.stringify(results, null, 2));
  console.log('Investigation complete. Results saved to investigate_real_brand_opportunities.json');
}

main().catch(e => { console.error(e); process.exit(1); }); 