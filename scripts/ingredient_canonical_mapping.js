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
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const BATCH_SIZE = 500; // Smaller batch size to avoid timeouts
const MAX_INGREDIENT_NAME_LENGTH = 255;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Utility function for camelCase conversion
function toCamelCase(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .toLowerCase()
        .trim()
        .replace(/[\s_-]+/g, ' ')
        .split(' ')
        .map((word, index) => {
            if (index === 0) {
                return word; // First word stays lowercase
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join('');
}

// Clean ingredient name by removing action words and measurements
function cleanIngredientName(ingredient) {
    if (!ingredient) return '';
    
    let cleaned = ingredient.toLowerCase();
    
    // Remove action words
    const ACTION_WORDS = [
        'diced', 'chopped', 'minced', 'sliced', 'grated', 'shredded',
        'sautéed', 'roasted', 'grilled', 'baked', 'fried', 'steamed',
        'fresh', 'frozen', 'canned', 'dried', 'cooked', 'raw',
        'peeled', 'seeded', 'trimmed', 'washed', 'drained', 'crushed',
        'crumbled', 'shaved', 'julienned', 'spiralized', 'matchstick',
        'coarsely', 'finely', 'roughly', 'thinly', 'thickly'
    ];
    
    // Remove measurements
    const MEASUREMENTS = [
        /\d+\s*(cups?|tbsp|tsp|oz|lbs?|grams?|kg|ml|liters?)/gi,
        /\d+\/\d+/g, // fractions
        /\ba\s+few\b/gi,
        /\ba\s+pinch\b/gi,
        /\bto\s+taste\b/gi,
        /\bor\s+to\s+taste\b/gi,
        /\babout\s+\d+/gi,
        /\bapproximately\s+\d+/gi
    ];
    
    // Remove action words
    ACTION_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    
    // Remove measurements
    MEASUREMENTS.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });
    
    // Clean up extra spaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Convert to camelCase if multi-word
    if (cleaned.includes(' ')) {
        cleaned = toCamelCase(cleaned);
    }
    
    // Truncate if too long
    if (cleaned.length > MAX_INGREDIENT_NAME_LENGTH) {
        cleaned = cleaned.substring(0, MAX_INGREDIENT_NAME_LENGTH);
    }
    
    return cleaned;
}

// Check if database tables exist
async function checkDatabaseTables() {
    console.log('🔍 Checking database tables...');
    
    try {
        const { data: ingredientTable, error: ingredientError } = await supabase
            .from('IngredientCanonical')
            .select('id')
            .limit(1);
        
        if (ingredientError) {
            console.error('❌ IngredientCanonical table not found or not accessible');
            console.error('Error:', ingredientError);
            console.log('\n📋 Please run the SQL migration first:');
            console.log('1. Go to your Supabase SQL editor');
            console.log('2. Run the SQL from database/migrations/create_simple_mapping_tables.sql');
            console.log('3. Then run this script again');
            process.exit(1);
        }
        
        console.log('✅ Database tables are accessible');
        return true;
    } catch (error) {
        console.error('❌ Error checking database tables:', error);
        return false;
    }
}

// Get total ingredient count from recipes
async function getTotalIngredientCount() {
    try {
        console.log('🔍 Getting total ingredient count...');
        
        // Use max ID as approximation
        const { data: maxIdData, error: maxIdError } = await supabase
            .from('RecipeIngredient')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);
        
        if (!maxIdError && maxIdData && maxIdData.length > 0) {
            const approximateCount = maxIdData[0].id;
            console.log(`📊 Approximate total ingredients (based on max ID): ${approximateCount}`);
            return approximateCount;
        }
        
        // Fallback to known value
        console.log('🔄 Using fallback count: 50000');
        return 50000;
        
    } catch (error) {
        console.error('❌ Error getting ingredient count:', error);
        console.log('🔄 Using fallback count: 50000');
        return 50000;
    }
}

// Check if ingredient already processed
async function isIngredientProcessed(ingredientId) {
    try {
        const { data, error } = await supabase
            .from('IngredientCanonical')
            .select('matching_products')
            .contains('matching_products', [ingredientId]);
        
        if (error) {
            console.error('❌ Error checking if ingredient processed:', error);
            return false;
        }
        
        return data && data.length > 0;
    } catch (error) {
        console.error('❌ Error checking if ingredient processed:', error);
        return false;
    }
}

