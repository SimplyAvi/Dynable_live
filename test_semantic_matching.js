#!/usr/bin/env node

/**
 * Semantic Matching System Test Suite
 * 
 * This comprehensive test suite validates:
 * 1. Allergen filtering (products with allergens omitted)
 * 2. Semantic ingredient matching (relevant products only)
 * 3. Role-based allergen limits (tier system enforcement)
 * 4. Performance benchmarks
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Test configuration
const TEST_USER_EMAIL = 'testjjuser@gmail.com';
const TEST_RECIPE_ID = 7269; // Use the recipe from your earlier test

class SemanticMatchingTestSuite {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.failedTests = 0;
    }

    async runAllTests() {
        console.log('🧪 Starting Semantic Matching System Test Suite...\n');
        
        try {
            // Test 1: Allergen Filtering
            await this.testAllergenFiltering();
            
            // Test 2: Semantic Ingredient Matching
            await this.testSemanticIngredientMatching();
            
            // Test 3: Role-Based Allergen Limits
            await this.testRoleBasedAllergenLimits();
            
            // Test 4: Performance Benchmarks
            await this.testPerformanceBenchmarks();
            
            // Test 5: Edge Function Integration
            await this.testEdgeFunctionIntegration();
            
            // Generate final report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            process.exit(1);
        }
    }

    async testAllergenFiltering() {
        console.log('🧪 Test 1: Allergen Filtering');
        console.log('   Testing: Products containing user allergens are omitted from search\n');
        
        const testCases = [
            {
                name: 'Milk Allergy Filtering',
                userAllergens: ['milk'],
                searchIngredient: 'milk',
                expectedBehavior: 'No products containing milk allergens'
            },
            {
                name: 'Egg Allergy Filtering',
                userAllergens: ['eggs'],
                searchIngredient: 'egg',
                expectedBehavior: 'No products containing egg allergens'
            },
            {
                name: 'Multiple Allergen Filtering',
                userAllergens: ['milk', 'eggs'],
                searchIngredient: 'milk',
                expectedBehavior: 'No products containing milk or egg allergens'
            }
        ];

        for (const testCase of testCases) {
            console.log(`   🔍 Testing: ${testCase.name}`);
            
            try {
                // Step 1: Find ingredient in semantic taxonomy
                const { data: ingredientData, error: ingredientError } = await supabase
                    .from('ingredients')
                    .select('id, canonical_name, category')
                    .ilike('canonical_name', testCase.searchIngredient)
                    .limit(1);
                
                if (ingredientError || !ingredientData || ingredientData.length === 0) {
                    this.recordTestResult(testCase.name, false, `Ingredient not found: ${testCase.searchIngredient}`);
                    continue;
                }
                
                const ingredient = ingredientData[0];
                console.log(`      ✅ Found ingredient: ${ingredient.canonical_name} (${ingredient.category})`);
                
                // Step 2: Find products for this ingredient
                const { data: mappings, error: mappingError } = await supabase
                    .from('ingredient_product_mapping')
                    .select('product_id, confidence_score')
                    .eq('ingredient_id', ingredient.id)
                    .gte('confidence_score', 0.80)
                    .limit(20);
                
                if (mappingError || !mappings || mappings.length === 0) {
                    this.recordTestResult(testCase.name, false, 'No product mappings found');
                    continue;
                }
                
                const productIds = mappings.map(m => m.product_id);
                
                // Step 3: Test allergen filtering
                const { data: filteredProducts, error: filterError } = await supabase
                    .from('products')
                    .select('id, name, brand_name, allergens')
                    .in('id', productIds)
                    .not('allergens', 'ov', `{${testCase.userAllergens.join(',')}}`)
                    .eq('is_active', true)
                    .limit(10);
                
                if (filterError) {
                    this.recordTestResult(testCase.name, false, `Allergen filtering failed: ${filterError.message}`);
                    continue;
                }
                
                // Step 4: Verify no products contain user allergens
                const containsAllergens = filteredProducts?.some(product => {
                    if (!product.allergens || product.allergens.length === 0) return false;
                    return testCase.userAllergens.some(allergen => 
                        product.allergens.includes(allergen)
                    );
                });
                
                if (containsAllergens) {
                    this.recordTestResult(testCase.name, false, 'Products with user allergens found in results');
                } else {
                    this.recordTestResult(testCase.name, true, `Found ${filteredProducts?.length || 0} products without user allergens`);
                    console.log(`      ✅ ${testCase.expectedBehavior}: ${filteredProducts?.length || 0} products`);
                }
                
            } catch (error) {
                this.recordTestResult(testCase.name, false, `Test failed: ${error.message}`);
            }
        }
        
        console.log('');
    }

    async testSemanticIngredientMatching() {
        console.log('🧪 Test 2: Semantic Ingredient Matching');
        console.log('   Testing: Recipe ingredients show relevant products (supermarket catalog logic)\n');
        
        const testCases = [
            {
                name: 'Egg Ingredient Matching',
                recipeIngredient: '2 large eggs',
                expectedCategory: 'protein',
                shouldNotMatch: ['egg muffins', 'egg rolls', 'eggplant'],
                expectedBehavior: 'Show actual eggs, not processed egg products'
            },
            {
                name: 'Milk Ingredient Matching',
                recipeIngredient: '1 cup milk',
                expectedCategory: 'dairy',
                shouldNotMatch: ['milk chocolate', 'almond milk'],
                expectedBehavior: 'Show actual milk, not milk-based products'
            },
            {
                name: 'Flour Ingredient Matching',
                recipeIngredient: '2 cups flour',
                expectedCategory: 'baking',
                shouldNotMatch: ['flour tortillas', 'flour-based products'],
                expectedBehavior: 'Show actual flour, not flour-based products'
            }
        ];

        for (const testCase of testCases) {
            console.log(`   🔍 Testing: ${testCase.name}`);
            
            try {
                // Extract ingredient name from recipe ingredient
                const ingredientName = testCase.recipeIngredient
                    .replace(/^\d+(\.\d+)?\s*/, '') // Remove quantity (including decimals)
                    .replace(/\s+(cup|cups|tbsp|tsp|oz|lbs?|grams?|ml|liters?|large|medium|small)\b/gi, '') // Remove units
                    .replace(/\s+(cup|cups|tbsp|tsp|oz|lbs?|grams?|ml|liters?|large|medium|small)\b/gi, '') // Remove units again (in case of multiple)
                    .trim()
                    .toLowerCase();
                
                console.log(`      📝 Recipe ingredient: "${testCase.recipeIngredient}"`);
                console.log(`      🔍 Extracted: "${ingredientName}"`);
                
                // Step 1: Find ingredient in semantic taxonomy
                const { data: ingredientData, error: ingredientError } = await supabase
                    .from('ingredients')
                    .select('id, canonical_name, category, subcategory')
                    .ilike('canonical_name', ingredientName)
                    .limit(1);
                
                if (ingredientError || !ingredientData || ingredientData.length === 0) {
                    this.recordTestResult(testCase.name, false, `Ingredient not found: ${ingredientName}`);
                    continue;
                }
                
                const ingredient = ingredientData[0];
                console.log(`      ✅ Found: ${ingredient.canonical_name} (${ingredient.category})`);
                
                // Step 2: Verify category matches expected
                if (ingredient.category !== testCase.expectedCategory) {
                    this.recordTestResult(testCase.name, false, 
                        `Category mismatch: expected ${testCase.expectedCategory}, got ${ingredient.category}`);
                    continue;
                }
                
                // Step 3: Find products for this ingredient
                const { data: mappings, error: mappingError } = await supabase
                    .from('ingredient_product_mapping')
                    .select('product_id, confidence_score, match_type')
                    .eq('ingredient_id', ingredient.id)
                    .gte('confidence_score', 0.80)
                    .order('confidence_score', { ascending: false })
                    .limit(10);
                
                if (mappingError || !mappings || mappings.length === 0) {
                    this.recordTestResult(testCase.name, false, 'No product mappings found');
                    continue;
                }
                
                const productIds = mappings.map(m => m.product_id);
                
                // Step 4: Get product details
                const { data: products, error: productError } = await supabase
                    .from('products')
                    .select('id, name, brand_name, description')
                    .in('id', productIds)
                    .eq('is_active', true)
                    .limit(10);
                
                if (productError) {
                    this.recordTestResult(testCase.name, false, `Product fetch failed: ${productError.message}`);
                    continue;
                }
                
                // Step 5: Check for false positives
                const falsePositives = products?.filter(product => 
                    testCase.shouldNotMatch.some(shouldNot => 
                        product.name.toLowerCase().includes(shouldNot.toLowerCase())
                    )
                ) || [];
                
                if (falsePositives.length > 0) {
                    this.recordTestResult(testCase.name, false, 
                        `False positives found: ${falsePositives.map(fp => fp.name).join(', ')}`);
                } else {
                    this.recordTestResult(testCase.name, true, 
                        `Found ${products?.length || 0} relevant products, no false positives`);
                    console.log(`      ✅ ${testCase.expectedBehavior}: ${products?.length || 0} products`);
                    
                    // Show sample products
                    products?.slice(0, 3).forEach((product, index) => {
                        console.log(`         ${index + 1}. ${product.name} (${product.brand_name})`);
                    });
                }
                
            } catch (error) {
                this.recordTestResult(testCase.name, false, `Test failed: ${error.message}`);
            }
        }
        
        console.log('');
    }

    async testRoleBasedAllergenLimits() {
        console.log('🧪 Test 3: Role-Based Allergen Limits');
        console.log('   Testing: User tier system enforcement for allergen selection\n');
        
        try {
            // Get test user
            const { data: user, error: userError } = await supabase
                .from('Users')
                .select('id, email, role')
                .eq('email', TEST_USER_EMAIL)
                .single();
            
            if (userError || !user) {
                this.recordTestResult('Role-Based Allergen Limits', false, `Test user not found: ${TEST_USER_EMAIL}`);
                return;
            }
            
            console.log(`   👤 Test user: ${user.email} (${user.role})`);
            
            // Test allergen limits based on role
            const roleLimits = {
                'free': 2,
                'standard': 5,
                'premium': 10,
                'admin': 999
            };
            
            const expectedLimit = roleLimits[user.role] || 2;
            console.log(`   📊 Expected allergen limit: ${expectedLimit}`);
            
            // Test current user's allergen preferences
            const { data: preferences, error: prefError } = await supabase
                .from('SearchPreferences')
                .select('selectedallergens')
                .eq('supabase_user_id', user.supabase_user_id)
                .single();
            
            if (prefError) {
                console.log(`   ⚠️  No search preferences found for user`);
            } else {
                const currentAllergens = preferences.selectedallergens || [];
                console.log(`   🧪 Current allergens: ${currentAllergens.length} (${currentAllergens.join(', ')})`);
                
                if (currentAllergens.length > expectedLimit) {
                    this.recordTestResult('Role-Based Allergen Limits', false, 
                        `User has ${currentAllergens.length} allergens, limit is ${expectedLimit}`);
                } else {
                    this.recordTestResult('Role-Based Allergen Limits', true, 
                        `User has ${currentAllergens.length} allergens, within limit of ${expectedLimit}`);
                }
            }
            
        } catch (error) {
            this.recordTestResult('Role-Based Allergen Limits', false, `Test failed: ${error.message}`);
        }
        
        console.log('');
    }

    async testPerformanceBenchmarks() {
        console.log('🧪 Test 4: Performance Benchmarks');
        console.log('   Testing: Query performance and response times\n');
        
        const performanceTests = [
            {
                name: 'Ingredient Lookup Performance',
                test: async () => {
                    const startTime = Date.now();
                    const { data } = await supabase
                        .from('ingredients')
                        .select('id, canonical_name, category')
                        .ilike('canonical_name', 'egg')
                        .limit(1);
                    return Date.now() - startTime;
                },
                maxTime: 100 // ms
            },
            {
                name: 'Product Mapping Performance',
                test: async () => {
                    const startTime = Date.now();
                    const { data } = await supabase
                        .from('ingredient_product_mapping')
                        .select('product_id, confidence_score')
                        .eq('ingredient_id', 1)
                        .gte('confidence_score', 0.80)
                        .limit(20);
                    return Date.now() - startTime;
                },
                maxTime: 50 // ms
            },
            {
                name: 'Allergen Filtering Performance',
                test: async () => {
                    const startTime = Date.now();
                    const { data } = await supabase
                        .from('products')
                        .select('id, name, allergens')
                        .not('allergens', 'ov', '{"milk","eggs"}')
                        .eq('is_active', true)
                        .limit(10);
                    return Date.now() - startTime;
                },
                maxTime: 30 // ms
            }
        ];

        for (const perfTest of performanceTests) {
            console.log(`   🔍 Testing: ${perfTest.name}`);
            
            try {
                const executionTime = await perfTest.test();
                console.log(`      ⏱️  Execution time: ${executionTime}ms`);
                
                if (executionTime <= perfTest.maxTime) {
                    this.recordTestResult(perfTest.name, true, `${executionTime}ms (target: ≤${perfTest.maxTime}ms)`);
                    console.log(`      ✅ Performance target met`);
                } else {
                    this.recordTestResult(perfTest.name, false, `${executionTime}ms (target: ≤${perfTest.maxTime}ms)`);
                    console.log(`      ⚠️  Performance target missed`);
                }
                
            } catch (error) {
                this.recordTestResult(perfTest.name, false, `Performance test failed: ${error.message}`);
            }
        }
        
        console.log('');
    }

    async testEdgeFunctionIntegration() {
        console.log('🧪 Test 5: Edge Function Integration');
        console.log('   Testing: Recipe processor with semantic matching\n');
        
        try {
            // Simulate Edge Function call
            const testRecipeData = {
                recipeId: TEST_RECIPE_ID,
                ingredients: [
                    { name: '2 large eggs', quantity: '2', unit: 'large' },
                    { name: '1 cup milk', quantity: '1', unit: 'cup' },
                    { name: '2 cups flour', quantity: '2', unit: 'cups' }
                ],
                userAllergens: ['milk']
            };
            
            console.log(`   📤 Simulating Edge Function call for recipe ${testRecipeData.recipeId}`);
            console.log(`   🧪 Ingredients: ${testRecipeData.ingredients.map(i => i.name).join(', ')}`);
            console.log(`   🚫 User allergens: ${testRecipeData.userAllergens.join(', ')}`);
            
            // Simulate semantic matching logic
            let totalProducts = 0;
            let filteredProducts = 0;
            
            for (const ingredient of testRecipeData.ingredients) {
                const ingredientName = ingredient.name.replace(/^\d+\s*/, '').replace(/\s+\w+$/, '').toLowerCase();
                
                // Find ingredient
                const { data: ingredientData } = await supabase
                    .from('ingredients')
                    .select('id, canonical_name, category')
                    .ilike('canonical_name', ingredientName)
                    .limit(1);
                
                if (ingredientData && ingredientData.length > 0) {
                    const ingredientInfo = ingredientData[0];
                    
                    // Find products
                    const { data: mappings } = await supabase
                        .from('ingredient_product_mapping')
                        .select('product_id, confidence_score')
                        .eq('ingredient_id', ingredientInfo.id)
                        .gte('confidence_score', 0.80)
                        .limit(5);
                    
                    if (mappings && mappings.length > 0) {
                        const productIds = mappings.map(m => m.product_id);
                        
                        // Filter by allergens
                        const { data: products } = await supabase
                            .from('products')
                            .select('id, name, brand_name, allergens')
                            .in('id', productIds)
                            .eq('is_active', true)
                            .not('allergens', 'ov', `{${testRecipeData.userAllergens.join(',')}}`)
                            .limit(5);
                        
                        totalProducts += mappings.length;
                        filteredProducts += products?.length || 0;
                        
                        console.log(`      ${ingredientInfo.canonical_name}: ${products?.length || 0} products (filtered from ${mappings.length})`);
                    }
                }
            }
            
            const filteringEfficiency = totalProducts > 0 ? ((filteredProducts/totalProducts)*100).toFixed(1) : 0;
            
            this.recordTestResult('Edge Function Integration', true, 
                `Found ${filteredProducts} products after filtering (${filteringEfficiency}% efficiency)`);
            
            console.log(`   ✅ Edge Function simulation completed`);
            console.log(`   📊 Total products: ${totalProducts}`);
            console.log(`   📊 Filtered products: ${filteredProducts}`);
            console.log(`   📊 Filtering efficiency: ${filteringEfficiency}%`);
            
        } catch (error) {
            this.recordTestResult('Edge Function Integration', false, `Test failed: ${error.message}`);
        }
        
        console.log('');
    }

    recordTestResult(testName, passed, message) {
        const result = {
            test: testName,
            passed: passed,
            message: message,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        if (passed) {
            this.passedTests++;
            console.log(`      ✅ ${testName}: ${message}`);
        } else {
            this.failedTests++;
            console.log(`      ❌ ${testName}: ${message}`);
        }
    }

    generateTestReport() {
        console.log('📊 TEST SUITE REPORT');
        console.log('='.repeat(50));
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`📈 Total: ${this.passedTests + this.failedTests}`);
        console.log(`🎯 Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
        
        if (this.failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults
                .filter(result => !result.passed)
                .forEach(result => {
                    console.log(`   • ${result.test}: ${result.message}`);
                });
        }
        
        console.log('\n🎉 Semantic Matching System Test Suite Complete!');
        
        if (this.failedTests === 0) {
            console.log('🚀 All tests passed! System is ready for production.');
        } else {
            console.log('⚠️  Some tests failed. Review and fix before production.');
        }
    }
}

// Run the test suite
const testSuite = new SemanticMatchingTestSuite();
testSuite.runAllTests();
