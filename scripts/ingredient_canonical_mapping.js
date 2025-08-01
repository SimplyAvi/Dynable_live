/**
 * Ingredient Canonical Mapping - Phase 2
 * Processes recipe ingredients and maps them to products from Phase 1
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Features:
 * - Background processing for hours-long execution
 * - Resume capability from interruptions
 * - Progress tracking with ETA
 * - Universal camelCase implementation
 * - Maps to pre-computed product IDs from Phase 1
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
const BATCH_SIZE = 500; // Smaller batch size for ingredients
const CHECKPOINT_INTERVAL = 500;
const LOG_INTERVAL = 50;

// State tracking
let processedCount = 0;
let totalCount = 0;
let startTime = Date.now();
let isShuttingDown = false;

// Action words to remove from ingredients
const ACTION_WORDS = [
    'diced', 'chopped', 'minced', 'sliced', 'grated', 'shredded',
    'sautéed', 'roasted', 'grilled', 'baked', 'fried', 'steamed',
    'fresh', 'frozen', 'canned', 'dried', 'cooked', 'raw', 'peeled',
    'seeded', 'stemmed', 'trimmed', 'cleaned', 'washed', 'drained',
    'crushed', 'mashed', 'pureed', 'blended', 'whipped', 'beaten',
    'folded', 'kneaded', 'rolled', 'pressed', 'squeezed', 'strained',
    'filtered', 'clarified', 'reduced', 'thickened', 'thinned', 'diluted'
];

// Measurements to remove
const MEASUREMENTS = [
    /\d+\s*(cups?|tbsp|tsp|oz|lbs?|grams?|kg|ml|liters?)/gi,
    /\d+\/\d+/g, // fractions
    /\ba\s+few\b/gi,
    /\ba\s+pinch\b/gi,
    /\bone\b/gi,
    /\btwo\b/gi,
    /\bthree\b/gi,
    /\bfour\b/gi,
    /\bfive\b/gi,
    /\bhalf\b/gi,
    /\bquarter\b/gi,
    /\bthird\b/gi
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
 * Clean ingredient name by removing action words and measurements
 */
