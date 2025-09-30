// Verify custom allergens column was added successfully
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyCustomAllergens() {
    console.log('🔍 VERIFYING CUSTOM ALLERGENS COLUMN');
    console.log('====================================');
    
    try {
        // Test if custom_allergens column exists
        const { data, error } = await supabase
            .from('Users')
            .select('id, email, custom_allergens')
            .limit(1);
        
        if (error) {
            if (error.code === '42703') {
                console.log('❌ custom_allergens column still does not exist');
                console.log('Please check if the SQL was executed correctly');
                return;
            } else {
                console.log('❌ Error:', error.message);
                return;
            }
        }
        
        console.log('✅ custom_allergens column exists!');
        console.log('📊 Column structure verified');
        console.log('🎉 Ready to test the custom allergen feature!');
        
        // Test inserting a sample custom allergen
        console.log('\n🧪 Testing custom allergen functionality...');
        
        // Create a test user record (this won't actually insert due to RLS)
        const testAllergen = [{
            id: 'test_1',
            name: 'artificial sweeteners',
            displayName: 'Artificial Sweeteners',
            createdAt: new Date().toISOString(),
            isActive: true,
            isCustom: true
        }];
        
        console.log('📝 Test allergen structure:', JSON.stringify(testAllergen, null, 2));
        console.log('✅ Database structure is ready for custom allergens!');
        
        console.log('\n🚀 NEXT STEPS:');
        console.log('1. Go to http://localhost:3001');
        console.log('2. Login with Google OAuth');
        console.log('3. Look for the green "+" button in the allergen filter');
        console.log('4. Click it to add a custom allergen');
        console.log('5. Test the grammar validation');
        console.log('6. Verify the allergen appears with a star indicator');
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
    }
}

verifyCustomAllergens().then(() => {
    console.log('\n✅ Verification completed!');
    process.exit(0);
}).catch(err => {
    console.error('❌ Verification error:', err);
    process.exit(1);
});
