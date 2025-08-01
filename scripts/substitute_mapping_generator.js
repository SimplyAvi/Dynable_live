/**
 * Substitute Mapping Generator Script (Ongoing)
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * This script analyzes product canonical data and creates intelligent substitute
 * mappings to solve database timeout issues in recipe-to-product workflows.
 * 
 * Features:
 * - Analyzes product canonical data for substitute opportunities
 * - Uses allergen data to find safe alternatives
 * - Considers dietary restrictions (gluten-free, vegan, etc.)
 * - Maintains confidence scores for substitute quality
 * - Updates substitute mappings as data changes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔄 SUBSTITUTE MAPPING GENERATOR SCRIPT');
console.log('======================================\n');

// Common substitute mappings based on allergen restrictions
const COMMON_SUBSTITUTES = {
    // Wheat/Gluten substitutes
    'flour': [
        { substitute: 'almond_flour', allergens: ['treeNuts'], ratio: '1:1', notes: 'May affect texture', categories: ['glutenFree', 'keto'], confidence: 0.95 },
        { substitute: 'coconut_flour', allergens: ['treeNuts'], ratio: '1/4 cup per 1 cup', notes: 'Very absorbent, use less', categories: ['glutenFree', 'keto'], confidence: 0.90 },
        { substitute: 'rice_flour', allergens: [], ratio: '1:1', notes: 'Good for thickening', categories: ['glutenFree'], confidence: 0.85 },
        { substitute: 'oat_flour', allergens: ['gluten'], ratio: '1:1', notes: 'Use certified gluten-free oats', categories: ['glutenFree'], confidence: 0.80 }
    ],
    
    // Dairy substitutes
    'milk': [
        { substitute: 'almond_milk', allergens: ['treeNuts'], ratio: '1:1', notes: 'Slightly nutty flavor', categories: ['dairyFree', 'vegan'], confidence: 0.95 },
        { substitute: 'soy_milk', allergens: ['soy'], ratio: '1:1', notes: 'Creamy texture', categories: ['dairyFree', 'vegan'], confidence: 0.90 },
        { substitute: 'oat_milk', allergens: ['gluten'], ratio: '1:1', notes: 'Naturally sweet', categories: ['dairyFree', 'vegan'], confidence: 0.85 },
        { substitute: 'coconut_milk', allergens: ['treeNuts'], ratio: '1:1', notes: 'Rich and creamy', categories: ['dairyFree', 'vegan'], confidence: 0.80 }
    ],
    
    'butter': [
        { substitute: 'coconut_oil', allergens: ['treeNuts'], ratio: '1:1', notes: 'Solid at room temperature', categories: ['dairyFree', 'vegan'], confidence: 0.90 },
        { substitute: 'olive_oil', allergens: [], ratio: '3/4 cup per 1 cup', notes: 'Good for cooking', categories: ['dairyFree', 'vegan'], confidence: 0.85 },
        { substitute: 'avocado_oil', allergens: [], ratio: '1:1', notes: 'Neutral flavor', categories: ['dairyFree', 'vegan'], confidence: 0.80 }
    ],
    
    'cheese': [
        { substitute: 'nutritional_yeast', allergens: [], ratio: '1/4 cup per 1 cup', notes: 'Cheesy flavor, no melting', categories: ['dairyFree', 'vegan'], confidence: 0.75 },
        { substitute: 'cashew_cheese', allergens: ['treeNuts'], ratio: '1:1', notes: 'Creamy texture', categories: ['dairyFree', 'vegan'], confidence: 0.70 }
    ],
    
    // Egg substitutes
    'eggs': [
        { substitute: 'flax_eggs', allergens: [], ratio: '1 tbsp ground flax + 3 tbsp water per egg', notes: 'Good for binding', categories: ['eggFree', 'vegan'], confidence: 0.85 },
        { substitute: 'chia_eggs', allergens: [], ratio: '1 tbsp chia seeds + 3 tbsp water per egg', notes: 'Similar to flax eggs', categories: ['eggFree', 'vegan'], confidence: 0.80 },
        { substitute: 'banana', allergens: [], ratio: '1/4 cup mashed per egg', notes: 'Adds sweetness', categories: ['eggFree', 'vegan'], confidence: 0.75 },
        { substitute: 'applesauce', allergens: [], ratio: '1/4 cup per egg', notes: 'Good for baking', categories: ['eggFree', 'vegan'], confidence: 0.70 }
    ],
    
    // Sugar substitutes
    'sugar': [
        { substitute: 'honey', allergens: [], ratio: '3/4 cup per 1 cup', notes: 'Natural sweetener', categories: ['natural'], confidence: 0.90 },
        { substitute: 'maple_syrup', allergens: [], ratio: '3/4 cup per 1 cup', notes: 'Rich flavor', categories: ['natural'], confidence: 0.85 },
        { substitute: 'stevia', allergens: [], ratio: '1/4 tsp per 1 cup', notes: 'Very sweet, use sparingly', categories: ['natural', 'keto'], confidence: 0.80 },
        { substitute: 'coconut_sugar', allergens: [], ratio: '1:1', notes: 'Lower glycemic index', categories: ['natural'], confidence: 0.75 }
    ],
    
    // Oil substitutes
    'oil': [
        { substitute: 'applesauce', allergens: [], ratio: '1/2 cup per 1 cup', notes: 'Reduces fat content', categories: ['lowFat'], confidence: 0.80 },
        { substitute: 'banana', allergens: [], ratio: '1/2 cup mashed per 1 cup', notes: 'Adds moisture', categories: ['lowFat'], confidence: 0.75 },
        { substitute: 'yogurt', allergens: ['milk'], ratio: '1:1', notes: 'Greek yogurt works best', categories: ['protein'], confidence: 0.70 }
    ],
    
    // Meat substitutes
    'chicken': [
        { substitute: 'tofu', allergens: ['soy'], ratio: '1:1', notes: 'Firm tofu for texture', categories: ['vegan'], confidence: 0.75 },
        { substitute: 'tempeh', allergens: ['soy'], ratio: '1:1', notes: 'Nutty flavor', categories: ['vegan'], confidence: 0.70 },
        { substitute: 'seitan', allergens: ['wheat'], ratio: '1:1', notes: 'Meaty texture', categories: ['vegan'], confidence: 0.65 }
    ],
    
    'beef': [
        { substitute: 'lentils', allergens: [], ratio: '1 cup cooked per 1 lb', notes: 'Good for ground beef', categories: ['vegan'], confidence: 0.80 },
        { substitute: 'mushrooms', allergens: [], ratio: '1:1', notes: 'Portobello for steaks', categories: ['vegan'], confidence: 0.75 },
        { substitute: 'tempeh', allergens: ['soy'], ratio: '1:1', notes: 'Crumbled for ground beef', categories: ['vegan'], confidence: 0.70 }
    ]
};

// Dietary categories and their allergen restrictions
const DIETARY_CATEGORIES = {
    'glutenFree': ['wheat', 'gluten'],
    'dairyFree': ['milk', 'lactose'],
    'eggFree': ['eggs'],
    'soyFree': ['soy'],
    'nutFree': ['treeNuts', 'peanuts'],
    'vegan': ['milk', 'eggs', 'fish', 'shellfish'],
    'keto': [],
    'paleo': ['grains', 'dairy'],
    'lowCarb': [],
    'lowFat': [],
    'natural': []
};

/**
 * Check if a product is safe for a given dietary restriction
 */
