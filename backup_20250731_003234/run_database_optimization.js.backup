/**
 * Database Optimization Script for Allergen Filtering Performance
 * This script provides the SQL commands to run in your Supabase SQL Editor
 */

console.log('🚨 CRITICAL: Allergen Filtering Performance Optimization');
console.log('📊 Target Database: https://fdojimqdhuqhimgjpdai.supabase.co');
console.log('');
console.log('📋 STEP-BY-STEP EXECUTION:');
console.log('');
console.log('1️⃣ Go to your Supabase Dashboard');
console.log('   URL: https://supabase.com/dashboard/project/fdojimqdhuqhimgjpdai');
console.log('');
console.log('2️⃣ Navigate to SQL Editor');
console.log('   - Click "SQL Editor" in the left sidebar');
console.log('   - Click "New query"');
console.log('');
console.log('3️⃣ Execute these commands ONE BY ONE:');
console.log('');

const commands = [
    {
        step: 1,
        name: 'Enable trigram extension',
        sql: 'CREATE EXTENSION IF NOT EXISTS pg_trgm;',
        description: 'Enables trigram extension for ILIKE optimization'
    },
    {
        step: 2,
        name: 'Create trigram index (MOST CRITICAL)',
        sql: `CREATE INDEX CONCURRENTLY idx_ingredient_description_trgm 
ON "IngredientCategorized" USING gin(description gin_trgm_ops);`,
        description: 'This is the most important index for fixing timeouts'
    },
    {
        step: 3,
        name: 'Create full-text search index',
        sql: `CREATE INDEX CONCURRENTLY idx_ingredient_description_fts 
ON "IngredientCategorized" USING gin(to_tsvector('english', description));`,
        description: 'Alternative approach for text searching'
    },
    {
        step: 4,
        name: 'Create brand filter index',
        sql: `CREATE INDEX CONCURRENTLY idx_ingredient_brand 
ON "IngredientCategorized" (brandName) 
WHERE brandName IS NOT NULL AND brandName != 'generic';`,
        description: 'Excludes generic products efficiently'
    },
    {
        step: 5,
        name: 'Create composite allergen index',
        sql: `CREATE INDEX CONCURRENTLY idx_ingredient_common_allergens
ON "IngredientCategorized" (description) 
WHERE description ILIKE '%milk%' OR description ILIKE '%peanuts%' 
   OR description ILIKE '%gluten%' OR description ILIKE '%wheat%'
   OR description ILIKE '%eggs%' OR description ILIKE '%soy%';`,
        description: 'Pre-optimized for common allergens'
    }
];

commands.forEach(cmd => {
    console.log(`\n${cmd.step}️⃣ ${cmd.name}`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   SQL Command:`);
    console.log(`   ${cmd.sql}`);
    console.log(`   ⏳ Expected time: 30-60 seconds`);
    console.log(`   ✅ Success indicator: "Query returned successfully"`);
});

console.log('\n4️⃣ After all indexes are created, test performance:');
console.log('');

const testQueries = [
    {
        name: 'Test single allergen filtering',
        sql: `SELECT COUNT(*) FROM "IngredientCategorized" 
WHERE description NOT ILIKE '%milk%' 
AND brandName != 'generic' LIMIT 1000;`,
        expected: 'Should complete in <2 seconds'
    },
    {
        name: 'Test multiple allergen filtering',
        sql: `SELECT COUNT(*) FROM "IngredientCategorized" 
WHERE description NOT ILIKE '%milk%' 
AND description NOT ILIKE '%peanuts%'
AND description NOT ILIKE '%gluten%'
AND brandName != 'generic' LIMIT 1000;`,
        expected: 'Should complete in <2 seconds'
    },
    {
        name: 'Test search + allergen combination',
        sql: `SELECT COUNT(*) FROM "IngredientCategorized" 
WHERE description ILIKE '%chicken%'
AND description NOT ILIKE '%soy%'
AND brandName != 'generic' LIMIT 1000;`,
        expected: 'Should complete in <2 seconds'
    }
];

testQueries.forEach((query, index) => {
    console.log(`\nTest ${index + 1}: ${query.name}`);
    console.log(`   SQL: ${query.sql}`);
    console.log(`   Expected: ${query.expected}`);
});

console.log('\n5️⃣ Verify indexes were created:');
console.log(`
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'IngredientCategorized'
ORDER BY indexname;
`);

console.log('\n🎯 SUCCESS CRITERIA:');
console.log('✅ All 5 indexes created successfully');
console.log('✅ Test queries complete in <2 seconds');
console.log('✅ No timeout errors (57014)');
console.log('✅ Allergen filtering works in the app');

console.log('\n🚨 IMPORTANT NOTES:');
console.log('- Execute commands ONE BY ONE (not all at once)');
console.log('- Wait for each command to complete before running the next');
console.log('- If any command fails, check the error message');
console.log('- The trigram index (step 2) is the most critical');
console.log('- After indexes are created, restart your app to test');

console.log('\n📞 Need help? Check the error messages and try again.');
console.log('   Most common issues:');
console.log('   - Index already exists (safe to ignore)');
console.log('   - Permission denied (check service role key)');
console.log('   - Table doesn\'t exist (check table name)');

console.log('\n⏰ Ready to execute? Copy and paste each SQL command into Supabase SQL Editor.'); 