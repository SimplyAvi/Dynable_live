const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkUserRole() {
    try {
        console.log('🔍 Checking user role in database...');
        
        const { data, error } = await supabase
            .from('Users')
            .select('id, email, role, custom_allergens, supabase_user_id');
            
        if (error) {
            console.error('❌ Error:', error);
            return;
        }
        
        if (!data || data.length === 0) {
            console.log('❌ No users found');
            return;
        }
        
        console.log('✅ Users found:');
        data.forEach((user, index) => {
            console.log(`  User ${index + 1}:`);
            console.log('    ID:', user.id);
            console.log('    Email:', user.email);
            console.log('    Role:', user.role);
            console.log('    Supabase User ID:', user.supabase_user_id);
            console.log('    Custom Allergens:', user.custom_allergens);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkUserRole();