function isProductSafeForDiet(productAllergens, dietaryCategory) {
    const restrictedAllergens = DIETARY_CATEGORIES[dietaryCategory] || [];
    
    if (!productAllergens || productAllergens.length === 0) {
        return true;
    }
    
    return !productAllergens.some(allergen => restrictedAllergens.includes(allergen));
}

/**
 * Calculate confidence score for a substitute based on various factors
 */
function calculateConfidenceScore(originalProduct, substituteProduct, dietaryCategory) {
    let score = 0.5; // Base score
    
    // Check allergen compatibility
    if (isProductSafeForDiet(substituteProduct.allergens, dietaryCategory)) {
        score += 0.3;
    }
    
    // Check if substitute is in common substitutes list
    const commonSubstitutes = COMMON_SUBSTITUTES[originalProduct.canonical_product_name];
    if (commonSubstitutes) {
        const commonSubstitute = commonSubstitutes.find(sub => sub.substitute === substituteProduct.canonical_product_name);
        if (commonSubstitute) {
            score += 0.2;
        }
    }
    
    // Check category similarity
    if (originalProduct.product_category === substituteProduct.product_category) {
        score += 0.1;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Generate substitute mappings for a product
 */
async function generateSubstituteMappings(productCanonical) {
    try {
        const substitutes = [];
        
        // Get common substitutes for this product
        const commonSubstitutes = COMMON_SUBSTITUTES[productCanonical.canonical_product_name];
        
        if (commonSubstitutes) {
            for (const commonSubstitute of commonSubstitutes) {
                // Find the substitute product in ProductCanonical
                const { data: substituteProducts, error } = await supabase
                    .from('ProductCanonical')
                    .select('*')
                    .eq('canonical_product_name', commonSubstitute.substitute);
                
                if (error) {
                    console.error(`❌ Error finding substitute product ${commonSubstitute.substitute}:`, error);
                    continue;
                }
                
                if (substituteProducts && substituteProducts.length > 0) {
                    const substituteProduct = substituteProducts[0];
                    
                    // Check if this substitute is safe for common dietary restrictions
                    const safeCategories = [];
                    Object.keys(DIETARY_CATEGORIES).forEach(category => {
                        if (isProductSafeForDiet(substituteProduct.allergens, category)) {
                            safeCategories.push(category);
                        }
                    });
                    
                    const substituteMapping = {
                        original_product_canonical: productCanonical.canonical_product_name,
                        original_allergens: productCanonical.allergens || [],
                        substitute_product_canonical: substituteProduct.canonical_product_name,
                        substitute_allergens: substituteProduct.allergens || [],
                        substitute_ratio: commonSubstitute.ratio,
                        cooking_notes: commonSubstitute.notes,
                        dietary_categories: safeCategories,
                        confidence_score: commonSubstitute.confidence
                    };
                    
                    substitutes.push(substituteMapping);
                }
            }
        }
        
        // Generate additional substitutes based on allergen exclusions
        const { data: allProducts, error: allProductsError } = await supabase
            .from('ProductCanonical')
            .select('*')
            .neq('canonical_product_name', productCanonical.canonical_product_name);
        
        if (!allProductsError && allProducts) {
            for (const potentialSubstitute of allProducts) {
                // Skip if already in common substitutes
                if (substitutes.some(sub => sub.substitute_product_canonical === potentialSubstitute.canonical_product_name)) {
                    continue;
                }
                
                // Check if this substitute is safe for the original product's allergens
                const originalAllergens = productCanonical.allergens || [];
                const isSafe = !potentialSubstitute.allergens.some(allergen => 
                    originalAllergens.includes(allergen)
                );
                
                if (isSafe && potentialSubstitute.product_category === productCanonical.product_category) {
                    const confidence = calculateConfidenceScore(productCanonical, potentialSubstitute, 'general');
                    
                    if (confidence > 0.6) { // Only include high-confidence substitutes
                        const safeCategories = [];
                        Object.keys(DIETARY_CATEGORIES).forEach(category => {
                            if (isProductSafeForDiet(potentialSubstitute.allergens, category)) {
                                safeCategories.push(category);
                            }
                        });
                        
                        const substituteMapping = {
                            original_product_canonical: productCanonical.canonical_product_name,
                            original_allergens: productCanonical.allergens || [],
                            substitute_product_canonical: potentialSubstitute.canonical_product_name,
                            substitute_allergens: potentialSubstitute.allergens || [],
                            substitute_ratio: '1:1', // Default ratio
                            cooking_notes: 'May require recipe adjustment',
                            dietary_categories: safeCategories,
                            confidence_score: confidence
                        };
                        
                        substitutes.push(substituteMapping);
                    }
                }
            }
        }
        
        return substitutes;
        
    } catch (error) {
        console.error(`❌ Error generating substitute mappings for ${productCanonical.canonical_product_name}:`, error);
        return [];
    }
}

/**
 * Process a batch of products and generate substitute mappings
 */
async function processSubstituteBatch(batchSize = 50) {
    try {
        console.log(`🔄 Processing substitute batch (size: ${batchSize})...`);
        
        // Get products that need substitute mappings
        const { data: products, error } = await supabase
            .from('ProductCanonical')
            .select('*')
            .limit(batchSize);
        
        if (error) {
            console.error('❌ Error fetching products for substitute generation:', error);
            return { success: false, error: error.message };
        }
        
        if (!products || products.length === 0) {
            console.log('ℹ️ No products to process for substitutes');
            return { success: true, processed: 0 };
        }
        
        console.log(`🔄 Generating substitutes for ${products.length} products...`);
        
        let totalSubstitutes = 0;
        
        // Process each product
        for (const product of products) {
            console.log(`📋 Generating substitutes for "${product.canonical_product_name}"...`);
            
            const substitutes = await generateSubstituteMappings(product);
            
            if (substitutes.length > 0) {
                // Insert substitute mappings
                const { data: insertedSubstitutes, error: insertError } = await supabase
                    .from('SubstituteMappings')
                    .upsert(substitutes, { 
                        onConflict: 'original_product_canonical,substitute_product_canonical',
                        ignoreDuplicates: false 
                    })
                    .select();
                
                if (insertError) {
                    console.error(`❌ Error inserting substitutes for ${product.canonical_product_name}:`, insertError);
                } else {
                    totalSubstitutes += insertedSubstitutes.length;
                    console.log(`✅ Generated ${insertedSubstitutes.length} substitutes for "${product.canonical_product_name}"`);
                }
            } else {
                console.log(`ℹ️ No substitutes found for "${product.canonical_product_name}"`);
            }
        }
        
        console.log(`✅ Generated ${totalSubstitutes} total substitute mappings`);
        return { 
            success: true, 
            processed: products.length,
            substitutes: totalSubstitutes
        };
        
    } catch (error) {
        console.error('❌ Error processing substitute batch:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update existing substitute mappings when product data changes
 */
async function updateExistingSubstituteMappings() {
    try {
        console.log('🔄 Updating existing substitute mappings...');
        
        // Get all substitute mappings
        const { data: mappings, error } = await supabase
            .from('SubstituteMappings')
            .select('*');
        
        if (error) {
            console.error('❌ Error fetching existing substitute mappings:', error);
            return { success: false, error: error.message };
        }
        
        let updatedCount = 0;
        
        for (const mapping of mappings) {
            // Get current product data
            const { data: originalProduct, error: originalError } = await supabase
                .from('ProductCanonical')
                .select('*')
                .eq('canonical_product_name', mapping.original_product_canonical)
                .single();
            
            const { data: substituteProduct, error: substituteError } = await supabase
                .from('ProductCanonical')
                .select('*')
                .eq('canonical_product_name', mapping.substitute_product_canonical)
                .single();
            
            if (originalError || substituteError) {
                console.error(`❌ Error fetching product data for mapping ${mapping.id}:`, originalError || substituteError);
                continue;
            }
            
            // Recalculate confidence score
            const newConfidence = calculateConfidenceScore(originalProduct, substituteProduct, 'general');
            
            // Check if mapping needs update
            const needsUpdate = 
                JSON.stringify(originalProduct.allergens) !== JSON.stringify(mapping.original_allergens) ||
                JSON.stringify(substituteProduct.allergens) !== JSON.stringify(mapping.substitute_allergens) ||
                Math.abs(newConfidence - mapping.confidence_score) > 0.1;
            
            if (needsUpdate) {
                // Update the mapping
                const { error: updateError } = await supabase
                    .from('SubstituteMappings')
                    .update({ 
                        original_allergens: originalProduct.allergens || [],
                        substitute_allergens: substituteProduct.allergens || [],
                        confidence_score: newConfidence,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', mapping.id);
                
                if (updateError) {
                    console.error(`❌ Error updating substitute mapping ${mapping.id}:`, updateError);
                } else {
                    updatedCount++;
                    console.log(`✅ Updated substitute mapping for "${mapping.original_product_canonical}" → "${mapping.substitute_product_canonical}" (confidence: ${newConfidence.toFixed(2)})`);
                }
            }
        }
        
        console.log(`✅ Updated ${updatedCount} substitute mappings`);
        return { success: true, updated: updatedCount };
        
    } catch (error) {
        console.error('❌ Error updating existing substitute mappings:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Main function to run the substitute mapping generator
 */
async function runSubstituteMappingGenerator() {
    console.log('🚀 Starting substitute mapping generator...\n');
    
    try {
        // Step 1: Process new products for substitutes
        console.log('📊 STEP 1: Generating substitutes for new products...');
        const processResult = await processSubstituteBatch(50);
        
        if (!processResult.success) {
            console.error('❌ Failed to process substitutes:', processResult.error);
            return;
        }
        
        console.log(`✅ Processed ${processResult.processed} products, generated ${processResult.substitutes} substitutes\n`);
        
        // Step 2: Update existing substitute mappings
        console.log('📊 STEP 2: Updating existing substitute mappings...');
        const updateResult = await updateExistingSubstituteMappings();
        
        if (!updateResult.success) {
            console.error('❌ Failed to update substitute mappings:', updateResult.error);
            return;
        }
        
        console.log(`✅ Updated ${updateResult.updated} existing substitute mappings\n`);
        
        // Step 3: Generate summary
        console.log('📊 STEP 3: Generating summary...');
        const { data: summary, error: summaryError } = await supabase
            .from('SubstituteMappings')
            .select('original_product_canonical, substitute_product_canonical, confidence_score, dietary_categories');
        
        if (summaryError) {
            console.error('❌ Error generating summary:', summaryError);
        } else {
            console.log(`📈 Total substitute mappings: ${summary.length}`);
            
            const categoryCounts = {};
            let totalConfidence = 0;
            
            summary.forEach(mapping => {
                const categories = mapping.dietary_categories || [];
                categories.forEach(category => {
                    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                });
                totalConfidence += mapping.confidence_score || 0;
            });
            
            console.log('📊 Substitutes by dietary category:');
            Object.entries(categoryCounts).forEach(([category, count]) => {
                console.log(`   ${category}: ${count} substitutes`);
            });
            
            const avgConfidence = summary.length > 0 ? totalConfidence / summary.length : 0;
            console.log(`📊 Average confidence score: ${avgConfidence.toFixed(2)}`);
        }
        
        console.log('\n✅ Substitute mapping generator completed successfully!');
        
    } catch (error) {
        console.error('❌ Substitute mapping generator failed:', error);
    }
}

// Run the script
if (require.main === module) {
    runSubstituteMappingGenerator().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = {
    isProductSafeForDiet,
    calculateConfidenceScore,
    generateSubstituteMappings,
    processSubstituteBatch,
    updateExistingSubstituteMappings,
    runSubstituteMappingGenerator
}; 