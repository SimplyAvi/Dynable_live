/**
 * Execute Database Indexes for Allergen Filtering Performance
 * This script will create the necessary indexes to fix the timeout issues
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://fdojimqdhuqhimgjpdai.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Database indexes to create
const INDEXES = [
    {
        name: 'Enable trigram extension',
        sql: 'CREATE EXTENSION IF NOT EXISTS pg_trgm;',
        description: 'Enables trigram extension for ILIKE optimization'
    },
    {
        name: 'Create trigram index for description',
        sql: `CREATE INDEX CONCURRENTLY idx_ingredient_description_trgm 
               ON "IngredientCategorized" USING gin(description gin_trgm_ops);`,
        description: 'Most critical index for allergen filtering performance'
    },
    {
        name: 'Create full-text search index',
        sql: `CREATE INDEX CONCURRENTLY idx_ingredient_description_fts 
               ON "IngredientCategorized" USING gin(to_tsvector('english', description));`,
        description: 'Alternative approach for text searching'
    },
    {
        name: 'Create brand filter index',
        sql: `CREATE INDEX CONCURRENTLY idx_ingredient_brand 
               ON "IngredientCategorized" (brandName) 
               WHERE brandName IS NOT NULL AND brandName != 'generic';`,
        description: 'Excludes generic products efficiently'
    },
    {
        name: 'Create composite allergen index',
        sql: `CREATE INDEX CONCURRENTLY idx_ingredient_common_allergens
               ON "IngredientCategorized" (description) 
               WHERE description ILIKE '%milk%' OR description ILIKE '%peanuts%' 
                  OR description ILIKE '%gluten%' OR description ILIKE '%wheat%'
                  OR description ILIKE '%eggs%' OR description ILIKE '%soy%';`,
        description: 'Pre-optimized for common allergens'
    }
];

/**
 * Execute a single SQL command
 */
async function executeSQL(sql, description) {
    try {
        console.log(`\n🔧 Executing: ${description}`);
        console.log(`SQL: ${sql.substring(0, 100)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
            console.error(`❌ Error executing SQL:`, error);
            return { success: false, error };
        }
        
        console.log(`✅ Successfully executed: ${description}`);
        return { success: true, data };
    } catch (error) {
        console.error(`❌ Exception executing SQL:`, error);
        return { success: false, error };
    }
}

/**
 * Test query performance after indexes are created
 */
async function testQueryPerformance() {
    console.log('\n🧪 Testing query performance...');
    
    const testQueries = [
        {
            name: 'Single allergen test (milk)',
            sql: `SELECT COUNT(*) FROM "IngredientCategorized" 
                  WHERE description NOT ILIKE '%milk%' 
                  AND brandName != 'generic' LIMIT 1000;`
        },
        {
            name: 'Multiple allergen test',
            sql: `SELECT COUNT(*) FROM "IngredientCategorized" 
                  WHERE description NOT ILIKE '%milk%' 
                  AND description NOT ILIKE '%peanuts%'
                  AND description NOT ILIKE '%gluten%'
                  AND brandName != 'generic' LIMIT 1000;`
        },
        {
            name: 'Search + allergen combination',
            sql: `SELECT COUNT(*) FROM "IngredientCategorized" 
                  WHERE description ILIKE '%chicken%'
                  AND description NOT ILIKE '%soy%'
                  AND brandName != 'generic' LIMIT 1000;`
        }
    ];
    
    for (const query of testQueries) {
        const startTime = Date.now();
        const result = await executeSQL(query.sql, query.name);
        const duration = Date.now() - startTime;
        
        if (result.success) {
            console.log(`✅ ${query.name} completed in ${duration}ms`);
            if (duration > 2000) {
                console.warn(`⚠️  Query took ${duration}ms (target: <2000ms)`);
            }
        } else {
            console.error(`❌ ${query.name} failed:`, result.error);
        }
    }
}

/**
 * Verify indexes were created successfully
 */
async function verifyIndexes() {
    console.log('\n🔍 Verifying indexes...');
    
    const verifySQL = `
        SELECT 
            indexname,
            tablename,
            indexdef
        FROM pg_indexes 
        WHERE tablename = 'IngredientCategorized'
        ORDER BY indexname;
    `;
    
    const result = await executeSQL(verifySQL, 'Verify indexes');
    
    if (result.success) {
        console.log('✅ Indexes verification completed');
        console.log('📋 Found indexes:', result.data);
    } else {
        console.error('❌ Failed to verify indexes:', result.error);
    }
}

/**
 * Main execution function
 */
async function executeDatabaseIndexes() {
    console.log('🚀 Starting database index creation for allergen filtering performance...');
    console.log(`📊 Target: ${SUPABASE_URL}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    
    const results = {
        successful: 0,
        failed: 0,
        errors: []
    };
    
    // Execute each index
    for (const index of INDEXES) {
        const result = await executeSQL(index.sql, index.description);
        
        if (result.success) {
            results.successful++;
            console.log(`✅ ${index.name} - SUCCESS`);
        } else {
            results.failed++;
            results.errors.push({ index: index.name, error: result.error });
            console.error(`❌ ${index.name} - FAILED`);
        }
        
        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Verify indexes
    await verifyIndexes();
    
    // Test performance
    await testQueryPerformance();
    
    // Summary
    console.log('\n📊 EXECUTION SUMMARY:');
    console.log(`✅ Successful: ${results.successful}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⏰ Completed at: ${new Date().toISOString()}`);
    
    if (results.failed > 0) {
        console.log('\n❌ ERRORS:');
        results.errors.forEach(error => {
            console.log(`- ${error.index}: ${error.error}`);
        });
    }
    
    if (results.successful === INDEXES.length) {
        console.log('\n🎉 ALL INDEXES CREATED SUCCESSFULLY!');
        console.log('✅ Allergen filtering performance should now be optimized');
    } else {
        console.log('\n⚠️  SOME INDEXES FAILED - Check errors above');
    }
}

// Execute if run directly
if (require.main === module) {
    executeDatabaseIndexes().catch(console.error);
}

module.exports = { executeDatabaseIndexes }; 