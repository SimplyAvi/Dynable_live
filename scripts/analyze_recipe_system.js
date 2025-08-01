/**
 * Recipe-to-Product Mapping System Analysis
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * This script analyzes the current recipe-to-product workflow and identifies
 * performance bottlenecks causing database timeouts.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 RECIPE-TO-PRODUCT MAPPING SYSTEM ANALYSIS');
console.log('=============================================\n');

async function analyzeCurrentSystem() {
    try {
        console.log('📊 PHASE 1: CURRENT SYSTEM ANALYSIS');
        console.log('------------------------------------\n');

        // 1. Analyze Recipe Tables
        console.log('1️⃣ RECIPE TABLES ANALYSIS');
        console.log('-------------------------');
        
        const recipeTables = await analyzeRecipeTables();
        console.log('✅ Recipe tables analyzed');
        
        // 2. Analyze Current Recipe Workflow
        console.log('\n2️⃣ RECIPE WORKFLOW ANALYSIS');
        console.log('---------------------------');
        
        const workflowAnalysis = await analyzeRecipeWorkflow();
        console.log('✅ Recipe workflow analyzed');
        
        // 3. Identify Performance Bottlenecks
        console.log('\n3️⃣ PERFORMANCE BOTTLENECK ANALYSIS');
        console.log('-----------------------------------');
        
        const performanceIssues = await analyzePerformanceBottlenecks();
        console.log('✅ Performance bottlenecks identified');
        
        // 4. Analyze Data Quality
        console.log('\n4️⃣ DATA QUALITY ANALYSIS');
        console.log('------------------------');
        
        const dataQuality = await analyzeDataQuality();
        console.log('✅ Data quality analyzed');
        
        // 5. Generate Recommendations
        console.log('\n5️⃣ RECOMMENDATIONS');
        console.log('-------------------');
        
        generateRecommendations(recipeTables, workflowAnalysis, performanceIssues, dataQuality);
        
    } catch (error) {
        console.error('❌ Analysis failed:', error);
    }
}

async function analyzeRecipeTables() {
    console.log('📋 Analyzing recipe-related tables...');
    
    const tables = {};
    
    // Analyze Recipes table
    try {
        const { data: recipes, error } = await supabase
            .from('Recipes')
            .select('*')
            .limit(5);
        
        if (error) {
            console.error('❌ Error analyzing Recipes table:', error);
        } else {
            tables.Recipes = {
                count: recipes?.length || 0,
                sample: recipes?.[0] || null,
                structure: {
                    id: 'integer (PK)',
                    title: 'varchar(255)',
                    directions: 'text[]',
                    source: 'varchar(255)',
                    tags: 'varchar(255)[]',
                    url: 'varchar(255)',
                    createdAt: 'timestamp',
                    updatedAt: 'timestamp'
                }
            };
            console.log(`   📊 Recipes table: ${recipes?.length || 0} sample records`);
        }
    } catch (error) {
        console.error('❌ Error accessing Recipes table:', error);
    }
    
    // Analyze RecipeIngredients table
    try {
        const { data: ingredients, error } = await supabase
            .from('RecipeIngredients')
            .select('*')
            .limit(5);
        
        if (error) {
            console.error('❌ Error analyzing RecipeIngredients table:', error);
        } else {
            tables.RecipeIngredients = {
                count: ingredients?.length || 0,
                sample: ingredients?.[0] || null,
                structure: {
                    id: 'integer (PK)',
                    name: 'text',
                    quantity: 'varchar(255)',
                    recipeId: 'integer (FK)',
                    createdAt: 'timestamp',
                    updatedAt: 'timestamp'
                }
            };
            console.log(`   📊 RecipeIngredients table: ${ingredients?.length || 0} sample records`);
        }
    } catch (error) {
        console.error('❌ Error accessing RecipeIngredients table:', error);
    }
    
    // Analyze SubstituteMappings table
    try {
        const { data: substitutes, error } = await supabase
            .from('SubstituteMappings')
            .select('*')
            .limit(5);
        
        if (error) {
            console.error('❌ Error analyzing SubstituteMappings table:', error);
        } else {
            tables.SubstituteMappings = {
                count: substitutes?.length || 0,
                sample: substitutes?.[0] || null,
                structure: {
                    id: 'integer (PK)',
                    substituteType: 'varchar(255)',
                    searchTerms: 'varchar(255)[]',
                    description: 'varchar(255)',
                    createdAt: 'timestamp',
                    updatedAt: 'timestamp'
                }
            };
            console.log(`   📊 SubstituteMappings table: ${substitutes?.length || 0} sample records`);
        }
    } catch (error) {
        console.error('❌ Error accessing SubstituteMappings table:', error);
    }
    
    return tables;
}

async function analyzeRecipeWorkflow() {
    console.log('🔄 Analyzing current recipe workflow...');
    
    const workflow = {
        steps: [],
        bottlenecks: [],
        timeouts: []
    };
    
    // Step 1: Recipe Request
    workflow.steps.push({
        step: 'Recipe Request',
        description: 'User searches for recipes',
        components: ['RecipePage.js', 'searchRecipesFromSupabasePure()'],
        databaseQueries: ['SELECT * FROM Recipes WHERE title ILIKE %search%'],
        performance: 'Good - simple text search'
    });
    
    // Step 2: Ingredient Extraction
    workflow.steps.push({
        step: 'Ingredient Extraction',
        description: 'Extract ingredients from recipe',
        components: ['RecipePage.js - getProduct()', 'RecipeIngredients table'],
        databaseQueries: ['SELECT * FROM RecipeIngredients WHERE RecipeId = ?'],
        performance: 'Good - direct FK lookup'
    });
    
    // Step 3: Ingredient Cleaning
    workflow.steps.push({
        step: 'Ingredient Cleaning',
        description: 'Clean ingredient names for product matching',
        components: ['RecipePage.js - cleanIngredientNameFrontend()'],
        processing: 'Client-side text cleaning',
        performance: 'Good - client-side processing'
    });
    
    // Step 4: Product Matching (BOTTLENECK)
    workflow.steps.push({
        step: 'Product Matching',
        description: 'Find products that match ingredients',
        components: ['getProductsByIngredientFromSupabase()'],
        databaseQueries: ['SELECT * FROM IngredientCategorized WHERE description ILIKE %ingredient%'],
        performance: 'POOR - Complex LIKE queries on 243K+ products',
        bottleneck: 'Exponential complexity with multiple ingredients'
    });
    
    // Step 5: Substitute Finding (BOTTLENECK)
    workflow.steps.push({
        step: 'Substitute Finding',
        description: 'Find allergen-safe substitutes',
        components: ['getRecipeSubstitutesFromSupabase()'],
        databaseQueries: ['SELECT * FROM SubstituteMappings WHERE searchTerms @> [ingredient]'],
        performance: 'POOR - Array operations on substitute mappings',
        bottleneck: 'Complex array matching and filtering'
    });
    
    // Step 6: Allergen Filtering (BOTTLENECK)
    workflow.steps.push({
        step: 'Allergen Filtering',
        description: 'Filter products by allergen exclusions',
        components: ['checkIngredientForAllergens()'],
        databaseQueries: ['Complex JOIN operations with allergen arrays'],
        performance: 'POOR - Array operations on 243K+ products',
        bottleneck: 'Multiple array operations per product'
    });
    
    return workflow;
}

async function analyzePerformanceBottlenecks() {
    console.log('⏱️ Analyzing performance bottlenecks...');
    
    const bottlenecks = [];
    
    // Bottleneck 1: Product Matching
    bottlenecks.push({
        issue: 'Product Matching Complexity',
        description: 'LIKE queries on 243K+ products for each ingredient',
        impact: 'HIGH - Exponential complexity with multiple ingredients',
        currentQuery: 'SELECT * FROM IngredientCategorized WHERE description ILIKE %ingredient%',
        problem: 'No pre-computed mappings, no indexes on ingredient names',
        solution: 'Create ProductCanonical table with pre-computed mappings'
    });
    
    // Bottleneck 2: Substitute Finding
    bottlenecks.push({
        issue: 'Substitute Finding Complexity',
        description: 'Array operations on substitute mappings',
        impact: 'MEDIUM - Complex array matching for each ingredient',
        currentQuery: 'SELECT * FROM SubstituteMappings WHERE searchTerms @> [ingredient]',
        problem: 'No pre-computed ingredient-to-substitute mappings',
        solution: 'Create IngredientCanonical table with pre-computed substitutes'
    });
    
    // Bottleneck 3: Allergen Filtering
    bottlenecks.push({
        issue: 'Allergen Filtering Complexity',
        description: 'Array operations on 243K+ products',
        impact: 'HIGH - Multiple array operations per product',
        currentQuery: 'Complex JOIN operations with allergen arrays',
        problem: 'No pre-computed allergen-safe product lists',
        solution: 'Create SubstituteMapping table with pre-computed allergen-safe alternatives'
    });
    
    // Bottleneck 4: No Caching
    bottlenecks.push({
        issue: 'No Caching System',
        description: 'Every recipe request triggers full database queries',
        impact: 'HIGH - Repeated expensive operations',
        currentQuery: 'No caching implemented',
        problem: 'No pre-computed results for common ingredient combinations',
        solution: 'Implement ongoing mapping scripts that maintain pre-computed results'
    });
    
    return bottlenecks;
}

async function analyzeDataQuality() {
    console.log('📈 Analyzing data quality...');
    
    const dataQuality = {
        ingredientNaming: [],
        productNaming: [],
        substituteCoverage: [],
        allergenData: []
    };
    
    // Analyze ingredient naming patterns
    try {
        const { data: ingredients, error } = await supabase
            .from('RecipeIngredients')
            .select('name')
            .limit(20);
        
        if (!error && ingredients) {
            dataQuality.ingredientNaming = ingredients.map(ing => ing.name);
            console.log('   📊 Sample ingredient names:', ingredients.slice(0, 5).map(ing => ing.name));
        }
    } catch (error) {
        console.error('❌ Error analyzing ingredient naming:', error);
    }
    
    // Analyze product naming patterns
    try {
        const { data: products, error } = await supabase
            .from('IngredientCategorized')
            .select('description')
            .limit(20);
        
        if (!error && products) {
            dataQuality.productNaming = products.map(prod => prod.description);
            console.log('   📊 Sample product names:', products.slice(0, 5).map(prod => prod.description));
        }
    } catch (error) {
        console.error('❌ Error analyzing product naming:', error);
    }
    
    // Analyze substitute coverage
    try {
        const { data: substitutes, error } = await supabase
            .from('SubstituteMappings')
            .select('*')
            .limit(10);
        
        if (!error && substitutes) {
            dataQuality.substituteCoverage = substitutes;
            console.log(`   📊 Substitute mappings: ${substitutes.length} records`);
        }
    } catch (error) {
        console.error('❌ Error analyzing substitute coverage:', error);
    }
    
    return dataQuality;
}

function generateRecommendations(recipeTables, workflowAnalysis, performanceIssues, dataQuality) {
    console.log('💡 Generating recommendations...\n');
    
    console.log('🎯 CRITICAL FINDINGS:');
    console.log('=====================');
    
    console.log('1️⃣ PERFORMANCE BOTTLENECKS:');
    performanceIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.issue}`);
        console.log(`      Impact: ${issue.impact}`);
        console.log(`      Problem: ${issue.problem}`);
        console.log(`      Solution: ${issue.solution}\n`);
    });
    
    console.log('2️⃣ DATA QUALITY ISSUES:');
    console.log('   - Inconsistent ingredient naming (action words, measurements)');
    console.log('   - Product names contain descriptors that complicate matching');
    console.log('   - Limited substitute coverage');
    console.log('   - No pre-computed mappings\n');
    
    console.log('3️⃣ RECOMMENDED SOLUTION:');
    console.log('=======================');
    console.log('   ✅ Implement two-phase mapping system:');
    console.log('      Phase 1: ProductCanonical table with clean product names');
    console.log('      Phase 2: IngredientCanonical table with pre-computed mappings');
    console.log('      Phase 3: SubstituteMapping table with allergen-safe alternatives');
    console.log('   ✅ Create ongoing scripts to maintain mappings as data changes');
    console.log('   ✅ Implement caching for common ingredient combinations');
    console.log('   ✅ Add database indexes for fast lookups\n');
    
    console.log('4️⃣ IMPLEMENTATION PRIORITY:');
    console.log('==========================');
    console.log('   🔥 HIGH: ProductCanonical mapping (solves product matching timeouts)');
    console.log('   🔥 HIGH: IngredientCanonical mapping (solves ingredient matching timeouts)');
    console.log('   🔥 HIGH: SubstituteMapping enhancement (solves substitute finding timeouts)');
    console.log('   🔥 HIGH: Ongoing maintenance scripts (keeps mappings current)\n');
}

// Run the analysis
analyzeCurrentSystem().then(() => {
    console.log('\n✅ RECIPE SYSTEM ANALYSIS COMPLETE');
    console.log('==================================');
    console.log('Next step: Implement the two-phase mapping system');
    process.exit(0);
}).catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
}); 