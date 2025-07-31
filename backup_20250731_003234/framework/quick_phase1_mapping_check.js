const { IngredientCategorized } = require('./db/models');

(async () => {
  const samples = await IngredientCategorized.findAll({
    where: { canonicalTagConfidence: 'confident' },
    limit: 20,
    order: [['updatedAt', 'DESC']],
    attributes: ['description', 'brandOwner', 'canonicalTag']
  });
  console.log('=== RECENT PHASE 1 MAPPINGS SAMPLE ===');
  samples.forEach((p, i) => {
    console.log(`${i+1}. "${p.description}" (${p.brandOwner}) → ${p.canonicalTag}`);
  });
  process.exit(0);
})(); 