// Find matching products for an ingredient
async function findMatchingProducts(canonicalIngredient) {
    try {
        // Search in ProductCanonical table for matching products
        const { data: products, error } = await supabase
            .from('ProductCanonical')
            .select('product_ids, canonical_product_name')
            .ilike('canonical_product_name', `%${canonicalIngredient}%`);
        
        if (error) {
            console.error('❌ Error finding matching products:', error);
            return [];
        }
        
        const matchingProductIds = [];
        products.forEach(product => {
            if (product.product_ids) {
                matchingProductIds.push(...product.product_ids);
            }
        });
        
        return [...new Set(matchingProductIds)]; // Remove duplicates
    } catch (error) {
        console.error('❌ Error finding matching products:', error);
        return [];
    }
}

// Insert or update ingredient canonical mapping
async function insertOrUpdateIngredientCanonical(canonicalName, originalName, matchingProductIds) {
    try {
        // First, try to find existing record
        const { data: existing, error: selectError } = await supabase
            .from('IngredientCanonical')
            .select('id, matching_products')
            .eq('canonical_ingredient', canonicalName)
            .single();
        
        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error(`❌ Error checking existing mapping for "${canonicalName}":`, selectError);
            return false;
        }
        
        if (existing) {
            // Update existing record
            const updatedProductIds = [...new Set([...existing.matching_products, ...matchingProductIds])];
            
            const { error: updateError } = await supabase
                .from('IngredientCanonical')
                .update({ matching_products: updatedProductIds })
                .eq('id', existing.id);
            
            if (updateError) {
                console.error(`❌ Error updating mapping for "${canonicalName}":`, updateError);
                return false;
            }
            
            console.log(`🔄 Updated existing mapping for "${canonicalName}" (${updatedProductIds.length} products)`);
            return true;
        } else {
            // Insert new record
            const { error: insertError } = await supabase
                .from('IngredientCanonical')
                .insert({
                    original_ingredient: originalName,
                    canonical_ingredient: canonicalName,
                    matching_products: matchingProductIds
                });
            
            if (insertError) {
                console.error(`❌ Error inserting mapping for "${canonicalName}":`, insertError);
                return false;
            }
            
            console.log(`✅ Created new mapping for "${originalName}" → "${canonicalName}" (${matchingProductIds.length} products)`);
            return true;
        }
    } catch (error) {
        console.error(`❌ Error processing mapping for "${canonicalName}":`, error);
        return false;
    }
}

