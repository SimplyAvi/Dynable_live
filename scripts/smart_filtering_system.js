const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Smart filtering categories (same as validation system)
const INGREDIENT_CATEGORIES = {
    FRUITS: ['apple', 'banana', 'orange', 'strawberry', 'blueberry', 'raspberry', 'peach', 'mango', 'pineapple', 'grape', 'cherry', 'lemon', 'lime', 'tomato', 'avocado'],
    VEGETABLES: ['onion', 'garlic', 'carrot', 'celery', 'bell pepper', 'mushroom', 'spinach', 'lettuce', 'cucumber', 'zucchini', 'squash', 'potato', 'sweet potato'],
    PROTEINS: ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'salmon', 'tuna', 'egg', 'tofu', 'beans', 'lentils'],
    DAIRY: ['milk', 'cheese', 'yogurt', 'cream', 'butter', 'sour cream', 'cream cheese'],
    GRAINS: ['flour', 'rice', 'pasta', 'bread', 'oats', 'quinoa', 'couscous'],
    CONDIMENTS: ['salt', 'pepper', 'sugar', 'honey', 'vinegar', 'oil', 'soy sauce', 'mustard', 'ketchup', 'mayonnaise'],
    SPICES: ['cinnamon', 'nutmeg', 'oregano', 'basil', 'thyme', 'rosemary', 'cumin', 'paprika', 'cayenne'],
    BAKING: ['baking powder', 'baking soda', 'vanilla', 'chocolate', 'cocoa', 'nuts', 'raisins'],
    GENERIC: ['water', 'broth', 'stock', 'sauce', 'dressing', 'marinade', 'seasoning']
};

// Filtering rules based on ingredient type
const FILTERING_RULES = {
    STRICT: {
        maxProducts: 50,
        minRelevance: 0.7,
        requireExactMatch: true,
        categoryRestriction: true
    },
    MODERATE: {
        maxProducts: 100,
        minRelevance: 0.5,
        requireExactMatch: false,
        categoryRestriction: true
    },
    FLEXIBLE: {
        maxProducts: 200,
        minRelevance: 0.3,
        requireExactMatch: false,
        categoryRestriction: false
    }
};

// Get ingredient category and filtering level
function getIngredientFilteringLevel(ingredient) {
    const cleanIngredient = ingredient.toLowerCase().trim();
    
    for (const [category, ingredients] of Object.entries(INGREDIENT_CATEGORIES)) {
        for (const categoryIngredient of ingredients) {
            if (cleanIngredient.includes(categoryIngredient)) {
                if (['FRUITS', 'VEGETABLES', 'PROTEINS'].includes(category)) {
                    return { category, level: 'STRICT', rule: FILTERING_RULES.STRICT };
                } else if (['DAIRY', 'GRAINS'].includes(category)) {
                    return { category, level: 'MODERATE', rule: FILTERING_RULES.MODERATE };
                } else {
                    return { category, level: 'FLEXIBLE', rule: FILTERING_RULES.FLEXIBLE };
                }
            }
        }
    }
    
    return { category: 'UNKNOWN', level: 'FLEXIBLE', rule: FILTERING_RULES.FLEXIBLE };
}

// Calculate relevance score between ingredient and product
function calculateRelevanceScore(ingredient, productName) {
    const cleanIngredient = ingredient.toLowerCase().trim();
    const cleanProduct = productName.toLowerCase().trim();
    
    // Exact match gets highest score
    if (cleanProduct === cleanIngredient) {
        return 1.0;
    }
    
    // Contains ingredient name
    if (cleanProduct.includes(cleanIngredient)) {
        return 0.9;
    }
    
    // Word overlap
    const ingredientWords = cleanIngredient.split(/\s+/);
    const productWords = cleanProduct.split(/\s+/);
    const overlap = ingredientWords.filter(word => 
        productWords.some(productWord => productWord.includes(word))
    ).length;
    
    if (overlap > 0) {
        return 0.5 + (overlap / ingredientWords.length) * 0.3;
    }
    
    return 0.0;
}

