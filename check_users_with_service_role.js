const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key to bypass RLS
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsersWithServiceRole() {
    try {
        console.log('🔍 Checking users with service role (bypasses RLS)...');
        
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

checkUsersWithServiceRole();
