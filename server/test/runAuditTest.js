const { Recipe, Ingredient, Food, CanonicalIngredient, IngredientToCanonical } = require('../db/models');
const { cleanIngredientName } = require('../api/foodRoutes');

async function runQuickAuditTest() {
  console.log('🧪 Running Quick Audit Test...\n');
  
  try {
    // Test 1: Check if focus recipe exists
    console.log('1. Checking for focus recipe...');
    const focusRecipe = await Recipe.findOne({ 
      where: { title: '1-Dish Pepperoni Cheese Pizza Bake' }, 
      include: [Ingredient] 
    });
    
    if (focusRecipe) {
      console.log(`✅ Found focus recipe with ${focusRecipe.Ingredients.length} ingredients`);
    } else {
      console.log('❌ Focus recipe not found');
      return;
    }
    
    // Test 2: Check a few key ingredients
    const testIngredients = [
      '3/4 cups all-purpose flour',
      'teaspoons sugar', 
      'tablespoons olive oil'
    ];
    
    console.log('\n2. Testing ingredient processing...');
    for (const ingredient of testIngredients) {
      const cleaned = cleanIngredientName(ingredient);
      console.log(`   "${ingredient}" → "${cleaned}"`);
      
      // Check if there's a canonical mapping
      const mapping = await IngredientToCanonical.findOne({ 
        where: { messyName: cleaned.toLowerCase() } 
      });
      
      if (mapping) {
        const canonical = await CanonicalIngredient.findByPk(mapping.CanonicalIngredientId);
        console.log(`   ✅ Mapped to canonical: "${canonical.name}"`);
        
        // Check for products
        const products = await Food.findAll({
          where: { canonicalTag: canonical.name.toLowerCase() },
          limit: 3
        });
        
        if (products.length > 0) {
          console.log(`   ✅ Found ${products.length} products`);
        } else {
          console.log(`   ⚠️  No products found for "${canonical.name}"`);
        }
      } else {
        console.log(`   ❌ No canonical mapping found`);
      }
    }
    
    // Test 3: Check canonical tag confidence
    console.log('\n3. Checking canonical tag confidence...');
    const productsWithConfidence = await Food.findAll({
      where: { 
        canonicalTagConfidence: { [require('sequelize').Op.in]: ['confident', 'suggested'] } 
      },
      limit: 5
    });
    
    console.log(`Found ${productsWithConfidence.length} products with confidence levels:`);
    productsWithConfidence.forEach(p => {
      console.log(`   "${p.description}" → ${p.canonicalTag} (${p.canonicalTagConfidence})`);
    });
    
    console.log('\n✅ Quick audit test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during audit test:', error);
  } finally {
    process.exit(0);
  }
}

runQuickAuditTest(); 