// Smart filtering of product mappings
async function filterProductMappings() {
    console.log('🧠 Starting Smart Filtering System...');
    console.log('📋 Automatically cleaning ingredient mappings based on validation rules\n');
    
    try {
        // Get ingredient mappings to filter
        const { data: ingredientMappings, error } = await supabase
            .from('IngredientCanonical')
            .select('id, canonical_ingredient, matching_products')
            .limit(50); // Process in batches
        
        if (error) {
            console.error('❌ Error fetching ingredient mappings:', error);
            return;
        }
        
        console.log(`📊 Processing ${ingredientMappings.length} ingredient mappings...\n`);
        
        let totalProcessed = 0;
        let totalFiltered = 0;
        let totalUpdated = 0;
        let categoryStats = {};
        
        for (const mapping of ingredientMappings) {
            const { id, canonical_ingredient, matching_products } = mapping;
            
            if (!matching_products || matching_products.length === 0) {
                continue;
            }
            
            // Get filtering level for this ingredient
            const filtering = getIngredientFilteringLevel(canonical_ingredient);
            
            // Initialize category stats
            if (!categoryStats[filtering.category]) {
                categoryStats[filtering.category] = { total: 0, filtered: 0, updated: 0 };
            }
            categoryStats[filtering.category].total++;
            
            console.log(`🔍 Filtering "${canonical_ingredient}" (${filtering.level} level)`);
            console.log(`   📋 Category: ${filtering.category}`);
            console.log(`   📊 Original products: ${matching_products.length}`);
            
            // Get product details for filtering
            const { data: products, error: productError } = await supabase
                .from('IngredientCategorized')
                .select('id, description')
                .in('id', matching_products);
            
            if (productError) {
                console.error(`   ❌ Error fetching products:`, productError);
                continue;
            }
            
            // Score and filter products
            const scoredProducts = products.map(product => ({
                id: product.id,
                description: product.description,
                score: calculateRelevanceScore(canonical_ingredient, product.description)
            }));
            
            // Sort by relevance score (highest first)
            scoredProducts.sort((a, b) => b.score - a.score);
            
            // Apply filtering rules
            const filteredProducts = scoredProducts.filter(product => {
                const isValid = (
                    product.score >= filtering.rule.minRelevance &&
                    (!filtering.rule.requireExactMatch || product.score === 1.0)
                );
                return isValid;
            });
            
            // Limit to max products
            const finalProducts = filteredProducts.slice(0, filtering.rule.maxProducts);
            
            // Report results
            const originalCount = matching_products.length;
            const filteredCount = finalProducts.length;
            const removedCount = originalCount - filteredCount;
            
            console.log(`   ✅ Filtered products: ${filteredCount}`);
            console.log(`   ❌ Removed products: ${removedCount}`);
            console.log(`   📈 Average relevance: ${(finalProducts.reduce((sum, p) => sum + p.score, 0) / Math.max(finalProducts.length, 1)).toFixed(2)}`);
            
            // Update database if changes were made
            if (removedCount > 0) {
                const newProductIds = finalProducts.map(p => p.id);
                
                const { error: updateError } = await supabase
                    .from('IngredientCanonical')
                    .update({ matching_products: newProductIds })
                    .eq('id', id);
                
                if (updateError) {
                    console.error(`   ❌ Error updating mapping:`, updateError);
                } else {
                    console.log(`   💾 Database updated successfully`);
                    totalUpdated++;
                    categoryStats[filtering.category].updated++;
                }
            }
            
            console.log('');
            
            // Update stats
            totalProcessed++;
            if (removedCount > 0) {
                totalFiltered++;
                categoryStats[filtering.category].filtered++;
            }
        }
        
        // Final report
        console.log('📊 Smart Filtering Summary:');
        console.log(`   📋 Total ingredients processed: ${totalProcessed}`);
        console.log(`   🔧 Ingredients filtered: ${totalFiltered} (${((totalFiltered/totalProcessed)*100).toFixed(1)}%)`);
        console.log(`   💾 Database updates: ${totalUpdated}`);
        
        console.log('\n📈 Category Breakdown:');
        for (const [category, stats] of Object.entries(categoryStats)) {
            const filterRate = ((stats.filtered / stats.total) * 100).toFixed(1);
            const updateRate = ((stats.updated / stats.total) * 100).toFixed(1);
            console.log(`   ${category}: ${stats.filtered}/${stats.total} filtered (${filterRate}%), ${stats.updated} updated (${updateRate}%)`);
        }
        
        // Performance impact analysis
        console.log('\n⚡ Performance Impact Analysis:');
        console.log('   📈 Expected improvements:');
        console.log('      - Faster ingredient lookups (fewer products to search)');
        console.log('      - Higher relevance results');
        console.log('      - Better user experience');
        console.log('      - Reduced false positives');
        
    } catch (error) {
        console.error('❌ Error in smart filtering:', error);
    }
}

// Test filtering on specific problematic ingredients
async function testProblematicIngredients() {
    console.log('\n🧪 Testing Filtering on Problematic Ingredients...\n');
    
    const problematicIngredients = [
        'garlic', // 1166 products - too many
        'tomato', // 1378 products - too many  
        'onion',  // 1036 products - too many
        'flour',  // 48 products - reasonable
        'salt'    // 1273 products - too many
    ];
    
    for (const ingredient of problematicIngredients) {
        const filtering = getIngredientFilteringLevel(ingredient);
        
        console.log(`🔍 Testing "${ingredient}":`);
        console.log(`   📋 Category: ${filtering.category} (${filtering.level})`);
        console.log(`   📊 Max allowed: ${filtering.rule.maxProducts}`);
        console.log(`   📈 Min relevance: ${filtering.rule.minRelevance}`);
        console.log(`   🎯 Exact match required: ${filtering.rule.requireExactMatch}`);
        console.log('');
    }
}

// Run the smart filtering system
async function runSmartFiltering() {
    console.log('🚀 Starting Smart Filtering System...\n');
    
    await testProblematicIngredients();
    await filterProductMappings();
    
    console.log('\n🎉 Smart Filtering Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Monitor filtering results');
    console.log('2. Adjust filtering rules if needed');
    console.log('3. Implement real-time filtering in the app');
    console.log('4. Create user feedback system for filtered results');
}

runSmartFiltering().catch(console.error); 