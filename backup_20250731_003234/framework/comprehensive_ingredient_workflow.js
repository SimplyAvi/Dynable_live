const { IngredientCategorized, Subcategory, Ingredient, IngredientToCanonicals } = require('./db/models');
const sequelize = require('./db/database');

async function comprehensiveIngredientWorkflow() {
  try {
    console.log('🔄 COMPREHENSIVE INGREDIENT WORKFLOW\n');
    
    // Test cases: pure vs processed ingredients
    const testCases = [
      { ingredient: 'mayonnaise', type: 'processed', expected: 'mayonnaise' },
      { ingredient: 'olive oil', type: 'pure', expected: 'olive oil' },
      { ingredient: 'bread', type: 'processed', expected: 'bread' },
      { ingredient: 'egg', type: 'pure', expected: 'egg' },
      { ingredient: 'cream cheese', type: 'processed', expected: 'cream cheese' },
      { ingredient: 'salt', type: 'pure', expected: 'salt' }
    ];
    
    console.log('🧪 TESTING INGREDIENT CLASSIFICATION AND MAPPING:\n');
    
    for (const testCase of testCases) {
      console.log(`📋 Testing: "${testCase.ingredient}" (${testCase.type})`);
      console.log(`   Expected canonical: "${testCase.expected}"`);
      
      // 1. Check if ingredient maps to canonical
      const canonicalMapping = await IngredientToCanonicals.findOne({
        where: { messyName: testCase.ingredient.toLowerCase() },
        include: [{ model: Ingredient, as: 'Ingredient' }]
      });
      
      if (canonicalMapping) {
        const canonicalName = canonicalMapping.Ingredient.name;
        console.log(`   ✅ Mapped to canonical: "${canonicalName}"`);
        
        // 2. Check if canonical has subcategory classification
        const subcategory = await Subcategory.findOne({
          where: { SubcategoryName: { [sequelize.Sequelize.Op.iLike]: `%${canonicalName}%` } }
        });
        
        if (subcategory) {
          console.log(`   🏷️  Subcategory: "${subcategory.SubcategoryName}"`);
          console.log(`      Pure ingredient: ${subcategory.pure_ingredient}`);
          console.log(`      Processed food: ${subcategory.is_processed_food}`);
          
          // 3. Check if classification matches expected type
          const isCorrectlyClassified = 
            (testCase.type === 'pure' && subcategory.pure_ingredient) ||
            (testCase.type === 'processed' && subcategory.is_processed_food);
          
          console.log(`   ${isCorrectlyClassified ? '✅' : '❌'} Classification: ${isCorrectlyClassified ? 'CORRECT' : 'INCORRECT'}`);
        } else {
          console.log(`   ❓ No subcategory found for "${canonicalName}"`);
        }
        
        // 4. Check available products
        const products = await IngredientCategorized.findAll({
          where: { canonicalTag: canonicalName },
          limit: 5,
          order: [['description', 'ASC']]
        });
        
        console.log(`   🛒 Available products: ${products.length}`);
        products.forEach(product => {
          const isReal = product.brandOwner !== 'Generic';
          console.log(`      ${isReal ? '✅' : '❌'} "${product.description}" (${product.brandOwner})`);
        });
        
      } else {
        console.log(`   ❌ No canonical mapping found`);
      }
      
      console.log(''); // Empty line for readability
    }
    
    // 5. Show workflow summary
    console.log('📊 WORKFLOW SUMMARY:');
    console.log('');
    console.log('🔄 FOR PURE INGREDIENTS (like "olive oil"):');
    console.log('   1. Recipe calls for "olive oil"');
    console.log('   2. Maps to canonical "olive oil"');
    console.log('   3. Subcategory marked as pure_ingredient = true');
    console.log('   4. Shows real olive oil products');
    console.log('   5. User can choose pure olive oil products');
    console.log('');
    console.log('🔄 FOR PROCESSED INGREDIENTS (like "mayonnaise"):');
    console.log('   1. Recipe calls for "mayonnaise"');
    console.log('   2. Maps to canonical "mayonnaise"');
    console.log('   3. Subcategory marked as is_processed_food = true');
    console.log('   4. Shows real mayonnaise products');
    console.log('   5. User can choose real mayonnaise products');
    console.log('   6. NO substitution with "egg + oil + vinegar"');
    console.log('');
    console.log('💡 KEY INSIGHTS:');
    console.log('   ✅ Processed ingredients need their own canonical entries');
    console.log('   ✅ Processed ingredients need real products in database');
    console.log('   ✅ Subcategory flags help distinguish pure vs processed');
    console.log('   ✅ No substitution for processed ingredients - use as-is');
    console.log('   ✅ Allergen tracking works for both pure and processed');
    
    // 6. Check current coverage
    console.log('\n📈 COVERAGE ANALYSIS:');
    
    const totalCanonicals = await Ingredient.count();
    const pureSubcategories = await Subcategory.count({ where: { pure_ingredient: true } });
    const processedSubcategories = await Subcategory.count({ where: { is_processed_food: true } });
    
    console.log(`   Total canonical ingredients: ${totalCanonicals}`);
    console.log(`   Pure subcategories: ${pureSubcategories}`);
    console.log(`   Processed subcategories: ${processedSubcategories}`);
    
    // Check products with canonical tags
    const totalProducts = await IngredientCategorized.count();
    const productsWithCanonical = await IngredientCategorized.count({
      where: { canonicalTag: { [sequelize.Sequelize.Op.ne]: null } }
    });
    
    console.log(`   Total products: ${totalProducts}`);
    console.log(`   Products with canonicalTag: ${productsWithCanonical} (${(productsWithCanonical/totalProducts*100).toFixed(1)}%)`);
    
    console.log('\n✅ WORKFLOW ANALYSIS COMPLETE!');
    
  } catch (error) {
    console.error('❌ Error in comprehensive workflow:', error);
  } finally {
    await sequelize.close();
  }
}

comprehensiveIngredientWorkflow(); 