const { IngredientCategorized, Ingredient, IngredientToCanonical } = require('./db/models');
const { sequelize } = require('./db/database');
const { Op } = require('sequelize');

async function verifySystem() {
  console.log('🔍 VERIFYING COMPLETE SYSTEM...\n');
  
  try {
      // 1. Check product tagging coverage
  const taggedProducts = await IngredientCategorized.count({ where: { canonicalTag: { [Op.ne]: null } } });
  const totalProducts = await IngredientCategorized.count();
  console.log(`📦 Product Tagging:`);
  console.log(`   - Tagged products: ${taggedProducts}`);
  console.log(`   - Total products: ${totalProducts}`);
  console.log(`   - Coverage: ${((taggedProducts/totalProducts)*100).toFixed(1)}%\n`);
  
  // 2. Check ingredient mapping coverage
  const mappings = await IngredientToCanonical.count();
  const canonicalRecipeIngredients = await Ingredient.count();
  console.log(`🔗 Ingredient Mapping:`);
  console.log(`   - Total mappings: ${mappings}`);
  console.log(`   - Canonical ingredients: ${canonicalRecipeIngredients}`);
  console.log(`   - Avg mappings per canonical: ${(mappings/canonicalRecipeIngredients).toFixed(1)}\n`);
  
  // 3. Check allergen coverage
  const allergenProducts = await IngredientCategorized.count({ where: { allergens: { [Op.ne]: null } } });
  console.log(`⚠️  Allergen Coverage:`);
  console.log(`   - Products with allergens: ${allergenProducts}`);
  console.log(`   - Coverage: ${((allergenProducts/totalProducts)*100).toFixed(1)}%\n`);
  
  // 4. Sample some tagged products
  const sampleProducts = await IngredientCategorized.findAll({ 
    where: { canonicalTag: { [Op.ne]: null } },
    limit: 5,
    attributes: ['description', 'canonicalTag', 'canonicalTagConfidence']
  });
    console.log(`📋 Sample Tagged Products:`);
    sampleProducts.forEach(p => {
      console.log(`   - "${p.description}" → ${p.canonicalTag} (${p.canonicalTagConfidence})`);
    });
    
    console.log('\n✅ System verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  }
}

verifySystem(); 