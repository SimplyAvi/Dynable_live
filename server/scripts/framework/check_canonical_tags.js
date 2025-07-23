const { IngredientCategorized } = require('./db/models');
const { Op } = require('sequelize');
const { sequelize } = require('./db/database');

async function checkCanonicalTags() {
  try {
    console.log('=== TOP 20 CONFIDENT CANONICAL TAGS ===');
    const topTags = await IngredientCategorized.findAll({
      attributes: ['canonicalTag', [sequelize.fn('COUNT', sequelize.col('id')), 'product_count']],
      where: { canonicalTagConfidence: 'confident' },
      group: ['canonicalTag'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 20,
      raw: true
    });
    topTags.forEach(tag => console.log(`${tag.canonicalTag}: ${tag.product_count} products`));

    console.log('\n=== SUBSTITUTE-RELATED TAGS ===');
    const substituteTags = await IngredientCategorized.findAll({
      attributes: ['canonicalTag'],
      where: {
        canonicalTag: {
          [Op.in]: ['almond flour', 'coconut flour', 'gluten-free flour blend', 'oat flour', 'rice flour', 'almond milk', 'coconut milk', 'oat milk', 'soy milk']
        },
        canonicalTagConfidence: 'confident'
      },
      group: ['canonicalTag'],
      raw: true
    });
    substituteTags.forEach(tag => console.log(`✅ ${tag.canonicalTag}`));
    if (substituteTags.length === 0) {
      console.log('❌ No substitute products found');
    }

    console.log('\n=== ALL CONFIDENT CANONICAL TAGS (first 50) ===');
    const allTags = await IngredientCategorized.findAll({
      attributes: ['canonicalTag'],
      where: { canonicalTagConfidence: 'confident' },
      group: ['canonicalTag'],
      order: [['canonicalTag', 'ASC']],
      limit: 50,
      raw: true
    });
    allTags.forEach(tag => console.log(tag.canonicalTag));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCanonicalTags(); 