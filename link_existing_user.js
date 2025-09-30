const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function linkExistingUser() {
    try {
        console.log('🔗 Attempting to link existing user...');
        
        // Since the user already exists in auth, let's try to get them
        // We'll use a different approach - try to sign in to get the user ID
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'testjjuser@gmail.com',
            password: 'testpassword123'
        });
        
        if (signInError) {
            console.log('❌ Could not sign in with test password, trying to find user another way...');
            
            // Let's try to get the user by attempting to create them with a different email
            // and then update the email
            const { data: tempUser, error: tempError } = await supabase.auth.admin.createUser({
                email: 'temp-testjjuser@gmail.com',
                password: 'testpassword123',
                email_confirm: true
            });
            
            if (tempError) {
                console.error('❌ Error creating temp user:', tempError);
                return;
            }
            
            console.log('✅ Created temp user, now updating email...');
            
            // Update the email to the correct one
            const { error: updateEmailError } = await supabase.auth.admin.updateUserById(
                tempUser.user.id,
                { email: 'testjjuser@gmail.com' }
            );
            
            if (updateEmailError) {
                console.error('❌ Error updating email:', updateEmailError);
                return;
            }
            
            console.log('✅ Updated email to testjjuser@gmail.com');
            
            // Now link to Users table
            const { error: updateError } = await supabase
                .from('Users')
                .update({ supabase_user_id: tempUser.user.id })
                .eq('email', 'testjjuser@gmail.com');
                
            if (updateError) {
                console.error('❌ Error updating Users table:', updateError);
                return;
            }
            
            console.log('✅ Updated Users table with Supabase user ID');
            console.log('🎉 User is now properly linked!');
            
        } else {
            console.log('✅ Found existing user through sign in:');
            console.log('    ID:', signInData.user.id);
            console.log('    Email:', signInData.user.email);
            
            // Update the Users table with the Supabase user ID
            const { error: updateError } = await supabase
                .from('Users')
                .update({ supabase_user_id: signInData.user.id })
                .eq('email', 'testjjuser@gmail.com');
                
            if (updateError) {
                console.error('❌ Error updating Users table:', updateError);
                return;
            }
            
            console.log('✅ Updated Users table with Supabase user ID');
            console.log('🎉 User is now properly linked!');
        }
        
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

linkExistingUser();
