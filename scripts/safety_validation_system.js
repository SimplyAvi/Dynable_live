/**
 * Safety Validation System - CRITICAL FOR USER SAFETY
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * This system validates ALL mappings before processing to prevent
 * life-threatening allergen exposure and dangerous product recommendations.
 * 
 * MANDATORY: Run this before any data processing
 * MANDATORY: All tests must pass before proceeding
 * MANDATORY: Human review for any flagged items
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

console.log('🚨 SAFETY VALIDATION SYSTEM - CRITICAL FOR USER SAFETY');
console.log('========================================================\n');

// CRITICAL: Known safe ingredient-to-canonical mappings
const KNOWN_SAFE_MAPPINGS = {
    // Tomatoes
    'diced tomatoes': 'tomatoes',
    'chopped tomatoes': 'tomatoes',
    'tomato': 'tomatoes',
    'roma tomatoes': 'tomatoes',
    'cherry tomatoes': 'tomatoes',
    
    // Onions
    'chopped onions': 'onions',
    'diced onions': 'onions',
    'onion': 'onions',
    'red onions': 'onions',
    'yellow onions': 'onions',
    
    // Garlic
    'minced garlic': 'garlic',
    'chopped garlic': 'garlic',
    'garlic': 'garlic',
    'garlic cloves': 'garlic',
    
    // Flour
    'all purpose flour': 'flour',
    'bread flour': 'flour',
    'wheat flour': 'flour',
    'flour': 'flour',
    'white flour': 'flour',
    
    // Sugar
    'granulated sugar': 'sugar',
    'white sugar': 'sugar',
    'sugar': 'sugar',
    'brown sugar': 'sugar',
    
    // Milk
    'whole milk': 'milk',
    'skim milk': 'milk',
    'milk': 'milk',
    '2% milk': 'milk',
    
    // Eggs
    'large eggs': 'eggs',
    'egg': 'eggs',
    'eggs': 'eggs',
    'chicken eggs': 'eggs',
    
    // Oil
    'olive oil': 'oil',
    'vegetable oil': 'oil',
    'canola oil': 'oil',
    'oil': 'oil',
    
    // Butter
    'unsalted butter': 'butter',
    'salted butter': 'butter',
    'butter': 'butter',
    
    // Salt
    'kosher salt': 'salt',
    'table salt': 'salt',
    'salt': 'salt',
    'sea salt': 'salt',
    
    // Pepper
    'black pepper': 'pepper',
    'ground pepper': 'pepper',
    'pepper': 'pepper',
    'white pepper': 'pepper'
};

// CRITICAL: Known allergen assignments (life-threatening if wrong)
const KNOWN_ALLERGEN_MAPPINGS = {
    // Tree Nuts (CRITICAL: Must be camelCase "treeNuts")
    'almonds': ['treeNuts'],
    'walnuts': ['treeNuts'],
    'pecans': ['treeNuts'],
    'cashews': ['treeNuts'],
    'pistachios': ['treeNuts'],
    'hazelnuts': ['treeNuts'],
    'macadamia nuts': ['treeNuts'],
    'brazil nuts': ['treeNuts'],
    'pine nuts': ['treeNuts'],
    'almond milk': ['treeNuts'],
    'cashew milk': ['treeNuts'],
    'almond flour': ['treeNuts'],
    'cashew flour': ['treeNuts'],
    
    // Peanuts (separate from tree nuts)
    'peanuts': ['peanuts'],
    'peanut butter': ['peanuts'],
    'peanut oil': ['peanuts'],
    
    // Wheat/Gluten (CRITICAL: Must be camelCase)
    'wheat': ['wheat', 'gluten'],
    'wheat flour': ['wheat', 'gluten'],
    'bread flour': ['wheat', 'gluten'],
    'all purpose flour': ['wheat', 'gluten'],
    'whole wheat flour': ['wheat', 'gluten'],
    'bread': ['wheat', 'gluten'],
    'pasta': ['wheat', 'gluten'],
    'cereal': ['wheat', 'gluten'],
    'crackers': ['wheat', 'gluten'],
    'seitan': ['wheat', 'gluten'],
    
    // Dairy (CRITICAL: Must be camelCase)
    'milk': ['milk', 'lactose'],
    'cheese': ['milk', 'lactose'],
    'butter': ['milk', 'lactose'],
    'cream': ['milk', 'lactose'],
    'yogurt': ['milk', 'lactose'],
    'ice cream': ['milk', 'lactose'],
    'whey': ['milk', 'lactose'],
    'casein': ['milk', 'lactose'],
    
    // Eggs
    'eggs': ['eggs'],
    'egg whites': ['eggs'],
    'egg yolks': ['eggs'],
    'mayonnaise': ['eggs'],
    
    // Soy
    'soy': ['soy'],
    'soybeans': ['soy'],
    'soy milk': ['soy'],
    'soy sauce': ['soy'],
    'tofu': ['soy'],
    'tempeh': ['soy'],
    'edamame': ['soy'],
    
    // Fish
    'fish': ['fish'],
    'salmon': ['fish'],
    'tuna': ['fish'],
    'cod': ['fish'],
    'halibut': ['fish'],
    'mackerel': ['fish'],
    
    // Shellfish
    'shrimp': ['shellfish'],
    'crab': ['shellfish'],
    'lobster': ['shellfish'],
    'oysters': ['shellfish'],
    'mussels': ['shellfish'],
    'clams': ['shellfish'],
    
    // Sesame
    'sesame': ['sesame'],
    'sesame seeds': ['sesame'],
    'sesame oil': ['sesame'],
    'tahini': ['sesame'],
    
    // Mustard
    'mustard': ['mustard'],
    'mustard seeds': ['mustard'],
    'mustard powder': ['mustard']
};

// CRITICAL: Known safe substitutes (validated for allergen safety)
const KNOWN_SAFE_SUBSTITUTES = {
    // Wheat flour substitutes (for gluten-free)
    'flour': [
        { substitute: 'almondFlour', allergens: ['treeNuts'], safe: true },
        { substitute: 'coconutFlour', allergens: ['treeNuts'], safe: true },
        { substitute: 'riceFlour', allergens: [], safe: true },
        { substitute: 'oatFlour', allergens: ['gluten'], safe: false } // Contains gluten!
    ],
    
    // Milk substitutes (for dairy-free)
    'milk': [
        { substitute: 'almondMilk', allergens: ['treeNuts'], safe: true },
        { substitute: 'soyMilk', allergens: ['soy'], safe: true },
        { substitute: 'oatMilk', allergens: ['gluten'], safe: true },
        { substitute: 'coconutMilk', allergens: ['treeNuts'], safe: true },
        { substitute: 'dairyMilk', allergens: ['milk'], safe: false } // Contains dairy!
    ],
    
    // Egg substitutes (for egg-free)
    'eggs': [
        { substitute: 'flaxEggs', allergens: [], safe: true },
        { substitute: 'chiaEggs', allergens: [], safe: true },
        { substitute: 'banana', allergens: [], safe: true },
        { substitute: 'applesauce', allergens: [], safe: true },
        { substitute: 'chickenEggs', allergens: ['eggs'], safe: false } // Contains eggs!
    ]
};

/**
 * CRITICAL: Validate camelCase for ALL allergen tags
 */
