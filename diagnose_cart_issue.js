// 🔍 CART ISSUE DIAGNOSTIC SCRIPT
// Run this in the browser console to diagnose cart persistence issues

console.log('🔍 Cart Issue Diagnostic - Starting...');

// Function to check current cart state
window.checkCartState = () => {
    const store = window.store;
    const cartState = store.getState().anonymousCart;
    
    console.log('=== CURRENT CART STATE ===');
    console.log('Cart items:', cartState.items);
    console.log('Cart items count:', cartState.items.length);
    console.log('Is anonymous:', cartState.isAnonymous);
    console.log('Is logging out:', cartState.isLoggingOut);
    console.log('Session:', cartState.session ? 'exists' : 'null');
    console.log('Loading:', cartState.loading);
    console.log('Error:', cartState.error);
    
    return cartState;
};

// Function to check database cart state
window.checkDatabaseCart = async () => {
    console.log('=== CHECKING DATABASE CART ===');
    
    try {
        const { supabase } = await import('./src/utils/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            console.log('❌ No session found - cannot check database cart');
            return null;
        }
        
        console.log('✅ Session found, checking database cart...');
        
        const { data: cart, error } = await supabase
            .from('Carts')
            .select('items, supabase_user_id, updatedAt')
            .eq('supabase_user_id', session.user.id)
            .maybeSingle();
        
        if (error) {
            console.error('❌ Database cart error:', error);
            return null;
        }
        
        console.log('Database cart result:', cart);
        console.log('Database cart items count:', cart?.items?.length || 0);
        console.log('Database cart user ID:', cart?.supabase_user_id);
        console.log('Database cart updated:', cart?.updatedAt);
        
        return cart;
    } catch (error) {
        console.error('❌ Error checking database cart:', error);
        return null;
    }
};

// Function to check if cart clearing is working
window.testCartClearing = async () => {
    console.log('=== TESTING CART CLEARING ===');
    
    // Check initial state
    const initialState = window.checkCartState();
    const initialDbCart = await window.checkDatabaseCart();
    
    console.log('Initial Redux cart items:', initialState.items.length);
    console.log('Initial database cart items:', initialDbCart?.items?.length || 0);
    
    // Test manual cart clearing
    console.log('Testing manual cart clearing...');
    const store = window.store;
    store.dispatch({ type: 'anonymousCart/forceClear' });
    store.dispatch({ type: 'anonymousCart/logout' });
    
    // Check state after clearing
    setTimeout(async () => {
        const clearedState = window.checkCartState();
        const clearedDbCart = await window.checkDatabaseCart();
        
        console.log('After clearing:');
        console.log('- Redux cart items:', clearedState.items.length);
        console.log('- Database cart items:', clearedDbCart?.items?.length || 0);
        console.log('- Is logging out:', clearedState.isLoggingOut);
        
        if (clearedState.items.length === 0 && (clearedDbCart?.items?.length || 0) === 0) {
            console.log('✅ Cart clearing is working correctly');
        } else {
            console.log('❌ Cart clearing is NOT working correctly');
        }
    }, 500);
};

// Function to check auth state
window.checkAuthState = () => {
    console.log('=== CHECKING AUTH STATE ===');
    
    const store = window.store;
    const authState = store.getState().auth;
    const cartState = store.getState().anonymousCart;
    
    console.log('Auth isAuthenticated:', authState.isAuthenticated);
    console.log('Auth currentUser:', authState.currentUser);
    console.log('Cart isAnonymous:', cartState.isAnonymous);
    console.log('Cart session:', cartState.session ? 'exists' : 'null');
    
    return { authState, cartState };
};

// Function to check for cart fetch attempts
window.checkCartFetchAttempts = () => {
    console.log('=== CHECKING CART FETCH ATTEMPTS ===');
    
    // Override console.log to capture cart fetch messages
    const originalLog = console.log;
    const cartFetchMessages = [];
    
    console.log = (...args) => {
        const message = args.join(' ');
        if (message.includes('fetchCart') || message.includes('CART') || message.includes('cart')) {
            cartFetchMessages.push(message);
        }
        originalLog.apply(console, args);
    };
    
    console.log('Monitoring cart fetch attempts for 5 seconds...');
    
    setTimeout(() => {
        console.log = originalLog;
        console.log('Cart fetch messages captured:', cartFetchMessages);
        
        if (cartFetchMessages.length === 0) {
            console.log('✅ No cart fetch attempts detected');
        } else {
            console.log('❌ Cart fetch attempts detected:', cartFetchMessages.length);
        }
    }, 5000);
};

// Function to check for timing issues
window.checkTimingIssues = () => {
    console.log('=== CHECKING TIMING ISSUES ===');
    
    const store = window.store;
    const state = store.getState();
    
    console.log('Current timing state:');
    console.log('- Auth isAuthenticated:', state.auth.isAuthenticated);
    console.log('- Cart isAnonymous:', state.anonymousCart.isAnonymous);
    console.log('- Cart isLoggingOut:', state.anonymousCart.isLoggingOut);
    console.log('- Cart items count:', state.anonymousCart.items.length);
    console.log('- Cart session:', state.anonymousCart.session ? 'exists' : 'null');
    
    // Check for timing conflicts
    const hasTimingConflict = state.auth.isAuthenticated === false && 
                             state.anonymousCart.isAnonymous === false && 
                             state.anonymousCart.items.length > 0;
    
    if (hasTimingConflict) {
        console.log('❌ TIMING CONFLICT DETECTED: Not authenticated, not anonymous, but has cart items');
    } else {
        console.log('✅ No timing conflicts detected');
    }
};

// Main diagnostic function
window.runCartDiagnostic = async () => {
    console.log('🔍 RUNNING COMPREHENSIVE CART DIAGNOSTIC');
    console.log('=====================================');
    
    // Check current state
    window.checkCartState();
    await window.checkDatabaseCart();
    window.checkAuthState();
    window.checkTimingIssues();
    
    console.log('=====================================');
    console.log('🎯 DIAGNOSTIC COMPLETE');
    console.log('');
    console.log('If cart is persisting, run: window.testCartClearing()');
    console.log('To monitor cart fetches, run: window.checkCartFetchAttempts()');
};

// Run diagnostic immediately
window.runCartDiagnostic(); 