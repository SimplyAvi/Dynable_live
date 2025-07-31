#!/usr/bin/env node

/**
 * 🧪 CAMELCASE IMPLEMENTATION TEST SCRIPT
 * Dynable App - Validate camelCase allergen naming
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

// Test cases for camelCase conversion
const testCases = [
    // Tree nuts variations
    { input: 'tree nuts', expected: 'treeNuts', description: 'Tree nuts → treeNuts' },
    { input: 'Tree Nuts', expected: 'treeNuts', description: 'Tree Nuts → treeNuts' },
    { input: 'tree_nuts', expected: 'treeNuts', description: 'tree_nuts → treeNuts' },
    { input: 'tree-nuts', expected: 'treeNuts', description: 'tree-nuts → treeNuts' },
    { input: 'treenuts', expected: 'treeNuts', description: 'treenuts → treeNuts' },
    { input: 'nuts', expected: 'treeNuts', description: 'nuts → treeNuts' },
    
    // Free-from variations
    { input: 'gluten free', expected: 'glutenFree', description: 'gluten free → glutenFree' },
    { input: 'gluten_free', expected: 'glutenFree', description: 'gluten_free → glutenFree' },
    { input: 'gluten-free', expected: 'glutenFree', description: 'gluten-free → glutenFree' },
    { input: 'glutenfree', expected: 'glutenFree', description: 'glutenfree → glutenFree' },
    
    { input: 'dairy free', expected: 'dairyFree', description: 'dairy free → dairyFree' },
    { input: 'dairy_free', expected: 'dairyFree', description: 'dairy_free → dairyFree' },
    { input: 'dairy-free', expected: 'dairyFree', description: 'dairy-free → dairyFree' },
    { input: 'dairyfree', expected: 'dairyFree', description: 'dairyfree → dairyFree' },
    
    { input: 'egg free', expected: 'eggFree', description: 'egg free → eggFree' },
    { input: 'egg_free', expected: 'eggFree', description: 'egg_free → eggFree' },
    { input: 'egg-free', expected: 'eggFree', description: 'egg-free → eggFree' },
    { input: 'eggfree', expected: 'eggFree', description: 'eggfree → eggFree' },
    
    { input: 'soy free', expected: 'soyFree', description: 'soy free → soyFree' },
    { input: 'soy_free', expected: 'soyFree', description: 'soy_free → soyFree' },
    { input: 'soy-free', expected: 'soyFree', description: 'soy-free → soyFree' },
    { input: 'soyfree', expected: 'soyFree', description: 'soyfree → soyFree' },
    
    { input: 'nut free', expected: 'nutFree', description: 'nut free → nutFree' },
    { input: 'nut_free', expected: 'nutFree', description: 'nut_free → nutFree' },
    { input: 'nut-free', expected: 'nutFree', description: 'nut-free → nutFree' },
    { input: 'nutfree', expected: 'nutFree', description: 'nutfree → nutFree' },
    
    { input: 'fish free', expected: 'fishFree', description: 'fish free → fishFree' },
    { input: 'fish_free', expected: 'fishFree', description: 'fish_free → fishFree' },
    { input: 'fish-free', expected: 'fishFree', description: 'fish-free → fishFree' },
    { input: 'fishfree', expected: 'fishFree', description: 'fishfree → fishFree' },
    
    // Common multi-word allergens (comprehensive camelCase testing)
    { input: 'bell pepper', expected: 'bellPepper', description: 'bell pepper → bellPepper' },
    { input: 'black pepper', expected: 'blackPepper', description: 'black pepper → blackPepper' },
    { input: 'hot sauce', expected: 'hotSauce', description: 'hot sauce → hotSauce' },
    { input: 'coconut oil', expected: 'coconutOil', description: 'coconut oil → coconutOil' },
    { input: 'palm oil', expected: 'palmOil', description: 'palm oil → palmOil' },
    { input: 'sunflower oil', expected: 'sunflowerOil', description: 'sunflower oil → sunflowerOil' },
    { input: 'vegetable oil', expected: 'vegetableOil', description: 'vegetable oil → vegetableOil' },
    { input: 'olive oil', expected: 'oliveOil', description: 'olive oil → oliveOil' },
    { input: 'avocado oil', expected: 'avocadoOil', description: 'avocado oil → avocadoOil' },
    { input: 'kiwi fruit', expected: 'kiwiFruit', description: 'kiwi fruit → kiwiFruit' },
    { input: 'dragon fruit', expected: 'dragonFruit', description: 'dragon fruit → dragonFruit' },
    { input: 'passion fruit', expected: 'passionFruit', description: 'passion fruit → passionFruit' },
    { input: 'sweet potatoes', expected: 'sweetPotatoes', description: 'sweet potatoes → sweetPotatoes' },
    { input: 'yellow squash', expected: 'yellowSquash', description: 'yellow squash → yellowSquash' },
    { input: 'butternut squash', expected: 'butternutSquash', description: 'butternut squash → butternutSquash' },
    { input: 'green beans', expected: 'greenBeans', description: 'green beans → greenBeans' },
    { input: 'black beans', expected: 'blackBeans', description: 'black beans → blackBeans' },
    { input: 'pinto beans', expected: 'pintoBeans', description: 'pinto beans → pintoBeans' },
    { input: 'kidney beans', expected: 'kidneyBeans', description: 'kidney beans → kidneyBeans' },
    { input: 'navy beans', expected: 'navyBeans', description: 'navy beans → navyBeans' },
    { input: 'black eyed peas', expected: 'blackEyedPeas', description: 'black eyed peas → blackEyedPeas' },
    { input: 'split peas', expected: 'splitPeas', description: 'split peas → splitPeas' },
    { input: 'brown rice', expected: 'brownRice', description: 'brown rice → brownRice' },
    { input: 'white rice', expected: 'whiteRice', description: 'white rice → whiteRice' },
    { input: 'wild rice', expected: 'wildRice', description: 'wild rice → wildRice' },
    { input: 'greek yogurt', expected: 'greekYogurt', description: 'greek yogurt → greekYogurt' },
    { input: 'sour cream', expected: 'sourCream', description: 'sour cream → sourCream' },
    { input: 'heavy cream', expected: 'heavyCream', description: 'heavy cream → heavyCream' },
    { input: 'half and half', expected: 'halfAndHalf', description: 'half and half → halfAndHalf' },
    { input: 'whole milk', expected: 'wholeMilk', description: 'whole milk → wholeMilk' },
    { input: 'skim milk', expected: 'skimMilk', description: 'skim milk → skimMilk' },
    { input: 'almond milk', expected: 'almondMilk', description: 'almond milk → almondMilk' },
    { input: 'soy milk', expected: 'soyMilk', description: 'soy milk → soyMilk' },
    { input: 'oat milk', expected: 'oatMilk', description: 'oat milk → oatMilk' },
    { input: 'coconut milk', expected: 'coconutMilk', description: 'coconut milk → coconutMilk' },
    { input: 'rice milk', expected: 'riceMilk', description: 'rice milk → riceMilk' },
    { input: 'energy drinks', expected: 'energyDrinks', description: 'energy drinks → energyDrinks' },
    { input: 'sports drinks', expected: 'sportsDrinks', description: 'sports drinks → sportsDrinks' },
    { input: 'artificial colors', expected: 'artificialColors', description: 'artificial colors → artificialColors' },
    { input: 'food dyes', expected: 'foodDyes', description: 'food dyes → foodDyes' },
    { input: 'citric acid', expected: 'citricAcid', description: 'citric acid → citricAcid' },
    { input: 'vanilla extract', expected: 'vanillaExtract', description: 'vanilla extract → vanillaExtract' },
    
    // Single allergens (should remain as-is)
    { input: 'milk', expected: 'milk', description: 'milk → milk' },
    { input: 'eggs', expected: 'eggs', description: 'eggs → eggs' },
    { input: 'fish', expected: 'fish', description: 'fish → fish' },
    { input: 'shellfish', expected: 'shellfish', description: 'shellfish → shellfish' },
    { input: 'peanuts', expected: 'peanuts', description: 'peanuts → peanuts' },
    { input: 'wheat', expected: 'wheat', description: 'wheat → wheat' },
    { input: 'soy', expected: 'soy', description: 'soy → soy' },
    { input: 'sesame', expected: 'sesame', description: 'sesame → sesame' },
    { input: 'gluten', expected: 'gluten', description: 'gluten → gluten' },
    { input: 'lactose', expected: 'lactose', description: 'lactose → lactose' }
];

/**
 * Test database function
 */
