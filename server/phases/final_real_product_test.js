const db = require('./db/database.js');

async function finalRealProductTest() {
  try {
    await db.authenticate();
    const Food = require('./db/models/Food.js');
    const Recipe = require('./db/models/Recipe/Recipe.js');
    const Ingredient = require('./db/models/Recipe/Ingredient.js');
    
    console.log('🎯 Final Real Product Test...\n');
    
    // Get final statistics
    const totalProducts = await Food.count();
    const genericProducts = await Food.count({ where: { brandOwner: 'Generic' } });
    const realProducts = totalProducts - genericProducts;
    const mappedRealProducts = await Food.count({
      where: {
        brandOwner: { [db.Sequelize.Op.ne]: 'Generic' },
        canonicalTag: { [db.Sequelize.Op.ne]: null }
      }
    });
    
    console.log('📊 Final Statistics:');
    console.log(`  Total products: ${totalProducts.toLocaleString()}`);
    console.log(`  Real products: ${realProducts.toLocaleString()} (${((realProducts/totalProducts)*100).toFixed(1)}%)`);
    console.log(`  Generic products: ${genericProducts.toLocaleString()} (${((genericProducts/totalProducts)*100).toFixed(1)}%)`);
    console.log(`  Mapped real products: ${mappedRealProducts.toLocaleString()}`);
    
    // Test recipe functionality with real products
    console.log('\n🧪 Testing Recipe Functionality with Real Products...');
    
    const testRecipeIds = [17, 20005, 20006, 20007, 20017];
    let totalRecipeIngredients = 0;
    let ingredientsWithRealProducts = 0;
    let ingredientsWithGenericProducts = 0;
    let ingredientsWithNoProducts = 0;
    
    for (const recipeId of testRecipeIds) {
      console.log(`\n📋 Testing Recipe ID: ${recipeId}`);
      
      const recipe = await Recipe.findByPk(recipeId, {
        include: [{
          model: Ingredient,
          as: 'Ingredients'
        }]
      });
      
      if (!recipe) {
        console.log(`  ❌ Recipe not found`);
        continue;
      }
      
      console.log(`  Recipe: "${recipe.name || 'Unnamed Recipe'}"`);
      
      for (const ingredient of recipe.Ingredients) {
        totalRecipeIngredients++;
        
        // Clean ingredient name
        const cleanedName = cleanIngredientName(ingredient.name);
        
        // Get products for this ingredient
        const products = await Food.findAll({
          where: { canonicalTag: cleanedName },
          order: [
            [db.Sequelize.literal(`CASE WHEN "brandOwner" = 'Generic' THEN 1 ELSE 0 END`), 'ASC'],
            ['brandOwner', 'ASC']
          ],
          limit: 3
        });
        
        if (products.length > 0) {
          const realProducts = products.filter(p => p.brandOwner !== 'Generic');
          const genericProducts = products.filter(p => p.brandOwner === 'Generic');
          
          if (realProducts.length > 0) {
            ingredientsWithRealProducts++;
            console.log(`    ✅ "${ingredient.name}" - ${realProducts.length} real products (${realProducts[0].brandOwner || realProducts[0].brandName})`);
          } else {
            ingredientsWithGenericProducts++;
            console.log(`    🏷️  "${ingredient.name}" - ${genericProducts.length} generic products`);
          }
        } else {
          ingredientsWithNoProducts++;
          console.log(`    ❌ "${ingredient.name}" - No products found`);
        }
      }
    }
    
    console.log('\n📊 Recipe Test Results:');
    console.log(`  Total ingredients tested: ${totalRecipeIngredients}`);
    console.log(`  Ingredients with real products: ${ingredientsWithRealProducts} (${((ingredientsWithRealProducts/totalRecipeIngredients)*100).toFixed(1)}%)`);
    console.log(`  Ingredients with generic products: ${ingredientsWithGenericProducts} (${((ingredientsWithGenericProducts/totalRecipeIngredients)*100).toFixed(1)}%)`);
    console.log(`  Ingredients with no products: ${ingredientsWithNoProducts} (${((ingredientsWithNoProducts/totalRecipeIngredients)*100).toFixed(1)}%)`);
    
    // Test common ingredients
    console.log('\n🛍️  Testing Common Ingredients:');
    
    const commonIngredients = ['salt', 'sugar', 'eggs', 'milk', 'flour', 'butter', 'olive oil', 'cheese'];
    
    for (const ingredient of commonIngredients) {
      const products = await Food.findAll({
        where: { canonicalTag: ingredient },
        order: [
          [db.Sequelize.literal(`CASE WHEN "brandOwner" = 'Generic' THEN 1 ELSE 0 END`), 'ASC'],
          ['brandOwner', 'ASC']
        ],
        limit: 5
      });
      
      const realProducts = products.filter(p => p.brandOwner !== 'Generic');
      const genericProducts = products.filter(p => p.brandOwner === 'Generic');
      
      console.log(`\n🥘 "${ingredient}":`);
      console.log(`  Total products: ${products.length}`);
      console.log(`  Real products: ${realProducts.length}`);
      console.log(`  Generic products: ${genericProducts.length}`);
      
      if (realProducts.length > 0) {
        console.log(`  ✅ Top real product: ${realProducts[0].description} - ${realProducts[0].brandOwner || realProducts[0].brandName}`);
      }
    }
    
    // Overall assessment
    console.log('\n🎯 FINAL ASSESSMENT:');
    console.log('=' .repeat(50));
    
    const realProductPercentage = (realProducts / totalProducts) * 100;
    const recipeRealProductPercentage = (ingredientsWithRealProducts / totalRecipeIngredients) * 100;
    
    console.log(`📊 Database Real Product Usage: ${realProductPercentage.toFixed(1)}%`);
    console.log(`📋 Recipe Real Product Usage: ${recipeRealProductPercentage.toFixed(1)}%`);
    
    if (realProductPercentage >= 70) {
      console.log('✅ EXCELLENT: High real product usage!');
    } else if (realProductPercentage >= 50) {
      console.log('🟡 GOOD: Moderate real product usage');
    } else {
      console.log('🔴 NEEDS IMPROVEMENT: Low real product usage');
    }
    
    if (recipeRealProductPercentage >= 70) {
      console.log('✅ EXCELLENT: Most recipe ingredients show real products!');
    } else if (recipeRealProductPercentage >= 50) {
      console.log('🟡 GOOD: Many recipe ingredients show real products');
    } else {
      console.log('🔴 NEEDS IMPROVEMENT: Most recipe ingredients show generic products');
    }
    
    console.log('\n💡 Recommendations:');
    if (realProductPercentage < 70) {
      console.log('  🔧 Continue mapping unmapped real products');
      console.log('  🔧 Remove more unnecessary generic products');
      console.log('  🔧 Optimize canonical ingredient names');
    } else {
      console.log('  ✅ System is performing well with real products');
      console.log('  ✅ Ready for frontend integration');
      console.log('  ✅ Users will see brand names instead of generic products');
    }
    
  } catch (error) {
    console.error('❌ Error during final test:', error);
  } finally {
    process.exit(0);
  }
}

function cleanIngredientName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-zA-Z\s]/g, '') // Remove non-alphabetic characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

finalRealProductTest(); 