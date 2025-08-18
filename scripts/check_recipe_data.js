const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function checkRecipeData() {
    console.log('🔍 Checking Recipe Data Availability...\n');
    
    // Check all possible recipe-related table names
    const possibleTables = [
        'Recipe',
        'Recipes', 
        'RecipeIngredient',
        'RecipeIngredients',
        'Ingredient',
        'Ingredients',
        'Recipe_Ingredient',
        'recipe_ingredients',
        'recipe_ingredient',
        'recipes',
        'recipe'
    ];
    
    console.log('📋 Checking for recipe-related tables:');
    
    for (const tableName of possibleTables) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
            
            if (error) {
                console.log(`❌ ${tableName}: ${error.message}`);
            } else {
                console.log(`✅ ${tableName}: Found ${data?.length || 0} records`);
                
                // If we found data, let's see the structure
                if (data && data.length > 0) {
                    console.log(`   📊 Sample record:`, JSON.stringify(data[0], null, 2));
                }
            }
        } catch (error) {
            console.log(`❌ ${tableName}: ${error.message}`);
        }
    }
    
    // Check if we have any recipe data in other tables
    console.log('\n🔍 Checking for recipe data in existing tables:');
    
    try {
        // Check IngredientCategorized for recipe-related data
        const { data: ingredientData, error: ingredientError } = await supabase
            .from('IngredientCategorized')
            .select('description')
            .ilike('description', '%recipe%')
            .limit(5);
        
        if (!ingredientError && ingredientData && ingredientData.length > 0) {
            console.log('📋 Found recipe-related data in IngredientCategorized:');
            ingredientData.forEach(item => {
                console.log(`   • "${item.description}"`);
            });
        } else {
            console.log('❌ No recipe data found in IngredientCategorized');
        }
        
        // Check for any JSON or text fields that might contain recipe data
        const { data: allData, error: allError } = await supabase
            .from('IngredientCategorized')
            .select('description')
            .limit(10);
        
        if (!allError && allData) {
            console.log('\n📋 Sample product descriptions (to understand data structure):');
            allData.forEach((item, index) => {
                console.log(`   ${index + 1}. "${item.description}"`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error checking existing data:', error);
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. If recipe tables exist, we can proceed with Phase 2');
    console.log('2. If no recipe tables, we need to create them or find recipe data');
    console.log('3. We can also simulate recipe ingredients for testing');
}

checkRecipeData().catch(console.error); 