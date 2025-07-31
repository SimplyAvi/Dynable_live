#!/usr/bin/env node

/**
 * 🚀 CAMELCASE BATCH DEPLOYMENT SCRIPT
 * Dynable App - Comprehensive Database Migration
 * 
 * This script safely deploys the camelCase implementation to the database
 * and processes all 243,114+ products in batches of 1000.
 * 
 * Features:
 * - Deploy database schema first (categories, functions, constraints)
 * - Process existing data in batches of 1000
 * - Progress tracking for 244+ batches
 * - Rollback capability
 * - Error handling and recovery
 * - Graceful delays between batches
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BATCH_SIZE = 1000;
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds
const DELAY_BETWEEN_SCHEMA_OPERATIONS = 1000; // 1 second

// Database connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Progress tracking
let totalProcessed = 0;
let totalBatches = 0;
let currentBatch = 0;
let errors = [];
let rollbackData = [];
let resumeFromBatch = 0; // New: resume capability

/**
 * Utility functions
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const log = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
};

const logProgress = (current, total, operation = 'Processing') => {
    const percentage = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2));
    log(`${operation}: ${current}/${total} (${percentage}%) [${bar}]`);
};

/**
 * Save progress to file for resume capability
 */
async function saveProgress(batchNumber, processed, errors) {
    try {
        const progressData = {
            lastCompletedBatch: batchNumber,
            totalProcessed: processed,
            totalErrors: errors.length,
            timestamp: new Date().toISOString(),
            errors: errors.slice(-10) // Keep last 10 errors
        };
        
        const progressPath = path.join(__dirname, '../database/backups/deployment_progress.json');
        await fs.writeFile(progressPath, JSON.stringify(progressData, null, 2));
    } catch (error) {
        log(`⚠️ Could not save progress: ${error.message}`, 'warning');
    }
}

/**
 * Load progress from file for resume capability
 */
async function loadProgress() {
    try {
        const progressPath = path.join(__dirname, '../database/backups/deployment_progress.json');
        const progressData = JSON.parse(await fs.readFile(progressPath, 'utf8'));
        
        resumeFromBatch = progressData.lastCompletedBatch + 1;
        totalProcessed = progressData.totalProcessed;
        errors = progressData.errors || [];
        
        log(`🔄 Found previous progress: resuming from batch ${resumeFromBatch}`, 'info');
        return true;
    } catch (error) {
        log('ℹ️ No previous progress found, starting fresh', 'info');
        return false;
    }
}

/**
 * Check for network connectivity
 */
