// Test adding custom_allergens column using Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testColumnAddition() {
    console.log('🧪 TESTING CUSTOM ALLERGENS COLUMN');
    console.log('==================================');
    
    try {
        // First, let's check the current Users table structure
        console.log('📋 Checking current Users table structure...');
        
        const { data: users, error: fetchError } = await supabase
            .from('Users')
            .select('*')
            .limit(1);
        
        if (fetchError) {
            console.log('❌ Error fetching users:', fetchError.message);
            return;
        }
        
        if (users && users.length > 0) {
            console.log('✅ Users table accessible');
            console.log('📊 Current columns:', Object.keys(users[0]));
            
            // Check if custom_allergens column already exists
            if ('custom_allergens' in users[0]) {
                console.log('✅ custom_allergens column already exists!');
                console.log('📝 Sample custom_allergens data:', users[0].custom_allergens);
                return;
            }
        } else {
            console.log('📝 Users table is empty, but accessible');
        }
        
        // Try to insert a test record with custom_allergens to see if column exists
        console.log('🧪 Testing if custom_allergens column exists...');
        
        const { data: testData, error: testError } = await supabase
            .from('Users')
            .select('custom_allergens')
            .limit(1);
        
        if (testError) {
            if (testError.code === '42703') {
                console.log('❌ custom_allergens column does not exist');
                console.log('');
                console.log('🔧 MANUAL STEP REQUIRED:');
                console.log('Please run this SQL in your Supabase SQL Editor:');
                console.log('');
                console.log('ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS custom_allergens JSONB DEFAULT \'[]\';');
                console.log('CREATE INDEX IF NOT EXISTS idx_users_custom_allergens ON public."Users" USING GIN (custom_allergens);');
                console.log('');
                console.log('After running the SQL, restart your app to test the feature.');
            } else {
                console.log('❌ Error testing column:', testError.message);
            }
        } else {
            console.log('✅ custom_allergens column exists!');
            console.log('📝 Sample data:', testData);
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

testColumnAddition().then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
}).catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
