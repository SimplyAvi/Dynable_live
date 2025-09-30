const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key to search auth users
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findUserByEmail() {
    try {
        console.log('🔍 Searching for testjjuser@gmail.com in Supabase Auth...');
        
        // List all users and find by email
        const { data: users, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
            console.error('❌ Error finding auth user:', authError);
            return;
        }
        
        // Find user by email
        const authUser = users.users.find(user => user.email === 'testjjuser@gmail.com');
        
        if (!authUser) {
            console.log('❌ User not found in Supabase Auth');
            console.log('Available emails:', users.users.map(u => u.email).filter(e => e));
            return;
        }
        
        console.log('✅ Found auth user:');
        console.log('    ID:', authUser.id);
        console.log('    Email:', authUser.email);
        console.log('    Created At:', authUser.created_at);
        
        // Update the Users table with the Supabase user ID
        const { error: updateError } = await supabase
            .from('Users')
            .update({ supabase_user_id: authUser.id })
            .eq('email', 'testjjuser@gmail.com');
            
        if (updateError) {
            console.error('❌ Error updating Users table:', updateError);
            return;
        }
        
        console.log('✅ Updated Users table with Supabase user ID');
        console.log('🎉 User is now properly linked!');
        
        // Verify the link
        const { data: userData, error: verifyError } = await supabase
            .from('Users')
            .select('id, email, role, supabase_user_id')
            .eq('email', 'testjjuser@gmail.com')
            .single();
            
        if (verifyError) {
            console.error('❌ Error verifying user:', verifyError);
            return;
        }
        
        console.log('✅ Verification successful:');
        console.log('    Email:', userData.email);
        console.log('    Role:', userData.role);
        console.log('    Supabase User ID:', userData.supabase_user_id);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

findUserByEmail();
