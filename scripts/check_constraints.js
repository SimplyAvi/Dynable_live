const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function checkConstraints() {
    console.log('🔍 Checking database constraints...');
    
    try {
        // Check if tables exist
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', ['ProductCanonical', 'IngredientCanonical']);
        
        if (tablesError) {
            console.error('❌ Error checking tables:', tablesError);
            return;
        }
        
        console.log('📋 Existing tables:', tables?.map(t => t.table_name) || []);
        
        // Check constraints on ProductCanonical
        const { data: productConstraints, error: productError } = await supabase
            .rpc('exec_sql', {
                sql: `
                    SELECT 
                        constraint_name, 
                        constraint_type,
                        column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu 
                        ON tc.constraint_name = kcu.constraint_name
                    WHERE tc.table_name = 'ProductCanonical'
                    AND tc.table_schema = 'public'
                `
            });
        
        if (productError) {
            console.log('⚠️ Could not check ProductCanonical constraints (RPC not available)');
        } else {
            console.log('🔒 ProductCanonical constraints:', productConstraints);
        }
        
        // Check constraints on IngredientCanonical
        const { data: ingredientConstraints, error: ingredientError } = await supabase
            .rpc('exec_sql', {
                sql: `
                    SELECT 
                        constraint_name, 
                        constraint_type,
                        column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu 
                        ON tc.constraint_name = kcu.constraint_name
                    WHERE tc.table_name = 'IngredientCanonical'
                    AND tc.table_schema = 'public'
                `
            });
        
        if (ingredientError) {
            console.log('⚠️ Could not check IngredientCanonical constraints (RPC not available)');
        } else {
            console.log('🔒 IngredientCanonical constraints:', ingredientConstraints);
        }
        
        // Try a simple insert to test
        const { data: testData, error: testError } = await supabase
            .from('ProductCanonical')
            .select('canonical_product_name')
            .limit(1);
        
        if (testError) {
            console.error('❌ Error testing ProductCanonical access:', testError);
        } else {
            console.log('✅ ProductCanonical table is accessible');
        }
        
    } catch (error) {
        console.error('❌ Error checking constraints:', error);
    }
}

checkConstraints(); 