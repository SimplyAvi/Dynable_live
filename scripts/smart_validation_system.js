const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Smart validation categories based on ingredient context
const INGREDIENT_CATEGORIES = {
    // Core ingredients - should have strict validation
    FRUITS: ['apple', 'banana', 'orange', 'strawberry', 'blueberry', 'raspberry', 'peach', 'mango', 'pineapple', 'grape', 'cherry', 'lemon', 'lime', 'tomato', 'avocado'],
    VEGETABLES: ['onion', 'garlic', 'carrot', 'celery', 'bell pepper', 'mushroom', 'spinach', 'lettuce', 'cucumber', 'zucchini', 'squash', 'potato', 'sweet potato'],
    PROTEINS: ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'salmon', 'tuna', 'egg', 'tofu', 'beans', 'lentils'],
    DAIRY: ['milk', 'cheese', 'yogurt', 'cream', 'butter', 'sour cream', 'cream cheese'],
    GRAINS: ['flour', 'rice', 'pasta', 'bread', 'oats', 'quinoa', 'couscous'],
    
    // Processed ingredients - more flexible validation
    CONDIMENTS: ['salt', 'pepper', 'sugar', 'honey', 'vinegar', 'oil', 'soy sauce', 'mustard', 'ketchup', 'mayonnaise'],
    SPICES: ['cinnamon', 'nutmeg', 'oregano', 'basil', 'thyme', 'rosemary', 'cumin', 'paprika', 'cayenne'],
    BAKING: ['baking powder', 'baking soda', 'vanilla', 'chocolate', 'cocoa', 'nuts', 'raisins'],
    
    // Generic ingredients - very flexible validation
    GENERIC: ['water', 'broth', 'stock', 'sauce', 'dressing', 'marinade', 'seasoning']
};