function cleanIngredientName(ingredientName) {
    if (!ingredientName) return '';
    
    let cleaned = ingredientName.toLowerCase();
    
    // Remove action words
    ACTION_WORDS.forEach(actionWord => {
        const regex = new RegExp(`\\b${actionWord}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    
    // Remove measurements
    MEASUREMENTS.forEach(measurement => {
        cleaned = cleaned.replace(measurement, '');
    });
    
    // Clean up extra spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Convert to camelCase if multi-word
    if (cleaned.includes(' ')) {
        cleaned = toCamelCase(cleaned);
    }
    
    return cleaned;
}

/**
 * Get total ingredient count
 */
async function getTotalIngredientCount() {
    try {
        const { count, error } = await supabase
            .from('RecipeIngredients')
            .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('❌ Error getting total ingredient count:', error);
        return 0;
    }
}

/**
 * Get last checkpoint for resume capability
 */
async function getLastCheckpoint() {
    try {
        const checkpointFile = path.join(__dirname, 'logs', 'ingredient_mapping_checkpoint.json');
        
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
        
        const checkpointFile = path.join(logsDir, 'ingredient_mapping_checkpoint.json');
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
 * Check if ingredient already processed
 */
async function isIngredientProcessed(ingredientId) {
    try {
        const { data, error } = await supabase
            .from('IngredientCanonical')
            .select('id')
            .eq('id', ingredientId)
            .limit(1);
        
        if (error) throw error;
        return data && data.length > 0;
    } catch (error) {
        console.error('⚠️ Error checking if ingredient processed:', error);
        return false;
    }
}

/**
 * Find matching products for an ingredient
 */
async function findMatchingProducts(canonicalIngredient) {
    try {
        // First try to find exact match in ProductCanonical
        const { data: exactMatches, error: exactError } = await supabase
            .from('ProductCanonical')
            .select('product_ids')
            .eq('canonical_product_name', canonicalIngredient);
        
        if (!exactError && exactMatches && exactMatches.length > 0) {
            return exactMatches[0].product_ids || [];
        }
        
        // If no exact match, try partial match
        const { data: partialMatches, error: partialError } = await supabase
            .from('ProductCanonical')
            .select('product_ids, canonical_product_name')
            .ilike('canonical_product_name', `%${canonicalIngredient}%`)
            .limit(5);
        
        if (!partialError && partialMatches && partialMatches.length > 0) {
            // Combine all matching product IDs
            const allProductIds = [];
            partialMatches.forEach(match => {
                if (match.product_ids) {
                    allProductIds.push(...match.product_ids);
                }
            });
            return [...new Set(allProductIds)]; // Remove duplicates
        }
        
        return [];
        
    } catch (error) {
        console.error(`⚠️ Error finding matching products for "${canonicalIngredient}":`, error);
        return [];
    }
}

/**
 * Find substitute products (simplified version)
 */
async function findSubstituteProducts(canonicalIngredient, originalProductIds) {
    try {
        // For now, return empty array - can be enhanced later
        // This would look for allergen-safe alternatives
        return [];
        
    } catch (error) {
        console.error(`⚠️ Error finding substitute products for "${canonicalIngredient}":`, error);
        return [];
    }
}

/**
 * Process a batch of ingredients
 */
async function processIngredientBatch(offset, batchSize) {
    try {
        // Get batch of ingredients
        const { data: ingredients, error } = await supabase
            .from('RecipeIngredients')
            .select('id, ingredient_name, recipe_id')
            .range(offset, offset + batchSize - 1)
            .order('id');
        
        if (error) throw error;
        if (!ingredients || ingredients.length === 0) return 0;
        
        let processedInBatch = 0;
        
        for (const ingredient of ingredients) {
            // Skip if already processed
            if (await isIngredientProcessed(ingredient.id)) {
                console.log(`⏭️ Skipping already processed ingredient: ${ingredient.id}`);
                continue;
            }
            
            const cleanedName = cleanIngredientName(ingredient.ingredient_name);
            
            if (!cleanedName) {
                console.log(`⚠️ Skipping ingredient with empty cleaned name: ${ingredient.id}`);
                continue;
            }
            
            // Find matching products
            const matchingProducts = await findMatchingProducts(cleanedName);
            const substituteProducts = await findSubstituteProducts(cleanedName, matchingProducts);
            
            // Insert ingredient canonical mapping
            try {
                const { error: insertError } = await supabase
                    .from('IngredientCanonical')
                    .insert({
                        original_ingredient: ingredient.ingredient_name,
                        canonical_ingredient: cleanedName,
                        matching_products: matchingProducts,
                        substitute_product_ids: substituteProducts
                    });
                
                if (insertError) {
                    console.error(`❌ Error inserting ingredient mapping for "${cleanedName}":`, insertError);
                } else {
                    console.log(`✅ Processed "${ingredient.ingredient_name}" → "${cleanedName}" (${matchingProducts.length} products)`);
                    processedInBatch++;
                }
            } catch (error) {
                console.error(`❌ Error processing ingredient mapping for "${cleanedName}":`, error);
            }
        }
        
        return processedInBatch;
        
    } catch (error) {
        console.error('❌ Error processing ingredient batch:', error);
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
async function runIngredientCanonicalMapping() {
    console.log('🚀 Starting Ingredient Canonical Mapping - Phase 2');
    console.log('==================================================\n');
    
    // Setup graceful shutdown
    setupGracefulShutdown();
    
    try {
        // Get total count
        totalCount = await getTotalIngredientCount();
        console.log(`📊 Total ingredients to process: ${totalCount.toLocaleString()}`);
        
        // Get last checkpoint for resume
        const lastProcessedId = await getLastCheckpoint();
        if (lastProcessedId > 0) {
            console.log(`📂 Resuming from checkpoint: ${lastProcessedId.toLocaleString()}`);
            processedCount = lastProcessedId;
        }
        
        console.log(`🔄 Processing in batches of ${BATCH_SIZE}...\n`);
        
        // Process all ingredients
        for (let offset = processedCount; offset < totalCount; offset += BATCH_SIZE) {
            if (isShuttingDown) break;
            
            const batchStart = Date.now();
            const processedInBatch = await processIngredientBatch(offset, BATCH_SIZE);
            
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
        
        console.log('\n🎉 Ingredient Canonical Mapping Complete!');
        console.log('==========================================');
        console.log(`✅ Processed ${processedCount.toLocaleString()} ingredients`);
        console.log(`⏱️ Total time: ${Math.floor((Date.now() - startTime) / 1000)} seconds`);
        
        // Generate summary
        const { data: canonicalCount, error } = await supabase
            .from('IngredientCanonical')
            .select('*', { count: 'exact', head: true });
        
        if (!error) {
            console.log(`📊 Created ${canonicalCount} canonical ingredient mappings`);
        }
        
    } catch (error) {
        console.error('\n❌ Ingredient Canonical Mapping Failed');
        console.error('========================================');
        console.error('Error:', error);
        
        // Save checkpoint on error
        await saveCheckpoint(processedCount);
        
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runIngredientCanonicalMapping().catch(error => {
        console.error('❌ Script crashed:', error);
        process.exit(1);
    });
}

module.exports = {
    cleanIngredientName,
    toCamelCase,
    findMatchingProducts,
    runIngredientCanonicalMapping
}; 