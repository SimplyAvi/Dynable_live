/**
 * Simple Merge Debug Test
 * Run this in browser console to test merge functionality
 */

console.log('🧪 Merge Debug Test Ready');

// Test function to check merge state
window.testMergeState = () => {
    console.log('🔍 Testing Merge State...');
    
    // Check localStorage
    const anonymousUserId = localStorage.getItem('anonymousUserIdForMerge');
    console.log('📦 Anonymous User ID in localStorage:', anonymousUserId);
    
    // Check Redux state (if available)
    if (window.store) {
        const state = window.store.getState();
        console.log('📦 Anonymous Cart State:', state.anonymousCart);
        console.log('📦 Search Preferences State:', state.searchPreferences);
    } else {
        console.log('⚠️ Redux store not available');
    }
    
    // Check debug logger
    if (window.debugLogger) {
        const debugSummary = window.debugLogger.getDebugSummary();
        console.log('📦 Debug Summary:', debugSummary);
    } else {
        console.log('⚠️ Debug logger not available');
    }
};

// Test function to simulate merge
window.simulateMerge = (anonymousUserId, authenticatedUserId) => {
    console.log('🔄 Simulating merge...');
    console.log('Anonymous ID:', anonymousUserId);
    console.log('Authenticated ID:', authenticatedUserId);
    
    // This would be called by the actual merge functions
    if (window.debugLogger) {
        window.debugLogger.logMergeAttempt(anonymousUserId, authenticatedUserId);
    }
};

// Instructions
console.log(`
🧪 MERGE DEBUG COMMANDS:
- window.testMergeState() - Check current merge state
- window.simulateMerge('anon_id', 'auth_id') - Simulate merge
- window.debugLogger.getDebugSummary() - Get debug summary
- window.debugLogger.clearDebugState() - Clear debug state
`); 