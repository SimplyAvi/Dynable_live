// 🔍 CHECK EXISTING FUNCTIONS
// Simple script to check which functions exist before creating safe migration
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

async function checkExistingFunctions() {
    console.log('🔍 CHECKING EXISTING FUNCTIONS');
    console.log('==============================');
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
    const nonExistentFunctions = [];

    console.log('🔍 Checking each function...');
    console.log('');

    for (const funcName of functionsToCheck) {
        try {
            // Try to call the function to see if it exists
            // We'll use a simple call that should work for any function
            const { data, error } = await supabase.rpc(funcName);
            
            if (error) {
                if (error.message.includes('function') && error.message.includes('does not exist')) {
                    console.log(`❌ ${funcName} - Does not exist`);
                    nonExistentFunctions.push(funcName);
                } else {
                    // Function exists but may have parameters or return values
                    console.log(`✅ ${funcName} - Exists (${error.message})`);
                    existingFunctions.push(funcName);
                }
            } else {
                console.log(`✅ ${funcName} - Exists`);
                existingFunctions.push(funcName);
            }
        } catch (error) {
            // If we get an error, the function might still exist but need parameters
            console.log(`⚠️  ${funcName} - Error checking: ${error.message}`);
            existingFunctions.push(funcName);
        }
    }

    console.log('');
    console.log('📊 SUMMARY:');
    console.log('===========');
    console.log(`✅ Existing functions: ${existingFunctions.length}`);
    console.log(`❌ Non-existent functions: ${nonExistentFunctions.length}`);
    console.log(`📋 Total checked: ${functionsToCheck.length}`);
    console.log('');

    if (existingFunctions.length > 0) {
        console.log('✅ EXISTING FUNCTIONS:');
        existingFunctions.forEach(f => console.log(`   - ${f}`));
        console.log('');
    }

    if (nonExistentFunctions.length > 0) {
        console.log('❌ NON-EXISTENT FUNCTIONS:');
        nonExistentFunctions.forEach(f => console.log(`   - ${f}`));
        console.log('');
    }

    // Save results to file
    const fs = require('fs');
    const functionData = {
        timestamp: new Date().toISOString(),
        total_checked: functionsToCheck.length,
        existing_functions: existingFunctions,
        non_existent_functions: nonExistentFunctions,
        summary: {
            existing_count: existingFunctions.length,
            non_existent_count: nonExistentFunctions.length
        }
    };

    fs.writeFileSync('existing_functions.json', JSON.stringify(functionData, null, 2));
    console.log('💾 Results saved to existing_functions.json');
    console.log('');

    if (existingFunctions.length > 0) {
        console.log('🎯 NEXT STEPS:');
        console.log('==============');
        console.log('1. Review existing_functions.json');
        console.log('2. Create safe migration for existing functions only');
        console.log('3. Add SET search_path = public to existing functions');
        console.log('4. Skip non-existent functions');
        console.log('');
        console.log('✅ Ready to create safe migration!');
    } else {
        console.log('⚠️  No functions found - no migration needed');
    }
}

checkExistingFunctions().catch(error => {
    console.error('❌ Error:', error);
});
