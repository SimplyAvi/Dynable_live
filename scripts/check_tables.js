const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function checkTables() {
    console.log('🔍 Checking database tables...');
    
    const tablesToCheck = [
        'ProductCanonical',
        'IngredientCanonical',
        'RecipeIngredient',
        'Recipe',
        'IngredientCategorized',
        'Users',
        'SearchPreferences'
    ];
    
    for (const tableName of tablesToCheck) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('id')
                .limit(1);
            
            if (error) {
                console.log(`❌ ${tableName}: ${error.message}`);
            } else {
                console.log(`✅ ${tableName}: Accessible`);
            }
        } catch (error) {
            console.log(`❌ ${tableName}: ${error.message}`);
        }
    }
}

checkTables().catch(console.error); 