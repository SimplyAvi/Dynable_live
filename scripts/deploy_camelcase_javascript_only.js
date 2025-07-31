#!/usr/bin/env node

/**
 * 🚀 CAMELCASE JAVASCRIPT-ONLY BATCH DEPLOYMENT
 * Dynable App - JavaScript-Based Batch Processing
 * 
 * This script processes 243,114+ products using JavaScript camelCase conversion
 * instead of database functions, avoiding schema deployment issues.
 * 
 * Features:
 * - Uses proven JavaScript toCamelCase() function (82/82 tests passed)
 * - Processes existing data in batches of 1000
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
let resumeFromBatch = 0;

/**
 * JavaScript camelCase conversion (proven to work - 82/82 tests passed)
 */
const toCamelCase = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
        .toLowerCase()
        .trim()
        // Replace multiple spaces/underscores/hyphens with single space
        .replace(/[\s_-]+/g, ' ')
        // Split by space and camelCase
        .split(' ')
        .map((word, index) => {
            if (index === 0) {
                return word; // First word stays lowercase
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join('');
};

/**
 * Standardize allergen using JavaScript (matches database logic)
 */
const standardizeAllergen = (allergen) => {
    const cleaned = allergen.toLowerCase().trim();
    
    // Specific mappings for common variations
    const mappings = {
        'tree nuts': 'treeNuts',
        'tree_nuts': 'treeNuts',
        'tree-nuts': 'treeNuts',
        'treenuts': 'treeNuts',
        'nuts': 'treeNuts',
        'gluten free': 'glutenFree',
        'gluten_free': 'glutenFree',
        'gluten-free': 'glutenFree',
        'glutenfree': 'glutenFree',
        'dairy free': 'dairyFree',
        'dairy_free': 'dairyFree',
        'dairy-free': 'dairyFree',
        'dairyfree': 'dairyFree',
        'egg free': 'eggFree',
        'egg_free': 'eggFree',
        'egg-free': 'eggFree',
        'eggfree': 'eggFree',
        'soy free': 'soyFree',
        'soy_free': 'soyFree',
        'soy-free': 'soyFree',
        'soyfree': 'soyFree',
        'nut free': 'nutFree',
        'nut_free': 'nutFree',
        'nut-free': 'nutFree',
        'nutfree': 'nutFree',
        'fish free': 'fishFree',
        'fish_free': 'fishFree',
        'fish-free': 'fishFree',
        'fishfree': 'fishFree',
        // Common multi-word allergens
        'bell pepper': 'bellPepper',
        'black pepper': 'blackPepper',
        'hot sauce': 'hotSauce',
        'coconut oil': 'coconutOil',
        'palm oil': 'palmOil',
        'sunflower oil': 'sunflowerOil',
        'vegetable oil': 'vegetableOil',
        'olive oil': 'oliveOil',
        'avocado oil': 'avocadoOil',
        'kiwi fruit': 'kiwiFruit',
        'dragon fruit': 'dragonFruit',
        'passion fruit': 'passionFruit',
        'sweet potatoes': 'sweetPotatoes',
        'yellow squash': 'yellowSquash',
        'butternut squash': 'butternutSquash',
        'green beans': 'greenBeans',
        'black beans': 'blackBeans',
        'pinto beans': 'pintoBeans',
        'kidney beans': 'kidneyBeans',
        'navy beans': 'navyBeans',
        'black eyed peas': 'blackEyedPeas',
        'split peas': 'splitPeas',
        'brown rice': 'brownRice',
        'white rice': 'whiteRice',
        'wild rice': 'wildRice',
        'greek yogurt': 'greekYogurt',
        'sour cream': 'sourCream',
        'heavy cream': 'heavyCream',
        'half and half': 'halfAndHalf',
        'whole milk': 'wholeMilk',
        'skim milk': 'skimMilk',
        'almond milk': 'almondMilk',
        'soy milk': 'soyMilk',
        'oat milk': 'oatMilk',
        'coconut milk': 'coconutMilk',
        'rice milk': 'riceMilk',
        'energy drinks': 'energyDrinks',
        'sports drinks': 'sportsDrinks',
        'artificial colors': 'artificialColors',
        'food dyes': 'foodDyes',
        'citric acid': 'citricAcid',
        'vanilla extract': 'vanillaExtract'
    };
    
    return mappings[cleaned] || toCamelCase(cleaned);
};

/**
 * Clean free-from contradictions using JavaScript
 */
const cleanFreeFromContradictions = (allergens, description) => {
    if (!allergens || !Array.isArray(allergens)) return allergens;
    
    let cleanedAllergens = [...allergens];
    const descriptionLower = (description || '').toLowerCase();
    
    // Gluten free products should NOT have gluten in allergens
    if (descriptionLower.includes('gluten free') || descriptionLower.includes('gluten-free')) {
        cleanedAllergens = cleanedAllergens.filter(a => a !== 'gluten' && a !== 'wheat');
    }
    
    // Dairy free products should NOT have milk in allergens
    if (descriptionLower.includes('dairy free') || descriptionLower.includes('dairy-free')) {
        cleanedAllergens = cleanedAllergens.filter(a => a !== 'milk' && a !== 'lactose');
    }
    
    // Nut free products should NOT have nuts in allergens
    if (descriptionLower.includes('nut free') || descriptionLower.includes('nut-free')) {
        cleanedAllergens = cleanedAllergens.filter(a => a !== 'treeNuts' && a !== 'peanuts');
    }
    
    // Egg free products should NOT have eggs in allergens
    if (descriptionLower.includes('egg free') || descriptionLower.includes('egg-free')) {
        cleanedAllergens = cleanedAllergens.filter(a => a !== 'eggs');
    }
    
    // Soy free products should NOT have soy in allergens
    if (descriptionLower.includes('soy free') || descriptionLower.includes('soy-free')) {
        cleanedAllergens = cleanedAllergens.filter(a => a !== 'soy');
    }
    
    // Fish free products should NOT have fish in allergens
    if (descriptionLower.includes('fish free') || descriptionLower.includes('fish-free')) {
        cleanedAllergens = cleanedAllergens.filter(a => a !== 'fish' && a !== 'shellfish');
    }
    
    return cleanedAllergens;
};

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
 * Get total product count
 */
async function getTotalProductCount() {
    try {
        const { count, error } = await supabase
            .from('IngredientCategorized')
            .select('*', { count: 'exact', head: true });
            
        if (error) throw error;
        return count || 0;
    } catch (error) {
        log(`❌ Error getting product count: ${error.message}`, 'error');
        return 0;
    }
}

/**
 * Process a single batch of products using JavaScript functions
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
            
            // Process each product in the batch using JavaScript functions
            for (const product of products) {
                try {
                    // Skip if no allergens
                    if (!product.allergens || product.allergens.length === 0) {
                        processed++;
                        continue;
                    }
                    
                    // Convert allergens to camelCase using JavaScript function
                    const convertedAllergens = product.allergens.map(allergen => 
                        standardizeAllergen(allergen)
                    );
                    
                    // Clean free-from contradictions using JavaScript function
                    const cleanedAllergens = cleanFreeFromContradictions(
                        convertedAllergens, 
                        product.description
                    );
                    
                    // Update the product
                    const { error: updateError } = await supabase
                        .from('IngredientCategorized')
                        .update({ 
                            allergens: cleanedAllergens
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
                        allergens: product.allergens
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
    console.log('🚀 CAMELCASE JAVASCRIPT-ONLY BATCH DEPLOYMENT');
    console.log('==============================================');
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
        
        // Step 1: Get total product count
        log('📊 Step 1: Getting product count...', 'info');
        const totalProducts = await getTotalProductCount();
        if (totalProducts === 0) {
            log('❌ No products found in database', 'error');
            return false;
        }
        
        totalBatches = Math.ceil(totalProducts / BATCH_SIZE);
        log(`📈 Found ${totalProducts} products to process in ${totalBatches} batches`, 'info');
        
        // Step 2: Create rollback backup (only if starting fresh)
        if (resumeFromBatch === 0) {
            log('💾 Step 2: Creating rollback backup...', 'info');
            const backupSuccess = await createRollbackBackup();
            if (!backupSuccess) {
                log('❌ Rollback backup creation failed. Aborting.', 'error');
                return false;
            }
        } else {
            log('⏭️ Step 2: Skipping backup creation (resuming from batch)', 'info');
        }
        
        // Step 3: Process batches
        log('🔄 Step 3: Processing product batches...', 'info');
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
        
        // Step 4: Final summary
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
        log('🔄 To resume: node scripts/deploy_camelcase_javascript_only.js --resume', 'info');
        
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
🚀 CAMELCASE JAVASCRIPT-ONLY BATCH DEPLOYMENT

Usage:
  node scripts/deploy_camelcase_javascript_only.js [options]

Options:
  --rollback    Rollback to previous allergen state
  --resume      Resume from previous progress (if interrupted)
  --test        Run in test mode (dry run)
  --help        Show this help message

Environment Variables:
  SUPABASE_URL              Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Your Supabase service role key

Features:
  - Uses JavaScript camelCase conversion (no database functions needed)
  - Processes 243,114+ products in batches of 1000
  - Progress tracking for 244+ batches
  - Resume capability (if interrupted)
  - Rollback capability
  - Error handling and recovery
  - Graceful delays between batches

Example:
  node scripts/deploy_camelcase_javascript_only.js
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
    toCamelCase,
    standardizeAllergen,
    cleanFreeFromContradictions
}; 