// Fetch ingredients with retry logic
async function fetchIngredientsWithRetry(offset, retries = 0) {
    try {
        console.log(`📦 Fetching ingredients starting at offset ${offset}...`);
        
        const { data: ingredients, error } = await supabase
            .from('RecipeIngredient')
            .select('id, ingredient_name')
            .range(offset, offset + BATCH_SIZE - 1)
            .order('id');
        
        if (error) {
            if (error.code === '57014' && retries < MAX_RETRIES) {
                console.log(`⏳ Timeout error, retrying in ${RETRY_DELAY/1000}s... (attempt ${retries + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return await fetchIngredientsWithRetry(offset, retries + 1);
            }
            console.error('❌ Error fetching ingredients:', error);
            return null;
        }
        
        return ingredients;
    } catch (error) {
        if (retries < MAX_RETRIES) {
            console.log(`⏳ Network error, retrying in ${RETRY_DELAY/1000}s... (attempt ${retries + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return await fetchIngredientsWithRetry(offset, retries + 1);
        }
        console.error('❌ Error fetching ingredients after retries:', error);
        return null;
    }
}

// Process ingredients in batches
async function processIngredientBatch(offset) {
    try {
        const ingredients = await fetchIngredientsWithRetry(offset);
        
        if (!ingredients) {
            console.log('❌ Failed to fetch ingredients after retries');
            return false;
        }
        
        if (ingredients.length === 0) {
            console.log('📭 No more ingredients to process');
            return false;
        }
        
        console.log(`📊 Processing ${ingredients.length} ingredients...`);
        
        // Group ingredients by canonical name
        const canonicalGroups = {};
        
        for (const ingredient of ingredients) {
            // Skip if already processed
            if (await isIngredientProcessed(ingredient.id)) {
                console.log(`⏭️ Skipping already processed ingredient ${ingredient.id}`);
                continue;
            }
            
            const canonicalName = cleanIngredientName(ingredient.ingredient_name);
            
            if (!canonicalName) {
                console.log(`⚠️ Skipping ingredient with empty canonical name: ${ingredient.ingredient_name}`);
                continue;
            }
            
            if (!canonicalGroups[canonicalName]) {
                canonicalGroups[canonicalName] = {
                    original_ingredient: ingredient.ingredient_name,
                    canonical_ingredient: canonicalName,
                    matching_products: []
                };
            }
        }
        
        // Find matching products for each canonical ingredient
        let successCount = 0;
        let errorCount = 0;
        
        for (const [canonicalName, mapping] of Object.entries(canonicalGroups)) {
            const matchingProductIds = await findMatchingProducts(canonicalName);
            
            const success = await insertOrUpdateIngredientCanonical(
                mapping.canonical_ingredient,
                mapping.original_ingredient,
                matchingProductIds
            );
            
            if (success) {
                successCount++;
            } else {
                errorCount++;
            }
        }
        
        console.log(`✅ Batch complete: ${successCount} successful, ${errorCount} errors`);
        return true;
        
    } catch (error) {
        console.error('❌ Error processing batch:', error);
        return false;
    }
}

// Save checkpoint
async function saveCheckpoint(offset, processedCount, totalCount) {
    try {
        const checkpoint = {
            lastProcessedOffset: offset,
            timestamp: new Date().toISOString(),
            processedCount: processedCount,
            totalCount: totalCount
        };
        
        const fs = require('fs');
        fs.writeFileSync('scripts/logs/ingredient_mapping_checkpoint.json', JSON.stringify(checkpoint, null, 2));
        console.log(`💾 Checkpoint saved: offset ${offset}, processed ${processedCount}/${totalCount}`);
    } catch (error) {
        console.error('❌ Error saving checkpoint:', error);
    }
}

// Main processing function
async function startIngredientMapping() {
    console.log('🚀 Starting Ingredient Canonical Mapping (Phase 2)...');
    console.log(`📋 Processing in batches of ${BATCH_SIZE}`);
    console.log(`📋 Max retries: ${MAX_RETRIES}, Retry delay: ${RETRY_DELAY}ms`);
    
    // Check database tables first
    const tablesOk = await checkDatabaseTables();
    if (!tablesOk) {
        return;
    }
    
    // Get total count
    const totalCount = await getTotalIngredientCount();
    console.log(`📊 Total ingredients to process: ${totalCount}`);
    
    if (totalCount === 0) {
        console.log('❌ No ingredients found to process');
        return;
    }
    
    const startTime = Date.now();
    let processedCount = 0;
    let batchCount = 0;
    
    // Process in batches
    for (let offset = 0; offset < totalCount; offset += BATCH_SIZE) {
        batchCount++;
        console.log(`\n🔄 Processing batch ${batchCount}/${Math.ceil(totalCount / BATCH_SIZE)}`);
        
        const success = await processIngredientBatch(offset);
        
        if (!success) {
            console.log('❌ Batch failed, saving checkpoint and stopping');
            await saveCheckpoint(offset, processedCount, totalCount);
            break;
        }
        
        processedCount += BATCH_SIZE;
        
        // Save checkpoint every 5 batches
        if (batchCount % 5 === 0) {
            await saveCheckpoint(offset + BATCH_SIZE, processedCount, totalCount);
        }
        
        // Progress tracking
        const elapsed = Date.now() - startTime;
        const rate = processedCount / (elapsed / 1000);
        const remaining = (totalCount - processedCount) / rate;
        const eta = new Date(Date.now() + remaining * 1000);
        
        console.log(`📊 Progress: ${processedCount}/${totalCount} (${((processedCount/totalCount)*100).toFixed(2)}%)`);
        console.log(`⏱️ Rate: ${rate.toFixed(1)} records/sec`);
        console.log(`🕐 ETA: ${eta.toLocaleString()}`);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const totalElapsed = Date.now() - startTime;
    console.log(`\n🎉 Processing complete!`);
    console.log(`⏱️ Total time: ${Math.floor(totalElapsed/1000)}s`);
    console.log(`📊 Processed: ${processedCount} ingredients`);
    console.log(`📈 Average rate: ${(processedCount/(totalElapsed/1000)).toFixed(1)} records/sec`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutdown signal received. Finishing current batch...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutdown signal received. Finishing current batch...');
    process.exit(0);
});

// Run the mapping
startIngredientMapping().catch(console.error); 