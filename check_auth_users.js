const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key to access auth.users
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAuthUsers() {
    try {
        console.log('🔍 Checking Supabase Auth users...');
        
        // Query auth.users table directly
        const { data, error } = await supabase.auth.admin.listUsers();
        
        if (error) {
            console.error('❌ Error:', error);
            return;
        }
        
        if (!data || data.users.length === 0) {
            console.log('❌ No auth users found');
            return;
        }
        
        console.log('✅ Auth users found:');
        data.users.forEach((user, index) => {
            console.log(`  Auth User ${index + 1}:`);
            console.log('    ID:', user.id);
            console.log('    Email:', user.email);
            console.log('    Created At:', user.created_at);
            console.log('    Last Sign In:', user.last_sign_in_at);
        });
        
        // Look for testjjuser@gmail.com specifically
        const testUser = data.users.find(user => user.email === 'testjjuser@gmail.com');
        if (testUser) {
            console.log('\n🎯 Found testjjuser@gmail.com:');
            console.log('    ID:', testUser.id);
            console.log('    Email:', testUser.email);
        } else {
            console.log('\n❌ testjjuser@gmail.com not found in auth users');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkAuthUsers();
