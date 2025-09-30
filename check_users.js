/**
 * Check existing users in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    console.log('🔍 Checking existing users...\n');

    try {
        // Get all users
        const { data: users, error } = await supabase
            .from('Users')
            .select('id, email, name, role, "createdAt"')
            .order('email');

        if (error) {
            console.error('❌ Error fetching users:', error.message);
            return;
        }

        if (!users || users.length === 0) {
            console.log('❌ No users found in database');
            return;
        }

        console.log(`✅ Found ${users.length} user(s):\n`);

        users.forEach((user, index) => {
            const tierDescription = {
                'free': 'Free (2 allergens max)',
                'standard': 'Standard (Unlimited + Custom)', 
                'premium': 'Premium (All features)',
                'admin': 'Admin (Full access)',
                'seller': 'Seller (Product management)'
            }[user.role] || 'Unknown';

            console.log(`${index + 1}. 📧 ${user.email}`);
            console.log(`   👤 Name: ${user.name || 'N/A'}`);
            console.log(`   🎯 Role: ${user.role || 'N/A'}`);
            console.log(`   📊 Tier: ${tierDescription}`);
            console.log(`   📅 Created: ${user.createdAt || 'N/A'}`);
            console.log('');
        });

        // Check if testjjuser@gmail.com exists
        const testUser = users.find(user => user.email === 'testjjuser@gmail.com');
        if (testUser) {
            console.log('🎯 Found testjjuser@gmail.com:');
            console.log(`   Current role: ${testUser.role}`);
            console.log(`   Current tier: ${tierDescription}`);
        } else {
            console.log('❌ testjjuser@gmail.com not found');
            console.log('💡 Available emails:');
            users.forEach(user => console.log(`   - ${user.email}`));
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

checkUsers();
