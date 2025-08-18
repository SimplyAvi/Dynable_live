// 🧪 QUERY SELECTION TEST - VERIFY WHICH QUERY IS BEING CALLED
// Run this in the browser console to test query selection

console.log('🧪 Query Selection Test - Starting...');

// Test 1: Check which query function is being called
console.log('Test 1: Query function selection...');
console.log('Expected behavior:');
console.log('- Authenticated users: searchProductsUnified');
console.log('- Anonymous users: searchProductsSimpleForAnonymous');

// Test 2: Check console messages
console.log('Test 2: Console message verification...');
console.log('Look for these messages:');
console.log('- [UNIFIED] Starting unified product search (authenticated)');
console.log('- [SIMPLE] Anonymous user simple filtering (anonymous)');

// Test 3: Check timeout behavior
console.log('Test 3: Timeout behavior...');
console.log('If timeouts occur:');
console.log('- Check if the correct query function is being called');
console.log('- Check if the is_active filter is applied');
console.log('- Check database performance with the SQL diagnostic');

// Test 4: Manual query test
console.log('Test 4: Manual query test...');
console.log('Try this in the browser console:');
console.log(`
// Test unified query (authenticated)
window.testUnifiedQuery = async () => {
    const { searchProductsUnified } = await import('./src/utils/supabaseQueries.js');
    return await searchProductsUnified({
        page: 1,
        limit: 20,
        searchTerm: '',
        allergens: [],
        userType: 'authenticated',
        includeCount: true
    });
};

// Test simple query (anonymous)
window.testSimpleQuery = async () => {
    const { searchProductsSimpleForAnonymous } = await import('./src/utils/supabaseQueries.js');
    return await searchProductsSimpleForAnonymous({
        page: 1,
        limit: 20,
        searchTerm: '',
        allergens: [],
        includeCount: true
    });
};
`);

console.log('');
console.log('🎯 DIAGNOSTIC STEPS:');
console.log('1. Check console for query function messages');
console.log('2. Run manual query tests');
console.log('3. Check database performance with SQL script');
console.log('4. Verify if timeouts are consistent or intermittent');
console.log('');
console.log('🔧 NEXT STEPS:');
console.log('1. Run the SQL diagnostic script in Supabase');
console.log('2. Check if indexes are missing');
console.log('3. Verify query performance with EXPLAIN ANALYZE');
console.log('4. Determine if it\'s a database or network issue'); 