async function testDatabaseFunction() {
    console.log('🧪 Testing database camelCase function...');
    console.log('=====================================');
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
        try {
            const { data, error } = await supabase.rpc('standardize_allergen_name', {
                allergen_input: testCase.input
            });
            
            if (error) {
                console.log(`❌ ${testCase.description}: ERROR - ${error.message}`);
                failed++;
                continue;
            }
            
            const result = data;
            const success = result === testCase.expected;
            
            if (success) {
                console.log(`✅ ${testCase.description}: ${testCase.input} → ${result}`);
                passed++;
            } else {
                console.log(`❌ ${testCase.description}: Expected ${testCase.expected}, got ${result}`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${testCase.description}: EXCEPTION - ${error.message}`);
            failed++;
        }
    }
    
    console.log('\n📊 Database Function Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    return { passed, failed };
}

/**
 * Test JavaScript function
 */
function testJavaScriptFunction() {
    console.log('\n🧪 Testing JavaScript camelCase function...');
    console.log('==========================================');
    
    // Import the JavaScript function (simulate it)
    const toCamelCase = (str) => {
        if (!str || typeof str !== 'string') return '';
        
        return str
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
    };
    
    const standardizeAllergen = (allergen) => {
        if (!allergen || typeof allergen !== 'string') {
            return null;
        }
        
        // Clean input: lowercase, remove extra spaces
        const cleaned = allergen.toLowerCase().trim().replace(/\s+/g, ' ');
        
        // EXACT mappings (must match database function)
        const mappings = {
            'tree nuts': 'treeNuts',
            'tree_nuts': 'treeNuts', 
            'tree-nuts': 'treeNuts',
            'treenuts': 'treeNuts',
            'nuts': 'treeNuts',
            
            'gluten free': 'glutenFree',
            'gluten_free': 'glutenFree',
            'gluten-free': 'glutenFree', 
            'glutenfree': 'glutenFree',
            
            'dairy free': 'dairyFree',
            'dairy_free': 'dairyFree',
            'dairy-free': 'dairyFree',
            'dairyfree': 'dairyFree',
            
            'egg free': 'eggFree',
            'egg_free': 'eggFree', 
            'egg-free': 'eggFree',
            'eggfree': 'eggFree',
            
            'soy free': 'soyFree',
            'soy_free': 'soyFree',
            'soy-free': 'soyFree',
            'soyfree': 'soyFree',
            
            'nut free': 'nutFree',
            'nut_free': 'nutFree',
            'nut-free': 'nutFree', 
            'nutfree': 'nutFree',
            
            'fish free': 'fishFree',
            'fish_free': 'fishFree',
            'fish-free': 'fishFree',
            'fishfree': 'fishFree'
        };
        
        return mappings[cleaned] || toCamelCase(cleaned);
    };
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
        try {
            const result = standardizeAllergen(testCase.input);
            const success = result === testCase.expected;
            
            if (success) {
                console.log(`✅ ${testCase.description}: ${testCase.input} → ${result}`);
                passed++;
            } else {
                console.log(`❌ ${testCase.description}: Expected ${testCase.expected}, got ${result}`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${testCase.description}: EXCEPTION - ${error.message}`);
            failed++;
        }
    }
    
    console.log('\n📊 JavaScript Function Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    return { passed, failed };
}

/**
 * Test validation rules
 */
function testValidationRules() {
    console.log('\n🧪 Testing validation rules...');
    console.log('=============================');
    
    const isCamelCase = (allergen) => {
        // Must start with lowercase, can contain uppercase, no spaces/underscores
        return /^[a-z][a-zA-Z0-9]*$/.test(allergen);
    };
    
    const validAllergens = [
        'milk', 'eggs', 'fish', 'shellfish', 'treeNuts', 'peanuts', 
        'wheat', 'soy', 'sesame', 'gluten', 'lactose',
        'glutenFree', 'dairyFree', 'eggFree', 'soyFree', 'nutFree', 'fishFree'
    ];
    
    const testValidationCases = [
        { input: 'treeNuts', expected: true, description: 'Valid camelCase' },
        { input: 'glutenFree', expected: true, description: 'Valid camelCase' },
        { input: 'tree_nuts', expected: false, description: 'Invalid underscore' },
        { input: 'tree nuts', expected: false, description: 'Invalid space' },
        { input: 'TreeNuts', expected: false, description: 'Invalid uppercase start' },
        { input: 'treenuts', expected: false, description: 'Invalid lowercase' },
        { input: 'tree-nuts', expected: false, description: 'Invalid hyphen' }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testValidationCases) {
        const isValid = isCamelCase(testCase.input) && validAllergens.includes(testCase.input);
        const success = isValid === testCase.expected;
        
        if (success) {
            console.log(`✅ ${testCase.description}: ${testCase.input} → ${isValid}`);
            passed++;
        } else {
            console.log(`❌ ${testCase.description}: Expected ${testCase.expected}, got ${isValid}`);
            failed++;
        }
    }
    
    console.log('\n📊 Validation Rules Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    return { passed, failed };
}

/**
 * Main test function
 */
async function runTests() {
    console.log('🚨 CAMELCASE IMPLEMENTATION TEST');
    console.log('================================');
    console.log('Testing database and JavaScript camelCase implementation...\n');
    
    try {
        // Test database function
        const dbResults = await testDatabaseFunction();
        
        // Test JavaScript function
        const jsResults = testJavaScriptFunction();
        
        // Test validation rules
        const validationResults = testValidationRules();
        
        // Summary
        console.log('\n🎯 OVERALL RESULTS:');
        console.log('==================');
        console.log(`Database Function: ${dbResults.passed}/${dbResults.passed + dbResults.failed} passed`);
        console.log(`JavaScript Function: ${jsResults.passed}/${jsResults.passed + jsResults.failed} passed`);
        console.log(`Validation Rules: ${validationResults.passed}/${validationResults.passed + validationResults.failed} passed`);
        
        const totalPassed = dbResults.passed + jsResults.passed + validationResults.passed;
        const totalTests = (dbResults.passed + dbResults.failed) + (jsResults.passed + jsResults.failed) + (validationResults.passed + validationResults.failed);
        
        console.log(`\n📊 TOTAL: ${totalPassed}/${totalTests} tests passed`);
        console.log(`📈 OVERALL SUCCESS RATE: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
        
        if (totalPassed === totalTests) {
            console.log('\n🎉 ALL TESTS PASSED! CamelCase implementation is working correctly.');
        } else {
            console.log('\n❌ SOME TESTS FAILED! Please check the implementation.');
        }
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests }; 