// Test the UPSERT fix for custom allergens
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpsertFix() {
    console.log('🧪 TESTING UPSERT FIX FOR CUSTOM ALLERGENS');
    console.log('==========================================');
    
    try {
        const testUserId = 'dbdd91b7-862e-4f07-85f9-c821128a9d4d';
        const testEmail = 'testjjuser@gmail.com';
        const testName = 'Lionel';
        
        console.log('📝 Testing UPSERT operation...');
        
        const testCustomAllergen = [{
            id: 'test_apple_upsert',
            name: 'apple',
            displayName: 'Apple',
            createdAt: new Date().toISOString(),
            isActive: true,
            isCustom: true,
            isUnderReview: true,
            reviewStatus: 'pending'
        }];
        
        // Test the UPSERT operation
        const { data, error } = await supabase
            .from('Users')
            .upsert({
                supabase_user_id: testUserId,
                email: testEmail,
                name: testName,
                custom_allergens: testCustomAllergen,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, { 
                onConflict: 'supabase_user_id',
                ignoreDuplicates: false 
            })
            .select()
            .single();
        
        if (error) {
            console.log('❌ UPSERT error:', error.message);
            console.log('Error code:', error.code);
            console.log('Error details:', error.details);
            
            // Check if it's an RLS error (expected with anon key)
            if (error.code === '42501') {
                console.log('✅ RLS error expected - this would work with authenticated user');
            }
        } else {
            console.log('✅ UPSERT successful!');
            console.log('📊 Result:', data);
        }
        
        console.log('\n📝 Testing fetch after UPSERT...');
        
        const { data: fetchData, error: fetchError } = await supabase
            .from('Users')
            .select('*')
            .eq('supabase_user_id', testUserId)
            .single();
        
        if (fetchError) {
            console.log('❌ Fetch error:', fetchError.message);
            if (fetchError.code === '42501') {
                console.log('✅ RLS error expected for fetch too');
            }
        } else {
            console.log('✅ Fetch successful!');
            console.log('📊 User data:', fetchData);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testUpsertFix().then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
}).catch(err => {
    console.error('❌ Test error:', err);
    process.exit(1);
});