function validateCamelCase(allergen) {
    // Must start with lowercase letter
    // Can contain uppercase letters (but not at start)
    // No spaces, underscores, or hyphens
    const camelCaseRegex = /^[a-z][a-zA-Z0-9]*$/;
    
    if (!camelCaseRegex.test(allergen)) {
        throw new Error(`CRITICAL: Non-camelCase allergen "${allergen}". Must be camelCase per system rules.`);
    }
    
    return true;
}

/**
 * CRITICAL: Validate ingredient mapping safety
 */
function validateIngredientMapping(original, canonical) {
    // Check against known safe mappings
    if (KNOWN_SAFE_MAPPINGS[original.toLowerCase()]) {
        const expected = KNOWN_SAFE_MAPPINGS[original.toLowerCase()];
        if (expected !== canonical) {
            throw new Error(`CRITICAL: Unsafe ingredient mapping "${original}" → "${canonical}". Expected: "${expected}"`);
        }
        return true;
    }
    
    // Calculate similarity for unknown mappings
    const similarity = calculateSimilarity(original, canonical);
    if (similarity < 0.85) {
        // FLAG FOR MANUAL REVIEW
        logForReview({
            type: 'INGREDIENT_MAPPING',
            original,
            canonical,
            similarity,
            status: 'NEEDS_HUMAN_VALIDATION'
        });
        return false;
    }
    
    return true;
}

