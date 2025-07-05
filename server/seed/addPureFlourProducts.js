const { Food } = require('../db/models');

async function addPureFlourProducts() {
  const products = [
    {
      description: 'ALMOND FLOUR',
      brandName: 'Generic',
      canonicalTag: 'almond flour',
      canonicalTagConfidence: 'confident',
      allergens: ['tree nuts', 'almonds'],
    },
    {
      description: 'BLANCHED ALMOND FLOUR',
      brandName: 'Generic',
      canonicalTag: 'almond flour',
      canonicalTagConfidence: 'confident',
      allergens: ['tree nuts', 'almonds'],
    },
    {
      description: 'PSYLLIUM HUSK',
      brandName: 'Generic',
      canonicalTag: 'psyllium husk',
      canonicalTagConfidence: 'confident',
      allergens: [],
    },
    {
      description: 'ORGANIC PSYLLIUM HUSK',
      brandName: 'Generic',
      canonicalTag: 'psyllium husk',
      canonicalTagConfidence: 'confident',
      allergens: [],
    }
  ];

  for (const prod of products) {
    const exists = await Food.findOne({ where: { description: prod.description } });
    if (!exists) {
      await Food.create(prod);
      console.log(`✅ Added product: ${prod.description}`);
    } else {
      console.log(`⏭️  Skipped (already exists): ${prod.description}`);
    }
  }
  console.log('🎉 Pure flour products added!');
}

addPureFlourProducts()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); }); 