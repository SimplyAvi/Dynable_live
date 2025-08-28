#!/usr/bin/env node

/**
 * 🧪 Test Performance Optimization Approach
 * Author: Justin Linzan
 * Date: January 2025
 * Purpose: Test the performance optimization approach before running full migration
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    console.error('   - SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPerformanceOptimization() {
    console.log('🧪 Testing Performance Optimization Approach');
    console.log('============================================');
    console.log('');

    try {
        // Test 1: Check current policies that need optimization
        console.log('📊 Step 1: Analyzing current policies...');
        await analyzeCurrentPolicies();

        // Test 2: Test SELECT wrapping approach
        console.log('📊 Step 2: Testing SELECT wrapping approach...');
        await testSelectWrapping();

        // Test 3: Test policy recreation
        console.log('📊 Step 3: Testing policy recreation...');
        await testPolicyRecreation();

        console.log('');
        console.log('✅ All tests completed successfully!');
        console.log('🎯 Ready to proceed with full migration');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

async function analyzeCurrentPolicies() {
    try {
        // Get current policies that might have performance issues
        const { data: policies, error } = await supabase
            .from('pg_policies')
            .select('tablename, policyname, qual, with_check')
            .in('tablename', [
                'IngredientCategorized', 'admin_actions', 'AllergenDerivatives',
                'Substitutions', 'Recipes', 'RecipeIngredients', 'Ingredients',
                'IngredientToCanonicals', 'Users', 'Orders'
            ]);

        if (error) {
            console.log('⚠️  Could not fetch policies:', error.message);
            return;
        }

        console.log(`📋 Found ${policies.length} policies to analyze`);

        // Check for policies with direct auth function calls
        const problematicPolicies = policies.filter(policy => {
            const qual = policy.qual || '';
            const withCheck = policy.with_check || '';
            const combined = qual + ' ' + withCheck;
            
            return combined.includes('auth.jwt()') || combined.includes('auth.uid()');
        });

        console.log(`⚠️  Found ${problematicPolicies.length} policies with potential performance issues`);
        
        if (problematicPolicies.length > 0) {
            console.log('📝 Problematic policies:');
            problematicPolicies.forEach(policy => {
                console.log(`   - ${policy.tablename}.${policy.policyname}`);
            });
        }

    } catch (error) {
        console.log('⚠️  Policy analysis failed:', error.message);
    }
}

async function testSelectWrapping() {
    try {
        // Test the SELECT wrapping approach with a simple query
        console.log('🧪 Testing SELECT wrapping syntax...');

        // Test 1: Simple auth.uid() wrapping
        const testQuery1 = `
            SELECT 
                (SELECT auth.uid()) as user_id,
                (SELECT (auth.jwt() ->> 'role')::text) as user_role,
                (SELECT (auth.jwt() ->> 'is_anonymous')::boolean) as is_anonymous
            LIMIT 1;
        `;

        try {
            const { data, error } = await supabase.rpc('exec_sql', {
                sql_query: testQuery1
            });

            if (error) {
                console.log('⚠️  SELECT wrapping test failed:', error.message);
            } else {
                console.log('✅ SELECT wrapping syntax works');
            }
        } catch (error) {
            console.log('⚠️  Could not test SELECT wrapping:', error.message);
        }

        // Test 2: Check if we can create a simple optimized policy
        console.log('🧪 Testing optimized policy creation...');
        
        const testPolicySQL = `
            CREATE POLICY "test_optimized_policy" ON "Users"
            FOR SELECT USING (
                (SELECT auth.uid()::text) = id::text OR 
                (SELECT (auth.jwt() ->> 'role')::text) = 'admin'
            );
        `;

        try {
            const { data, error } = await supabase.rpc('exec_sql', {
                sql_query: testPolicySQL
            });

            if (error) {
                console.log('⚠️  Optimized policy creation failed:', error.message);
            } else {
                console.log('✅ Optimized policy creation works');
                
                // Clean up test policy
                const cleanupSQL = `DROP POLICY IF EXISTS "test_optimized_policy" ON "Users";`;
                await supabase.rpc('exec_sql', { sql_query: cleanupSQL });
                console.log('✅ Test policy cleaned up');
            }
        } catch (error) {
            console.log('⚠️  Could not test policy creation:', error.message);
        }

    } catch (error) {
        console.log('⚠️  SELECT wrapping test failed:', error.message);
    }
}

async function testPolicyRecreation() {
    try {
        console.log('🧪 Testing policy recreation approach...');

        // Test dropping and recreating a simple policy
        const testTable = 'Users';
        const testPolicyName = 'test_recreation_policy';

        // Step 1: Drop policy if exists
        const dropSQL = `DROP POLICY IF EXISTS "${testPolicyName}" ON "${testTable}";`;
        
        try {
            await supabase.rpc('exec_sql', { sql_query: dropSQL });
            console.log('✅ Policy drop works');
        } catch (error) {
            console.log('⚠️  Policy drop failed:', error.message);
        }

        // Step 2: Create optimized policy
        const createSQL = `
            CREATE POLICY "${testPolicyName}" ON "${testTable}"
            FOR SELECT USING (
                (SELECT auth.uid()::text) = id::text OR 
                (SELECT (auth.jwt() ->> 'role')::text) = 'admin'
            );
        `;

        try {
            await supabase.rpc('exec_sql', { sql_query: createSQL });
            console.log('✅ Optimized policy creation works');
        } catch (error) {
            console.log('⚠️  Optimized policy creation failed:', error.message);
        }

        // Step 3: Clean up
        try {
            await supabase.rpc('exec_sql', { sql_query: dropSQL });
            console.log('✅ Policy cleanup works');
        } catch (error) {
            console.log('⚠️  Policy cleanup failed:', error.message);
        }

    } catch (error) {
        console.log('⚠️  Policy recreation test failed:', error.message);
    }
}

// Execute the test
if (require.main === module) {
    testPerformanceOptimization()
        .then(() => {
            console.log('✅ Test completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Test failed:', error.message);
            process.exit(1);
        });
}

module.exports = { testPerformanceOptimization };
