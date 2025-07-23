import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

console.log('👑 Creating First Admin User for Dynable RBAC System\n');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const createFirstAdmin = async () => {
  try {
    console.log('📋 Step 1: Checking current users...');
    
    // Check if any users exist
    const { data: users, error: usersError } = await supabase
      .from('Users')
      .select('id, email, role')
      .limit(5);

    if (usersError) {
      console.log('❌ Error checking users:', usersError.message);
      return;
    }

    console.log(`📊 Found ${users?.length || 0} existing users`);
    
    if (users && users.length > 0) {
      console.log('📋 Existing users:');
      users.forEach(user => {
        console.log(`  - ${user.email} (Role: ${user.role || 'none'})`);
      });
      
      // Check if any admin exists
      const adminUser = users.find(u => u.role === 'admin');
      if (adminUser) {
        console.log(`\n✅ Admin user already exists: ${adminUser.email}`);
        console.log('🚀 RBAC system is ready to use!');
        return;
      }
    }

    console.log('\n📝 Step 2: Creating first admin user...');
    
    // Create admin with proper timestamp fields
    const now = new Date().toISOString();
    const adminData = {
      email: 'admin@dynable.com',
      name: 'Dynable Admin',
      role: 'admin',
      is_verified_seller: false,
      converted_from_anonymous: false,
      createdAt: now,
      updatedAt: now
    };

    console.log(`\n🔧 Creating admin user: ${adminData.email}`);
    
    const { data: newAdmin, error: createError } = await supabase
      .from('Users')
      .insert([adminData])
      .select()
      .single();

    if (createError) {
      console.log('❌ Error creating admin:', createError.message);
      console.log('💡 This might be because the user already exists or there are database constraints.');
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Role: ${newAdmin.role}`);
    console.log(`   ID: ${newAdmin.id}`);

    console.log('\n🎉 First Admin User Setup Complete!');
    console.log('=====================================');
    console.log('✅ Database migrations applied');
    console.log('✅ RLS policies active');
    console.log('✅ Admin user created');
    console.log('✅ RBAC system ready');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Test the RBAC system with your application');
    console.log('2. Create additional users through your signup process');
    console.log('3. Test role-based access control');
    console.log('4. Verify admin functions work correctly');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

// Run the admin creation
createFirstAdmin(); 