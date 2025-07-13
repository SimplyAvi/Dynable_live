const { Food, Subcategory, CanonicalIngredient } = require('./db/models');
const sequelize = require('./db/database');

async function analyzePureFoodCoverage() {
  try {
    console.log('🔍 ANALYZING PURE FOOD COVERAGE\n');
    
    // 1. Basic Food product statistics
    const totalProducts = await Food.count();
    const productsWithCanonical = await Food.count({
      where: {
        canonicalTag: { [sequelize.Sequelize.Op.ne]: null }
      }
    });
    
    console.log('📊 FOOD PRODUCTS ANALYSIS:');
    console.log(`   Total products: ${totalProducts.toLocaleString()}`);
    console.log(`   With canonicalTag: ${productsWithCanonical.toLocaleString()} (${(productsWithCanonical/totalProducts*100).toFixed(1)}%)`);
    console.log(`   Without canonicalTag: ${(totalProducts - productsWithCanonical).toLocaleString()} (${((totalProducts - productsWithCanonical)/totalProducts*100).toFixed(1)}%)`);
    
    // 2. Canonical ingredients analysis
    const totalCanonicals = await CanonicalIngredient.count();
    console.log(`\n📋 CANONICAL INGREDIENTS: ${totalCanonicals.toLocaleString()}`);
    
    // 3. Subcategory pure ingredient analysis
    const totalSubcategories = await Subcategory.count();
    const pureSubcategories = await Subcategory.count({
      where: { pure_ingredient: true }
    });
    const processedSubcategories = await Subcategory.count({
      where: { is_processed_food: true }
    });
    
    console.log('\n🏷️  SUBCATEGORY CLASSIFICATION:');
    console.log(`   Total subcategories: ${totalSubcategories}`);
    console.log(`   Pure ingredients: ${pureSubcategories} (${(pureSubcategories/totalSubcategories*100).toFixed(1)}%)`);
    console.log(`   Processed foods: ${processedSubcategories} (${(processedSubcategories/totalSubcategories*100).toFixed(1)}%)`);
    
    // 4. Sample products with and without canonical tags
    console.log('\n📋 SAMPLE PRODUCTS WITH CANONICAL TAGS:');
    const productsWithTags = await Food.findAll({
      where: {
        canonicalTag: { [sequelize.Sequelize.Op.ne]: null }
      },
      limit: 10,
      order: [['description', 'ASC']]
    });
    
    productsWithTags.forEach(product => {
      console.log(`   ✅ "${product.description}" -> ${product.canonicalTag}`);
    });
    
    console.log('\n📋 SAMPLE PRODUCTS WITHOUT CANONICAL TAGS:');
    const productsWithoutTags = await Food.findAll({
      where: {
        canonicalTag: null
      },
      limit: 10,
      order: [['description', 'ASC']]
    });
    
    productsWithoutTags.forEach(product => {
      console.log(`   ❌ "${product.description}" -> null`);
    });
    
    // 5. Pure vs processed product analysis
    console.log('\n🔍 PURE VS PROCESSED PRODUCT ANALYSIS:');
    
    // Get products that have canonical tags and check their subcategory
    const productsWithCanonicalAndSubcategory = await Food.findAll({
      where: {
        canonicalTag: { [sequelize.Sequelize.Op.ne]: null }
      },
      include: [{
        model: Subcategory,
        as: 'Subcategory'
      }],
      limit: 20
    });
    
    let pureProducts = 0;
    let processedProducts = 0;
    let unclassifiedProducts = 0;
    
    productsWithCanonicalAndSubcategory.forEach(product => {
      const subcategory = product.Subcategory;
      if (subcategory) {
        if (subcategory.pure_ingredient) {
          pureProducts++;
          console.log(`   ✅ PURE: "${product.description}" -> ${product.canonicalTag} (${subcategory.SubcategoryName})`);
        } else if (subcategory.is_processed_food) {
          processedProducts++;
          console.log(`   🔄 PROCESSED: "${product.description}" -> ${product.canonicalTag} (${subcategory.SubcategoryName})`);
        } else {
          unclassifiedProducts++;
          console.log(`   ❓ UNCLASSIFIED: "${product.description}" -> ${product.canonicalTag} (${subcategory.SubcategoryName})`);
        }
      } else {
        unclassifiedProducts++;
        console.log(`   ❓ NO SUBCATEGORY: "${product.description}" -> ${product.canonicalTag}`);
      }
    });
    
    console.log(`\n📊 CLASSIFICATION SUMMARY:`);
    console.log(`   Pure products: ${pureProducts}`);
    console.log(`   Processed products: ${processedProducts}`);
    console.log(`   Unclassified products: ${unclassifiedProducts}`);
    
    // 6. Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (productsWithCanonical < totalProducts * 0.5) {
      console.log('   🔧 Priority 1: Add canonicalTag to products (low coverage)');
    }
    
    if (pureProducts < (pureProducts + processedProducts) * 0.3) {
      console.log('   🔧 Priority 2: Improve pure product classification');
    }
    
    if (unclassifiedProducts > 0) {
      console.log('   🔧 Priority 3: Classify unclassified products');
    }
    
    console.log('\n✅ ANALYSIS COMPLETE!');
    
  } catch (error) {
    console.error('❌ Error analyzing pure food coverage:', error);
  } finally {
    await sequelize.close();
  }
}

analyzePureFoodCoverage(); 