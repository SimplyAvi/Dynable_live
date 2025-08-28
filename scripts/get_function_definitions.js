// 🔍 GET FUNCTION DEFINITIONS
// Query existing functions to create safe security migration
// Author: Justin Linzan
// Date: January 2025

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getFunctionDefinitions() {
    console.log('🔍 QUERYING EXISTING FUNCTION DEFINITIONS');
    console.log('==========================================');
    console.log('');

    try {
        // Query to get all function definitions from the public schema
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: `
                SELECT 
                    p.proname as function_name,
                    pg_get_functiondef(p.oid) as function_definition,
                    p.proconfig as function_config,
                    CASE 
                        WHEN p.proconfig LIKE '%search_path%' THEN 'Has search_path'
                        ELSE 'No search_path'
                    END as search_path_status,
                    p.prosecdef as security_definer,
                    p.prolang as language_oid,
                    l.lanname as language_name
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                JOIN pg_language l ON p.prolang = l.oid
                WHERE n.nspname = 'public'
                AND p.proname IN (
                    'update_search_preferences_updated_at',
                    'update_updated_at_column',
                    'to_camel_case',
                    'fix_cart_price_data_types',
                    'is_admin_user',
                    'get_all_carts_admin',
                    'validate_cart_items',
                    'fix_remaining_string_prices',
                    'fix_string_prices_simple',
                    'clean_product_name',
                    'clean_ingredient_name',
                    'fix_all_string_prices',
                    'get_search_preferences',
                    'detect_allergens_in_description',
                    'merge_carts_safe',
                    'clear_search_preferences',
                    'merge_search_preferences_safe',
                    'process_product_allergens_improved',
                    'process_product_allergens_dry_run',
                    'validate_allergen_format',
                    'validate_allergen_array',
                    'validate_jsonb_allergen_array',
                    'validate_ingredients_allergens',
                    'validate_ingredient_categorized_allergens',
                    'validate_search_preferences_allergens',
                    'check_allergen_data_integrity',
                    'process_product_allergens_minimal_dry_run',
                    'save_search_preferences',
                    'merge_search_preferences',
                    'process_product_allergens_minimal',
                    'link_anonymous_cart',
                    'merge_anonymous_cart'
                )
                ORDER BY p.proname;
            `
        });

        if (error) {
            console.error('❌ Error querying functions:', error);
            return;
        }

        if (!data || data.length === 0) {
            console.log('⚠️  No functions found matching the security warning list');
            return;
        }

        console.log(`📊 Found ${data.length} functions that need security fixes:`);
        console.log('');

        // Display function information
        data.forEach((func, index) => {
            console.log(`${index + 1}. ${func.function_name}`);
            console.log(`   Status: ${func.search_path_status}`);
            console.log(`   Security: ${func.security_definer ? 'SECURITY DEFINER' : 'SECURITY INVOKER'}`);
            console.log(`   Language: ${func.language_name}`);
            console.log('');
        });

        // Save function definitions to file for migration creation
        const fs = require('fs');
        const functionData = {
            timestamp: new Date().toISOString(),
            total_functions: data.length,
            functions: data
        };

        fs.writeFileSync('function_definitions.json', JSON.stringify(functionData, null, 2));
        console.log('💾 Function definitions saved to function_definitions.json');
        console.log('');

        // Show functions that need search_path fixes
        const needsFix = data.filter(f => f.search_path_status === 'No search_path');
        console.log(`🔧 ${needsFix.length} functions need search_path fixes:`);
        needsFix.forEach(f => console.log(`   - ${f.function_name}`));

        console.log('');
        console.log('✅ Function inventory complete!');
        console.log('📝 Next step: Create safe migration using actual function definitions');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Alternative query if exec_sql function doesn't exist
