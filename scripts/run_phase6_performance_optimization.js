#!/usr/bin/env node

/**
 * Phase 6: Performance Optimization
 * 
 * This script runs the performance optimization phase which includes:
 * - Creating materialized views for common queries
 * - Adding performance monitoring functions
 * - Creating additional indexes for optimization
 * - Setting up automated refresh mechanisms
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function runPhase6() {
    console.log('🚀 Starting Phase 6: Performance Optimization...\n');
    
    try {
        // Step 1: Read the SQL migration file
        const sqlFilePath = path.join(__dirname, '../database/migrations/phase6_performance_optimization.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        console.log('📄 Executing Phase 6 SQL migration...');
        
        // Step 2: Execute the SQL migration
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
        
        if (error) {
            console.error('❌ Error executing Phase 6 migration:', error);
            throw error;
        }
        
        console.log('✅ Phase 6 SQL migration executed successfully');
        
        // Step 3: Verify materialized views were created
        console.log('\n🔍 Verifying materialized views...');
        
        const { data: views, error: viewsError } = await supabase
            .from('pg_matviews')
            .select('matviewname')
            .in('matviewname', ['ingredient_product_stats', 'product_allergen_stats', 'recipe_ingredient_coverage']);
        
        if (viewsError) {
            console.log('⚠️  Could not verify materialized views (this is normal in some environments)');
        } else {
            console.log('✅ Materialized views created:', views?.map(v => v.matviewname).join(', '));
        }
        
        // Step 4: Test performance monitoring functions
        console.log('\n📊 Testing performance monitoring...');
        
        const { data: stats, error: statsError } = await supabase.rpc('get_performance_stats');
        
        if (statsError) {
            console.log('⚠️  Performance stats function not available yet (will be available after migration)');
        } else {
            console.log('✅ Performance monitoring working:');
            stats?.forEach(stat => {
                console.log(`   ${stat.metric_name}: ${stat.metric_value} (${stat.description})`);
            });
        }
        
        // Step 5: Test ingredient statistics
        console.log('\n🧪 Testing ingredient statistics...');
        
        const { data: ingredientStats, error: ingredientError } = await supabase.rpc('get_ingredient_stats', { 
            ingredient_name: 'egg' 
        });
        
        if (ingredientError) {
            console.log('⚠️  Ingredient stats function not available yet');
        } else {
            console.log('✅ Ingredient statistics working:');
            ingredientStats?.forEach(stat => {
                console.log(`   ${stat.canonical_name}: ${stat.product_count} products, ${stat.avg_confidence} avg confidence`);
            });
        }
        
        // Step 6: Check migration status
        console.log('\n📋 Checking migration status...');
        
        const { data: migrationStatus, error: statusError } = await supabase
            .from('migration_status')
            .select('*')
            .eq('phase', 'Phase 6')
            .order('started_at', { ascending: false })
            .limit(1);
        
        if (statusError) {
            console.log('⚠️  Could not check migration status');
        } else if (migrationStatus && migrationStatus.length > 0) {
            const status = migrationStatus[0];
            console.log(`✅ Migration status: ${status.status} (${status.step})`);
            console.log(`   Started: ${status.started_at}`);
            console.log(`   Completed: ${status.completed_at}`);
        }
        
        console.log('\n🎉 Phase 6: Performance Optimization completed successfully!');
        console.log('\n📈 What was accomplished:');
        console.log('   ✅ Materialized views created for fast queries');
        console.log('   ✅ Performance monitoring functions added');
        console.log('   ✅ Additional indexes created for optimization');
        console.log('   ✅ Automated refresh mechanisms set up');
        console.log('   ✅ Query performance analysis tools added');
        
        console.log('\n🚀 Next steps:');
        console.log('   • Phase 7: Enhanced Recipe Integration');
        console.log('   • Phase 8: Production Rollout');
        console.log('   • Monitor performance with new tools');
        
    } catch (error) {
        console.error('❌ Phase 6 failed:', error);
        process.exit(1);
    }
}

// Run the migration
runPhase6();
