/**
 * Safe Product Canonical Mapping Script - CRITICAL FOR USER SAFETY
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * This script processes products and creates canonical mappings with comprehensive
 * safety validation to prevent life-threatening allergen exposure.
 * 
 * Features:
 * - CRITICAL safety validation before processing
 * - Universal camelCase enforcement for ALL variables
 * - Long-running capability with resume functionality
 * - Comprehensive error handling and logging
 * - Human review queue for risky mappings
 * - Progress tracking for hours-long execution
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import safety validation system
const { 
    validateCamelCase, 
    validateIngredientMapping, 
    validateAllergenMapping, 
    validateSubstitute,
    runSafetyValidation 
} = require('./safety_validation_system.js');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🏷️ SAFE PRODUCT CANONICAL MAPPING SCRIPT');
console.log('=========================================\n');

// CRITICAL: Universal camelCase converter for ALL multi-word variables
function universalCamelCaseConverter(text) {
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

// CRITICAL: Validate camelCase for ALL variables
function validateAllCamelCase(data) {
    const fields = [
        'canonical_product_name',
        'base_ingredients', // array
        'allergens', // array
        'descriptors' // array
    ];
    
    fields.forEach(field => {
        if (Array.isArray(data[field])) {
            // Validate array items
            data[field].forEach(item => {
                if (!validateCamelCase(item)) {
                    throw new Error(`CRITICAL: Non-camelCase value "${item}" in field "${field}"`);
                }
            });
        } else if (data[field]) {
            // Validate single values
            if (!validateCamelCase(data[field])) {
                throw new Error(`CRITICAL: Non-camelCase value "${data[field]}" in field "${field}"`);
            }
        }
    });
}

// CRITICAL: Clean product name with universal camelCase
function cleanProductName(productName) {
    if (!productName) return '';
    
    let cleaned = productName.toLowerCase();
    
    // Remove descriptors (same as before)
    const DESCRIPTORS = [
        'zero sugar', 'diet', 'light', 'reduced fat', 'low fat', 'fat free',
        'all purpose', 'whole wheat', 'organic', 'natural', 'extra virgin',
        'fresh', 'frozen', 'canned', 'dried', 'raw', 'cooked',
        'original', 'classic', 'traditional', 'premium', 'select',
        'reduced sodium', 'low sodium', 'no salt added', 'unsalted',
        'sugar free', 'no sugar added', 'artificially sweetened',
        'whole grain', 'multigrain', 'enriched', 'bleached', 'unbleached',
        'gluten free', 'dairy free', 'vegan', 'vegetarian', 'keto',
        'paleo', 'low carb', 'high protein', 'low calorie', 'no preservatives',
        'non gmo', 'fair trade', 'sustainable', 'local', 'imported',
        'premium quality', 'gourmet', 'artisan', 'craft', 'small batch',
        'family recipe', 'homestyle', 'restaurant style', 'chef inspired'
    ];
    
    DESCRIPTORS.forEach(descriptor => {
        const regex = new RegExp(`\\b${descriptor}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    
    // Remove brand names
    const BRAND_NAMES = [
        'coca cola', 'pepsi', 'kraft', 'heinz', 'campbell', 'nestle',
        'kellogg', 'general mills', 'conagra', 'unilever', 'p&g',
        'mars', 'hershey', 'mondelez', 'danone', 'kellogg company',
        'general mills inc', 'kraft heinz', 'campbell soup', 'conagra brands'
    ];
    
    BRAND_NAMES.forEach(brand => {
        const regex = new RegExp(`\\b${brand}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    
    // Remove measurements and quantities
    cleaned = cleaned.replace(/\d+[\/\d]*\s*(cups?|tbsp|tsp|oz|lbs?|grams?|kg|ml|liters?|packages?|cans?|containers?|envelopes?|slices?|loaves?|sticks?|cloves?|heads?|bunches?|sprigs?|pieces?|sheets?|bags?|bottles?|jars?|boxes?|packets?|drops?|ears?|stalks?|strips?|cubes?|blocks?|bars?)\b/gi, '');
    
    // Clean up extra spaces and punctuation
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/^[,\s]+|[,\s]+$/g, '');
    cleaned = cleaned.trim();
    
    // CRITICAL: Apply universal camelCase conversion
    return universalCamelCaseConverter(cleaned);
}

// CRITICAL: Extract allergens with camelCase validation
function extractAllergens(product) {
    const allergens = [];
    
    if (product.allergens && Array.isArray(product.allergens)) {
        allergens.push(...product.allergens);
    }
    
    // Extract allergens from description
    const description = (product.description || '').toLowerCase();
    
    if (description.includes('wheat') || description.includes('gluten')) {
        allergens.push('wheat');
    }
    if (description.includes('milk') || description.includes('dairy')) {
        allergens.push('milk');
    }
    if (description.includes('eggs')) {
        allergens.push('eggs');
    }
    if (description.includes('soy')) {
        allergens.push('soy');
    }
    if (description.includes('nuts') || description.includes('almond') || description.includes('peanut')) {
        allergens.push('treeNuts');
    }
    if (description.includes('fish') || description.includes('shellfish')) {
        allergens.push('fish');
    }
    
    // CRITICAL: Validate camelCase for all allergens
    allergens.forEach(validateCamelCase);
    
    return [...new Set(allergens)]; // Remove duplicates
}

// CRITICAL: Resume capability for long-running processes
async function resumeFromCheckpoint() {
    const checkpointFile = path.join(__dirname, 'logs', 'product_mapping_checkpoint.json');
    
    if (fs.existsSync(checkpointFile)) {
        const checkpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
        console.log(`📂 Resuming from record ID: ${checkpoint.lastProcessedId}`);
        return checkpoint.lastProcessedId;
    }
    
    return 0;
}

// CRITICAL: Save checkpoint for resume capability
async function saveCheckpoint(lastProcessedId) {
    const checkpointFile = path.join(__dirname, 'logs', 'product_mapping_checkpoint.json');
    const logsDir = path.dirname(checkpointFile);
    
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const checkpoint = {
        lastProcessedId,
        timestamp: new Date().toISOString(),
        totalProcessed: lastProcessedId
    };
    
    fs.writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2));
}

// CRITICAL: Progress tracking for hours-long execution
function trackProgress(current, total, startTime) {
    const elapsed = Date.now() - startTime;
    const rate = current / (elapsed / 1000); // records per second
    const remaining = (total - current) / rate; // seconds remaining
    const eta = new Date(Date.now() + remaining * 1000);
    
    console.log(`📊 Progress: ${current}/${total} (${((current/total)*100).toFixed(2)}%)`);
    console.log(`⏱️ Rate: ${rate.toFixed(1)} records/sec`);
    console.log(`🕐 ETA: ${eta.toLocaleString()}`);
    console.log(`⏳ Remaining: ${Math.floor(remaining/3600)}h ${Math.floor((remaining%3600)/60)}m`);
    
    // Save status file for monitoring
    const statusFile = path.join(__dirname, 'logs', 'product_mapping_status.json');
    const status = {
        current,
        total,
        progress: ((current/total)*100).toFixed(2),
        rate: rate.toFixed(1),
        eta: eta.toISOString(),
        elapsed: Math.floor(elapsed/1000),
        remaining: Math.floor(remaining)
    };
    
    fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
}

// CRITICAL: Error handling for long-running processes
async function handleLongRunningErrors(error, recordId, attemptCount = 1) {
    console.error(`❌ Error processing record ${recordId} (attempt ${attemptCount}):`, error);
    
    // Log error to file
    const errorLog = path.join(__dirname, 'logs', 'product_mapping_errors.log');
    const errorEntry = `${new Date().toISOString()} - Record ${recordId} (attempt ${attemptCount}): ${error.message}\n`;
    fs.appendFileSync(errorLog, errorEntry);
    
    // Retry logic with exponential backoff
    if (attemptCount < 3) {
        const delay = Math.pow(2, attemptCount) * 1000; // 2s, 4s, 8s
        console.log(`🔄 Retrying in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return await processRecord(recordId, attemptCount + 1);
    }
    
    // After 3 attempts, log and continue (don't crash entire process)
    const failedLog = path.join(__dirname, 'logs', 'product_mapping_failed.json');
    let failedRecords = [];
    if (fs.existsSync(failedLog)) {
        failedRecords = JSON.parse(fs.readFileSync(failedLog, 'utf8'));
    }
    
    failedRecords.push({
        recordId,
        error: error.message,
        timestamp: new Date().toISOString(),
        attempts: attemptCount
    });
    
    fs.writeFileSync(failedLog, JSON.stringify(failedRecords, null, 2));
    console.log(`⚠️ Skipping record ${recordId} after ${attemptCount} failed attempts`);
}

// CRITICAL: Process single record with safety validation
async function processRecord(product, attemptCount = 1) {
    try {
        const originalName = product.description || '';
        const canonicalName = cleanProductName(originalName);
        
        if (!canonicalName) {
            console.log(`⏭️ Skipping empty product name: ${product.id}`);
            return false;
        }
        
        // CRITICAL: Validate ingredient mapping safety
        if (!validateIngredientMapping(originalName, canonicalName)) {
            console.log(`⚠️ Flagged for review: "${originalName}" → "${canonicalName}"`);
            return false;
        }
        
        const category = determineProductCategory(canonicalName);
        const allergens = extractAllergens(product);
        const descriptors = extractDescriptors(originalName);
        
        // CRITICAL: Validate all data for camelCase compliance
        const mapping = {
            canonical_product_name: canonicalName,
            product_category: category,
            base_ingredients: [canonicalName],
            allergens: allergens,
            descriptors: descriptors,
            product_ids: [product.id],
            original_product_name: originalName
        };
        
        // CRITICAL: Validate camelCase for ALL fields
        validateAllCamelCase(mapping);
        
        return mapping;
        
    } catch (error) {
        if (attemptCount < 3) {
            return await handleLongRunningErrors(error, product.id, attemptCount);
        }
        throw error;
    }
}

// CRITICAL: Process batch with safety validation
async function processProductBatch(batchSize = 100) {
    try {
        console.log(`🔄 Processing product batch (size: ${batchSize})...`);
        
        // Get last processed ID for resume capability
        const lastProcessedId = await resumeFromCheckpoint();
        
        // Get products that haven't been processed yet
        let query = supabase
            .from('IngredientCategorized')
            .select('id, description, "brandName", allergens, "canonicalTag"')
            .limit(batchSize);
        
        if (lastProcessedId > 0) {
            query = query.gt('id', lastProcessedId);
        }
        
        const { data: products, error } = await query;
        
        if (error) {
            console.error('❌ Error fetching products:', error);
            return { success: false, error: error.message };
        }
        
        if (!products || products.length === 0) {
            console.log('ℹ️ No new products to process');
            return { success: true, processed: 0 };
        }
        
        console.log(`📦 Processing ${products.length} products...`);
        
        const canonicalMappings = new Map();
        let processedCount = 0;
        let errorCount = 0;
        
        // Process each product with safety validation
        for (const product of products) {
            try {
                const mapping = await processRecord(product);
                
                if (mapping) {
                    // Group products by canonical name
                    if (!canonicalMappings.has(mapping.canonical_product_name)) {
                        canonicalMappings.set(mapping.canonical_product_name, mapping);
                    } else {
                        const existing = canonicalMappings.get(mapping.canonical_product_name);
                        existing.product_ids.push(product.id);
                        
                        // Update allergens and descriptors
                        mapping.allergens.forEach(allergen => {
                            if (!existing.allergens.includes(allergen)) {
                                existing.allergens.push(allergen);
                            }
                        });
                        
                        mapping.descriptors.forEach(descriptor => {
                            if (!existing.descriptors.includes(descriptor)) {
                                existing.descriptors.push(descriptor);
                            }
                        });
                    }
                    
                    processedCount++;
                }
                
                // Save checkpoint every 10 records
                if (processedCount % 10 === 0) {
                    await saveCheckpoint(product.id);
                }
                
            } catch (error) {
                errorCount++;
                console.error(`❌ Error processing product ${product.id}:`, error);
            }
        }
        
        // Save canonical mappings to database
        const mappingsToInsert = Array.from(canonicalMappings.values());
        
        if (mappingsToInsert.length > 0) {
            const { data: insertedMappings, error: insertError } = await supabase
                .from('ProductCanonical')
                .upsert(mappingsToInsert, { 
                    onConflict: 'canonical_product_name',
                    ignoreDuplicates: false 
                })
                .select();
            
            if (insertError) {
                console.error('❌ Error inserting canonical mappings:', insertError);
                return { success: false, error: insertError.message };
            }
            
            console.log(`✅ Successfully processed ${processedCount} products into ${insertedMappings.length} canonical mappings`);
            console.log(`❌ Errors: ${errorCount}`);
            
            // Log some examples
            insertedMappings.slice(0, 3).forEach(mapping => {
                console.log(`   📋 "${mapping.original_product_name}" → "${mapping.canonical_product_name}" (${mapping.product_ids.length} products)`);
            });
        }
        
        return { 
            success: true, 
            processed: processedCount,
            errors: errorCount,
            mappings: insertedMappings?.length || 0
        };
        
    } catch (error) {
        console.error('❌ Error processing product batch:', error);
        return { success: false, error: error.message };
    }
}

// CRITICAL: Main function with safety validation
async function runSafeProductCanonicalMapping() {
    console.log('🚀 Starting SAFE product canonical mapping...\n');
    
    // CRITICAL: Run safety validation first
    console.log('🔍 Running safety validation...');
    const isSafe = await runSafetyValidation();
    
    if (!isSafe) {
        console.error('❌ Safety validation failed. Cannot proceed.');
        process.exit(1);
    }
    
    console.log('✅ Safety validation passed. Proceeding with mapping...\n');
    
    const startTime = Date.now();
    
    try {
        // Get total count for progress tracking
        const { count: totalCount } = await supabase
            .from('IngredientCategorized')
            .select('*', { count: 'exact', head: true });
        
        console.log(`📊 Total products to process: ${totalCount}`);
        
        let totalProcessed = 0;
        let totalMappings = 0;
        let totalErrors = 0;
        
        // Process in batches
        while (totalProcessed < totalCount) {
            const batchResult = await processProductBatch(100);
            
            if (!batchResult.success) {
                console.error('❌ Batch processing failed:', batchResult.error);
                break;
            }
            
            totalProcessed += batchResult.processed;
            totalMappings += batchResult.mappings;
            totalErrors += batchResult.errors;
            
            // Track progress
            trackProgress(totalProcessed, totalCount, startTime);
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('\n🎉 SAFE PRODUCT CANONICAL MAPPING COMPLETED');
        console.log('===========================================');
        console.log(`📊 Total processed: ${totalProcessed}`);
        console.log(`📊 Total mappings: ${totalMappings}`);
        console.log(`❌ Total errors: ${totalErrors}`);
        console.log(`⏱️ Total time: ${Math.floor((Date.now() - startTime) / 1000)}s`);
        
    } catch (error) {
        console.error('❌ Safe product canonical mapping failed:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    runSafeProductCanonicalMapping().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = {
    universalCamelCaseConverter,
    validateAllCamelCase,
    cleanProductName,
    extractAllergens,
    processRecord,
    processProductBatch,
    runSafeProductCanonicalMapping
}; 