const { Recipe, Ingredient } = require('../db/models');
const fs = require('fs').promises;
const path = require('path');

async function quickTestIngredientCreation() {
    console.log('=== QUICK TEST: First 3 Recipes ===');
    
    try {
        // Get first recipe file
        const recipeDataPath = path.join(__dirname, 'Data/Recipes/a'); // Start with 'a' folder
        const files = await fs.readdir(recipeDataPath);
        const jsonFiles = files.filter(f => f.endsWith('.json')).slice(0, 3); // Only first 3
        
        console.log(`Testing with files: ${jsonFiles.join(', ')}`);
        
        for (const file of jsonFiles) {
            console.log(`\n--- Testing: ${file} ---`);
            
            const filePath = path.join(recipeDataPath, file);
            const content = await fs.readFile(filePath, 'utf8');
            const recipeData = JSON.parse(content);
            
            console.log(`Recipe: "${recipeData.name}"`);
            console.log(`Raw ingredients count: ${recipeData.ingredients?.length || 0}`);
            
            if (recipeData.ingredients?.length > 0) {
                console.log(`First 3 raw ingredients:`, recipeData.ingredients.slice(0, 3));
            }
            
            // Create recipe
            const recipe = await Recipe.create({
                title: recipeData.title || 'Test Recipe',
                url: recipeData.url || 'http://example.com',
                description: recipeData.description,
                directions: recipeData.directions || []
            });
            
            console.log(`✅ Recipe created: ID ${recipe.id}`);
            
            // Process ingredients
            if (recipeData.ingredients?.length > 0) {
                const ingredientsData = recipeData.ingredients.slice(0, 5).map(ing => { // Only first 5 ingredients
                    const parts = ing.split(' ');
                    return {
                        name: parts.slice(1).join(' ') || ing,
                        quantity: parts[0] || null,
                        RecipeId: recipe.id
                    };
                });
                
                console.log(`Transformed ingredients:`, ingredientsData);
                
                try {
                    const created = await Ingredient.bulkCreate(ingredientsData, {
                        validate: true,
                        returning: true
                    });
                    
                    console.log(`✅ Created ${created.length} ingredients successfully!`);
                    console.log(`Sample created:`, created[0]?.toJSON());
                    
                } catch (error) {
                    console.error(`❌ BulkCreate failed:`, error.message);
                    
                    // Try individual creation
                    console.log(`Trying individual creation...`);
                    for (let i = 0; i < ingredientsData.length; i++) {
                        try {
                            const individual = await Ingredient.create(ingredientsData[i]);
                            console.log(`  ✅ Individual ${i+1}: ${individual.name}`);
                        } catch (indError) {
                            console.error(`  ❌ Individual ${i+1} failed:`, indError.message);
                            console.error(`  Data:`, ingredientsData[i]);
                        }
                    }
                }
            }
        }
        
        // Check final counts
        const recipeCount = await Recipe.count();
        const ingredientCount = await Ingredient.count();
        console.log(`\n=== Final Counts ===`);
        console.log(`Recipes: ${recipeCount}`);
        console.log(`RecipeIngredients: ${ingredientCount}`);
        
    } catch (error) {
        console.error('Quick test failed:', error);
    }
}

module.exports = { quickTestIngredientCreation };

// Run if called directly
if (require.main === module) {
    quickTestIngredientCreation().then(() => process.exit(0));
} 