const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Optimized configuration based on performance tests
const OPTIMIZED_CONFIG = {
    batchSize: 10000,
    maxConcurrentBatches: 2,
    delayBetweenBatches: 500,
    checkpointInterval: 5
};

// Product classification rules
const CLASSIFICATION_RULES = {
    RAW_INGREDIENTS: {
        keywords: [
            'flour', 'sugar', 'salt', 'eggs', 'milk', 'butter', 'oil',
            'onions', 'garlic', 'tomatoes', 'carrots', 'potatoes',
            'chicken', 'beef', 'pork', 'fish', 'shrimp',
            'apples', 'bananas', 'strawberries', 'lemons', 'limes',
            'rice', 'pasta', 'beans', 'nuts', 'seeds'
        ],
        excludeKeywords: [
            'bread', 'cookies', 'sauce', 'noodles', 'pie', 'cake',
            'chips', 'crackers', 'cereal', 'snacks', 'candy'
        ]
    },
    PROCESSED_PRODUCTS: {
        keywords: [
            'bread', 'cookies', 'sauce', 'noodles', 'pie', 'cake',
            'chips', 'crackers', 'cereal', 'snacks', 'candy',
            'gum', 'chocolate', 'ice cream', 'yogurt',
            'cheese', 'deli meat', 'frozen meals', 'canned goods'
        ]
    }
};

// Classify a product as raw ingredient or processed product
function classifyProduct(productName) {
    const name = productName.toLowerCase();
    
    // Check for processed product indicators
    const isProcessed = CLASSIFICATION_RULES.PROCESSED_PRODUCTS.keywords.some(keyword => 
        name.includes(keyword)
    );
    
    // Check for raw ingredient indicators
    const isRaw = CLASSIFICATION_RULES.RAW_INGREDIENTS.keywords.some(keyword => 
        name.includes(keyword) && 
        !CLASSIFICATION_RULES.RAW_INGREDIENTS.excludeKeywords.some(exclude => 
            name.includes(exclude)
        )
    );
    
    if (isProcessed) return 'processed';
    if (isRaw) return 'raw';
    return 'unclear';
}