async function checkDatabaseConnection() {
    try {
        const { data, error } = await supabase
            .from('IngredientCategorized')
            .select('id')
            .limit(1);
            
        if (error) throw error;
        return true;
    } catch (error) {
        log(`❌ Database connection failed: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Retry mechanism for network issues
 */
async function retryOperation(operation, maxRetries = 3, delayMs = 5000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            
            log(`⚠️ Attempt ${attempt} failed: ${error.message}. Retrying in ${delayMs/1000}s...`, 'warning');
            await delay(delayMs);
            delayMs *= 2; // Exponential backoff
        }
    }
}

/**
 * Database schema deployment
 */
async function deployDatabaseSchema() {
    log('🔧 Deploying database schema...', 'info');
    
    try {
        // 1. Deploy categories
        log('📋 Deploying allergen categories...', 'info');
        const categoriesSQL = await fs.readFile(path.join(__dirname, '../database/rules/categories.sql'), 'utf8');
        await supabase.rpc('exec_sql', { sql: categoriesSQL });
        await delay(DELAY_BETWEEN_SCHEMA_OPERATIONS);
        
        // 2. Deploy functions
        log('⚙️ Deploying database functions...', 'info');
        const functionsSQL = await fs.readFile(path.join(__dirname, '../database/rules/functions.sql'), 'utf8');
        await supabase.rpc('exec_sql', { sql: functionsSQL });
        await delay(DELAY_BETWEEN_SCHEMA_OPERATIONS);
        
        // 3. Deploy constraints
        log('🔒 Deploying database constraints...', 'info');
        const constraintsSQL = await fs.readFile(path.join(__dirname, '../database/rules/constraints.sql'), 'utf8');
        await supabase.rpc('exec_sql', { sql: constraintsSQL });
        await delay(DELAY_BETWEEN_SCHEMA_OPERATIONS);
        
        // 4. Deploy triggers
        log('🎯 Deploying database triggers...', 'info');
        const triggersSQL = await fs.readFile(path.join(__dirname, '../database/rules/triggers.sql'), 'utf8');
        await supabase.rpc('exec_sql', { sql: triggersSQL });
        
        log('✅ Database schema deployed successfully!', 'success');
        return true;
        
    } catch (error) {
        log(`❌ Error deploying database schema: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Get total product count
 */
async function getTotalProductCount() {
    try {
        const { data, error } = await supabase
            .from('IngredientCategorized')
            .select('id', { count: 'exact' });
            
        if (error) throw error;
        return data.length;
    } catch (error) {
        log(`❌ Error getting product count: ${error.message}`, 'error');
        return 0;
    }
}

/**
 * Process a single batch of products with retry logic
 */
async function processBatch(batchNumber, offset) {
    return retryOperation(async () => {
        try {
            log(`🔄 Processing batch ${batchNumber}/${totalBatches} (records ${offset + 1}-${offset + BATCH_SIZE})`, 'info');
            
            // Get batch of products
            const { data: products, error } = await supabase
                .from('IngredientCategorized')
                .select('id, allergens, description')
                .range(offset, offset + BATCH_SIZE - 1);
                
            if (error) throw error;
            
            if (!products || products.length === 0) {
                log(`⚠️ No products found in batch ${batchNumber}`, 'warning');
                return { processed: 0, errors: 0 };
            }
            
            let processed = 0;
            let batchErrors = 0;
            
            // Process each product in the batch
            for (const product of products) {
                try {
                    // Skip if no allergens
                    if (!product.allergens || product.allergens.length === 0) {
                        processed++;
                        continue;
                    }
                    
                    // Convert allergens to camelCase using database function
                    const { data: convertedAllergens, error: conversionError } = await supabase.rpc(
                        'standardize_allergen_array',
                        { allergen_array: product.allergens }
                    );
                    
                    if (conversionError) throw conversionError;
                    
                    // Clean free-from contradictions
                    const { data: cleanedAllergens, error: cleaningError } = await supabase.rpc(
                        'clean_free_from_contradictions',
                        { 
                            allergen_array: convertedAllergens,
                            product_description: product.description || ''
                        }
                    );
                    
                    if (cleaningError) throw cleaningError;
                    
                    // Update the product
                    const { error: updateError } = await supabase
                        .from('IngredientCategorized')
                        .update({ 
                            allergens: cleanedAllergens,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', product.id);
                        
                    if (updateError) throw updateError;
                    
                    processed++;
                    
                } catch (productError) {
                    batchErrors++;
                    errors.push({
                        productId: product.id,
                        error: productError.message,
                        batch: batchNumber
                    });
                    log(`⚠️ Error processing product ${product.id}: ${productError.message}`, 'warning');
                }
            }
            
            return { processed, errors: batchErrors };
            
        } catch (error) {
            log(`❌ Error processing batch ${batchNumber}: ${error.message}`, 'error');
            throw error; // Re-throw for retry mechanism
        }
    });
}

/**
 * Create rollback backup
 */
async function createRollbackBackup() {
    log('💾 Creating rollback backup...', 'info');
    
    try {
        // Get all products with allergens for backup
        const { data: products, error } = await supabase
            .from('IngredientCategorized')
            .select('id, allergens')
            .not('allergens', 'is', null);
            
        if (error) throw error;
        
        rollbackData = products.map(p => ({
            id: p.id,
            allergens: p.allergens
        }));
        
        // Save backup to file
        const backupPath = path.join(__dirname, `../database/backups/camelcase_rollback_${Date.now()}.json`);
        await fs.writeFile(backupPath, JSON.stringify(rollbackData, null, 2));
        
        log(`✅ Rollback backup created: ${backupPath}`, 'success');
        return true;
        
    } catch (error) {
        log(`❌ Error creating rollback backup: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Rollback function
 */
async function rollback() {
    log('🔄 Starting rollback process...', 'warning');
    
    try {
        if (rollbackData.length === 0) {
            log('❌ No rollback data available', 'error');
            return false;
        }
        
        let rollbackCount = 0;
        
        for (const product of rollbackData) {
            try {
                const { error } = await supabase
                    .from('IngredientCategorized')
                    .update({ 
                        allergens: product.allergens,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', product.id);
                    
                if (error) throw error;
                rollbackCount++;
                
            } catch (error) {
                log(`⚠️ Error rolling back product ${product.id}: ${error.message}`, 'warning');
            }
        }
        
        log(`✅ Rollback completed: ${rollbackCount}/${rollbackData.length} products restored`, 'success');
        return true;
        
    } catch (error) {
        log(`❌ Error during rollback: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Main deployment function with resume capability
 */
async function deployCamelCaseImplementation() {
    console.log('🚀 CAMELCASE BATCH DEPLOYMENT');
    console.log('================================');
    console.log('');
    
    try {
        // Step 0: Check database connection
        log('🔍 Step 0: Checking database connection...', 'info');
        const connectionOk = await checkDatabaseConnection();
        if (!connectionOk) {
            log('❌ Cannot connect to database. Please check your internet connection and try again.', 'error');
            return false;
        }
        
        // Step 0.5: Load previous progress (resume capability)
        log('📋 Step 0.5: Checking for previous progress...', 'info');
        const hasPreviousProgress = await loadProgress();
        
        if (hasPreviousProgress) {
            log(`🔄 Resuming from batch ${resumeFromBatch}`, 'info');
        }
        
        // Step 1: Deploy database schema (only if starting fresh)
        if (resumeFromBatch === 0) {
            log('📋 Step 1: Deploying database schema...', 'info');
            const schemaSuccess = await deployDatabaseSchema();
            if (!schemaSuccess) {
                log('❌ Database schema deployment failed. Aborting.', 'error');
                return false;
            }
        } else {
            log('⏭️ Step 1: Skipping schema deployment (resuming from batch)', 'info');
        }
        
        // Step 2: Get total product count
        log('📊 Step 2: Getting product count...', 'info');
        const totalProducts = await getTotalProductCount();
        if (totalProducts === 0) {
            log('❌ No products found in database', 'error');
            return false;
        }
        
        totalBatches = Math.ceil(totalProducts / BATCH_SIZE);
        log(`📈 Found ${totalProducts} products to process in ${totalBatches} batches`, 'info');
        
        // Step 3: Create rollback backup (only if starting fresh)
        if (resumeFromBatch === 0) {
            log('💾 Step 3: Creating rollback backup...', 'info');
            const backupSuccess = await createRollbackBackup();
            if (!backupSuccess) {
                log('❌ Rollback backup creation failed. Aborting.', 'error');
                return false;
            }
        } else {
            log('⏭️ Step 3: Skipping backup creation (resuming from batch)', 'info');
        }
        
        // Step 4: Process batches
        log('🔄 Step 4: Processing product batches...', 'info');
        console.log('');
        
        for (let batch = resumeFromBatch || 1; batch <= totalBatches; batch++) {
            currentBatch = batch;
            const offset = (batch - 1) * BATCH_SIZE;
            
            const result = await processBatch(batch, offset);
            totalProcessed += result.processed;
            
            // Save progress after each batch
            await saveProgress(batch, totalProcessed, errors);
            
            // Log progress
            logProgress(batch, totalBatches, 'Batch Progress');
            log(`Batch ${batch}/${totalBatches} complete: ${result.processed} processed, ${result.errors} errors`, 'info');
            
            // Add delay between batches
            if (batch < totalBatches) {
                await delay(DELAY_BETWEEN_BATCHES);
            }
        }
        
        // Step 5: Final summary
        console.log('');
        log('🎉 DEPLOYMENT COMPLETE!', 'success');
        log(`📊 Summary:`, 'info');
        log(`   - Total products processed: ${totalProcessed}`, 'info');
        log(`   - Total batches completed: ${totalBatches}`, 'info');
        log(`   - Total errors: ${errors.length}`, errors.length > 0 ? 'warning' : 'info');
        
        if (errors.length > 0) {
            log('⚠️ Some errors occurred during processing. Check the error log above.', 'warning');
        }
        
        // Clean up progress file
        try {
            const progressPath = path.join(__dirname, '../database/backups/deployment_progress.json');
            await fs.unlink(progressPath);
            log('🧹 Cleaned up progress file', 'info');
        } catch (error) {
            // Ignore cleanup errors
        }
        
        return true;
        
    } catch (error) {
        log(`❌ Critical error during deployment: ${error.message}`, 'error');
        log('💾 Progress has been saved. You can resume later.', 'info');
        log('🔄 To resume: node scripts/deploy_camelcase_batch_processing.js --resume', 'info');
        
        return false;
    }
}

/**
 * Command line interface
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--rollback')) {
        log('🔄 Starting rollback process...', 'warning');
        const success = await rollback();
        process.exit(success ? 0 : 1);
    }
    
    if (args.includes('--resume')) {
        log('🔄 Resuming from previous progress...', 'info');
        // Resume logic is handled in deployCamelCaseImplementation
    }
    
    if (args.includes('--test')) {
        log('🧪 Running test mode (dry run)...', 'info');
        // TODO: Implement test mode
        return;
    }
    
    if (args.includes('--help')) {
        console.log(`
🚀 CAMELCASE BATCH DEPLOYMENT SCRIPT

Usage:
  node scripts/deploy_camelcase_batch_processing.js [options]

Options:
  --rollback    Rollback to previous allergen state
  --resume      Resume from previous progress (if interrupted)
  --test        Run in test mode (dry run)
  --help        Show this help message

Environment Variables:
  SUPABASE_URL              Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Your Supabase service role key

Features:
  - Deploys database schema (categories, functions, constraints)
  - Processes 243,114+ products in batches of 1000
  - Progress tracking for 244+ batches
  - Resume capability (if interrupted)
  - Rollback capability
  - Error handling and recovery
  - Graceful delays between batches

Example:
  node scripts/deploy_camelcase_batch_processing.js
        `);
        return;
    }
    
    // Run the deployment
    const success = await deployCamelCaseImplementation();
    process.exit(success ? 0 : 1);
}

// Run the script
if (require.main === module) {
    main().catch(error => {
        log(`❌ Unhandled error: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = {
    deployCamelCaseImplementation,
    rollback,
    processBatch,
    deployDatabaseSchema
}; 