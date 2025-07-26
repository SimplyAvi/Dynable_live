// Debug script to check cart merge functionality
// Run this in the browser console to investigate cart merge issues

import { supabase } from './src/utils/supabaseClient.js';

async function debugCartMerge() {
    console.log('🔍 Starting cart merge debug...');
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session:', session);
    
    if (!session) {
        console.log('❌ No session found');
        return;
    }
    
    // Check if user is authenticated
    const isAnonymous = !session.user.email || session.user.email.trim() === '';
    console.log('Is anonymous:', isAnonymous);
    console.log('User ID:', session.user.id);
    
    // Check localStorage for anonymous user ID
    const anonymousUserId = localStorage.getItem('anonymousUserIdForMerge');
    console.log('Anonymous user ID from localStorage:', anonymousUserId);
    
    // Check current user's cart
    const { data: currentCart, error: currentError } = await supabase
        .from('Carts')
        .select('*')
        .eq('supabase_user_id', session.user.id)
        .maybeSingle();
    
    console.log('Current user cart:', currentCart);
    console.log('Current cart error:', currentError);
    
    // Check anonymous cart if we have an ID
    if (anonymousUserId) {
        const { data: anonymousCart, error: anonymousError } = await supabase
            .from('Carts')
            .select('*')
            .eq('supabase_user_id', anonymousUserId)
            .maybeSingle();
        
        console.log('Anonymous cart:', anonymousCart);
        console.log('Anonymous cart error:', anonymousError);
    }
    
    // Check all carts for this user (in case there are multiple)
    const { data: allCarts, error: allCartsError } = await supabase
        .from('Carts')
        .select('*')
        .eq('supabase_user_id', session.user.id);
    
    console.log('All carts for current user:', allCarts);
    console.log('All carts error:', allCartsError);
}

// Export for use in browser console
window.debugCartMerge = debugCartMerge;
console.log('Debug function available: debugCartMerge()'); 