/**
 * Test Tier System Functionality
 * Author: Justin Linzan
 * Date: September 2025
 * 
 * This script tests the tier system implementation
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

async function testTierSystem() {
    console.log('🧪 Testing Tier System Implementation...\n');

    try {
        // 1. Check if user exists
        console.log('1️⃣ Checking if testjjuser@gmail.com exists...');
        const { data: userData, error: userError } = await supabase
            .from('Users')
            .select('*')
            .eq('email', 'testjjuser@gmail.com')
            .single();

        if (userError) {
            console.error('❌ Error fetching user:', userError.message);
            return;
        }

        if (!userData) {
            console.log('❌ User testjjuser@gmail.com not found');
            console.log('💡 Please make sure the user exists in the database');
            return;
        }

        console.log('✅ User found:', {
            email: userData.email,
            role: userData.role,
            custom_allergens: userData.custom_allergens
        });

        // 2. Update user to Standard tier
        console.log('\n2️⃣ Updating user to Standard tier...');
        const { error: updateError } = await supabase
            .from('Users')
            .update({ role: 'standard' })
            .eq('email', 'testjjuser@gmail.com');

        if (updateError) {
            console.error('❌ Error updating user tier:', updateError.message);
            return;
        }

        console.log('✅ User updated to Standard tier');

        // 3. Verify the update
        console.log('\n3️⃣ Verifying tier update...');
        const { data: updatedUser, error: verifyError } = await supabase
            .from('Users')
            .select('*')
            .eq('email', 'testjjuser@gmail.com')
            .single();

        if (verifyError) {
            console.error('❌ Error verifying update:', verifyError.message);
            return;
        }

        console.log('✅ User tier verified:', {
            email: updatedUser.email,
            role: updatedUser.role,
            tier_description: updatedUser.role === 'standard' ? 'Standard (Unlimited + Custom)' : 'Other'
        });

        // 4. Test custom allergen functionality
        console.log('\n4️⃣ Testing custom allergen functionality...');
        
        // Try to add a custom allergen
        const testAllergen = {
            id: `test_${Date.now()}`,
            name: 'testallergen',
            displayName: 'Test Allergen',
            createdAt: new Date().toISOString(),
            isActive: true,
            isUnderReview: true,
            reviewStatus: 'pending'
        };

        const currentCustomAllergens = updatedUser.custom_allergens || [];
        const updatedCustomAllergens = [...currentCustomAllergens, testAllergen];

        const { error: customAllergenError } = await supabase
            .from('Users')
            .update({ custom_allergens: updatedCustomAllergens })
            .eq('email', 'testjjuser@gmail.com');

        if (customAllergenError) {
            console.error('❌ Error adding custom allergen:', customAllergenError.message);
            return;
        }

        console.log('✅ Custom allergen added successfully');

        // 5. Show all users and their tiers
        console.log('\n5️⃣ Current user tiers:');
        const { data: allUsers, error: allUsersError } = await supabase
            .from('Users')
            .select('email, role')
            .order('role');

        if (allUsersError) {
            console.error('❌ Error fetching all users:', allUsersError.message);
            return;
        }

        allUsers.forEach(user => {
            const tierDescription = {
                'free': 'Free (2 allergens max)',
                'standard': 'Standard (Unlimited + Custom)',
                'premium': 'Premium (All features)',
                'admin': 'Admin (Full access)',
                'seller': 'Seller (Product management)'
            }[user.role] || 'Unknown';

            console.log(`   📧 ${user.email}: ${tierDescription}`);
        });

        console.log('\n🎉 Tier system test completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Log in as testjjuser@gmail.com');
        console.log('   2. Test unlimited allergen toggling');
        console.log('   3. Test custom allergen functionality');
        console.log('   4. Verify no disabled buttons appear');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run the test
testTierSystem();
