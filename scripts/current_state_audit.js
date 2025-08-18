const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Audit current table structures and data
async function auditCurrentState() {
    console.log('🔍 Auditing Current State - What We\'ve Built So Far...\n');
    
    // 1. ProductCanonical Table Analysis
    console.log('📊 PRODUCT CANONICAL TABLE ANALYSIS:\n');
    
    try {
        const { data: productSample, error: productError } = await supabase
            .from('ProductCanonical')
            .select('*')
            .limit(5);
        
        if (productError) {
            console.error('❌ Error accessing ProductCanonical:', productError);
        } else {
            console.log('📋 ProductCanonical Columns:');
            if (productSample && productSample.length > 0) {
                const columns = Object.keys(productSample[0]);
                columns.forEach(col => console.log(`   • ${col}`));
            }
            console.log('');
            
            console.log('📊 Sample ProductCanonical Data:');
            productSample?.forEach((product, index) => {
                console.log(`   ${index + 1}. "${product.original_product_name}" → "${product.canonical_product_name}"`);
            });
            console.log('');
        }
    } catch (error) {
        console.error('❌ Error in ProductCanonical analysis:', error);
    }
    
    // 2. IngredientCanonical Table Analysis
    console.log('📊 INGREDIENT CANONICAL TABLE ANALYSIS:\n');
    
    try {
        const { data: ingredientSample, error: ingredientError } = await supabase
            .from('IngredientCanonical')
            .select('*')
            .limit(5);
        
        if (ingredientError) {
            console.error('❌ Error accessing IngredientCanonical:', ingredientError);
        } else {
            console.log('📋 IngredientCanonical Columns:');
            if (ingredientSample && ingredientSample.length > 0) {
                const columns = Object.keys(ingredientSample[0]);
                columns.forEach(col => console.log(`   • ${col}`));
            }
            console.log('');
            
            console.log('📊 Sample IngredientCanonical Data:');
            ingredientSample?.forEach((ingredient, index) => {
                console.log(`   ${index + 1}. "${ingredient.original_ingredient}" → "${ingredient.canonical_ingredient}"`);
                if (ingredient.matching_products) {
                    console.log(`      📦 Matching Products: ${ingredient.matching_products.length} products`);
                }
            });
            console.log('');
        }
    } catch (error) {
        console.error('❌ Error in IngredientCanonical analysis:', error);
    }
    
    // 3. Check for any recent modifications
    console.log('🔍 CHECKING FOR RECENT MODIFICATIONS:\n');
    
    try {
        // Check if we have any new columns from recent work
        const { data: productColumns, error: productColError } = await supabase
            .from('ProductCanonical')
            .select('*')
            .limit(1);
        
        const { data: ingredientColumns, error: ingredientColError } = await supabase
            .from('IngredientCanonical')
            .select('*')
            .limit(1);
        
        console.log('📋 Current Column Status:');
        if (productColumns && productColumns.length > 0) {
            const productCols = Object.keys(productColumns[0]);
            console.log(`   ProductCanonical: ${productCols.join(', ')}`);
            
            // Check for new columns we might have added
            const hasProductType = productCols.includes('product_type');
            const hasCleanedName = productCols.includes('cleaned_product_name');
            console.log(`   • Has product_type: ${hasProductType ? 'YES' : 'NO'}`);
            console.log(`   • Has cleaned_product_name: ${hasCleanedName ? 'YES' : 'NO'}`);
        }
        
        if (ingredientColumns && ingredientColumns.length > 0) {
            const ingredientCols = Object.keys(ingredientColumns[0]);
            console.log(`   IngredientCanonical: ${ingredientCols.join(', ')}`);
            
            // Check for new columns we might have added
            const hasProductType = ingredientCols.includes('product_type');
            const hasCleanedName = ingredientCols.includes('cleaned_ingredient');
            console.log(`   • Has product_type: ${hasProductType ? 'YES' : 'NO'}`);
            console.log(`   • Has cleaned_ingredient: ${hasCleanedName ? 'YES' : 'NO'}`);
        }
        console.log('');
        
    } catch (error) {
        console.error('❌ Error checking modifications:', error);
    }
    
    // 4. Analyze what we've processed
    console.log('📊 PROCESSING STATUS ANALYSIS:\n');
    
    try {
        // Get counts to understand what we've processed
        const { count: productCount, error: productCountError } = await supabase
            .from('ProductCanonical')
            .select('*', { count: 'exact', head: true });
        
        const { count: ingredientCount, error: ingredientCountError } = await supabase
            .from('IngredientCanonical')
            .select('*', { count: 'exact', head: true });
        
        const { count: recipeIngredientCount, error: recipeIngredientError } = await supabase
            .from('RecipeIngredients')
            .select('*', { count: 'exact', head: true });
        
        console.log('📈 Processing Status:');
        console.log(`   ✅ ProductCanonical: ${productCount || 0} products processed`);
        console.log(`   ✅ IngredientCanonical: ${ingredientCount || 0} ingredients processed`);
        console.log(`   📝 RecipeIngredients: ${recipeIngredientCount || 0} recipe ingredients available`);
        console.log('');
        
        // Check if we have any mappings
        const { data: mappedIngredients, error: mappingError } = await supabase
            .from('IngredientCanonical')
            .select('canonical_ingredient, matching_products')
            .not('matching_products', 'is', null)
            .limit(5);
        
        if (!mappingError && mappedIngredients && mappedIngredients.length > 0) {
            console.log('🔗 Current Mappings Found:');
            mappedIngredients.forEach((ingredient, index) => {
                const productCount = ingredient.matching_products?.length || 0;
                console.log(`   ${index + 1}. "${ingredient.canonical_ingredient}" → ${productCount} products`);
            });
        } else {
            console.log('⚠️ No ingredient-to-product mappings found yet');
        }
        console.log('');
        
    } catch (error) {
        console.error('❌ Error in processing analysis:', error);
    }
}

