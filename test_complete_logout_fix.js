// 🧪 COMPLETE LOGOUT FIX TEST
// Run this in the browser console to test the complete logout fix

console.log('🧪 Complete Logout Fix Test');

// Function to check current session and cart state
window.checkCompleteState = async () => {
    console.log('=== CHECKING COMPLETE STATE ===');
    
    try {
        const { supabase } = await import('./src/utils/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();
        
        const store = window.store;
        const cartState = store.getState().anonymousCart;
        const authState = store.getState().auth;
        
        console.log('Current state:');
        console.log('- Supabase session:', session ? 'exists' : 'null');
        console.log('- Auth isAuthenticated:', authState.isAuthenticated);
        console.log('- Cart isAnonymous:', cartState.isAnonymous);
        console.log('- Cart items count:', cartState.items.length);
        console.log('- Cart isLoggingOut:', cartState.isLoggingOut);
        
        if (session) {
            console.log('- Session user ID:', session.user.id);
            console.log('- Session user email:', session.user.email);
            
            // Check if it's anonymous
            const { isAnonymousUser } = await import('./src/utils/anonymousAuth');
            const isAnonymous = isAnonymousUser(session);
            console.log('- Is anonymous user:', isAnonymous);
        }
        
        return { session, cartState, authState };
    } catch (error) {
        console.error('Error checking state:', error);
        return { session: null, cartState: null, authState: null };
    }
};

// Function to test the complete logout process
window.testCompleteLogout = async () => {
    console.log('=== TESTING COMPLETE LOGOUT PROCESS ===');
    
    // Check initial state
    console.log('1. Checking initial state...');
    const initialState = await window.checkCompleteState();
    
    // Simulate logout
    console.log('2. Simulating logout...');
    const store = window.store;
    
    // Clear Redux state first
    store.dispatch({ type: 'anonymousCart/forceClear' });
    store.dispatch({ type: 'anonymousCart/logout' });
    
    // Check state after Redux clearing
    console.log('3. Checking state after Redux clearing...');
    const afterReduxState = await window.checkCompleteState();
    
    // Simulate Supabase sign out
    console.log('4. Simulating Supabase sign out...');
    try {
        const { supabase } = await import('./src/utils/supabaseClient');
        await supabase.auth.signOut();
        
        // Wait a bit for session to clear
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check state after Supabase sign out
        console.log('5. Checking state after Supabase sign out...');
        const afterSupabaseState = await window.checkCompleteState();
        
        // Test anonymous session creation
        console.log('6. Testing anonymous session creation...');
        const { initializeAuth } = await import('./src/redux/anonymousCartSlice');
        const result = await store.dispatch(initializeAuth(true)).unwrap();
        console.log('Anonymous session creation result:', result);
        
        // Check final state
        console.log('7. Checking final state...');
        const finalState = await window.checkCompleteState();
        
        // Verify the fix
        if (finalState.session && finalState.cartState.isAnonymous && finalState.cartState.items.length === 0) {
            console.log('✅ SUCCESS: Complete logout and anonymous session creation working correctly');
            console.log('New anonymous user ID:', finalState.session.user.id);
        } else {
            console.log('❌ FAILED: Complete logout not working correctly');
            console.log('- Has session:', !!finalState.session);
            console.log('- Is anonymous:', finalState.cartState.isAnonymous);
            console.log('- Cart items:', finalState.cartState.items.length);
        }
        
    } catch (error) {
        console.error('❌ Error during logout test:', error);
    }
};

// Function to check for session persistence issues
window.checkSessionPersistence = async () => {
    console.log('=== CHECKING SESSION PERSISTENCE ===');
    
    try {
        const { supabase } = await import('./src/utils/supabaseClient');
        
        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            console.log('Current session found:');
            console.log('- User ID:', session.user.id);
            console.log('- Email:', session.user.email);
            console.log('- Role:', session.user.role);
            console.log('- Aud:', session.user.aud);
            
            // Check if this looks like an authenticated session
            const isAuthenticatedSession = session.user.email && session.user.role === 'authenticated';
            
            if (isAuthenticatedSession) {
                console.log('❌ AUTHENTICATED SESSION PERSISTING: This should be cleared on logout');
            } else {
                console.log('✅ Session appears to be anonymous or properly cleared');
            }
        } else {
            console.log('✅ No session found - properly cleared');
        }
        
        return session;
    } catch (error) {
        console.error('Error checking session persistence:', error);
        return null;
    }
};

// Function to test cart clearing
window.testCartClearing = async () => {
    console.log('=== TESTING CART CLEARING ===');
    
    const store = window.store;
    const cartState = store.getState().anonymousCart;
    
    console.log('Current cart state:');
    console.log('- Items count:', cartState.items.length);
    console.log('- Is anonymous:', cartState.isAnonymous);
    console.log('- Is logging out:', cartState.isLoggingOut);
    
    if (cartState.items.length > 0) {
        console.log('❌ CART NOT CLEARED: Items still present');
        console.log('Items:', cartState.items);
    } else {
        console.log('✅ Cart appears to be cleared');
    }
    
    return cartState;
};

// Main test function
window.runCompleteLogoutTest = async () => {
    console.log('🔍 RUNNING COMPLETE LOGOUT FIX TEST');
    console.log('=====================================');
    
    await window.checkCompleteState();
    await window.checkSessionPersistence();
    await window.testCartClearing();
    
    console.log('=====================================');
    console.log('To test complete logout process, run:');
    console.log('window.testCompleteLogout()');
};

// Run test immediately
window.runCompleteLogoutTest(); 