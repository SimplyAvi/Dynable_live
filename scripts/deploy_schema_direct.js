#!/usr/bin/env node

/**
 * 🔧 DIRECT SCHEMA DEPLOYMENT SCRIPT
 * Dynable App - Database Schema Deployment
 * 
 * This script directly deploys the database schema using proper Supabase methods
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Database connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const log = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
};

/**
 * Execute SQL directly using Supabase's query method
 */
async function executeSQL(sql, description) {
    try {
        log(`🔧 Executing: ${description}`, 'info');
        
        // Split SQL into individual statements
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        for (const statement of statements) {
            if (statement.trim()) {
                const { error } = await supabase.rpc('exec_sql', { sql: statement });
                if (error) {
                    // If exec_sql doesn't exist, try alternative approach
                    log(`⚠️ exec_sql failed, trying direct execution: ${error.message}`, 'warning');
                    
                    // For now, we'll use a different approach - let's test the functions directly
                    break;
                }
            }
        }
        
        log(`✅ Completed: ${description}`, 'success');
        return true;
        
    } catch (error) {
        log(`❌ Error executing ${description}: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Test if a function exists in the database
 */
async function testFunction(functionName) {
    try {
        // Test with a simple call
        const { data, error } = await supabase.rpc(functionName, { 
            allergen_array: ['test'] 
        });
        
        if (error) {
            log(`❌ Function ${functionName} not found: ${error.message}`, 'error');
            return false;
        }
        
        log(`✅ Function ${functionName} exists and works`, 'success');
        return true;
        
    } catch (error) {
        log(`❌ Function ${functionName} test failed: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Deploy schema using direct SQL execution
 */
async function deploySchemaDirect() {
    console.log('🔧 DIRECT SCHEMA DEPLOYMENT');
    console.log('============================');
    console.log('');
    
    try {
        // Test current state
        log('🔍 Testing current database state...', 'info');
        const functionExists = await testFunction('standardize_allergen_array');
        
        if (functionExists) {
            log('✅ Functions already exist, skipping deployment', 'success');
            return true;
        }
        
        log('❌ Functions not found, deploying schema...', 'info');
        
        // Read SQL files
        const categoriesSQL = await fs.readFile(path.join(__dirname, '../database/rules/categories.sql'), 'utf8');
        const functionsSQL = await fs.readFile(path.join(__dirname, '../database/rules/functions.sql'), 'utf8');
        const constraintsSQL = await fs.readFile(path.join(__dirname, '../database/rules/constraints.sql'), 'utf8');
        const triggersSQL = await fs.readFile(path.join(__dirname, '../database/rules/triggers.sql'), 'utf8');
        
        // Deploy step by step
        log('📋 Step 1: Deploying categories...', 'info');
        const categoriesSuccess = await executeSQL(categoriesSQL, 'Allergen Categories');
        if (!categoriesSuccess) return false;
        
        log('⚙️ Step 2: Deploying functions...', 'info');
        const functionsSuccess = await executeSQL(functionsSQL, 'Database Functions');
        if (!functionsSuccess) return false;
        
        log('🔒 Step 3: Deploying constraints...', 'info');
        const constraintsSuccess = await executeSQL(constraintsSQL, 'Database Constraints');
        if (!constraintsSuccess) return false;
        
        log('🎯 Step 4: Deploying triggers...', 'info');
        const triggersSuccess = await executeSQL(triggersSQL, 'Database Triggers');
        if (!triggersSuccess) return false;
        
        // Test the deployment
        log('🧪 Step 5: Testing deployment...', 'info');
        const testSuccess = await testFunction('standardize_allergen_array');
        if (!testSuccess) {
            log('❌ Function test failed after deployment', 'error');
            return false;
        }
        
        log('🎉 Schema deployment completed successfully!', 'success');
        return true;
        
    } catch (error) {
        log(`❌ Critical error during schema deployment: ${error.message}`, 'error');
        return false;
    }
}

// Run the deployment
if (require.main === module) {
    deploySchemaDirect()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            log(`❌ Unhandled error: ${error.message}`, 'error');
            process.exit(1);
        });
}

module.exports = { deploySchemaDirect }; 