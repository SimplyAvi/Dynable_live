/**
 * Create test user for tier system testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
    console.log('👤 Creating test user: testjjuser@gmail.com...\n');

    try {
        // Create a test user with Standard tier
        const testUser = {
            email: 'testjjuser@gmail.com',
            name: 'Test User',
            role: 'standard',
            custom_allergens: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        console.log('📝 User data to create:', testUser);

        const { data, error } = await supabase
            .from('Users')
            .insert([testUser])
            .select();

        if (error) {
            console.error('❌ Error creating user:', error.message);
            console.error('Full error:', error);
            return;
        }

        console.log('✅ Test user created successfully!');
        console.log('📊 User details:', data[0]);

        console.log('\n🎯 Next steps:');
        console.log('   1. Go to your app at http://localhost:3001');
        console.log('   2. Sign in with Google using testjjuser@gmail.com');
        console.log('   3. Test unlimited allergen toggling');
        console.log('   4. Test custom allergen functionality');
        console.log('   5. Verify no disabled buttons appear (Standard tier)');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

createTestUser();
