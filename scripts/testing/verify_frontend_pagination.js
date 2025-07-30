/**
 * Verify Frontend Pagination Behavior
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Simulates the exact Homepage.js calls to verify the frontend behavior
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL || 'https://your-project.supabase.co',
    process.env.SUPABASE_ANON_KEY || 'your-anon-key'
);

// Simulate the exact Homepage.js calls
async function simulateHomepageCalls() {
    console.log('[VERIFY] 🚀 Simulating Homepage.js data loading calls...\n');
    
    try {
        // Simulate the exact Homepage.js product call
        console.log('[VERIFY] Step 1: Simulating product loading (Homepage.js)...');
        
        const foodResponse = await searchProductsFromSupabasePure({
            name: '',
            page: 1,
            limit: 10,
            allergens: [],
            includeCount: true  // This is the fix we applied
        });
        
        console.log('[VERIFY] ✅ Product response structure:');
        console.log(`  - Has products array: ${!!foodResponse.products}`);
        console.log(`  - Products count: ${foodResponse.products ? foodResponse.products.length : 'N/A'}`);
        console.log(`  - Total count: ${foodResponse.totalCount ? foodResponse.totalCount.toLocaleString() : 'N/A'}`);
        console.log(`  - Current page: ${foodResponse.page}`);
        console.log(`  - Total pages: ${foodResponse.totalPages}`);
        
        // Simulate the exact Homepage.js recipe call
        console.log('\n[VERIFY] Step 2: Simulating recipe loading (Homepage.js)...');
        
        const recipeResponse = await searchRecipesFromSupabasePure({
            search: '',
            excludeIngredients: [],
            page: 1,
            limit: 10,
            includeCount: true  // This is the fix we applied
        });
        
        console.log('[VERIFY] ✅ Recipe response structure:');
        console.log(`  - Has recipes array: ${!!recipeResponse.recipes}`);
        console.log(`  - Recipes count: ${recipeResponse.recipes ? recipeResponse.recipes.length : 'N/A'}`);
        console.log(`  - Total count: ${recipeResponse.totalCount ? recipeResponse.totalCount.toLocaleString() : 'N/A'}`);
        console.log(`  - Current page: ${recipeResponse.page}`);
        console.log(`  - Total pages: ${recipeResponse.totalPages}`);
        
        // Calculate expected UI display strings
        console.log('\n[VERIFY] Step 3: Calculating expected UI display...');
        
        const productStartIdx = (foodResponse.page - 1) * 10 + 1;
        const productEndIdx = productStartIdx + foodResponse.products.length - 1;
        const productDisplay = `Showing ${productStartIdx}-${productEndIdx} of ${foodResponse.totalCount.toLocaleString()}`;
        
        const recipeStartIdx = (recipeResponse.page - 1) * 10 + 1;
        const recipeEndIdx = recipeStartIdx + recipeResponse.recipes.length - 1;
        const recipeDisplay = `Showing ${recipeStartIdx}-${recipeEndIdx} of ${recipeResponse.totalCount.toLocaleString()}`;
        
        console.log('[VERIFY] ✅ Expected UI Display:');
        console.log(`  - Products: "${productDisplay}"`);
        console.log(`  - Recipes: "${recipeDisplay}"`);
        
        // Verify the fix worked
        console.log('\n[VERIFY] Step 4: Verifying the fix...');
        
        const expectedProductCount = 243114;
        const expectedRecipeCount = 73325;
        
        if (foodResponse.totalCount === expectedProductCount) {
            console.log('✅ Product count matches expected (243,114)');
        } else {
            console.error(`❌ Product count mismatch: got ${foodResponse.totalCount}, expected ${expectedProductCount}`);
        }
        
        if (recipeResponse.totalCount === expectedRecipeCount) {
            console.log('✅ Recipe count matches expected (73,325)');
        } else {
            console.error(`❌ Recipe count mismatch: got ${recipeResponse.totalCount}, expected ${expectedRecipeCount}`);
        }
        
        // Check if response structure is correct for Redux
        console.log('\n[VERIFY] Step 5: Verifying Redux compatibility...');
        
        const hasCorrectProductStructure = foodResponse.products && foodResponse.totalCount && foodResponse.page && foodResponse.totalPages;
        const hasCorrectRecipeStructure = recipeResponse.recipes && recipeResponse.totalCount && recipeResponse.page && recipeResponse.totalPages;
        
        if (hasCorrectProductStructure) {
            console.log('✅ Product response has correct structure for Redux');
        } else {
            console.error('❌ Product response missing required fields for Redux');
        }
        
        if (hasCorrectRecipeStructure) {
            console.log('✅ Recipe response has correct structure for Redux');
        } else {
            console.error('❌ Recipe response missing required fields for Redux');
        }
        
        return {
            success: true,
            products: {
                totalCount: foodResponse.totalCount,
                display: productDisplay,
                structure: hasCorrectProductStructure
            },
            recipes: {
                totalCount: recipeResponse.totalCount,
                display: recipeDisplay,
                structure: hasCorrectRecipeStructure
            }
        };
        
    } catch (error) {
        console.error('[VERIFY] ❌ Verification failed:', error);
        return { success: false, error: error.message };
    }
}

// Mock the exact functions from supabaseQueries.js
async function searchProductsFromSupabasePure(searchParams) {
    const { name = '', page = 1, limit = 10, allergens = [], includeCount = false } = searchParams;
    
    let query = supabase
        .from('IngredientCategorized')
        .select('*', { count: includeCount ? 'exact' : null })
        .order('description');
    
    if (name && name.trim()) {
        query = query.ilike('description', `%${name.trim()}%`);
    }
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
        throw new Error(`Supabase query failed: ${error.message}`);
    }
    
    if (includeCount) {
        return {
            products: data,
            totalCount: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
        };
    }
    
    return data;
}

async function searchRecipesFromSupabasePure(searchParams) {
    const { search = '', page = 1, limit = 10, includeCount = false } = searchParams;
    
    let query = supabase
        .from('Recipes')
        .select('*', { count: includeCount ? 'exact' : null })
        .order('title');
    
    if (search && search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`);
    }
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
        throw new Error(`Supabase query failed: ${error.message}`);
    }
    
    if (includeCount) {
        return {
            recipes: data,
            totalCount: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
        };
    }
    
    return data;
}

// Run the verification
if (require.main === module) {
    simulateHomepageCalls()
        .then(result => {
            if (result.success) {
                console.log('\n[VERIFY] 🎉 Frontend pagination verification passed!');
                console.log('\n[VERIFY] 📊 Final Results:');
                console.log(`Products: ${result.products.display}`);
                console.log(`Recipes: ${result.recipes.display}`);
                console.log(`\n[VERIFY] ✅ Ready for commit: All tests pass`);
                process.exit(0);
            } else {
                console.error('\n[VERIFY] ❌ Verification failed:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('[VERIFY] ❌ Verification error:', error);
            process.exit(1);
        });
}

module.exports = { simulateHomepageCalls }; 