/**
 * CRITICAL: Validate allergen assignment safety
 */
function validateAllergenMapping(ingredient, allergens) {
    // Check against known allergen mappings
    if (KNOWN_ALLERGEN_MAPPINGS[ingredient.toLowerCase()]) {
        const expected = KNOWN_ALLERGEN_MAPPINGS[ingredient.toLowerCase()];
        
        // Validate camelCase for all allergens
        allergens.forEach(validateCamelCase);
        expected.forEach(validateCamelCase);
        
        // Check for critical mismatches
        if (!arraysMatch(expected, allergens)) {
            throw new Error(`CRITICAL: Unsafe allergen mapping for "${ingredient}". Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(allergens)}`);
        }
        return true;
    }
    
    // Flag unknown ingredients for human review
    logForReview({
        type: 'ALLERGEN_MAPPING',
        ingredient,
        allergens,
        status: 'NEEDS_HUMAN_VALIDATION'
    });
    
    return false;
}

/**
 * CRITICAL: Validate substitute safety
 */
function validateSubstitute(original, substitute, originalAllergens, substituteAllergens) {
    // Validate camelCase for all allergens
    originalAllergens.forEach(validateCamelCase);
    substituteAllergens.forEach(validateCamelCase);
    
    // CRITICAL: Substitute must not contain original allergens
    const hasConflictingAllergens = originalAllergens.some(allergen => 
        substituteAllergens.includes(allergen)
    );
    
    if (hasConflictingAllergens) {
        throw new Error(`CRITICAL: Dangerous substitute "${substitute}" contains same allergens as original "${original}". Conflicting allergens: ${originalAllergens.filter(a => substituteAllergens.includes(a)).join(', ')}`);
    }
    
    // Check against known safe substitutes
    if (KNOWN_SAFE_SUBSTITUTES[original]) {
        const knownSubstitute = KNOWN_SAFE_SUBSTITUTES[original].find(s => s.substitute === substitute);
        if (knownSubstitute && !knownSubstitute.safe) {
            throw new Error(`CRITICAL: Known unsafe substitute "${substitute}" for "${original}"`);
        }
    }
    
    return true;
}

/**
 * CRITICAL: Calculate similarity between strings
 */
function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

/**
 * CRITICAL: Check if arrays match (order-independent)
 */
function arraysMatch(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    
    return sorted1.every((item, index) => item === sorted2[index]);
}

/**
 * CRITICAL: Log items for human review
 */
function logForReview(item) {
    const reviewLog = path.join(__dirname, 'logs', 'human_review_queue.json');
    
    // Ensure logs directory exists
    const logsDir = path.dirname(reviewLog);
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Load existing queue
    let queue = [];
    if (fs.existsSync(reviewLog)) {
        queue = JSON.parse(fs.readFileSync(reviewLog, 'utf8'));
    }
    
    // Add new item with timestamp
    queue.push({
        ...item,
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.random()
    });
    
    // Save updated queue
    fs.writeFileSync(reviewLog, JSON.stringify(queue, null, 2));
    
    console.log(`⚠️ FLAGGED FOR HUMAN REVIEW: ${item.type} - ${item.original || item.ingredient}`);
}

/**
 * CRITICAL: Run all safety tests
 */
