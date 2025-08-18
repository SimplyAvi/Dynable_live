const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function checkTableName() {
    console.log('🔍 Checking exact table name...\n');
    
    // Try different possible table names
    const possibleNames = [
        'ProductCanonical',
        'productcanonical', 
        'product_canonical',
        'Product_Canonical',
        'productcanonicals',
        'ProductCanonicals'
    ];
    
    for (const tableName of possibleNames) {
        try {
            console.log(`🧪 Testing table name: "${tableName}"`);
            
            const { data, error } = await supabase
                .from(tableName)
                .select('id')
                .limit(1);
            
            if (error) {
                console.log(`   ❌ Error: ${error.message}`);
            } else {
                console.log(`   ✅ SUCCESS! Table name is: "${tableName}"`);
                console.log(`   📊 Sample data:`, data);
                return tableName;
            }
        } catch (err) {
            console.log(`   ❌ Exception: ${err.message}`);
        }
    }
    
    console.log('\n❌ Could not find the table with any of the tested names');
    return null;
}

if (require.main === module) {
    checkTableName().catch(console.error);
}

module.exports = { checkTableName }; 