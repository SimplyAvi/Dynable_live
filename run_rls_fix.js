const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key to run SQL
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runRLSFix() {
    try {
        console.log('🔧 Running RLS fix migration...');
        
        // Drop existing policies
        console.log('1. Dropping existing policies...');
        await supabase.rpc('exec_sql', {
            sql: `
                DROP POLICY IF EXISTS "users_view_own_profile" ON "Users";
                DROP POLICY IF EXISTS "users_create_own_profile" ON "Users";
                DROP POLICY IF EXISTS "users_update_own_profile" ON "Users";
            `
        });
        
        // Create updated policies
        console.log('2. Creating updated policies...');
        await supabase.rpc('exec_sql', {
            sql: `
                CREATE POLICY "users_view_own_profile" ON "Users"
                    FOR SELECT USING (
                        supabase_user_id = auth.uid() OR
                        email = auth.email() OR
                        (auth.jwt() ->> 'role')::text = 'admin'
                    );
            `
        });
        
        await supabase.rpc('exec_sql', {
            sql: `
                CREATE POLICY "users_create_own_profile" ON "Users"
                    FOR INSERT WITH CHECK (
                        supabase_user_id = auth.uid() OR
                        email = auth.email() OR
                        (auth.jwt() ->> 'role')::text = 'admin'
                    );
            `
        });
        
        await supabase.rpc('exec_sql', {
            sql: `
                CREATE POLICY "users_update_own_profile" ON "Users"
                    FOR UPDATE USING (
                        supabase_user_id = auth.uid() OR
                        email = auth.email() OR
                        (auth.jwt() ->> 'role')::text = 'admin'
                    ) WITH CHECK (
                        (OLD.role = NEW.role OR (auth.jwt() ->> 'role')::text = 'admin') AND
                        (
                            NEW.custom_allergens IS NULL OR 
                            NEW.custom_allergens = '[]' OR
                            NEW.role IN ('standard', 'premium', 'admin', 'seller') OR
                            (auth.jwt() ->> 'role')::text = 'admin'
                        )
                    );
            `
        });
        
        console.log('✅ RLS policies updated successfully!');
        
        // Test the policies
        console.log('3. Testing policies...');
        const { data: userData, error: userError } = await supabase
            .from('Users')
            .select('id, email, role, custom_allergens, supabase_user_id')
            .eq('email', 'testjjuser@gmail.com')
            .single();
            
        if (userError) {
            console.error('❌ Error testing policies:', userError);
            return;
        }
        
        console.log('✅ Test successful:');
        console.log('    Email:', userData.email);
        console.log('    Role:', userData.role);
        console.log('    Supabase User ID:', userData.supabase_user_id);
        console.log('    Custom Allergens:', userData.custom_allergens);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

runRLSFix();
