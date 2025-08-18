// 🧪 RLS DIAGNOSTIC TEST - IDENTIFY QUERY TIMEOUT ISSUE
// Run this in the browser console to diagnose the RLS issue

console.log('🧪 RLS Diagnostic Test - Starting...');

// Test 1: Check if the is_active filter is working
console.log('Test 1: Checking is_active filter...');
console.log('Expected console message: [UNIFIED] Applied active products filter (required by RLS policy)');

// Test 2: Check database structure
console.log('Test 2: Database structure check...');
console.log('The query should filter for is_active = true');

// Test 3: Check RLS policy
console.log('Test 3: RLS policy check...');
console.log('Anonymous users should only see products where is_active = true');

// Test 4: Check query performance
console.log('Test 4: Query performance...');
console.log('If timeouts occur, it might be:');
console.log('- Too many inactive products in the database');
console.log('- Missing index on is_active column');
console.log('- RLS policy not working correctly');

// Test 5: Manual query test
console.log('Test 5: Manual query test...');
console.log('Try this in the Supabase SQL Editor:');
console.log(`
SELECT COUNT(*) as total_products,
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
       COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_products
FROM "IngredientCategorized";
`);

// Test 6: Check if the issue is intermittent
console.log('Test 6: Intermittent issue check...');
console.log('If it worked before but not now, possible causes:');
console.log('- Database load/performance issues');
console.log('- Network connectivity problems');
console.log('- Supabase service issues');
console.log('- Query complexity increased');

console.log('');
console.log('🎯 DIAGNOSTIC STEPS:');
console.log('1. Check if the is_active filter message appears in console');
console.log('2. Run the manual query in Supabase SQL Editor');
console.log('3. Check if the issue is consistent or intermittent');
console.log('4. Monitor network tab for actual query performance');
console.log('');
console.log('🔧 POTENTIAL FIXES:');
console.log('1. Add index on is_active column if missing');
console.log('2. Increase query timeout if needed');
console.log('3. Optimize the query further');
console.log('4. Check database performance'); 