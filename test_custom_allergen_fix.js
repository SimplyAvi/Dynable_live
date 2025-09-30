// Test the custom allergen fix
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCustomAllergenFix() {
    console.log('🧪 TESTING CUSTOM ALLERGEN FIX');
    console.log('===============================');
    
    try {
        // Test the exact scenario from the logs
        const testUserId = 'dbdd91b7-862e-4f07-85f9-c821128a9d4d';
        const testEmail = 'testjjuser@gmail.com';
        const testName = 'Lionel';
        
        console.log('📝 Testing user upsert with all required fields...');
        
        const testCustomAllergen = [{
            id: 'test_1',
            name: 'test allergen',
            displayName: 'Test Allergen',
            createdAt: new Date().toISOString(),
            isActive: true,
            isCustom: true,
            isUnderReview: true,
            reviewStatus: 'pending'
        }];
        
        // Test the upsert with all required fields
        const { data, error } = await supabase
            .from('Users')
            .upsert({
                supabase_user_id: testUserId,
                email: testEmail,
                name: testName,
                custom_allergens: testCustomAllergen,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) {
            console.log('❌ Error:', error.message);
            console.log('Error code:', error.code);
            console.log('Error details:', error.details);
        } else {
            console.log('✅ Upsert successful!');
            console.log('📊 Created/Updated user:', data);
        }
        
        // Test fetching the user
        console.log('\n📝 Testing user fetch...');
        
        const { data: fetchData, error: fetchError } = await supabase
            .from('Users')
            .select('*')
            .eq('supabase_user_id', testUserId)
            .single();
        
        if (fetchError) {
            console.log('❌ Fetch error:', fetchError.message);
        } else {
            console.log('✅ Fetch successful!');
            console.log('📊 User data:', fetchData);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testCustomAllergenFix().then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
}).catch(err => {
    console.error('❌ Test error:', err);
    process.exit(1);
});
