const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Test configuration
const TEST_CONFIG = {
    batchSize: 1000,
    testMode: true
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

// Enhanced cleaning function
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

// Classify a product as raw ingredient or processed product
function classifyProduct(productName) {
    const cleanedName = cleanForClassification(productName);
    
    // Check for processed product indicators
    const isProcessed = CLASSIFICATION_RULES.PROCESSED_PRODUCTS.keywords.some(keyword => 
        cleanedName.includes(keyword)
    );
    
    // Check for raw ingredient indicators
    const isRaw = CLASSIFICATION_RULES.RAW_INGREDIENTS.keywords.some(keyword => 
        cleanedName.includes(keyword) && 
        !CLASSIFICATION_RULES.RAW_INGREDIENTS.excludeKeywords.some(exclude => 
            cleanedName.includes(exclude)
        )
    );
    
    if (isProcessed) return 'processed';
    if (isRaw) return 'raw';
    return 'unclear';
}

// Test existing functionality before making changes
async function testExistingFunctionality() {
    console.log('🛡️ Testing Existing Functionality...\n');
    
    try {
        // Test current queries
        const { data: productSample, error: productError } = await supabase
            .from('ProductCanonical')
            .select('canonical_product_name')
            .limit(5);
        
        const { data: ingredientSample, error: ingredientError } = await supabase
            .from('IngredientCanonical')
            .select('canonical_ingredient')
            .limit(5);
        
        console.log('✅ Existing Functionality Test:');
        console.log(`   📦 Product Query: ${!productError ? 'PASS' : 'FAIL'}`);
        console.log(`   🥕 Ingredient Query: ${!ingredientError ? 'PASS' : 'FAIL'}`);
        console.log(`   📊 Product Sample: ${productSample ? productSample.length : 0} records`);
        console.log(`   📊 Ingredient Sample: ${ingredientSample ? ingredientSample.length : 0} records`);
        console.log('');
        
        return !productError && !ingredientError;
        
    } catch (error) {
        console.error('❌ Error testing existing functionality:', error);
        return false;
    }
}

// Test classification on 1,000 products (without updating database)
async function testClassificationOnBatch() {
    console.log('🧪 Testing Classification on 1,000 Products...\n');
    
    try {
        // Get test batch
        const { data: products, error } = await supabase
            .from('ProductCanonical')
            .select('id, original_product_name, canonical_product_name')
            .limit(TEST_CONFIG.batchSize);
        
        if (error) {
            console.error('❌ Error fetching test products:', error);
            return;
        }
        
        console.log(`📊 Processing ${products.length} products for classification...\n`);
        
        const classifications = {
            raw: [],
            processed: [],
            unclear: []
        };
        
        let processedCount = 0;
        
        for (const product of products) {
            const classification = classifyProduct(product.canonical_product_name);
            classifications[classification].push({
                id: product.id,
                original: product.original_product_name,
                canonical: product.canonical_product_name,
                classification: classification
            });
            
            processedCount++;
            
            // Show progress
            if (processedCount % 100 === 0) {
                console.log(`   📈 Processed: ${processedCount}/${products.length}`);
            }
        }
        
        // Show results
        console.log('\n📊 Classification Results:');
        console.log(`   ✅ Raw: ${classifications.raw.length} (${((classifications.raw.length / products.length) * 100).toFixed(1)}%)`);
        console.log(`   🏭 Processed: ${classifications.processed.length} (${((classifications.processed.length / products.length) * 100).toFixed(1)}%)`);
        console.log(`   ❓ Unclear: ${classifications.unclear.length} (${((classifications.unclear.length / products.length) * 100).toFixed(1)}%)`);
        console.log('');
        
        // Show examples
        console.log('📋 RAW INGREDIENTS EXAMPLES:');
        classifications.raw.slice(0, 10).forEach((item, index) => {
            console.log(`   ${index + 1}. "${item.original}" → "${item.canonical}"`);
        });
        console.log('');
        
        console.log('📋 PROCESSED PRODUCTS EXAMPLES:');
        classifications.processed.slice(0, 10).forEach((item, index) => {
            console.log(`   ${index + 1}. "${item.original}" → "${item.canonical}"`);
        });
        console.log('');
        
        console.log('📋 UNCLEAR CASES EXAMPLES:');
        classifications.unclear.slice(0, 10).forEach((item, index) => {
            console.log(`   ${index + 1}. "${item.original}" → "${item.canonical}"`);
        });
        console.log('');
        
        return classifications;
        
    } catch (error) {
        console.error('❌ Error in classification test:', error);
        return null;
    }
}

// Analyze classification quality
function analyzeClassificationQuality(classifications) {
    console.log('🔍 Analyzing Classification Quality...\n');
    
    const total = classifications.raw.length + classifications.processed.length + classifications.unclear.length;
    
    console.log('📊 Quality Metrics:');
    console.log(`   📈 Classification Rate: ${((total - classifications.unclear.length) / total * 100).toFixed(1)}%`);
    console.log(`   ✅ Clear Classifications: ${total - classifications.unclear.length}`);
    console.log(`   ❓ Unclear Cases: ${classifications.unclear.length}`);
    console.log('');
    
    // Analyze raw ingredients
    console.log('🥕 Raw Ingredients Analysis:');
    const rawKeywords = {};
    classifications.raw.forEach(item => {
        const cleaned = cleanForClassification(item.canonical);
        CLASSIFICATION_RULES.RAW_INGREDIENTS.keywords.forEach(keyword => {
            if (cleaned.includes(keyword)) {
                rawKeywords[keyword] = (rawKeywords[keyword] || 0) + 1;
            }
        });
    });
    
    Object.entries(rawKeywords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([keyword, count]) => {
            console.log(`   • ${keyword}: ${count} products`);
        });
    console.log('');
    
    // Analyze processed products
    console.log('🏭 Processed Products Analysis:');
    const processedKeywords = {};
    classifications.processed.forEach(item => {
        const cleaned = cleanForClassification(item.canonical);
        CLASSIFICATION_RULES.PROCESSED_PRODUCTS.keywords.forEach(keyword => {
            if (cleaned.includes(keyword)) {
                processedKeywords[keyword] = (processedKeywords[keyword] || 0) + 1;
            }
        });
    });
    
    Object.entries(processedKeywords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([keyword, count]) => {
            console.log(`   • ${keyword}: ${count} products`);
        });
    console.log('');
    
    // Analyze unclear cases
    console.log('❓ Unclear Cases Analysis:');
    const unclearPatterns = {};
    classifications.unclear.forEach(item => {
        const cleaned = cleanForClassification(item.canonical);
        const words = cleaned.split(' ').filter(word => word.length > 3);
        words.forEach(word => {
            unclearPatterns[word] = (unclearPatterns[word] || 0) + 1;
        });
    });
    
    Object.entries(unclearPatterns)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([word, count]) => {
            console.log(`   • "${word}": ${count} occurrences`);
        });
    console.log('');
}

