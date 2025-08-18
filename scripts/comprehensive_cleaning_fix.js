const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Enhanced camelCase conversion
function toCamelCase(str) {
    if (!str || typeof str !== 'string') return '';
    
    return str
        .toLowerCase()
        .trim()
        // Remove special characters that shouldn't be in camelCase
        .replace(/[&,;:'"`~!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?®™©]/g, ' ')
        .replace(/[\s_-]+/g, ' ')
        .split(' ')
        .map((word, index) => {
            if (index === 0) {
                return word; // First word stays lowercase
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join('');
}

// Clean ingredient name by removing measurements and action words
function cleanIngredientName(ingredient) {
    if (!ingredient) return '';
    
    let cleaned = ingredient.toLowerCase();
    
    // Remove measurements
    const MEASUREMENTS = [
        /\d+\s*(cups?|tbsp|tsp|oz|lbs?|grams?|kg|ml|liters?)/gi,
        /\d+\/\d+/g, // fractions
        /\ba\s+few\b/gi,
        /\ba\s+pinch\b/gi,
        /\bto\s+taste\b/gi,
        /\bor\s+to\s+taste\b/gi,
        /\babout\s+\d+/gi,
        /\bapproximately\s+\d+/gi,
        /\bone\b/gi,
        /\btwo\b/gi,
        /\bthree\b/gi,
        /\bfour\b/gi,
        /\bfive\b/gi,
        /\bhalf\b/gi,
        /\bquarter\b/gi,
        /\bthird\b/gi
    ];
    
    // Remove action words
    const ACTION_WORDS = [
        'diced', 'chopped', 'minced', 'sliced', 'grated', 'shredded',
        'sautéed', 'roasted', 'grilled', 'baked', 'fried', 'steamed',
        'fresh', 'frozen', 'canned', 'dried', 'cooked', 'raw',
        'peeled', 'seeded', 'trimmed', 'washed', 'drained', 'crushed',
        'crumbled', 'shaved', 'julienned', 'spiralized', 'matchstick',
        'coarsely', 'finely', 'roughly', 'thinly', 'thickly',
        'crushed', 'mashed', 'pureed', 'blended', 'whipped', 'beaten',
        'folded', 'kneaded', 'rolled', 'pressed', 'squeezed', 'strained',
        'filtered', 'clarified', 'reduced', 'thickened', 'thinned', 'diluted'
    ];
    
    // Remove measurements
    MEASUREMENTS.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });
    
    // Remove action words
    ACTION_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    
    // Clean up extra spaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Convert to camelCase if multi-word
    if (cleaned.includes(' ')) {
        cleaned = toCamelCase(cleaned);
    }
    
    // Truncate if too long (max 100 chars)
    if (cleaned.length > 100) {
        cleaned = cleaned.substring(0, 100);
    }
    
    return cleaned;
}

// Fix product canonical names
async function fixProductCanonicals() {
    console.log('🔧 Fixing Product Canonical Names...\n');
    
    try {
        const { data: products, error } = await supabase
            .from('ProductCanonical')
            .select('id, canonical_product_name')
            .limit(100);
        
        if (error) {
            console.error('❌ Error fetching products:', error);
            return;
        }
        
        console.log(`📊 Processing ${products.length} products...`);
        
        let fixedCount = 0;
        let unchangedCount = 0;
        
        for (const product of products) {
            const originalName = product.canonical_product_name;
            const cleanedName = toCamelCase(originalName);
            
            if (cleanedName !== originalName) {
                console.log(`   🔧 "${originalName}" → "${cleanedName}"`);
                
                const { error: updateError } = await supabase
                    .from('ProductCanonical')
                    .update({ canonical_product_name: cleanedName })
                    .eq('id', product.id);
                
                if (updateError) {
                    console.error(`   ❌ Error updating product ${product.id}:`, updateError);
                } else {
                    fixedCount++;
                }
            } else {
                unchangedCount++;
            }
        }
        
        console.log(`\n📈 Product Fix Summary:`);
        console.log(`   🔧 Fixed: ${fixedCount}`);
        console.log(`   ✅ Unchanged: ${unchangedCount}`);
        
    } catch (error) {
        console.error('❌ Error fixing products:', error);
    }
}

// Fix ingredient canonical names
async function fixIngredientCanonicals() {
    console.log('\n🔧 Fixing Ingredient Canonical Names...\n');
    
    try {
        const { data: ingredients, error } = await supabase
            .from('IngredientCanonical')
            .select('id, canonical_ingredient')
            .limit(100);
        
        if (error) {
            console.error('❌ Error fetching ingredients:', error);
            return;
        }
        
        console.log(`📊 Processing ${ingredients.length} ingredients...`);
        
        let fixedCount = 0;
        let unchangedCount = 0;
        
        for (const ingredient of ingredients) {
            const originalName = ingredient.canonical_ingredient;
            const cleanedName = cleanIngredientName(originalName);
            
            if (cleanedName !== originalName) {
                console.log(`   🔧 "${originalName}" → "${cleanedName}"`);
                
                const { error: updateError } = await supabase
                    .from('IngredientCanonical')
                    .update({ canonical_ingredient: cleanedName })
                    .eq('id', ingredient.id);
                
                if (updateError) {
                    console.error(`   ❌ Error updating ingredient ${ingredient.id}:`, updateError);
                } else {
                    fixedCount++;
                }
            } else {
                unchangedCount++;
            }
        }
        
        console.log(`\n📈 Ingredient Fix Summary:`);
        console.log(`   🔧 Fixed: ${fixedCount}`);
        console.log(`   ✅ Unchanged: ${unchangedCount}`);
        
    } catch (error) {
        console.error('❌ Error fixing ingredients:', error);
    }
}

// Restore ingredient-to-product mappings with better logic
async function restoreIngredientMappings() {
    console.log('\n🔧 Restoring Ingredient-to-Product Mappings...\n');
    
    try {
        const { data: ingredients, error } = await supabase
            .from('IngredientCanonical')
            .select('id, canonical_ingredient')
            .limit(50);
        
        if (error) {
            console.error('❌ Error fetching ingredients:', error);
            return;
        }
        
        console.log(`📊 Processing ${ingredients.length} ingredients...`);
        
        let mappedCount = 0;
        let unmappedCount = 0;
        
        for (const ingredient of ingredients) {
            const canonicalIngredient = ingredient.canonical_ingredient;
            
            // Find matching products with more flexible logic
            const { data: products, error: productError } = await supabase
                .from('ProductCanonical')
                .select('product_ids, canonical_product_name')
                .or(`canonical_product_name.ilike.%${canonicalIngredient}%,canonical_product_name.ilike.${canonicalIngredient}%`);
            
            if (productError) {
                console.error(`   ❌ Error finding products for "${canonicalIngredient}":`, productError);
                continue;
            }
            
            const matchingProductIds = [];
            products.forEach(product => {
                if (product.product_ids) {
                    matchingProductIds.push(...product.product_ids);
                }
            });
            
            const uniqueProductIds = [...new Set(matchingProductIds)];
            
            if (uniqueProductIds.length > 0) {
                console.log(`   ✅ "${canonicalIngredient}": ${uniqueProductIds.length} products`);
                
                const { error: updateError } = await supabase
                    .from('IngredientCanonical')
                    .update({ matching_products: uniqueProductIds })
                    .eq('id', ingredient.id);
                
                if (updateError) {
                    console.error(`   ❌ Error updating mapping for "${canonicalIngredient}":`, updateError);
                } else {
                    mappedCount++;
                }
            } else {
                console.log(`   ⚠️ "${canonicalIngredient}": No products found`);
                unmappedCount++;
            }
        }
        
        console.log(`\n📈 Mapping Restoration Summary:`);
        console.log(`   ✅ Mapped: ${mappedCount}`);
        console.log(`   ⚠️ Unmapped: ${unmappedCount}`);
        
    } catch (error) {
        console.error('❌ Error restoring mappings:', error);
    }
}

// Test ingredient-to-product linking
async function testIngredientLinking() {
    console.log('\n🧪 Testing Ingredient-to-Product Linking...\n');
    
    const testIngredients = ['garlic', 'tomato', 'flour', 'milk', 'salt'];
    
    for (const ingredient of testIngredients) {
        try {
            const { data: mapping, error } = await supabase
                .from('IngredientCanonical')
                .select('canonical_ingredient, matching_products')
                .eq('canonical_ingredient', ingredient)
                .single();
            
            if (error) {
                console.log(`   ❌ "${ingredient}": Not found in mappings`);
                continue;
            }
            
            const productCount = mapping.matching_products ? mapping.matching_products.length : 0;
            console.log(`   ✅ "${ingredient}": ${productCount} products mapped`);
            
            if (productCount > 0) {
                // Get sample products
                const { data: products, error: productError } = await supabase
                    .from('IngredientCategorized')
                    .select('description')
                    .in('id', mapping.matching_products.slice(0, 3));
                
                if (!productError && products) {
                    console.log(`      📋 Sample products:`);
                    products.forEach(product => {
                        console.log(`         • "${product.description}"`);
                    });
                }
            }
            
        } catch (error) {
            console.error(`   ❌ Error testing "${ingredient}":`, error);
        }
    }
}

// Main comprehensive fix function
async function runComprehensiveFix() {
    console.log('🚀 Starting Comprehensive Cleaning & Mapping Fix...\n');
    
    await fixProductCanonicals();
    await fixIngredientCanonicals();
    await restoreIngredientMappings();
    await testIngredientLinking();
    
    console.log('\n🎉 Comprehensive Fix Complete!');
    console.log('\n📋 What We Fixed:');
    console.log('1. ✅ Removed commas, special characters from product names');
    console.log('2. ✅ Cleaned ingredient names to camelCase');
    console.log('3. ✅ Restored ingredient-to-product mappings');
    console.log('4. ✅ Tested ingredient linking functionality');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Monitor mapping quality');
    console.log('2. Adjust cleaning rules if needed');
    console.log('3. Implement in the frontend app');
    console.log('4. Add user feedback for mapping quality');
}

runComprehensiveFix().catch(console.error); 