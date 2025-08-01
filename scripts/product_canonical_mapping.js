/**
 * Product Canonical Mapping - Phase 1
 * Processes all 243K+ products to create clean canonical mappings
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Features:
 * - Background processing for hours-long execution
 * - Resume capability from interruptions
 * - Progress tracking with ETA
 * - Universal camelCase implementation
 * - Duplicate prevention
 * - Memory management for large datasets
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration
const BATCH_SIZE = 1000;
const CHECKPOINT_INTERVAL = 1000;
const LOG_INTERVAL = 100;
const MAX_PRODUCT_NAME_LENGTH = 255; // Database limit

// State tracking
let processedCount = 0;
let totalCount = 0;
let startTime = Date.now();
let isShuttingDown = false;

// Descriptors to remove from product names
const DESCRIPTORS = [
    'zero sugar', 'diet', 'light', 'reduced fat', 'low fat', 'fat free',
    'all purpose', 'whole wheat', 'organic', 'natural', 'extra virgin',
    'fresh', 'frozen', 'canned', 'dried', 'raw', 'cooked', 'premium',
    'select', 'choice', 'grade a', 'grade b', 'no sugar added',
    'sugar free', 'unsweetened', 'original', 'classic', 'traditional',
    'new', 'improved', 'enhanced', 'fortified', 'enriched', 'vitamin',
    'mineral', 'antioxidant', 'probiotic', 'prebiotic', 'gluten free',
    'dairy free', 'vegan', 'vegetarian', 'kosher', 'halal', 'non gmo',
    'gmo free', 'pesticide free', 'hormone free', 'antibiotic free'
];

/**
 * Universal camelCase conversion for ALL multi-word variables
 */
function toCamelCase(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
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
}

/**
 * Clean product name by removing descriptors and converting to camelCase
 */
