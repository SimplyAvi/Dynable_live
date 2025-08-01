/**
 * Recipe Performance Test
 * Tests recipe-to-product lookup performance after mapping system implementation
 * Author: Justin Linzan
 * Date: January 2025
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Test recipe performance using new mapping system
 */
async function testRecipePerformance() {
    console.log('🧪 Testing Recipe Performance with New Mapping System');
    console.log('====================================================\n');
    
    const testRecipes = [
        'chicken pasta',
        'tomato sauce',
        'garlic bread',
        'beef stew',
        'fish tacos',
        'vegetable soup',
        'chocolate cake',
        'apple pie',
        'pizza margherita',
        'caesar salad'
    ];
    
    let totalTime = 0;
    let successCount = 0;
    let failureCount = 0;
    
    for (const recipe of testRecipes) {
        console.log(`🔍 Testing: "${recipe}"`);
        
        const startTime = Date.now();
        
        try {
            // Simulate recipe lookup using new mapping system
            const result = await lookupRecipeProducts(recipe);
            const duration = Date.now() - startTime;
            
            totalTime += duration;
            successCount++;
            
            console.log(`✅ Found ${result.products.length} products in ${duration}ms`);
            
            if (duration > 1000) {
                console.log(`⚠️ SLOW: ${duration}ms (should be <1000ms)`);
            }
            
        } catch (error) {
            const duration = Date.now() - startTime;
            failureCount++;
            console.log(`❌ Failed in ${duration}ms: ${error.message}`);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 PERFORMANCE RESULTS');
    console.log('======================');
    console.log(`✅ Successful lookups: ${successCount}`);
    console.log(`❌ Failed lookups: ${failureCount}`);
    console.log(`⏱️ Average time: ${Math.round(totalTime / testRecipes.length)}ms`);
    console.log(`🎯 Target: <1000ms per lookup`);
    
    if (totalTime / testRecipes.length < 1000) {
        console.log('\n🎉 SUCCESS: Recipe lookups are fast enough!');
    } else {
        console.log('\n⚠️ WARNING: Recipe lookups are still too slow');
    }
}

/**
 * Simulate recipe product lookup using new mapping system
 */
async function lookupRecipeProducts(recipeName) {
    try {
        // Step 1: Extract ingredients from recipe (simplified)
        const ingredients = extractIngredientsFromRecipe(recipeName);
        
        // Step 2: Look up products for each ingredient using new mapping system
        const allProducts = [];
        
        for (const ingredient of ingredients) {
            const products = await lookupProductsForIngredient(ingredient);
            allProducts.push(...products);
        }
        
        // Remove duplicates
        const uniqueProducts = [...new Set(allProducts)];
        
        return {
            recipe: recipeName,
            ingredients: ingredients,
            products: uniqueProducts
        };
        
    } catch (error) {
        throw new Error(`Recipe lookup failed: ${error.message}`);
    }
}

/**
 * Extract ingredients from recipe name (simplified)
 */
function extractIngredientsFromRecipe(recipeName) {
    const lowerRecipe = recipeName.toLowerCase();
    const ingredients = [];
    
    // Simple keyword extraction
    if (lowerRecipe.includes('chicken')) ingredients.push('chicken');
    if (lowerRecipe.includes('pasta')) ingredients.push('pasta');
    if (lowerRecipe.includes('tomato')) ingredients.push('tomatoes');
    if (lowerRecipe.includes('sauce')) ingredients.push('sauce');
    if (lowerRecipe.includes('garlic')) ingredients.push('garlic');
    if (lowerRecipe.includes('bread')) ingredients.push('bread');
    if (lowerRecipe.includes('beef')) ingredients.push('beef');
    if (lowerRecipe.includes('stew')) ingredients.push('stew');
    if (lowerRecipe.includes('fish')) ingredients.push('fish');
    if (lowerRecipe.includes('tacos')) ingredients.push('tacos');
    if (lowerRecipe.includes('vegetable')) ingredients.push('vegetables');
    if (lowerRecipe.includes('soup')) ingredients.push('soup');
    if (lowerRecipe.includes('chocolate')) ingredients.push('chocolate');
    if (lowerRecipe.includes('cake')) ingredients.push('cake');
    if (lowerRecipe.includes('apple')) ingredients.push('apples');
    if (lowerRecipe.includes('pie')) ingredients.push('pie');
    if (lowerRecipe.includes('pizza')) ingredients.push('pizza');
    if (lowerRecipe.includes('salad')) ingredients.push('salad');
    
    return ingredients;
}

/**
 * Look up products for ingredient using new mapping system
 */
async function lookupProductsForIngredient(ingredient) {
    try {
        // Clean ingredient name
        const cleanedIngredient = cleanIngredientName(ingredient);
        
        // Look up in IngredientCanonical table
        const { data: mappings, error } = await supabase
            .from('IngredientCanonical')
            .select('matching_products')
            .eq('canonical_ingredient', cleanedIngredient)
            .limit(1);
        
        if (error) throw error;
        
        if (mappings && mappings.length > 0) {
            return mappings[0].matching_products || [];
        }
        
        // Fallback: search in ProductCanonical
        const { data: products, error: productError } = await supabase
            .from('ProductCanonical')
            .select('product_ids')
            .ilike('canonical_product_name', `%${cleanedIngredient}%`)
            .limit(1);
        
        if (productError) throw productError;
        
        if (products && products.length > 0) {
            return products[0].product_ids || [];
        }
        
        return [];
        
    } catch (error) {
        console.error(`Error looking up products for "${ingredient}":`, error);
        return [];
    }
}

/**
 * Clean ingredient name (same as in mapping scripts)
 */
function cleanIngredientName(ingredientName) {
    if (!ingredientName) return '';
    
    let cleaned = ingredientName.toLowerCase();
    
    // Remove action words
    const actionWords = [
        'diced', 'chopped', 'minced', 'sliced', 'grated', 'shredded',
        'sautéed', 'roasted', 'grilled', 'baked', 'fried', 'steamed',
        'fresh', 'frozen', 'canned', 'dried', 'cooked', 'raw', 'peeled',
        'seeded', 'stemmed', 'trimmed', 'cleaned', 'washed', 'drained'
    ];
    
    actionWords.forEach(actionWord => {
        const regex = new RegExp(`\\b${actionWord}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    
    // Remove measurements
    const measurements = [
        /\d+\s*(cups?|tbsp|tsp|oz|lbs?|grams?|kg|ml|liters?)/gi,
        /\d+\/\d+/g,
        /\ba\s+few\b/gi,
        /\ba\s+pinch\b/gi
    ];
    
    measurements.forEach(measurement => {
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
 * Universal camelCase conversion
 */
function toCamelCase(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
        .toLowerCase()
        .trim()
        .replace(/[\s_-]+/g, ' ')
        .split(' ')
        .map((word, index) => {
            if (index === 0) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join('');
}

/**
 * Test mapping system status
 */
async function testMappingSystemStatus() {
    console.log('🔍 Checking Mapping System Status');
    console.log('================================\n');
    
    try {
        // Check ProductCanonical table
        const { data: productMappings, error: productError } = await supabase
            .from('ProductCanonical')
            .select('*', { count: 'exact', head: true });
        
        if (productError) {
            console.log('❌ ProductCanonical table not found or error:', productError.message);
        } else {
            console.log(`✅ ProductCanonical table: ${productMappings} mappings`);
        }
        
        // Check IngredientCanonical table
        const { data: ingredientMappings, error: ingredientError } = await supabase
            .from('IngredientCanonical')
            .select('*', { count: 'exact', head: true });
        
        if (ingredientError) {
            console.log('❌ IngredientCanonical table not found or error:', ingredientError.message);
        } else {
            console.log(`✅ IngredientCanonical table: ${ingredientMappings} mappings`);
        }
        
        // Check sample data
        const { data: sampleProducts, error: sampleError } = await supabase
            .from('ProductCanonical')
            .select('canonical_product_name, product_ids')
            .limit(3);
        
        if (!sampleError && sampleProducts && sampleProducts.length > 0) {
            console.log('\n📋 Sample Product Mappings:');
            sampleProducts.forEach(product => {
                console.log(`   "${product.canonical_product_name}" (${product.product_ids?.length || 0} products)`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error checking mapping system status:', error);
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting Recipe Performance Tests');
    console.log('====================================\n');
    
    // First check mapping system status
    await testMappingSystemStatus();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Then test performance
    await testRecipePerformance();
}

// Run if called directly
if (require.main === module) {
    runTests().catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
}

module.exports = {
    testRecipePerformance,
    testMappingSystemStatus,
    lookupRecipeProducts
}; 