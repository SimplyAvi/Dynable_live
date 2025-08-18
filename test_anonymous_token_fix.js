// 🧪 ANONYMOUS TOKEN FIX TEST
// Run this in the browser console to test the anonymous token fix

console.log('🧪 Anonymous Token Fix Test');

// Function to check current session state
window.checkSessionState = async () => {
    console.log('=== CHECKING SESSION STATE ===');
    
    try {
        const { supabase } = await import('./src/utils/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('Current Supabase session:', session ? 'exists' : 'null');
        
        if (session) {
            console.log('Session user ID:', session.user.id);
            console.log('Session user email:', session.user.email);
            console.log('Session user phone:', session.user.phone);
            console.log('Session app_metadata:', session.user.app_metadata);
            
            // Check if it's anonymous
            const { isAnonymousUser } = await import('./src/utils/anonymousAuth');
            const isAnonymous = isAnonymousUser(session);
            console.log('Is anonymous user:', isAnonymous);
            
            return { session, isAnonymous };
        } else {
            console.log('No session found');
            return { session: null, isAnonymous: false };
        }
    } catch (error) {
        console.error('Error checking session:', error);
        return { session: null, isAnonymous: false };
    }
};

// Function to test the logout and anonymous session creation
window.testLogoutAndAnonymousSession = async () => {
    console.log('=== TESTING LOGOUT AND ANONYMOUS SESSION ===');
    
    // Check initial state
    console.log('1. Checking initial session state...');
    const initialState = await window.checkSessionState();
    
    // Simulate logout
    console.log('2. Simulating logout...');
    const store = window.store;
    store.dispatch({ type: 'anonymousCart/forceClear' });
    store.dispatch({ type: 'anonymousCart/logout' });
    
    // Check state after logout
    console.log('3. Checking state after logout...');
    const afterLogoutState = await window.checkSessionState();
    
    // Test anonymous session creation
    console.log('4. Testing anonymous session creation...');
    try {
        const { initializeAuth } = await import('./src/redux/anonymousCartSlice');
        const result = await store.dispatch(initializeAuth(true)).unwrap();
        console.log('Anonymous session creation result:', result);
        
        // Check final state
        console.log('5. Checking final session state...');
        const finalState = await window.checkSessionState();
        
        // Verify the fix
        if (finalState.session && finalState.isAnonymous) {
            console.log('✅ SUCCESS: New anonymous session created correctly');
            console.log('New anonymous user ID:', finalState.session.user.id);
        } else {
            console.log('❌ FAILED: Anonymous session not created correctly');
        }
        
    } catch (error) {
        console.error('❌ Error creating anonymous session:', error);
    }
};

// Function to check if cart is using the correct session
window.checkCartSession = async () => {
    console.log('=== CHECKING CART SESSION ===');
    
    const store = window.store;
    const cartState = store.getState().anonymousCart;
    
    console.log('Redux cart session:', cartState.session ? 'exists' : 'null');
    console.log('Redux cart isAnonymous:', cartState.isAnonymous);
    
    if (cartState.session) {
        console.log('Cart session user ID:', cartState.session.user.id);
        console.log('Cart session user email:', cartState.session.user.email);
    }
    
    // Check if cart session matches current Supabase session
    const currentSession = await window.checkSessionState();
    
    if (cartState.session && currentSession.session) {
        const sessionMatch = cartState.session.user.id === currentSession.session.user.id;
        console.log('Cart session matches current session:', sessionMatch);
        
        if (!sessionMatch) {
            console.log('❌ SESSION MISMATCH: Cart is using different session than current user');
        } else {
            console.log('✅ SESSION MATCH: Cart is using correct session');
        }
    } else {
        console.log('Cannot compare sessions - one or both are null');
    }
};

// Main test function
window.runAnonymousTokenTest = async () => {
    console.log('🔍 RUNNING ANONYMOUS TOKEN FIX TEST');
    console.log('=====================================');
    
    await window.checkSessionState();
    await window.checkCartSession();
    
    console.log('=====================================');
    console.log('To test logout and anonymous session creation, run:');
    console.log('window.testLogoutAndAnonymousSession()');
};

// Run test immediately
window.runAnonymousTokenTest(); 