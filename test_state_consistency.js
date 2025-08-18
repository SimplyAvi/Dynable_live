// 🧪 STATE CONSISTENCY TEST
// Run this in the browser console to test state consistency

console.log('🧪 State Consistency Test');

// Function to check overall state consistency
window.testStateConsistency = async () => {
    console.log('=== TESTING STATE CONSISTENCY ===');
    
    try {
        const { supabase } = await import('./src/utils/supabaseClient');
        const store = window.store;
        
        // Check all state components
        const authState = store.getState().auth;
        const cartState = store.getState().anonymousCart;
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('Current state analysis:');
        console.log('- Auth isAuthenticated:', authState.isAuthenticated);
        console.log('- Auth currentUser:', authState.currentUser);
        console.log('- Cart isAnonymous:', cartState.isAnonymous);
        console.log('- Cart items count:', cartState.items.length);
        console.log('- Cart isLoggingOut:', cartState.isLoggingOut);
        console.log('- Supabase session:', session ? 'exists' : 'null');
        console.log('- Connection warmed up:', window.connectionWarmedUp);
        
        // Check for state inconsistencies
        const inconsistencies = [];
        
        // Check 1: Auth vs Cart state
        if (authState.isAuthenticated && cartState.isAnonymous) {
            inconsistencies.push('Auth says authenticated but cart says anonymous');
        }
        
        if (!authState.isAuthenticated && !cartState.isAnonymous && cartState.items.length > 0) {
            inconsistencies.push('Not authenticated, not anonymous, but has cart items');
        }
        
        // Check 2: Session vs Auth state
        if (session && !authState.isAuthenticated) {
            inconsistencies.push('Supabase session exists but auth says not authenticated');
        }
        
        if (!session && authState.isAuthenticated) {
            inconsistencies.push('No Supabase session but auth says authenticated');
        }
        
        // Check 3: Cart vs Session state
        if (session && cartState.items.length === 0 && !cartState.isLoggingOut) {
            inconsistencies.push('Session exists but cart is empty and not logging out');
        }
        
        // Check 4: Connection state
        if (!window.connectionWarmedUp) {
            inconsistencies.push('Database connection not warmed up');
        }
        
        if (inconsistencies.length === 0) {
            console.log('✅ State consistency check passed - no inconsistencies found');
        } else {
            console.log('❌ State consistency check failed:');
            inconsistencies.forEach((issue, index) => {
                console.log(`  ${index + 1}. ${issue}`);
            });
        }
        
        return { consistent: inconsistencies.length === 0, inconsistencies };
    } catch (error) {
        console.error('❌ Error checking state consistency:', error);
        return { consistent: false, error };
    }
};

// Function to test complete logout flow
window.testCompleteLogoutFlow = async () => {
    console.log('=== TESTING COMPLETE LOGOUT FLOW ===');
    
    // Check initial state
    console.log('1. Checking initial state...');
    const initialState = await window.testStateConsistency();
    
    // Simulate logout
    console.log('2. Simulating logout...');
    const store = window.store;
    
    // Clear Redux state
    store.dispatch({ type: 'anonymousCart/forceClear' });
    store.dispatch({ type: 'anonymousCart/logout' });
    
    // Check state after Redux clearing
    console.log('3. Checking state after Redux clearing...');
    const afterReduxState = await window.testStateConsistency();
    
    // Simulate Supabase sign out
    console.log('4. Simulating Supabase sign out...');
    try {
        const { supabase } = await import('./src/utils/supabaseClient');
        await supabase.auth.signOut();
        
        // Wait for session to clear
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check state after Supabase sign out
        console.log('5. Checking state after Supabase sign out...');
        const afterSupabaseState = await window.testStateConsistency();
        
        // Test anonymous session creation
        console.log('6. Testing anonymous session creation...');
        const { initializeAuth } = await import('./src/redux/anonymousCartSlice');
        const result = await store.dispatch(initializeAuth(true)).unwrap();
        console.log('Anonymous session creation result:', result);
        
        // Check final state
        console.log('7. Checking final state...');
        const finalState = await window.testStateConsistency();
        
        // Verify the complete flow
        if (finalState.consistent && finalState.inconsistencies.length === 0) {
            console.log('✅ SUCCESS: Complete logout flow working correctly');
        } else {
            console.log('❌ FAILED: Complete logout flow has issues');
            console.log('Inconsistencies:', finalState.inconsistencies);
        }
        
    } catch (error) {
        console.error('❌ Error during logout flow test:', error);
    }
};

