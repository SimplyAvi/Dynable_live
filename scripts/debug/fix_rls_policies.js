const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for Carts table...');
  
  try {
    // Drop existing policies
    console.log('📝 Dropping existing policies...');
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "anonymous_cart_access" ON "Carts";
        DROP POLICY IF EXISTS "anonymous_cart_modify" ON "Carts";
        DROP POLICY IF EXISTS "anonymous_cart_update" ON "Carts";
        DROP POLICY IF EXISTS "users_own_cart" ON "Carts";
      `
    });
    
    // Recreate policies with correct column names
    console.log('📝 Creating new policies with correct column names...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "anonymous_cart_access" ON "Carts"
          FOR SELECT USING (
            (auth.jwt() ->> 'is_anonymous')::boolean = true AND
            "supabase_user_id"::text = auth.uid()::text
          );

        CREATE POLICY "anonymous_cart_modify" ON "Carts"
          FOR INSERT WITH CHECK (
            (auth.jwt() ->> 'is_anonymous')::boolean = true AND
            "supabase_user_id"::text = auth.uid()::text
          );

        CREATE POLICY "anonymous_cart_update" ON "Carts"
          FOR UPDATE USING (
            (auth.jwt() ->> 'is_anonymous')::boolean = true AND
            "supabase_user_id"::text = auth.uid()::text
          );

        CREATE POLICY "users_own_cart" ON "Carts"
          FOR ALL USING (
            (auth.jwt() ->> 'is_anonymous')::boolean = false AND
            "supabase_user_id"::text = auth.uid()::text
          );
      `
    });
    
    console.log('✅ RLS policies fixed successfully!');
    
    // Test the fix
    console.log('🧪 Testing cart insert...');
    const testResult = await supabase
      .from('Carts')
      .upsert({
        supabase_user_id: 'test-user-id-3',
        items: [{ id: 1, name: 'test product', quantity: 1 }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { onConflict: 'supabase_user_id' })
      .select();
    
    console.log('Test result:', testResult);
    
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
  }
}

fixRLSPolicies(); 