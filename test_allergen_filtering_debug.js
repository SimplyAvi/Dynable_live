/**
 * Debug allergen filtering and cart issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugIssues() {
    console.log('🔍 DEBUGGING ALLERGEN FILTERING & CART ISSUES\n');
    console.log('='.repeat(70));
    
    // Check test user's search preferences
    console.log('\n1️⃣ CHECKING SEARCH PREFERENCES:');
    console.log('-'.repeat(70));
    
    const { data: prefs, error: prefsError } = await supabase
        .from('SearchPreferences')
        .select('*')
        .eq('userId', 'dbdd91b7-862e-4f07-85f9-c821128a9d4d')
        .single();
    
    if (prefs) {
        console.log('✅ Search preferences found:');
        console.log('   User ID:', prefs.userId);
        console.log('   Selected Allergens:', prefs.selectedAllergens);
        console.log('   Search Term:', prefs.searchTerm);
    } else {
        console.log('❌ No search preferences found:', prefsError?.message);
    }
    
    // Check test user's cart
    console.log('\n2️⃣ CHECKING CART DATA:');
    console.log('-'.repeat(70));
    
    const { data: cart, error: cartError } = await supabase
        .from('Carts')
        .select('*')
        .eq('userId', 'dbdd91b7-862e-4f07-85f9-c821128a9d4d');
    
    if (cart && cart.length > 0) {
        console.log('✅ Cart found:');
        cart.forEach((item, i) => {
            console.log(`   ${i + 1}. Product ID: ${item.productId}, Quantity: ${item.quantity}`);
        });
        console.log('   Total items:', cart.length);
    } else {
        console.log('⚠️ No cart items found');
        if (cartError) console.log('   Error:', cartError.message);
    }
    
    // Check user's anonymous_cart_data (legacy cart storage)
    console.log('\n3️⃣ CHECKING LEGACY CART STORAGE:');
    console.log('-'.repeat(70));
    
    const { data: userData, error: userError } = await supabase
        .from('Users')
        .select('email, anonymous_cart_data')
        .eq('email', 'testjjuser@gmail.com')
        .single();
    
    if (userData) {
        console.log('✅ User data found:');
        console.log('   Email:', userData.email);
        console.log('   Legacy cart data:', userData.anonymous_cart_data ? `${userData.anonymous_cart_data.length} items` : 'None');
    } else {
        console.log('❌ User not found:', userError?.message);
    }
    
    console.log('\n' + '='.repeat(70));
}

debugIssues().catch(console.error);