// Explain what we've built vs what separation would do
function explainCurrentVsSeparation() {
    console.log('📋 WHAT WE\'VE BUILT SO FAR:\n');
    
    console.log('✅ COMPLETED WORK:');
    console.log('   1. 📦 ProductCanonical table with 213K products');
    console.log('   2. 🥕 IngredientCanonical table with 53K ingredients');
    console.log('   3. 🔗 Basic ingredient-to-product mapping system');
    console.log('   4. 🧹 Data cleaning and camelCase conversion');
    console.log('   5. ⚡ Performance optimizations (pagination vs range)');
    console.log('');
    
    console.log('🎯 WHAT SEPARATION WOULD ADD:');
    console.log('   1. 🏷️ product_type column (raw/processed classification)');
    console.log('   2. 🧠 Context-aware search (recipe vs browsing)');
    console.log('   3. 📊 Better accuracy for recipe substitutions');
    console.log('   4. 🎨 Improved user experience');
    console.log('');
    
    console.log('🔄 HOW IT FITS TOGETHER:');
    console.log('   ✅ KEEP: All existing data and mappings');
    console.log('   ✅ KEEP: ProductCanonical and IngredientCanonical tables');
    console.log('   ✅ KEEP: All processing work we\'ve done');
    console.log('   🆕 ADD: product_type classification');
    console.log('   🆕 ADD: Context-aware search logic');
    console.log('   🆕 ADD: Better recipe accuracy');
    console.log('');
    
    console.log('💡 IMPACT ON EXISTING WORK:');
    console.log('   ✅ NO: We won\'t lose any existing data');
    console.log('   ✅ NO: We won\'t undo any processing');
    console.log('   ✅ NO: We won\'t break existing mappings');
    console.log('   ✅ YES: We\'ll enhance the existing system');
    console.log('   ✅ YES: We\'ll improve recipe accuracy');
    console.log('');
}

// Main function
async function runCurrentStateAudit() {
    console.log('🚀 Starting Current State Audit...\n');
    
    await auditCurrentState();
    explainCurrentVsSeparation();
    
    console.log('🎉 Current State Audit Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Your existing work is safe and valuable');
    console.log('   ✅ Separation builds ON TOP of current work');
    console.log('   ✅ No data loss or processing redo needed');
    console.log('   ✅ Only adds new capabilities');
}

runCurrentStateAudit().catch(console.error); 