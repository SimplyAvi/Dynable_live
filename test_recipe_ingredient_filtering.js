#!/usr/bin/env node

/**
 * Recipe Ingredient Filtering Test Suite
 * 
 * This test suite validates:
 * 1. Recipe ingredients show relevant products (semantic matching)
 * 2. Allergen filtering works correctly (products with allergens omitted)
 * 3. Different ingredient types (eggs, milk, wheat) work properly
 * 4. Real recipe data integration
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

class RecipeIngredientTestSuite {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.failedTests = 0;
    }

    async runAllTests() {
        console.log('🧪 Starting Recipe Ingredient Filtering Test Suite...\n');
        
        try {
            // Test 1: Find recipes with eggs
            await this.testEggRecipes();
            
            // Test 2: Find recipes with milk
            await this.testMilkRecipes();
            
            // Test 3: Find recipes with wheat
            await this.testWheatRecipes();
            
            // Test 4: Allergen filtering validation
            await this.testAllergenFiltering();
            
            // Generate final report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            process.exit(1);
        }
    }

    async testEggRecipes() {
        console.log('🥚 Test 1: Egg Recipe Ingredient Matching');
        console.log('   Testing: Recipes with eggs show relevant egg products\n');
        
        try {
            // Find recipes that contain eggs
            const { data: eggRecipes, error: recipeError } = await supabase
                .from('RecipeIngredients')
                .select(`
                    RecipeId,
                    name,
                    quantity,
                    Recipes!inner(title, id)
                `)
                .ilike('name', '%egg%')
                .limit(3);
            
            if (recipeError || !eggRecipes || eggRecipes.length === 0) {
                this.recordTestResult('Egg Recipe Finding', false, 'No egg recipes found');
                return;
            }
            
            console.log(`   📋 Found ${eggRecipes.length} egg recipes:`);
            eggRecipes.forEach((recipe, index) => {
                console.log(`      ${index + 1}. ${recipe.Recipes.title} - "${recipe.name}"`);
            });
            
            // Test semantic matching for each egg recipe
            for (const eggRecipe of eggRecipes) {
                console.log(`\n   🔍 Testing recipe: ${eggRecipe.Recipes.title}`);
                console.log(`      Ingredient: "${eggRecipe.name}"`);
                
                // Extract ingredient name
                const ingredientName = this.extractIngredientName(eggRecipe.name);
                console.log(`      Extracted: "${ingredientName}"`);
                
                // Find semantic ingredient
                const { data: ingredientData, error: ingredientError } = await supabase
                    .from('ingredients')
                    .select('id, canonical_name, category')
                    .ilike('canonical_name', ingredientName)
                    .limit(1);
                
                if (ingredientError || !ingredientData || ingredientData.length === 0) {
                    this.recordTestResult(`Egg Recipe - ${eggRecipe.Recipes.title}`, false, `Ingredient not found: ${ingredientName}`);
                    continue;
                }
                
                const ingredient = ingredientData[0];
                console.log(`      ✅ Found ingredient: ${ingredient.canonical_name} (${ingredient.category})`);
                
                // Find products for this ingredient
                const { data: mappings, error: mappingError } = await supabase
                    .from('ingredient_product_mapping')
                    .select('product_id, confidence_score')
                    .eq('ingredient_id', ingredient.id)
                    .gte('confidence_score', 0.80)
                    .limit(10);
                
                if (mappingError || !mappings || mappings.length === 0) {
                    this.recordTestResult(`Egg Recipe - ${eggRecipe.Recipes.title}`, false, 'No product mappings found');
                    continue;
                }
                
                const productIds = mappings.map(m => m.product_id);
                
                // Get product details
                const { data: products, error: productError } = await supabase
                    .from('products')
                    .select('id, name, brand_name, allergens')
                    .in('id', productIds)
                    .eq('is_active', true)
                    .limit(5);
                
                if (productError || !products) {
                    this.recordTestResult(`Egg Recipe - ${eggRecipe.Recipes.title}`, false, `Product fetch failed: ${productError?.message}`);
                    continue;
                }
                
                // Check for false positives (eggplant, egg rolls, etc.)
                const falsePositives = products.filter(product => 
                    product.name.toLowerCase().includes('eggplant') ||
                    product.name.toLowerCase().includes('egg roll') ||
                    product.name.toLowerCase().includes('egg muffin')
                );
                
                if (falsePositives.length > 0) {
                    this.recordTestResult(`Egg Recipe - ${eggRecipe.Recipes.title}`, false, 
                        `False positives found: ${falsePositives.map(fp => fp.name).join(', ')}`);
                } else {
                    this.recordTestResult(`Egg Recipe - ${eggRecipe.Recipes.title}`, true, 
                        `Found ${products.length} relevant products, no false positives`);
                    console.log(`      ✅ Found ${products.length} relevant egg products`);
                    
                    // Show sample products
                    products.slice(0, 3).forEach((product, index) => {
                        console.log(`         ${index + 1}. ${product.name} (${product.brand_name})`);
                    });
                }
            }
            
        } catch (error) {
            this.recordTestResult('Egg Recipe Testing', false, `Test failed: ${error.message}`);
        }
        
        console.log('');
    }

    async testMilkRecipes() {
        console.log('🥛 Test 2: Milk Recipe Ingredient Matching');
        console.log('   Testing: Recipes with milk show relevant milk products\n');
        
        try {
            // Find recipes that contain milk
            const { data: milkRecipes, error: recipeError } = await supabase
                .from('RecipeIngredients')
                .select(`
                    RecipeId,
                    name,
                    quantity,
                    Recipes!inner(title, id)
                `)
                .ilike('name', '%milk%')
                .limit(3);
            
            if (recipeError || !milkRecipes || milkRecipes.length === 0) {
                this.recordTestResult('Milk Recipe Finding', false, 'No milk recipes found');
                return;
            }
            
            console.log(`   📋 Found ${milkRecipes.length} milk recipes:`);
            milkRecipes.forEach((recipe, index) => {
                console.log(`      ${index + 1}. ${recipe.Recipes.title} - "${recipe.name}"`);
            });
            
            // Test semantic matching for each milk recipe
            for (const milkRecipe of milkRecipes) {
                console.log(`\n   🔍 Testing recipe: ${milkRecipe.Recipes.title}`);
                console.log(`      Ingredient: "${milkRecipe.name}"`);
                
                // Extract ingredient name
                const ingredientName = this.extractIngredientName(milkRecipe.name);
                console.log(`      Extracted: "${ingredientName}"`);
                
                // Find semantic ingredient
                const { data: ingredientData, error: ingredientError } = await supabase
                    .from('ingredients')
                    .select('id, canonical_name, category')
                    .ilike('canonical_name', ingredientName)
                    .limit(1);
                
                if (ingredientError || !ingredientData || ingredientData.length === 0) {
                    this.recordTestResult(`Milk Recipe - ${milkRecipe.Recipes.title}`, false, `Ingredient not found: ${ingredientName}`);
                    continue;
                }
                
                const ingredient = ingredientData[0];
                console.log(`      ✅ Found ingredient: ${ingredient.canonical_name} (${ingredient.category})`);
                
                // Find products for this ingredient
                const { data: mappings, error: mappingError } = await supabase
                    .from('ingredient_product_mapping')
                    .select('product_id, confidence_score')
                    .eq('ingredient_id', ingredient.id)
                    .gte('confidence_score', 0.80)
                    .limit(10);
                
                if (mappingError || !mappings || mappings.length === 0) {
                    this.recordTestResult(`Milk Recipe - ${milkRecipe.Recipes.title}`, false, 'No product mappings found');
                    continue;
                }
                
                const productIds = mappings.map(m => m.product_id);
                
                // Get product details
                const { data: products, error: productError } = await supabase
                    .from('products')
                    .select('id, name, brand_name, allergens')
                    .in('id', productIds)
                    .eq('is_active', true)
                    .limit(5);
                
                if (productError || !products) {
                    this.recordTestResult(`Milk Recipe - ${milkRecipe.Recipes.title}`, false, `Product fetch failed: ${productError?.message}`);
                    continue;
                }
                
                // Check for false positives (milk chocolate, almond milk, etc.)
                const falsePositives = products.filter(product => 
                    product.name.toLowerCase().includes('milk chocolate') ||
                    product.name.toLowerCase().includes('almond milk') ||
                    product.name.toLowerCase().includes('soy milk')
                );
                
                if (falsePositives.length > 0) {
                    this.recordTestResult(`Milk Recipe - ${milkRecipe.Recipes.title}`, false, 
                        `False positives found: ${falsePositives.map(fp => fp.name).join(', ')}`);
                } else {
                    this.recordTestResult(`Milk Recipe - ${milkRecipe.Recipes.title}`, true, 
                        `Found ${products.length} relevant products, no false positives`);
                    console.log(`      ✅ Found ${products.length} relevant milk products`);
                    
                    // Show sample products
                    products.slice(0, 3).forEach((product, index) => {
                        console.log(`         ${index + 1}. ${product.name} (${product.brand_name})`);
                    });
                }
            }
            
        } catch (error) {
            this.recordTestResult('Milk Recipe Testing', false, `Test failed: ${error.message}`);
        }
        
        console.log('');
    }

    async testWheatRecipes() {
        console.log('🌾 Test 3: Wheat Recipe Ingredient Matching');
        console.log('   Testing: Recipes with wheat show relevant wheat products\n');
        
        try {
            // Find recipes that contain wheat
            const { data: wheatRecipes, error: recipeError } = await supabase
                .from('RecipeIngredients')
                .select(`
                    RecipeId,
                    name,
                    quantity,
                    Recipes!inner(title, id)
                `)
                .or('name.ilike.%wheat%,name.ilike.%flour%,name.ilike.%bread%')
                .limit(3);
            
            if (recipeError || !wheatRecipes || wheatRecipes.length === 0) {
                this.recordTestResult('Wheat Recipe Finding', false, 'No wheat recipes found');
                return;
            }
            
            console.log(`   📋 Found ${wheatRecipes.length} wheat-related recipes:`);
            wheatRecipes.forEach((recipe, index) => {
                console.log(`      ${index + 1}. ${recipe.Recipes.title} - "${recipe.name}"`);
            });
            
            // Test semantic matching for each wheat recipe
            for (const wheatRecipe of wheatRecipes) {
                console.log(`\n   🔍 Testing recipe: ${wheatRecipe.Recipes.title}`);
                console.log(`      Ingredient: "${wheatRecipe.name}"`);
                
                // Extract ingredient name
                const ingredientName = this.extractIngredientName(wheatRecipe.name);
                console.log(`      Extracted: "${ingredientName}"`);
                
                // Find semantic ingredient
                const { data: ingredientData, error: ingredientError } = await supabase
                    .from('ingredients')
                    .select('id, canonical_name, category')
                    .ilike('canonical_name', ingredientName)
                    .limit(1);
                
                if (ingredientError || !ingredientData || ingredientData.length === 0) {
                    this.recordTestResult(`Wheat Recipe - ${wheatRecipe.Recipes.title}`, false, `Ingredient not found: ${ingredientName}`);
                    continue;
                }
                
                const ingredient = ingredientData[0];
                console.log(`      ✅ Found ingredient: ${ingredient.canonical_name} (${ingredient.category})`);
                
                // Find products for this ingredient
                const { data: mappings, error: mappingError } = await supabase
                    .from('ingredient_product_mapping')
                    .select('product_id, confidence_score')
                    .eq('ingredient_id', ingredient.id)
                    .gte('confidence_score', 0.80)
                    .limit(10);
                
                if (mappingError || !mappings || mappings.length === 0) {
                    this.recordTestResult(`Wheat Recipe - ${wheatRecipe.Recipes.title}`, false, 'No product mappings found');
                    continue;
                }
                
                const productIds = mappings.map(m => m.product_id);
                
                // Get product details
                const { data: products, error: productError } = await supabase
                    .from('products')
                    .select('id, name, brand_name, allergens')
                    .in('id', productIds)
                    .eq('is_active', true)
                    .limit(5);
                
                if (productError || !products) {
                    this.recordTestResult(`Wheat Recipe - ${wheatRecipe.Recipes.title}`, false, `Product fetch failed: ${productError?.message}`);
                    continue;
                }
                
                // Check for false positives (wheat bread, wheat crackers, etc.)
                const falsePositives = products.filter(product => 
                    product.name.toLowerCase().includes('wheat bread') ||
                    product.name.toLowerCase().includes('wheat crackers') ||
                    product.name.toLowerCase().includes('wheat pasta')
                );
                
                if (falsePositives.length > 0) {
                    this.recordTestResult(`Wheat Recipe - ${wheatRecipe.Recipes.title}`, false, 
                        `False positives found: ${falsePositives.map(fp => fp.name).join(', ')}`);
                } else {
                    this.recordTestResult(`Wheat Recipe - ${wheatRecipe.Recipes.title}`, true, 
                        `Found ${products.length} relevant products, no false positives`);
                    console.log(`      ✅ Found ${products.length} relevant wheat products`);
                    
                    // Show sample products
                    products.slice(0, 3).forEach((product, index) => {
                        console.log(`         ${index + 1}. ${product.name} (${product.brand_name})`);
                    });
                }
            }
            
        } catch (error) {
            this.recordTestResult('Wheat Recipe Testing', false, `Test failed: ${error.message}`);
        }
        
        console.log('');
    }

    async testAllergenFiltering() {
        console.log('🚫 Test 4: Allergen Filtering Validation');
        console.log('   Testing: Products with allergens are correctly omitted\n');
        
        const allergenTests = [
            {
                name: 'Egg Allergen Filtering',
                allergen: 'eggs',
                testIngredient: 'egg',
                expectedBehavior: 'No products containing egg allergens'
            },
            {
                name: 'Milk Allergen Filtering',
                allergen: 'milk',
                testIngredient: 'milk',
                expectedBehavior: 'No products containing milk allergens'
            },
            {
                name: 'Wheat Allergen Filtering',
                allergen: 'wheat',
                testIngredient: 'flour',
                expectedBehavior: 'No products containing wheat allergens'
            }
        ];

        for (const test of allergenTests) {
            console.log(`   🔍 Testing: ${test.name}`);
            
            try {
                // Find ingredient
                const { data: ingredientData, error: ingredientError } = await supabase
                    .from('ingredients')
                    .select('id, canonical_name, category')
                    .ilike('canonical_name', test.testIngredient)
                    .limit(1);
                
                if (ingredientError || !ingredientData || ingredientData.length === 0) {
                    this.recordTestResult(test.name, false, `Ingredient not found: ${test.testIngredient}`);
                    continue;
                }
                
                const ingredient = ingredientData[0];
                console.log(`      ✅ Found ingredient: ${ingredient.canonical_name} (${ingredient.category})`);
                
                // Find products for this ingredient
                const { data: mappings, error: mappingError } = await supabase
                    .from('ingredient_product_mapping')
                    .select('product_id, confidence_score')
                    .eq('ingredient_id', ingredient.id)
                    .gte('confidence_score', 0.80)
                    .limit(20);
                
                if (mappingError || !mappings || mappings.length === 0) {
                    this.recordTestResult(test.name, false, 'No product mappings found');
                    continue;
                }
                
                const productIds = mappings.map(m => m.product_id);
                
                // Test allergen filtering
                const { data: filteredProducts, error: filterError } = await supabase
                    .from('products')
                    .select('id, name, brand_name, allergens')
                    .in('id', productIds)
                    .not('allergens', 'ov', `{${test.allergen}}`)
                    .eq('is_active', true)
                    .limit(10);
                
                if (filterError) {
                    this.recordTestResult(test.name, false, `Allergen filtering failed: ${filterError.message}`);
                    continue;
                }
                
                // Verify no products contain the allergen
                const containsAllergen = filteredProducts?.some(product => 
                    product.allergens && product.allergens.includes(test.allergen)
                );
                
                if (containsAllergen) {
                    this.recordTestResult(test.name, false, 'Products with user allergens found in results');
                } else {
                    this.recordTestResult(test.name, true, 
                        `Found ${filteredProducts?.length || 0} products without ${test.allergen} allergens`);
                    console.log(`      ✅ ${test.expectedBehavior}: ${filteredProducts?.length || 0} products`);
                }
                
            } catch (error) {
                this.recordTestResult(test.name, false, `Test failed: ${error.message}`);
            }
        }
        
        console.log('');
    }

    extractIngredientName(recipeIngredient) {
        let cleaned = recipeIngredient
            .replace(/^\d+(\.\d+)?\s*/, '') // Remove quantity
            .replace(/\s+(cup|cups|tbsp|tsp|oz|lbs?|grams?|ml|liters?|large|medium|small)\b/gi, '') // Remove units
            .replace(/\s+(cup|cups|tbsp|tsp|oz|lbs?|grams?|ml|liters?|large|medium|small)\b/gi, '') // Remove units again
            .replace(/,\s*.*$/, '') // Remove everything after comma
            .replace(/\(.*?\)/g, '') // Remove parenthetical content
            .trim()
            .toLowerCase();
        
        // Handle specific cases
        if (cleaned.includes('almond milk')) return 'milk';
        if (cleaned.includes('all purpose flour') || cleaned.includes('all-purpose flour')) return 'flour';
        if (cleaned.includes('eggs')) return 'eggs';
        if (cleaned.includes('egg')) return 'egg';
        
        return cleaned;
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
        console.log('📊 RECIPE INGREDIENT FILTERING TEST REPORT');
        console.log('='.repeat(60));
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
        
        console.log('\n🎉 Recipe Ingredient Filtering Test Suite Complete!');
        
        if (this.failedTests === 0) {
            console.log('🚀 All tests passed! Recipe ingredient filtering is working perfectly.');
        } else {
            console.log('⚠️  Some tests failed. Review and fix before production.');
        }
    }
}

// Run the test suite
const testSuite = new RecipeIngredientTestSuite();
testSuite.runAllTests();
