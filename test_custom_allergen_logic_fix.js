// Test the custom allergen logic fix
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCustomAllergenLogic() {
    console.log('🧪 TESTING CUSTOM ALLERGEN LOGIC FIX');
    console.log('=====================================');
    
    try {
        // Test the exact scenario from the logs
        const testUserId = 'dbdd91b7-862e-4f07-85f9-c821128a9d4d';
        const testEmail = 'testjjuser@gmail.com';
        const testName = 'Lionel';
        
        console.log('📝 Step 1: Testing user fetch (should return PGRST116 if user doesn\'t exist)...');
        
        const { data: fetchData, error: fetchError } = await supabase
            .from('Users')
            .select('custom_allergens')
            .eq('supabase_user_id', testUserId)
            .single();
        
        if (fetchError && fetchError.code === 'PGRST116') {
            console.log('✅ User doesn\'t exist (PGRST116) - this is expected for new users');
            console.log('📝 Step 2: Testing user creation with custom allergen...');
            
            const testCustomAllergen = [{
                id: 'test_apple_1',
                name: 'apple',
                displayName: 'Apple',
                createdAt: new Date().toISOString(),
                isActive: true,
                isCustom: true,
                isUnderReview: true,
                reviewStatus: 'pending'
            }];
            
            const { data: insertData, error: insertError } = await supabase
                .from('Users')
                .insert({
                    supabase_user_id: testUserId,
                    email: testEmail,
                    name: testName,
                    custom_allergens: testCustomAllergen,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();
            
            if (insertError) {
                console.log('❌ Insert error:', insertError.message);
                console.log('Error code:', insertError.code);
                console.log('Error details:', insertError.details);
            } else {
                console.log('✅ User created successfully!');
                console.log('📊 Created user:', insertData);
            }
            
        } else if (fetchError) {
            console.log('❌ Fetch error:', fetchError.message);
            console.log('Error code:', fetchError.code);
        } else {
            console.log('✅ User exists!');
            console.log('📊 User data:', fetchData);
            
            console.log('📝 Step 2: Testing user update with new custom allergen...');
            
            const existingAllergens = fetchData.custom_allergens || [];
            const newAllergen = {
                id: 'test_apple_2',
                name: 'apple',
                displayName: 'Apple',
                createdAt: new Date().toISOString(),
                isActive: true,
                isCustom: true,
                isUnderReview: true,
                reviewStatus: 'pending'
            };
            
            const updatedAllergens = [...existingAllergens, newAllergen];
            
            const { data: updateData, error: updateError } = await supabase
                .from('Users')
                .update({
                    custom_allergens: updatedAllergens,
                    updatedAt: new Date().toISOString()
                })
                .eq('supabase_user_id', testUserId)
                .select()
                .single();
            
            if (updateError) {
                console.log('❌ Update error:', updateError.message);
                console.log('Error code:', updateError.code);
            } else {
                console.log('✅ User updated successfully!');
                console.log('📊 Updated user:', updateData);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testCustomAllergenLogic().then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
}).catch(err => {
    console.error('❌ Test error:', err);
    process.exit(1);
});
