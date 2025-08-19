const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testConnection() {
    console.log('🔍 Testing database connection...');
    console.log('URL:', process.env.SUPABASE_URL);
    console.log('Key:', process.env.SUPABASE_ANON_KEY ? 'Present' : 'Missing');
    
    try {
        // Test basic connection
        const { data, error } = await supabase
            .from('IngredientCategorized')
            .select('id, description')
            .limit(1);
        
        if (error) {
            console.error('❌ Database connection error:', error);
            return;
        }
        
        console.log('✅ Database connection successful');
        console.log('📊 Sample data:', data);
        
        // Test count
        const { count, error: countError } = await supabase
            .from('IngredientCategorized')
            .select('*', { count: 'exact', head: true });
        
        if (countError) {
            console.error('❌ Count error:', countError);
        } else {
            console.log(`📊 Total products: ${count}`);
        }
        
        // Test ProductCanonical table
        const { data: canonicalData, error: canonicalError } = await supabase
            .from('ProductCanonical')
            .select('id, canonical_product_name')
            .limit(5);
        
        if (canonicalError) {
            console.error('❌ ProductCanonical table error:', canonicalError);
        } else {
            console.log('✅ ProductCanonical table accessible');
            console.log('📊 Sample canonical mappings:', canonicalData);
        }
        
    } catch (error) {
        console.error('❌ Connection test failed:', error);
    }
}

testConnection(); 