async function getFunctionDefinitionsAlternative() {
    console.log('🔍 QUERYING EXISTING FUNCTION DEFINITIONS (Alternative Method)');
    console.log('============================================================');
    console.log('');

    try {
        // Query to get function information using direct SQL
        const { data, error } = await supabase
            .from('pg_proc')
            .select(`
                proname,
                proconfig,
                prosecurity,
                prolang
            `)
            .eq('pronamespace', '(SELECT oid FROM pg_namespace WHERE nspname = \'public\')')
            .in('proname', [
                'update_search_preferences_updated_at',
                'update_updated_at_column',
                'to_camel_case',
                'fix_cart_price_data_types',
                'is_admin_user',
                'get_all_carts_admin',
                'validate_cart_items',
                'fix_remaining_string_prices',
                'fix_string_prices_simple',
                'clean_product_name',
                'clean_ingredient_name',
                'fix_all_string_prices',
                'get_search_preferences',
                'detect_allergens_in_description',
                'merge_carts_safe',
                'clear_search_preferences',
                'merge_search_preferences_safe',
                'process_product_allergens_improved',
                'process_product_allergens_dry_run',
                'validate_allergen_format',
                'validate_allergen_array',
                'validate_jsonb_allergen_array',
                'validate_ingredients_allergens',
                'validate_ingredient_categorized_allergens',
                'validate_search_preferences_allergens',
                'check_allergen_data_integrity',
                'process_product_allergens_minimal_dry_run',
                'save_search_preferences',
                'merge_search_preferences',
                'process_product_allergens_minimal',
                'link_anonymous_cart',
                'merge_anonymous_cart'
            ]);

        if (error) {
            console.error('❌ Error with alternative query:', error);
            console.log('');
            console.log('🔧 Trying manual function check...');
            await checkFunctionsManually();
            return;
        }

        console.log(`📊 Found ${data.length} functions:`);
        data.forEach(f => {
            console.log(`   - ${f.proname}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Manual function check
async function checkFunctionsManually() {
    console.log('🔍 MANUAL FUNCTION CHECK');
    console.log('========================');
    console.log('');

    const functionsToCheck = [
        'update_search_preferences_updated_at',
        'update_updated_at_column',
        'to_camel_case',
        'fix_cart_price_data_types',
        'is_admin_user',
        'get_all_carts_admin',
        'validate_cart_items',
        'fix_remaining_string_prices',
        'fix_string_prices_simple',
        'clean_product_name',
        'clean_ingredient_name',
        'fix_all_string_prices',
        'get_search_preferences',
        'detect_allergens_in_description',
        'merge_carts_safe',
        'clear_search_preferences',
        'merge_search_preferences_safe',
        'process_product_allergens_improved',
        'process_product_allergens_dry_run',
        'validate_allergen_format',
        'validate_allergen_array',
        'validate_jsonb_allergen_array',
        'validate_ingredients_allergens',
        'validate_ingredient_categorized_allergens',
        'validate_search_preferences_allergens',
        'check_allergen_data_integrity',
        'process_product_allergens_minimal_dry_run',
        'save_search_preferences',
        'merge_search_preferences',
        'process_product_allergens_minimal',
        'link_anonymous_cart',
        'merge_anonymous_cart'
    ];

    const existingFunctions = [];

    for (const funcName of functionsToCheck) {
        try {
            // Try to call the function to see if it exists
            const { data, error } = await supabase.rpc(funcName);
            
            if (error && error.message.includes('function') && error.message.includes('does not exist')) {
                console.log(`❌ ${funcName} - Does not exist`);
            } else {
                console.log(`✅ ${funcName} - Exists`);
                existingFunctions.push(funcName);
            }
        } catch (error) {
            console.log(`❌ ${funcName} - Error checking: ${error.message}`);
        }
    }

    console.log('');
    console.log(`📊 Summary: ${existingFunctions.length} functions exist out of ${functionsToCheck.length} checked`);
    console.log('');
    console.log('✅ Existing functions:');
    existingFunctions.forEach(f => console.log(`   - ${f}`));

    // Save to file
    const fs = require('fs');
    const functionData = {
        timestamp: new Date().toISOString(),
        total_functions: existingFunctions.length,
        existing_functions: existingFunctions,
        checked_functions: functionsToCheck
    };

    fs.writeFileSync('existing_functions.json', JSON.stringify(functionData, null, 2));
    console.log('');
    console.log('💾 Function list saved to existing_functions.json');
}

// Run the function inventory
async function main() {
    try {
        await getFunctionDefinitions();
    } catch (error) {
        console.log('🔄 Falling back to alternative method...');
        try {
            await getFunctionDefinitionsAlternative();
        } catch (error2) {
            console.log('🔄 Falling back to manual check...');
            await checkFunctionsManually();
        }
    }
}

main();
