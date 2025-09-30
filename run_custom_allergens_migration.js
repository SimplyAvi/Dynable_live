// Run custom allergens migration using Supabase client
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing environment variables');
    console.log('REACT_APP_SUPABASE_URL:', !!supabaseUrl);
    console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 RUNNING CUSTOM ALLERGENS MIGRATION');
    console.log('=====================================');
    
    try {
        // Add custom_allergens column to Users table
        console.log('📝 Adding custom_allergens column to Users table...');
        
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE "Users" 
                ADD COLUMN IF NOT EXISTS custom_allergens JSONB DEFAULT '[]';
            `
        });
        
        if (error) {
            console.log('⚠️  Column might already exist, trying direct approach...');
            
            // Try to query the table to see if column exists
            const { data: testData, error: testError } = await supabase
                .from('Users')
                .select('custom_allergens')
                .limit(1);
            
            if (testError && testError.code === '42703') {
                console.log('❌ Column does not exist and cannot be added via RPC');
                console.log('Please run this migration manually in Supabase SQL Editor:');
                console.log('');
                console.log('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS custom_allergens JSONB DEFAULT \'[]\';');
                console.log('');
                console.log('CREATE INDEX IF NOT EXISTS idx_users_custom_allergens ON "Users" USING GIN (custom_allergens);');
                return;
            } else if (testError) {
                console.log('❌ Error testing column:', testError.message);
                return;
            } else {
                console.log('✅ Column already exists!');
            }
        } else {
            console.log('✅ Column added successfully!');
        }
        
        // Create index
        console.log('📝 Creating index for custom_allergens...');
        
        const { data: indexData, error: indexError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE INDEX IF NOT EXISTS idx_users_custom_allergens 
                ON "Users" USING GIN (custom_allergens);
            `
        });
        
        if (indexError) {
            console.log('⚠️  Index creation failed (might already exist):', indexError.message);
            console.log('Please create this index manually in Supabase SQL Editor:');
            console.log('');
            console.log('CREATE INDEX IF NOT EXISTS idx_users_custom_allergens ON "Users" USING GIN (custom_allergens);');
        } else {
            console.log('✅ Index created successfully!');
        }
        
        // Test the column
        console.log('🧪 Testing custom_allergens column...');
        
        const { data: testData, error: testError } = await supabase
            .from('Users')
            .select('id, email, custom_allergens')
            .limit(1);
        
        if (testError) {
            console.log('❌ Error testing column:', testError.message);
        } else {
            console.log('✅ Column test successful!');
            console.log('Sample data structure:', testData);
        }
        
        console.log('\n🎉 Migration completed successfully!');
        console.log('The custom_allergens column is ready for use.');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

runMigration().then(() => {
    console.log('\n✅ Migration script completed!');
    process.exit(0);
}).catch(err => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
});
