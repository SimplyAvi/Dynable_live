const { cleanIngredientName } = require('./api/foodRoutes.js');

function testCleaning() {
  console.log('🔍 Testing ingredient name cleaning...\n');
  
  const testRecipeIngredients = [
    '1 pound lean ground beef',
    '2 teaspoons onion powder', 
    '1/4 cup honey mustard',
    '1 teaspoon garlic powder',
    '2 teaspoons crushed red pepper',
    '1/2 teaspoon salt',
    '1/4 cup brown sugar',
    '2 tablespoons olive oil',
    '4 slices Swiss cheese (optional)',
    '4 hamburger buns'
  ];
  
  for (const ingredient of testRecipeIngredients) {
    const cleaned = cleanIngredientName(ingredient);
    console.log(`"${ingredient}" → "${cleaned}"`);
  }
  
  console.log('\n💡 Analysis:');
  console.log('- RecipeIngredients that work: ground beef, onion powder, salt, brown sugar, olive oil, hamburger buns');
  console.log('- RecipeIngredients that don\'t work: honey mustard, garlic powder, crushed red pepper, swiss cheese');
  console.log('- The cleaning function is removing important words like "honey", "garlic", "crushed", "swiss"');
}

testCleaning(); 