// Function to test query performance with state consistency
window.testQueryPerformanceWithState = async () => {
    console.log('=== TESTING QUERY PERFORMANCE WITH STATE ===');
    
    // First check state consistency
    const stateCheck = await window.testStateConsistency();
    
    if (!stateCheck.consistent) {
        console.log('❌ State inconsistent, skipping query test');
        return { success: false, reason: 'State inconsistent' };
    }
    
    // Test query performance
    try {
        const { searchProductsUnified } = await import('./src/utils/supabaseQueries');
        
        console.log('🔥 Testing query with consistent state...');
        const startTime = Date.now();
        
        const result = await searchProductsUnified({
            page: 1,
            limit: 20,
            searchTerm: '',
            allergens: [],
            userType: 'anonymous',
            includeCount: true
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✅ Query completed in ${duration}ms with consistent state`);
        
        return { success: true, duration, result };
    } catch (error) {
        console.error('❌ Query performance test failed:', error);
        return { success: false, error };
    }
};

// Function to test the complete system
window.testCompleteSystem = async () => {
    console.log('=== TESTING COMPLETE SYSTEM ===');
    
    console.log('🔍 Running comprehensive system test...');
    
    // Test 1: State consistency
    console.log('\n1. Testing state consistency...');
    const stateTest = await window.testStateConsistency();
    
    // Test 2: Connection warmup
    console.log('\n2. Testing connection warmup...');
    const connectionTest = await window.manualWarmupConnection();
    
    // Test 3: Query performance
    console.log('\n3. Testing query performance...');
    const queryTest = await window.testQueryPerformanceWithState();
    
    // Test 4: Cart clearing
    console.log('\n4. Testing cart clearing...');
    const cartTest = await window.testCartClearing();
    
    // Overall assessment
    console.log('\n=== OVERALL ASSESSMENT ===');
    
    const allTests = [
        { name: 'State Consistency', result: stateTest.consistent },
        { name: 'Connection Warmup', result: connectionTest.success },
        { name: 'Query Performance', result: queryTest.success },
        { name: 'Cart Clearing', result: cartTest.items.length === 0 }
    ];
    
    const passedTests = allTests.filter(test => test.result).length;
    const totalTests = allTests.length;
    
    console.log(`Tests passed: ${passedTests}/${totalTests}`);
    
    allTests.forEach(test => {
        const status = test.result ? '✅' : '❌';
        console.log(`${status} ${test.name}`);
    });
    
    if (passedTests === totalTests) {
        console.log('\n🎉 ALL TESTS PASSED! System is working correctly.');
    } else {
        console.log('\n⚠️ Some tests failed. Check the issues above.');
    }
    
    return { passedTests, totalTests, tests: allTests };
};

// Main test function
window.runStateConsistencyTest = async () => {
    console.log('🔍 RUNNING STATE CONSISTENCY TEST');
    console.log('=====================================');
    
    await window.testStateConsistency();
    
    console.log('=====================================');
    console.log('Additional tests available:');
    console.log('- window.testCompleteLogoutFlow() - Test complete logout flow');
    console.log('- window.testQueryPerformanceWithState() - Test query with state check');
    console.log('- window.testCompleteSystem() - Test complete system');
};

// Run test immediately
window.runStateConsistencyTest(); 