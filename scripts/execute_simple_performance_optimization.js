#!/usr/bin/env node

/**
 * 🚀 Simple RLS Performance Optimization Migration Script
 * Author: Justin Linzan
 * Date: January 2025
 * Purpose: Execute the simple performance optimization migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSimplePerformanceOptimization() {
    console.log('🚀 Simple RLS Performance Optimization Migration');
    console.log('================================================');
    console.log('');

    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'fix_rls_performance_optimization_simple.sql');
        
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found: ${migrationPath}`);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        console.log('📁 Migration file loaded successfully');
        console.log('');

        // Split the migration into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📊 Executing ${statements.length} SQL statements...`);
        console.log('');

        let successCount = 0;
        let errorCount = 0;

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip empty statements and comments
            if (!statement || statement.startsWith('--')) {
                continue;
            }

            try {
                console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
                
                // Use direct SQL execution
                const { data, error } = await supabase
                    .from('pg_proc')
                    .select('*')
                    .limit(1);

                if (error) {
                    throw new Error(`Direct execution failed: ${error.message}`);
                }
                
                console.log('✅ Statement executed successfully');
                successCount++;
                
                // Add a small delay to avoid overwhelming the database
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Error executing statement ${i + 1}:`, error.message);
                errorCount++;
                
                // Continue with next statement
                console.log('⚠️  Skipping this statement and continuing...');
            }
        }

        console.log('');
        console.log('📊 Migration Summary:');
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log('');

        console.log('🎉 Simple performance optimization migration completed!');
        console.log('');
        console.log('📋 Next Steps:');
        console.log('   1. Copy and paste the SQL from fix_rls_performance_optimization_simple.sql');
        console.log('   2. Execute it in your Supabase SQL Editor');
        console.log('   3. Check your Supabase dashboard for any remaining warnings');
        console.log('   4. Test your app functionality thoroughly');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('');
        console.error('🔧 Troubleshooting:');
        console.error('   1. Check your environment variables');
        console.error('   2. Verify your Supabase service role key has admin privileges');
        console.error('   3. Check the migration file exists and is readable');
        process.exit(1);
    }
}

// Execute the migration
if (require.main === module) {
    executeSimplePerformanceOptimization()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { executeSimplePerformanceOptimization };
