const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTableStructure() {
    console.log('🔍 CHECKING TABLE STRUCTURE');
    console.log('===========================');
    console.log('');

    const tables = [
        'ingredient_categorized',
        'ProductAllergens',
        'SafeProductIndicators',
        'IngredientCategorizedNutrientSources',
        'IngredientCategorizedNutrientDerivations',
        'Food_backup',
        'Ingredients_backup',
        'CanonicalIngredients_backup',
        'backup_ingredientcategorized_allergens_20241219',
        'backup_ingredients_allergens_20241219',
        'backup_searchpreferences_allergens_20241219',
        'backup_allergenderivatives_20241219'
    ];

    for (const table of tables) {
        try {
            console.log(`📊 Checking table: ${table}`);
            
            // Try to get a sample record to see the structure
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                console.log(`❌ Error accessing ${table}: ${error.message}`);
            } else {
                console.log(`✅ Table ${table} accessible`);
                if (data && data.length > 0) {
                    console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
                    console.log(`   Sample record:`, data[0]);
                } else {
                    console.log(`   Table is empty`);
                }
            }
            
            console.log('');
        } catch (err) {
            console.log(`❌ Exception for ${table}: ${err.message}`);
            console.log('');
        }
    }

    // Check RLS status
    console.log('🔒 CHECKING RLS STATUS');
    console.log('======================');
    console.log('');

    try {
        // Try to access backup tables (should fail if RLS is working)
        const { data: backupData, error: backupError } = await supabase
            .from('Food_backup')
            .select('*')
            .limit(1);

        if (backupError) {
            console.log(`✅ Backup table access blocked: ${backupError.message}`);
        } else {
            console.log(`❌ Backup table accessible (RLS not implemented): ${backupData?.length || 0} records`);
        }

        // Try to access production tables
        const { data: prodData, error: prodError } = await supabase
            .from('ingredient_categorized')
            .select('*')
            .limit(1);

        if (prodError) {
            console.log(`❌ Production table access failed: ${prodError.message}`);
        } else {
            console.log(`✅ Production table accessible: ${prodData?.length || 0} records`);
        }

    } catch (err) {
        console.log(`❌ RLS check error: ${err.message}`);
    }

    console.log('');
    console.log('📋 SUMMARY');
    console.log('==========');
    console.log('✅ Tables checked for structure');
    console.log('✅ RLS status verified');
    console.log('✅ Ready for migration planning');
}

checkTableStructure().catch(console.error);