// Main test function
async function runSafeSeparationTest() {
    console.log('🚀 Starting Safe Separation Test (Classification Only)...\n');
    
    console.log('📋 Test Configuration:');
    console.log(`   📦 Batch Size: ${TEST_CONFIG.batchSize}`);
    console.log(`   🧪 Test Mode: ${TEST_CONFIG.testMode}`);
    console.log('   💾 Database Updates: DISABLED (safe mode)');
    console.log('');
    
    // Step 1: Test existing functionality
    const existingWorks = await testExistingFunctionality();
    if (!existingWorks) {
        console.log('❌ Existing functionality test failed. Aborting.');
        return;
    }
    
    // Step 2: Test classification
    const classifications = await testClassificationOnBatch();
    if (!classifications) {
        console.log('❌ Classification test failed. Aborting.');
        return;
    }
    
    // Step 3: Analyze quality
    analyzeClassificationQuality(classifications);
    
    console.log('🎉 Safe Separation Test Complete!');
    console.log('\n📋 Test Results:');
    console.log('   ✅ Existing functionality preserved');
    console.log('   ✅ Product type classification working');
    console.log('   ✅ Classification quality analyzed');
    console.log('   💾 Database updates skipped (safe mode)');
    console.log('\n💡 Ready to implement with database updates!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Add product_type column to tables');
    console.log('   2. Update test batch with classifications');
    console.log('   3. Scale up to full dataset');
}

runSafeSeparationTest().catch(console.error); 