const { Recipe, Ingredient } = require('../db/models');

async function testSingleIngredientCreation() {
    console.log('=== Testing Single Ingredient Creation ===');
    try {
        const sampleRecipe = await Recipe.findOne();
        if (!sampleRecipe) {
            console.log('No recipes found to test with');
            return;
        }
        console.log(`Testing with recipe: ${sampleRecipe.title || sampleRecipe.name} (ID: ${sampleRecipe.id})`);
        const testIngredient = await Ingredient.create({
            name: 'Test Ingredient',
            quantity: '1 cup',
            RecipeId: sampleRecipe.id
        });
        console.log('✅ Test ingredient created:', testIngredient.toJSON());
        await testIngredient.destroy();
        console.log('Test ingredient cleaned up');
    } catch (error) {
        console.error('❌ Single ingredient test failed:', error.message);
        console.error('Error details:', error);
    }
}

testSingleIngredientCreation(); 