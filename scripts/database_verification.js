const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// 🔍 DATABASE VERIFICATION SCRIPT
async function verifyDatabaseStructure() {
    console.log('🔍 DATABASE VERIFICATION - Critical Questions Answered\n');
    
    try {
        // 1. Check ProductCanonical table structure
        console.log('📋 1. PRODUCTCANONICAL TABLE STRUCTURE:');
        console.log('=' .repeat(50));
        
        const { data: productColumns, error: productColumnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'ProductCanonical')
            .order('ordinal_position');
        
        if (productColumnsError) {
            console.log('❌ Error querying ProductCanonical columns:', productColumnsError);
        } else {
            console.log('Columns in ProductCanonical:');
            productColumns.forEach(col => {
                console.log(`   📊 ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
        }
        console.log('');
        
        // 2. Check IngredientCanonical table structure
        console.log('📋 2. INGREDIENTCANONICAL TABLE STRUCTURE:');
        console.log('=' .repeat(50));
        
        const { data: ingredientColumns, error: ingredientColumnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'IngredientCanonical')
            .order('ordinal_position');
        
        if (ingredientColumnsError) {
            console.log('❌ Error querying IngredientCanonical columns:', ingredientColumnsError);
        } else {
            console.log('Columns in IngredientCanonical:');
            ingredientColumns.forEach(col => {
                console.log(`   📊 ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
        }
        console.log('');
        
        // 3. Check row counts
        console.log('📋 3. TABLE ROW COUNTS:');
        console.log('=' .repeat(50));
        
        // ProductCanonical count
        const { count: productCount, error: productCountError } = await supabase
            .from('ProductCanonical')
            .select('*', { count: 'exact', head: true });
        
        if (productCountError) {
            console.log('❌ Error counting ProductCanonical:', productCountError);
        } else {
            console.log(`📊 ProductCanonical: ${productCount} rows`);
        }
        
        // IngredientCanonical count
        const { count: ingredientCount, error: ingredientCountError } = await supabase
            .from('IngredientCanonical')
            .select('*', { count: 'exact', head: true });
        
        if (ingredientCountError) {
            console.log('❌ Error counting IngredientCanonical:', ingredientCountError);
        } else {
            console.log(`📊 IngredientCanonical: ${ingredientCount} rows`);
        }
        console.log('');
        
        // 4. Check for existing product_type columns
        console.log('📋 4. EXISTING PRODUCT_TYPE COLUMNS:');
        console.log('=' .repeat(50));
        
        const productTypeInProduct = productColumns?.find(col => col.column_name === 'product_type');
        const productTypeInIngredient = ingredientColumns?.find(col => col.column_name === 'product_type');
        
        console.log(`📊 ProductCanonical.product_type: ${productTypeInProduct ? 'EXISTS' : 'MISSING'}`);
        console.log(`📊 IngredientCanonical.product_type: ${productTypeInIngredient ? 'EXISTS' : 'MISSING'}`);
        console.log('');
        
        // 5. Sample data from both tables
        console.log('📋 5. SAMPLE DATA:');
        console.log('=' .repeat(50));
        
        // ProductCanonical samples
        console.log('📊 ProductCanonical samples:');
        const { data: productSamples, error: productSamplesError } = await supabase
            .from('ProductCanonical')
            .select('*')
            .limit(3);
        
        if (productSamplesError) {
            console.log('❌ Error fetching ProductCanonical samples:', productSamplesError);
        } else {
            productSamples.forEach((product, index) => {
                console.log(`   ${index + 1}. ID: ${product.id}`);
                console.log(`      Original: "${product.original_product_name}"`);
                console.log(`      Canonical: "${product.canonical_product_name}"`);
                if (product.product_type) {
                    console.log(`      Product Type: "${product.product_type}"`);
                }
                console.log('');
            });
        }
        
        // IngredientCanonical samples
        console.log('📊 IngredientCanonical samples:');
        const { data: ingredientSamples, error: ingredientSamplesError } = await supabase
            .from('IngredientCanonical')
            .select('*')
            .limit(3);
        
        if (ingredientSamplesError) {
            console.log('❌ Error fetching IngredientCanonical samples:', ingredientSamplesError);
        } else {
            ingredientSamples.forEach((ingredient, index) => {
                console.log(`   ${index + 1}. ID: ${ingredient.id}`);
                console.log(`      Original: "${ingredient.original_ingredient_name}"`);
                console.log(`      Canonical: "${ingredient.canonical_ingredient_name}"`);
                if (ingredient.product_type) {
                    console.log(`      Product Type: "${ingredient.product_type}"`);
                }
                console.log('');
            });
        }
        
        // 6. Test column addition permissions
        console.log('📋 6. PERMISSION TEST:');
        console.log('=' .repeat(50));
        
        console.log('🧪 Testing if we can add columns...');
        console.log('   (This will fail gracefully if no permissions)');
        
        const { error: addColumnError } = await supabase.rpc('add_column_if_not_exists', {
            table_name: 'ProductCanonical',
            column_name: 'test_column',
            column_type: 'text'
        });
        
        if (addColumnError) {
            console.log('❌ Cannot add columns via RPC (expected for Supabase)');
            console.log('   Error:', addColumnError.message);
            console.log('   💡 We may need to add columns manually via SQL');
        } else {
            console.log('✅ Can add columns via RPC');
        }
        console.log('');
        
        // 7. Summary and recommendations
        console.log('📋 7. SUMMARY & RECOMMENDATIONS:');
        console.log('=' .repeat(50));
        
        console.log('✅ CONFIRMED:');
        console.log(`   📊 ProductCanonical: ${productCount} rows (our main product table)`);
        console.log(`   📊 IngredientCanonical: ${ingredientCount} rows (recipe ingredients)`);
        console.log(`   📊 Both tables have canonical names (cleaned data)`);
        console.log('');
        
        console.log('❓ QUESTIONS TO RESOLVE:');
        console.log('   1. Should we classify BOTH tables or just ProductCanonical?');
        console.log('   2. Do we need manual SQL to add product_type columns?');
        console.log('   3. Which table contains the 213K products mentioned?');
        console.log('');
        
        console.log('💡 RECOMMENDATIONS:');
        console.log('   1. Start with ProductCanonical (main product table)');
        console.log('   2. Test column addition on a small table first');
        console.log('   3. Verify the 213K count matches ProductCanonical');
        console.log('   4. Consider IngredientCanonical for recipe context');
        console.log('');
        
        return {
            productCount,
            ingredientCount,
            productColumns,
            ingredientColumns,
            productTypeExists: !!productTypeInProduct,
            ingredientTypeExists: !!productTypeInIngredient,
            canAddColumns: !addColumnError
        };
        
    } catch (error) {
        console.error('❌ Error in database verification:', error);
        return null;
    }
}

// 🚀 RUN THE VERIFICATION
if (require.main === module) {
    verifyDatabaseStructure().catch(console.error);
}

module.exports = {
    verifyDatabaseStructure
}; 