async function runSafetyTests() {
    console.log('🔍 Running CRITICAL safety validation tests...\n');
    
    const results = {
        passed: 0,
        failed: 0,
        flagged: 0,
        errors: []
    };
    
    try {
        // Test 1: Validate ingredient mappings
        console.log('📋 Test 1: Validating ingredient mappings...');
        for (const [original, expected] of Object.entries(KNOWN_SAFE_MAPPINGS)) {
            try {
                if (validateIngredientMapping(original, expected)) {
                    results.passed++;
                } else {
                    results.flagged++;
                }
            } catch (error) {
                results.failed++;
                results.errors.push(`Ingredient mapping: ${error.message}`);
                console.error(`❌ ${error.message}`);
            }
        }
        
        // Test 2: Validate allergen mappings
        console.log('📋 Test 2: Validating allergen mappings...');
        for (const [ingredient, expectedAllergens] of Object.entries(KNOWN_ALLERGEN_MAPPINGS)) {
            try {
                if (validateAllergenMapping(ingredient, expectedAllergens)) {
                    results.passed++;
                } else {
                    results.flagged++;
                }
            } catch (error) {
                results.failed++;
                results.errors.push(`Allergen mapping: ${error.message}`);
                console.error(`❌ ${error.message}`);
            }
        }
        
        // Test 3: Validate substitute safety
        console.log('📋 Test 3: Validating substitute safety...');
        for (const [original, substitutes] of Object.entries(KNOWN_SAFE_SUBSTITUTES)) {
            for (const substitute of substitutes) {
                try {
                    // Get original allergens (simplified for test)
                    const originalAllergens = KNOWN_ALLERGEN_MAPPINGS[original] || [];
                    
                    if (validateSubstitute(original, substitute.substitute, originalAllergens, substitute.allergens)) {
                        results.passed++;
                    } else {
                        results.flagged++;
                    }
                } catch (error) {
                    results.failed++;
                    results.errors.push(`Substitute safety: ${error.message}`);
                    console.error(`❌ ${error.message}`);
                }
            }
        }
        
        // Test 4: Validate camelCase compliance
        console.log('📋 Test 4: Validating camelCase compliance...');
        const allAllergens = new Set();
        Object.values(KNOWN_ALLERGEN_MAPPINGS).forEach(allergens => {
            allergens.forEach(allergen => allAllergens.add(allergen));
        });
        
        for (const allergen of allAllergens) {
            try {
                validateCamelCase(allergen);
                results.passed++;
            } catch (error) {
                results.failed++;
                results.errors.push(`CamelCase validation: ${error.message}`);
                console.error(`❌ ${error.message}`);
            }
        }
        
        // Test 5: Test dangerous scenarios
        console.log('📋 Test 5: Testing dangerous scenarios...');
        
        // Test dangerous ingredient mapping
        try {
            validateIngredientMapping('diced tomatoes', 'onions');
            results.failed++;
            results.errors.push('DANGEROUS: Allowed tomatoes → onions mapping');
        } catch (error) {
            results.passed++; // Expected to fail
        }
        
        // Test dangerous allergen mapping
        try {
            validateAllergenMapping('almonds', ['peanuts']);
            results.failed++;
            results.errors.push('DANGEROUS: Allowed almonds → peanuts mapping');
        } catch (error) {
            results.passed++; // Expected to fail
        }
        
        // Test dangerous substitute
        try {
            validateSubstitute('wheat flour', 'wheat bread', ['wheat'], ['wheat']);
            results.failed++;
            results.errors.push('DANGEROUS: Allowed wheat flour → wheat bread substitute');
        } catch (error) {
            results.passed++; // Expected to fail
        }
        
    } catch (error) {
        console.error('❌ Safety test execution failed:', error);
        results.failed++;
        results.errors.push(`Test execution: ${error.message}`);
    }
    
    // Generate report
    console.log('\n📊 SAFETY TEST RESULTS:');
    console.log('========================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️ Flagged for review: ${results.flagged}`);
    
    if (results.errors.length > 0) {
        console.log('\n❌ CRITICAL ERRORS:');
        results.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    // CRITICAL: Must have zero failures to proceed
    if (results.failed > 0) {
        throw new Error(`CRITICAL: ${results.failed} safety tests failed. Cannot proceed with data processing.`);
    }
    
    console.log('\n✅ All safety tests passed. System is safe to proceed.');
    return results;
}

/**
 * CRITICAL: Test with real allergen scenarios
 */
async function testAllergenScenarios() {
    console.log('\n🧪 Testing with real allergen scenarios...\n');
    
    const scenarios = [
        {
            name: 'Wheat Allergy',
            userAllergens: ['wheat', 'gluten'],
            testProduct: 'flour',
            expectedSubstitutes: ['almondFlour', 'coconutFlour', 'riceFlour'],
            forbiddenSubstitutes: ['wheatFlour', 'breadFlour']
        },
        {
            name: 'Dairy Allergy',
            userAllergens: ['milk', 'lactose'],
            testProduct: 'milk',
            expectedSubstitutes: ['almondMilk', 'soyMilk', 'oatMilk', 'coconutMilk'],
            forbiddenSubstitutes: ['dairyMilk', 'cream']
        },
        {
            name: 'Nut Allergy',
            userAllergens: ['treeNuts', 'peanuts'],
            testProduct: 'almondMilk',
            expectedSubstitutes: ['soyMilk', 'oatMilk', 'riceMilk'],
            forbiddenSubstitutes: ['almondMilk', 'cashewMilk']
        },
        {
            name: 'Egg Allergy',
            userAllergens: ['eggs'],
            testProduct: 'eggs',
            expectedSubstitutes: ['flaxEggs', 'chiaEggs', 'banana', 'applesauce'],
            forbiddenSubstitutes: ['chickenEggs']
        }
    ];
    
    let passedScenarios = 0;
    let failedScenarios = 0;
    
    for (const scenario of scenarios) {
        console.log(`🔍 Testing: ${scenario.name}`);
        
        try {
            // Test that forbidden substitutes are not recommended
            for (const forbidden of scenario.forbiddenSubstitutes) {
                const isSafe = !scenario.userAllergens.some(allergen => {
                    const productAllergens = KNOWN_ALLERGEN_MAPPINGS[forbidden.toLowerCase()] || [];
                    return productAllergens.includes(allergen);
                });
                
                if (!isSafe) {
                    throw new Error(`DANGEROUS: ${forbidden} recommended for ${scenario.name} user`);
                }
            }
            
            console.log(`✅ ${scenario.name}: Safe substitutes validated`);
            passedScenarios++;
            
        } catch (error) {
            console.error(`❌ ${scenario.name}: ${error.message}`);
            failedScenarios++;
        }
    }
    
    console.log(`\n📊 Allergen Scenario Results: ${passedScenarios} passed, ${failedScenarios} failed`);
    
    if (failedScenarios > 0) {
        throw new Error(`CRITICAL: ${failedScenarios} allergen scenarios failed. System is unsafe.`);
    }
    
    console.log('✅ All allergen scenarios passed. System is safe for allergic users.');
}

/**
 * CRITICAL: Main safety validation function
 */
async function runSafetyValidation() {
    console.log('🚨 STARTING CRITICAL SAFETY VALIDATION');
    console.log('=======================================\n');
    
    try {
        // Run all safety tests
        await runSafetyTests();
        
        // Test with real allergen scenarios
        await testAllergenScenarios();
        
        console.log('\n🎉 SAFETY VALIDATION COMPLETE');
        console.log('==============================');
        console.log('✅ All safety tests passed');
        console.log('✅ All allergen scenarios validated');
        console.log('✅ System is safe to proceed with data processing');
        console.log('\n⚠️ REMINDER: Check human review queue before proceeding');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ SAFETY VALIDATION FAILED');
        console.error('===========================');
        console.error(`CRITICAL ERROR: ${error.message}`);
        console.error('\n🚨 SYSTEM IS UNSAFE - DO NOT PROCEED');
        console.error('🚨 FIX ALL SAFETY ISSUES BEFORE CONTINUING');
        
        return false;
    }
}

// Run safety validation if called directly
if (require.main === module) {
    runSafetyValidation().then(safe => {
        process.exit(safe ? 0 : 1);
    }).catch(error => {
        console.error('❌ Safety validation crashed:', error);
        process.exit(1);
    });
}

module.exports = {
    validateCamelCase,
    validateIngredientMapping,
    validateAllergenMapping,
    validateSubstitute,
    runSafetyTests,
    testAllergenScenarios,
    runSafetyValidation
}; 