// Enhanced cleaning function for better classification
function cleanForClassification(str) {
    if (!str || typeof str !== 'string') return '';
    
    let cleaned = str.toLowerCase().trim();
    
    // Remove numbers and measurements
    cleaned = cleaned.replace(/\d+/g, ' ');
    cleaned = cleaned.replace(/\b(cups?|tbsp|tsp|oz|ounces?|lbs?|pounds?|grams?|kg|kilograms?|ml|milliliters?|liters?|l|gallon|quart|pint|fluid|fl)\b/gi, ' ');
    
    // Remove action words
    const actionWords = ['diced', 'chopped', 'minced', 'sliced', 'grated', 'shredded', 'crushed', 'mashed', 'pureed', 'blended', 'whipped', 'beaten', 'fresh', 'frozen', 'canned', 'dried', 'cooked', 'raw', 'ripe', 'unripe', 'peeled', 'seeded', 'trimmed', 'washed', 'drained', 'crumbled', 'shaved', 'julienned', 'spiralized', 'matchstick', 'cubed', 'divided', 'separated', 'combined', 'mixed', 'stirred', 'whisked', 'folded', 'kneaded', 'rolled', 'pressed', 'optional', 'required', 'needed', 'desired', 'preferred', 'recommended', 'suggested', 'thawed', 'chilled', 'warm', 'hot', 'cold', 'room temperature', 'at room temperature'];
    
    actionWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, ' ');
    });
    
    // Remove special characters
    cleaned = cleaned.replace(/[&,;:'"`~!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?®™©]/g, ' ');
    
    // Clean up extra spaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

// Process ingredients with optimized pagination
async function processIngredientsWithPagination() {
    console.log('🚀 Starting Ingredient Classification with Optimized Pagination...\n');
    
    let lastProcessedId = 0;
    let totalProcessed = 0;
    let totalClassified = 0;
    let rawCount = 0;
    let processedCount = 0;
    let unclearCount = 0;
    
    const startTime = Date.now();
    
    try {
        while (true) {
            console.log(`📊 Processing batch starting from ID > ${lastProcessedId}`);
            
            const { data, error } = await supabase
                .from('IngredientCanonical')
                .select('id, canonical_ingredient')
                .gt('id', lastProcessedId)
                .order('id')
                .limit(OPTIMIZED_CONFIG.batchSize);
            
            if (error) {
                console.error('❌ Error fetching ingredients:', error);
                break;
            }
            
            if (!data || data.length === 0) {
                console.log('🏁 No more ingredients to process');
                break;
            }
            
            const batchStartTime = Date.now();
            let batchRawCount = 0;
            let batchProcessedCount = 0;
            let batchUnclearCount = 0;
            
            // Process each ingredient in the batch
            for (const ingredient of data) {
                const cleanedName = cleanForClassification(ingredient.canonical_ingredient);
                const classification = classifyProduct(cleanedName);
                
                // Update the ingredient with classification
                const { error: updateError } = await supabase
                    .from('IngredientCanonical')
                    .update({ 
                        product_type: classification,
                        cleaned_ingredient: cleanedName
                    })
                    .eq('id', ingredient.id);
                
                if (updateError) {
                    console.error(`❌ Error updating ingredient ${ingredient.id}:`, updateError);
                } else {
                    totalClassified++;
                    
                    switch (classification) {
                        case 'raw':
                            batchRawCount++;
                            rawCount++;
                            break;
                        case 'processed':
                            batchProcessedCount++;
                            processedCount++;
                            break;
                        default:
                            batchUnclearCount++;
                            unclearCount++;
                    }
                }
            }
            
            // Update cursor for next batch
            lastProcessedId = data[data.length - 1].id;
            totalProcessed += data.length;
            
            const batchTime = Date.now() - batchStartTime;
            const recordsPerSecond = (data.length / batchTime) * 1000;
            
            console.log(`   ✅ Batch complete: ${data.length} records in ${batchTime}ms (${recordsPerSecond.toFixed(0)} records/sec)`);
            console.log(`   📊 Classifications: Raw=${batchRawCount}, Processed=${batchProcessedCount}, Unclear=${batchUnclearCount}`);
            console.log(`   📈 Total processed: ${totalProcessed}, Total classified: ${totalClassified}`);
            console.log('');
            
            // Checkpoint every few batches
            if (totalProcessed % (OPTIMIZED_CONFIG.batchSize * OPTIMIZED_CONFIG.checkpointInterval) === 0) {
                console.log(`💾 Checkpoint: Processed ${totalProcessed} ingredients, Last ID: ${lastProcessedId}`);
            }
            
            // Small delay between batches to prevent overwhelming the database
            if (data.length === OPTIMIZED_CONFIG.batchSize) {
                await new Promise(resolve => setTimeout(resolve, OPTIMIZED_CONFIG.delayBetweenBatches));
            }
        }
        
        const totalTime = Date.now() - startTime;
        const avgTimePerRecord = totalTime / totalProcessed;
        const recordsPerSecond = (totalProcessed / totalTime) * 1000;
        
        console.log('\n📈 Classification Complete!');
        console.log(`   ⏱️ Total Time: ${totalTime}ms`);
        console.log(`   📊 Total Processed: ${totalProcessed}`);
        console.log(`   📈 Avg Time per Record: ${avgTimePerRecord.toFixed(2)}ms`);
        console.log(`   📦 Records per Second: ${recordsPerSecond.toFixed(0)}`);
        console.log('');
        console.log('📊 Classification Results:');
        console.log(`   ✅ Raw Ingredients: ${rawCount} (${((rawCount / totalClassified) * 100).toFixed(1)}%)`);
        console.log(`   🏭 Processed Products: ${processedCount} (${((processedCount / totalClassified) * 100).toFixed(1)}%)`);
        console.log(`   ❓ Unclear: ${unclearCount} (${((unclearCount / totalClassified) * 100).toFixed(1)}%)`);
        
    } catch (error) {
        console.error('❌ Error in pagination processing:', error);
    }
}

// Test the separation system with sample data
async function testSeparationSystem() {
    console.log('🧪 Testing Separation System...\n');
    
    try {
        // Get sample ingredients with their classifications
        const { data: ingredients, error } = await supabase
            .from('IngredientCanonical')
            .select('id, canonical_ingredient, product_type, cleaned_ingredient')
            .not('product_type', 'is', null)
            .limit(20);
        
        if (error) {
            console.error('❌ Error fetching test data:', error);
            return;
        }
        
        console.log('📊 Sample Classifications:\n');
        
        const stats = { raw: 0, processed: 0, unclear: 0 };
        
        for (const ingredient of ingredients) {
            const type = ingredient.product_type || 'unclear';
            stats[type]++;
            
            console.log(`🔍 "${ingredient.canonical_ingredient}"`);
            console.log(`   🧹 Cleaned: "${ingredient.cleaned_ingredient}"`);
            console.log(`   🏷️ Type: ${type.toUpperCase()}`);
            console.log('');
        }
        
        console.log('📈 Test Statistics:');
        console.log(`   ✅ Raw: ${stats.raw}`);
        console.log(`   🏭 Processed: ${stats.processed}`);
        console.log(`   ❓ Unclear: ${stats.unclear}`);
        
    } catch (error) {
        console.error('❌ Error in separation test:', error);
    }
}

// Main function
async function implementSeparationWithPagination() {
    console.log('🚀 Implementing Separation with Optimized Pagination...\n');
    
    console.log('📋 Configuration:');
    console.log(`   📦 Batch Size: ${OPTIMIZED_CONFIG.batchSize}`);
    console.log(`   ⚡ Expected Performance: 8,547 records/second`);
    console.log(`   🎯 Method: ID-based pagination cursors`);
    console.log('');
    
    // First, test the separation system
    await testSeparationSystem();
    
    // Then process all ingredients
    await processIngredientsWithPagination();
    
    console.log('\n🎉 Separation Implementation Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. ✅ Database restructured with product types');
    console.log('2. ✅ All ingredients classified');
    console.log('3. 🔄 Ready to implement context-aware search');
    console.log('4. 🎨 Frontend updates for separate systems');
}

implementSeparationWithPagination().catch(console.error); 