function cleanProductName(productName) {
    if (!productName) return '';
    
    let cleaned = productName.toLowerCase();
    
    // Remove descriptors
    DESCRIPTORS.forEach(descriptor => {
        const regex = new RegExp(`\\b${descriptor}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    
    // Clean up extra spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Convert to camelCase if multi-word
    if (cleaned.includes(' ')) {
        cleaned = toCamelCase(cleaned);
    }
    
    // Truncate if too long
    if (cleaned.length > MAX_PRODUCT_NAME_LENGTH) {
        cleaned = cleaned.substring(0, MAX_PRODUCT_NAME_LENGTH);
    }
    
    return cleaned;
}

/**
 * Check if database tables exist
 */
async function checkDatabaseTables() {
    try {
        console.log('🔍 Checking if database tables exist...');
        
        // Check ProductCanonical table
        const { data: productTest, error: productError } = await supabase
            .from('ProductCanonical')
            .select('id')
            .limit(1);
        
        if (productError) {
            console.error('❌ ProductCanonical table does not exist or is not accessible');
            console.error('Error:', productError.message);
            console.error('\nPlease run the SQL migration first:');
            console.error('psql -d your_database -f database/migrations/create_simple_mapping_tables.sql');
            return false;
        }
        
        console.log('✅ ProductCanonical table exists');
        
        // Check IngredientCanonical table
        const { data: ingredientTest, error: ingredientError } = await supabase
            .from('IngredientCanonical')
            .select('id')
            .limit(1);
        
        if (ingredientError) {
            console.error('❌ IngredientCanonical table does not exist or is not accessible');
            console.error('Error:', ingredientError.message);
            return false;
        }
        
        console.log('✅ IngredientCanonical table exists');
        return true;
        
    } catch (error) {
        console.error('❌ Error checking database tables:', error);
        return false;
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
        console.error('❌ Error getting total count:', error);
        return 0;
    }
}

/**
 * Get last checkpoint for resume capability
 */
async function getLastCheckpoint() {
    try {
        const checkpointFile = path.join(__dirname, 'logs', 'product_mapping_checkpoint.json');
        
        if (fs.existsSync(checkpointFile)) {
            const data = JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
            return data.lastProcessedId || 0;
        }
        
        return 0;
    } catch (error) {
        console.log('⚠️ No checkpoint found, starting from beginning');
        return 0;
    }
}

/**
 * Save checkpoint for resume capability
 */
async function saveCheckpoint(lastProcessedId) {
    try {
        const logsDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        const checkpointFile = path.join(logsDir, 'product_mapping_checkpoint.json');
        const checkpoint = {
            lastProcessedId,
            timestamp: new Date().toISOString(),
            processedCount,
            totalCount
        };
        
        fs.writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2));
    } catch (error) {
        console.error('⚠️ Error saving checkpoint:', error);
    }
}

/**
 * Check if product already processed
 */
async function isProductProcessed(productId) {
    try {
        const { data, error } = await supabase
            .from('ProductCanonical')
            .select('product_ids')
            .contains('product_ids', [productId])
            .limit(1);
        
        if (error) throw error;
        return data && data.length > 0;
    } catch (error) {
        console.error('⚠️ Error checking if product processed:', error);
        return false;
    }
}

/**
 * Process a batch of products
 */
async function processProductBatch(offset, batchSize) {
    try {
        // Get batch of products
        const { data: products, error } = await supabase
            .from('IngredientCategorized')
            .select('id, description, allergens')
            .range(offset, offset + batchSize - 1)
            .order('id');
        
        if (error) throw error;
        if (!products || products.length === 0) return 0;
        
        // Group products by canonical name
        const canonicalGroups = {};
        
        for (const product of products) {
            // Skip if already processed
            if (await isProductProcessed(product.id)) {
                console.log(`⏭️ Skipping already processed product: ${product.id}`);
                continue;
            }
            
            const cleanedName = cleanProductName(product.description);
            
            if (!cleanedName) {
                console.log(`⚠️ Skipping product with empty cleaned name: ${product.id}`);
                continue;
            }
            
            if (!canonicalGroups[cleanedName]) {
                canonicalGroups[cleanedName] = {
                    original_product_name: product.description,
                    canonical_product_name: cleanedName,
                    product_ids: []
                };
            }
            
            canonicalGroups[cleanedName].product_ids.push(product.id);
        }
        
        // Insert canonical mappings
        for (const [canonicalName, mapping] of Object.entries(canonicalGroups)) {
            try {
                const { error: insertError } = await supabase
                    .from('ProductCanonical')
                    .upsert({
                        original_product_name: mapping.original_product_name,
                        canonical_product_name: mapping.canonical_product_name,
                        product_ids: mapping.product_ids
                    }, {
                        onConflict: 'canonical_product_name',
                        ignoreDuplicates: false
                    });
                
                if (insertError) {
                    // If it's a unique constraint violation, try to update existing record
                    if (insertError.code === '23505') { // Unique violation
                        console.log(`🔄 Updating existing canonical mapping for "${canonicalName}"`);
                        
                        const { error: updateError } = await supabase
                            .from('ProductCanonical')
                            .update({
                                product_ids: mapping.product_ids
                            })
                            .eq('canonical_product_name', canonicalName);
                        
                        if (updateError) {
                            console.error(`❌ Error updating canonical mapping for "${canonicalName}":`, updateError);
                        } else {
                            console.log(`✅ Updated existing mapping for "${canonicalName}" (${mapping.product_ids.length} products)`);
                        }
                    } else {
                        console.error(`❌ Error inserting canonical mapping for "${canonicalName}":`, insertError);
                    }
                } else {
                    console.log(`✅ Processed "${mapping.original_product_name}" → "${canonicalName}" (${mapping.product_ids.length} products)`);
                }
            } catch (error) {
                console.error(`❌ Error processing canonical mapping for "${canonicalName}":`, error);
            }
        }
        
        return products.length;
        
    } catch (error) {
        console.error('❌ Error processing product batch:', error);
        return 0;
    }
}

/**
 * Track progress with ETA
 */
function trackProgress(current, total) {
    const elapsed = Date.now() - startTime;
    const rate = current / (elapsed / 1000); // records per second
    const remaining = (total - current) / rate; // seconds remaining
    const eta = new Date(Date.now() + remaining * 1000);
    
    const progressPercent = ((current / total) * 100).toFixed(2);
    const elapsedHours = Math.floor(elapsed / 3600000);
    const elapsedMinutes = Math.floor((elapsed % 3600000) / 60000);
    const remainingHours = Math.floor(remaining / 3600);
    const remainingMinutes = Math.floor((remaining % 3600) / 60);
    
    console.log(`📊 Progress: ${current}/${total} (${progressPercent}%)`);
    console.log(`⏱️ Rate: ${rate.toFixed(1)} records/sec`);
    console.log(`⏰ Elapsed: ${elapsedHours}h ${elapsedMinutes}m`);
    console.log(`🕐 ETA: ${eta.toLocaleString()}`);
    console.log(`⏳ Remaining: ${remainingHours}h ${remainingMinutes}m`);
    console.log('---');
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown() {
    const gracefulShutdown = async () => {
        console.log('\n🛑 Shutdown signal received. Finishing current batch...');
        isShuttingDown = true;
        
        // Save final checkpoint
        await saveCheckpoint(processedCount);
        
        console.log('✅ Shutdown complete. Safe to restart.');
        process.exit(0);
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
}

/**
 * Main processing function
 */
async function runProductCanonicalMapping() {
    console.log('🚀 Starting Product Canonical Mapping - Phase 1');
    console.log('===============================================\n');
    
    // Setup graceful shutdown
    setupGracefulShutdown();
    
    try {
        // Check if database tables exist
        const tablesExist = await checkDatabaseTables();
        if (!tablesExist) {
            console.error('\n❌ Database tables not found. Please run the SQL migration first.');
            process.exit(1);
        }
        
        // Get total count
        totalCount = await getTotalProductCount();
        console.log(`📊 Total products to process: ${totalCount.toLocaleString()}`);
        
        // Get last checkpoint for resume
        const lastProcessedId = await getLastCheckpoint();
        if (lastProcessedId > 0) {
            console.log(`📂 Resuming from checkpoint: ${lastProcessedId.toLocaleString()}`);
            processedCount = lastProcessedId;
        }
        
        console.log(`🔄 Processing in batches of ${BATCH_SIZE}...\n`);
        
        // Process all products
        for (let offset = processedCount; offset < totalCount; offset += BATCH_SIZE) {
            if (isShuttingDown) break;
            
            const batchStart = Date.now();
            const processedInBatch = await processProductBatch(offset, BATCH_SIZE);
            
            processedCount += processedInBatch;
            
            // Track progress
            if (processedCount % LOG_INTERVAL === 0 || processedCount === totalCount) {
                trackProgress(processedCount, totalCount);
            }
            
            // Save checkpoint
            if (processedCount % CHECKPOINT_INTERVAL === 0) {
                await saveCheckpoint(processedCount);
            }
            
            // Add small delay to avoid overwhelming database
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('\n🎉 Product Canonical Mapping Complete!');
        console.log('=====================================');
        console.log(`✅ Processed ${processedCount.toLocaleString()} products`);
        console.log(`⏱️ Total time: ${Math.floor((Date.now() - startTime) / 1000)} seconds`);
        
        // Generate summary
        const { data: canonicalCount, error } = await supabase
            .from('ProductCanonical')
            .select('*', { count: 'exact', head: true });
        
        if (!error) {
            console.log(`📊 Created ${canonicalCount} canonical product mappings`);
        }
        
    } catch (error) {
        console.error('\n❌ Product Canonical Mapping Failed');
        console.error('===================================');
        console.error('Error:', error);
        
        // Save checkpoint on error
        await saveCheckpoint(processedCount);
        
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runProductCanonicalMapping().catch(error => {
        console.error('❌ Script crashed:', error);
        process.exit(1);
    });
}

module.exports = {
    cleanProductName,
    toCamelCase,
    runProductCanonicalMapping
}; 