const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key to create auth users
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAndLinkUser() {
    try {
        console.log('🔗 Creating Supabase Auth user for testjjuser@gmail.com...');
        
        // Create user in Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: 'testjjuser@gmail.com',
            password: 'testpassword123', // Temporary password
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                name: 'Test User'
            }
        });
        
        if (authError) {
            console.error('❌ Error creating auth user:', authError);
            return;
        }
        
        console.log('✅ Created auth user:', authUser.user.id);
        
        // Update the Users table with the Supabase user ID
        const { error: updateError } = await supabase
            .from('Users')
            .update({ supabase_user_id: authUser.user.id })
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

createAndLinkUser();
