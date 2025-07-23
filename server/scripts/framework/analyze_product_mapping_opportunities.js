const { IngredientCategorized, Ingredient, IngredientToCanonical, sequelize } = require('./db/models');
const { Op, QueryTypes } = require('sequelize');

async function analyzeProductMappingOpportunities() {
  console.log('🔍 PRODUCT MAPPING STRATEGY ANALYZER\n');

  // 1. Current Product Coverage Assessment
  console.log('1️⃣ CURRENT PRODUCT COVERAGE ASSESSMENT');
  const totalCanonicals = await Ingredient.count();
  const canonicalsWithProducts = await IngredientCategorized.count({
    where: { canonicalTag: { [Op.ne]: null } },
    distinct: true,
    col: 'canonicalTag'
  });
  const canonicalsWithRealProducts = await IngredientCategorized.count({
    where: {
      canonicalTag: { [Op.ne]: null },
      brandOwner: { [Op.ne]: 'Generic' }
    },
    distinct: true,
    col: 'canonicalTag'
  });
  const totalProducts = await IngredientCategorized.count();
  const realProducts = await IngredientCategorized.count({ where: { brandOwner: { [Op.ne]: 'Generic' } } });
  const genericProducts = totalProducts - realProducts;

  // High-priority canonicals (frequent in recipes) without products
  const highPriorityCanonicals = await sequelize.query(`
    SELECT ci.name, COUNT(i.id) as recipe_count
    FROM "CanonicalRecipeIngredients" ci
    LEFT JOIN "IngredientToCanonicals" itc ON itc."IngredientId" = ci.id
    LEFT JOIN "RecipeIngredients" i ON LOWER(REPLACE(i.name, ' ', '')) = itc."messyName"
    LEFT JOIN "IngredientCategorized" f ON f."canonicalTag" = ci.name
    WHERE f.id IS NULL
    GROUP BY ci.id, ci.name
    ORDER BY recipe_count DESC
    LIMIT 20
  `, { type: QueryTypes.SELECT });

  console.log(`   Total canonicals: ${totalCanonicals.toLocaleString()}`);
  console.log(`   Canonicals with any products: ${canonicalsWithProducts.toLocaleString()}`);
  console.log(`   Canonicals with real products: ${canonicalsWithRealProducts.toLocaleString()}`);
  console.log(`   Total products: ${totalProducts.toLocaleString()} (Real: ${realProducts.toLocaleString()}, Generic: ${genericProducts.toLocaleString()})`);
  console.log('   High-priority canonicals (no products, frequent in recipes):');
  highPriorityCanonicals.forEach((c, i) => {
    console.log(`     ${i + 1}. ${c.name} (${c.recipe_count} recipe uses)`);
  });

  // 2. Unmapped Product Analysis
  console.log('\n2️⃣ UNMAPPED PRODUCT ANALYSIS');
  const unmappedRealProductsCount = await IngredientCategorized.count({
    where: {
      brandOwner: { [Op.ne]: 'Generic' },
      [Op.or]: [
        { canonicalTag: null },
        { canonicalTag: '' }
      ]
    }
  });
  const sampleUnmapped = await IngredientCategorized.findAll({
    where: {
      brandOwner: { [Op.ne]: 'Generic' },
      [Op.or]: [
        { canonicalTag: null },
        { canonicalTag: '' }
      ]
    },
    limit: 10,
    order: sequelize.random()
  });
  // Categorize by brand popularity and clarity
  const brandCounts = await IngredientCategorized.findAll({
    attributes: ['brandOwner', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    where: {
      brandOwner: { [Op.ne]: 'Generic' },
      [Op.or]: [
        { canonicalTag: null },
        { canonicalTag: '' }
      ]
    },
    group: ['brandOwner'],
    order: [[sequelize.literal('count'), 'DESC']],
    limit: 10
  });
  console.log(`   Unmapped real-brand products: ${unmappedRealProductsCount.toLocaleString()}`);
  console.log('   Top unmapped brands:');
  brandCounts.forEach((b, i) => {
    console.log(`     ${i + 1}. ${b.brandOwner} (${b.dataValues.count})`);
  });
  console.log('   Sample unmapped real-brand products:');
  sampleUnmapped.forEach((p, i) => {
    console.log(`     ${i + 1}. "${p.description}" (${p.brandOwner})`);
  });

  // 3. Strategic Approach Options
  console.log('\n3️⃣ STRATEGIC APPROACH OPTIONS');
  console.log('   • Fuzzy matching: Product descriptions → canonicals');
  console.log('   • Pattern recognition: Apply proven ingredient techniques to products');
  console.log('   • Manual curation: Target high-value product categories/brands');

  // 4. Implementation Roadmap
  console.log('\n4️⃣ IMPLEMENTATION ROADMAP');
  console.log('   Phase 1: Map obvious products (milk, bread, eggs, etc.)');
  console.log('   Phase 2: Scale with automated techniques (fuzzy, pattern, batch)');
  console.log('   Phase 3: Handle complex/processed products and edge cases');

  console.log('\n✅ Product mapping landscape analyzed. Ready for action!');
}

analyzeProductMappingOpportunities(); 