// Validation rules based on ingredient type
const VALIDATION_RULES = {
    STRICT: {
        maxProducts: 50,        // Maximum products allowed
        minRelevance: 0.7,      // Minimum relevance score
        requireExactMatch: true, // Require exact ingredient name match
        categoryRestriction: true // Restrict to same category
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

// Get ingredient category and validation level
function getIngredientValidationLevel(ingredient) {
    const cleanIngredient = ingredient.toLowerCase().trim();
    
    // Check each category
    for (const [category, ingredients] of Object.entries(INGREDIENT_CATEGORIES)) {
        for (const categoryIngredient of ingredients) {
            if (cleanIngredient.includes(categoryIngredient)) {
                if (['FRUITS', 'VEGETABLES', 'PROTEINS'].includes(category)) {
                    return { category, level: 'STRICT', rule: VALIDATION_RULES.STRICT };
                } else if (['DAIRY', 'GRAINS'].includes(category)) {
                    return { category, level: 'MODERATE', rule: VALIDATION_RULES.MODERATE };
                } else {
                    return { category, level: 'FLEXIBLE', rule: VALIDATION_RULES.FLEXIBLE };
                }
            }
        }
    }
    
    // Default to flexible for unknown ingredients
    return { category: 'UNKNOWN', level: 'FLEXIBLE', rule: VALIDATION_RULES.FLEXIBLE };
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
    
    // No match
    return 0.0;
}

// Smart validation of product mappings
async function validateProductMappings() {
    console.log('🧠 Starting Smart Validation System...');
    console.log('📋 Using recipe ingredient context for validation\n');
    
    try {
        // Get sample ingredient mappings for testing
        const { data: ingredientMappings, error } = await supabase
            .from('IngredientCanonical')
            .select('canonical_ingredient, matching_products')
            .limit(20);
        
        if (error) {
            console.error('❌ Error fetching ingredient mappings:', error);
            return;
        }
        
        console.log(`📊 Analyzing ${ingredientMappings.length} ingredient mappings...\n`);
        
        let totalValidated = 0;
        let totalPassed = 0;
        let totalFailed = 0;
        let categoryStats = {};
        
        for (const mapping of ingredientMappings) {
            const { canonical_ingredient, matching_products } = mapping;
            
            if (!matching_products || matching_products.length === 0) {
                continue;
            }
            
            // Get validation level for this ingredient
            const validation = getIngredientValidationLevel(canonical_ingredient);
            
            // Initialize category stats
            if (!categoryStats[validation.category]) {
                categoryStats[validation.category] = { total: 0, passed: 0, failed: 0 };
            }
            categoryStats[validation.category].total++;
            
            console.log(`🔍 Validating "${canonical_ingredient}" (${validation.level} level)`);
            console.log(`   📋 Category: ${validation.category}`);
            console.log(`   📊 Current products: ${matching_products.length}`);
            
            // Get product details for validation
            const { data: products, error: productError } = await supabase
                .from('IngredientCategorized')
                .select('id, description')
                .in('id', matching_products.slice(0, 50)); // Limit for performance
            
            if (productError) {
                console.error(`   ❌ Error fetching products:`, productError);
                continue;
            }
            
            // Validate each product
            const validProducts = [];
            const invalidProducts = [];
            
            for (const product of products) {
                const relevanceScore = calculateRelevanceScore(canonical_ingredient, product.description);
                
                // Apply validation rules
                const isValid = (
                    matching_products.length <= validation.rule.maxProducts &&
                    relevanceScore >= validation.rule.minRelevance &&
                    (!validation.rule.requireExactMatch || relevanceScore === 1.0)
                );
                
                if (isValid) {
                    validProducts.push({ id: product.id, score: relevanceScore });
                } else {
                    invalidProducts.push({ id: product.id, score: relevanceScore });
                }
            }
            
            // Report results
            const passed = validProducts.length;
            const failed = invalidProducts.length;
            
            console.log(`   ✅ Valid products: ${passed}`);
            console.log(`   ❌ Invalid products: ${failed}`);
            console.log(`   📈 Average relevance: ${(validProducts.reduce((sum, p) => sum + p.score, 0) / Math.max(validProducts.length, 1)).toFixed(2)}`);
            
            if (failed > 0) {
                console.log(`   🚨 Validation issues found!`);
                console.log(`      - Max allowed: ${validation.rule.maxProducts}`);
                console.log(`      - Min relevance: ${validation.rule.minRelevance}`);
                console.log(`      - Exact match required: ${validation.rule.requireExactMatch}`);
            }
            
            console.log('');
            
            // Update stats
            totalValidated++;
            if (failed === 0) {
                totalPassed++;
                categoryStats[validation.category].passed++;
            } else {
                totalFailed++;
                categoryStats[validation.category].failed++;
            }
        }
        
        // Final report
        console.log('📊 Smart Validation Summary:');
        console.log(`   📋 Total ingredients validated: ${totalValidated}`);
        console.log(`   ✅ Passed validation: ${totalPassed} (${((totalPassed/totalValidated)*100).toFixed(1)}%)`);
        console.log(`   ❌ Failed validation: ${totalFailed} (${((totalFailed/totalValidated)*100).toFixed(1)}%)`);
        
        console.log('\n📈 Category Breakdown:');
        for (const [category, stats] of Object.entries(categoryStats)) {
            const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
            console.log(`   ${category}: ${stats.passed}/${stats.total} (${passRate}%)`);
        }
        
        // Recommendations
        console.log('\n💡 Smart Validation Recommendations:');
        if (totalFailed > 0) {
            console.log('   🔧 Consider implementing automatic filtering for:');
            console.log('      - High-product-count ingredients (>100 products)');
            console.log('      - Low-relevance matches (<0.5 score)');
            console.log('      - Category mismatches');
        } else {
            console.log('   ✅ All tested ingredients passed validation!');
        }
        
    } catch (error) {
        console.error('❌ Error in smart validation:', error);
    }
}

// Test specific ingredient scenarios
async function testSpecificScenarios() {
    console.log('\n🧪 Testing Specific Validation Scenarios...\n');
    
    const testCases = [
        { ingredient: 'tomato', expectedCategory: 'VEGETABLES', expectedLevel: 'STRICT' },
        { ingredient: 'flour', expectedCategory: 'GRAINS', expectedLevel: 'MODERATE' },
        { ingredient: 'salt', expectedCategory: 'CONDIMENTS', expectedLevel: 'FLEXIBLE' },
        { ingredient: 'watermelon gum', expectedCategory: 'UNKNOWN', expectedLevel: 'FLEXIBLE' }
    ];
    
    for (const testCase of testCases) {
        const validation = getIngredientValidationLevel(testCase.ingredient);
        
        console.log(`🔍 Testing "${testCase.ingredient}":`);
        console.log(`   Expected: ${testCase.expectedCategory} (${testCase.expectedLevel})`);
        console.log(`   Actual: ${validation.category} (${validation.level})`);
        console.log(`   ✅ Match: ${validation.category === testCase.expectedCategory && validation.level === testCase.expectedLevel ? 'YES' : 'NO'}`);
        console.log('');
    }
}

// Run the smart validation system
async function runSmartValidation() {
    console.log('🚀 Starting Smart Validation System...\n');
    
    await testSpecificScenarios();
    await validateProductMappings();
    
    console.log('\n🎉 Smart Validation Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Review validation results');
    console.log('2. Implement automatic filtering for failed validations');
    console.log('3. Create user-facing validation feedback');
    console.log('4. Monitor validation performance over time');
}

runSmartValidation().catch(console.error); 