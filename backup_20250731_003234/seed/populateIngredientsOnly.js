const { Recipe, Ingredient } = require('../db/models');
const fs = require('fs').promises;
const path = require('path');

async function populateRecipeIngredientsOnly() {
    console.log('=== POPULATING INGREDIENTS FOR EXISTING RECIPES ===');
    
    let processedFiles = 0;
    let totalRecipeIngredients = 0;
    let errorCount = 0;
    let recipesNotFound = 0;
    
    try {
        // First, check how many recipes we have
        const existingRecipeCount = await Recipe.count();
        console.log(`Found ${existingRecipeCount} existing recipes in database`);
        
        const recipeDataPath = path.join(__dirname, 'Data/Recipes');
        const recipeFolders = await fs.readdir(recipeDataPath);
        
        for (const folder of recipeFolders) {
            const folderPath = path.join(recipeDataPath, folder);
            const stat = await fs.stat(folderPath);
            
            if (!stat.isDirectory()) continue;
            
            console.log(`\nProcessing folder: ${folder}`);
            const recipeFiles = await fs.readdir(folderPath);
            const jsonFiles = recipeFiles.filter(file => file.endsWith('.json'));
            
            for (const file of jsonFiles) {
                try {
                    processedFiles++;
                    const filePath = path.join(folderPath, file);
                    const fileContent = await fs.readFile(filePath, 'utf8');
                    const recipeData = JSON.parse(fileContent);
                    
                    const recipeName = recipeData.name || recipeData.title || `Recipe from ${file}`;
                    
                    // Find the existing recipe by name/title
                    const existingRecipe = await Recipe.findOne({
                        where: {
                            title: recipeName
                        }
                    });
                    
                    if (!existingRecipe) {
                        recipesNotFound++;
                        console.log(`⚠️  Recipe not found: "${recipeName}"`);
                        continue;
                    }
                    
                    // Check if this recipe already has ingredients
                    const existingIngredientCount = await Ingredient.count({
                        where: { RecipeId: existingRecipe.id }
                    });
                    
                    if (existingIngredientCount > 0) {
                        console.log(`⏭️  Recipe "${recipeName}" already has ${existingIngredientCount} ingredients, skipping`);
                        continue;
                    }
                    
                    // Process ingredients
                    if (recipeData.ingredients && Array.isArray(recipeData.ingredients)) {
                        const ingredientsData = recipeData.ingredients.map(ingredientStr => {
                            const parts = ingredientStr.trim().split(' ');
                            const quantity = parts[0];
                            const name = parts.slice(1).join(' ').trim();
                            
                            return {
                                name: name || ingredientStr,
                                quantity: quantity || null,
                                RecipeId: existingRecipe.id
                            };
                        });
                        
                        if (ingredientsData.length > 0) {
                            try {
                                const createdRecipeIngredients = await Ingredient.bulkCreate(ingredientsData, {
                                    validate: true,
                                    returning: true
                                });
                                
                                totalRecipeIngredients += createdRecipeIngredients.length;
                                console.log(`✅ Added ${createdRecipeIngredients.length} ingredients to "${recipeName}"`);
                                
                            } catch (ingredientError) {
                                errorCount++;
                                console.error(`❌ Error creating ingredients for "${recipeName}":`, ingredientError.message);
                            }
                        }
                    }
                    
                } catch (fileError) {
                    errorCount++;
                    console.error(`❌ Error processing ${file}:`, fileError.message);
                    continue;
                }
                
                // Progress indicator
                if (processedFiles % 100 === 0) {
                    console.log(`Progress: ${processedFiles} files processed, ${totalRecipeIngredients} ingredients created`);
                }
            }
        }
        
        console.log(`\n=== FINAL RESULTS ===`);
        console.log(`Files processed: ${processedFiles}`);
        console.log(`RecipeIngredients created: ${totalRecipeIngredients}`);
        console.log(`Recipes not found: ${recipesNotFound}`);
        console.log(`Errors: ${errorCount}`);
        
        // Final verification
        const finalIngredientCount = await Ingredient.count();
        console.log(`\nTotal ingredients now in database: ${finalIngredientCount}`);
        
        // Sample check - recipes with ingredients
        const recipesWithRecipeIngredients = await Recipe.count({
            include: [{
                model: Ingredient,
                required: true // Only recipes that have ingredients
            }]
        });
        console.log(`Recipes with ingredients: ${recipesWithRecipeIngredients}`);
        
    } catch (error) {
        console.error('RecipeIngredients population failed:', error);
        throw error;
    }
}

module.exports = { populateRecipeIngredientsOnly };

// Run if called directly
if (require.main === module) {
    populateRecipeIngredientsOnly()
        .then(() => {
            console.log('\n🎉 RecipeIngredients population completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 RecipeIngredients population failed:', error);
            process.exit(1);
        });
} 