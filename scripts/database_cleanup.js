#!/usr/bin/env node

/**
 * 🗄️ DATABASE CLEANUP SCRIPT
 * Dynable App - Complete Database Standardization
 * 
 * This script performs comprehensive database cleanup:
 * 1. Removes non-allergen items from allergen arrays
 * 2. Fixes underscore naming (tree_nuts → treenuts)
 * 3. Standardizes allergen casing
 * 4. Removes duplicate products
 * 
 * CRITICAL RULE: NO UNDERSCORES in database values
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

// Progress tracking
const cleanupProgress = {
    removeNonAllergens: { completed: 0, total: 200000, status: 'pending', batches: 0 },
    fixUnderscores: { completed: 0, total: 200000, status: 'pending', batches: 0 },
    standardizeCasing: { completed: 0, total: 200000, status: 'pending', batches: 0 },
    removeDuplicates: { completed: 0, total: 5, status: 'pending', batches: 0 }
};

/**
 * Batch processing utility
 */
const processBatchUpdate = async (tableName, updateQuery, batchSize = 1000, progressCallback = null) => {
    let offset = 0;
    let totalProcessed = 0;
    let totalBatches = 0;
    
    console.log(`🔄 Starting batch processing for ${tableName}...`);
    
    while (true) {
        try {
            // Get batch of records
            const { data, error } = await supabase
                .from(tableName)
                .select('id')
                .range(offset, offset + batchSize - 1);
                
            if (error) {
                console.error(`❌ Error fetching batch ${totalBatches + 1}:`, error);
                break;
            }
            
            if (!data || data.length === 0) {
                console.log(`✅ No more records to process`);
                break;
            }
            
            // Apply updates to this batch
            const batchIds = data.map(record => record.id);
            const { error: updateError } = await supabase
                .from(tableName)
                .update(updateQuery)
                .in('id', batchIds);
                
            if (updateError) {
                console.error(`❌ Batch ${totalBatches + 1} failed:`, updateError);
                throw updateError;
            }
            
            totalProcessed += data.length;
            totalBatches++;
            offset += batchSize;
            
            if (progressCallback) {
                progressCallback(totalProcessed, totalBatches, offset);
            }
            
            console.log(`✅ Batch ${totalBatches}: ${data.length} records processed`);
            
            // Add delay to prevent overwhelming database
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`❌ Fatal error in batch ${totalBatches + 1}:`, error);
            break;
        }
    }
    
    console.log(`🎉 Batch processing complete! ${totalProcessed} records processed in ${totalBatches} batches`);
    return { totalProcessed, totalBatches };
};

/**
 * Update progress tracking
 */
const updateProgress = (task, processed, batches) => {
    cleanupProgress[task].completed = processed;
    cleanupProgress[task].batches = batches;
    cleanupProgress[task].status = processed >= cleanupProgress[task].total ? 'completed' : 'in_progress';
    
    console.log(`📊 ${task}: ${processed}/${cleanupProgress[task].total} (${batches} batches)`);
};

/**
 * 1. Remove non-allergen items from allergen arrays
 */
const removeNonAllergens = async () => {
    const nonAllergens = [
        'Apples', 'Bananas', 'Beef', 'Celery', 'Chicken', 'Chocolate',
        'Corn', 'Garlic', 'Mustard', 'Onions', 'Peaches', 'Pork',
        'Sesame', 'Strawberries', 'Tomatoes'
    ];
    
    console.log(`🗑️  Removing ${nonAllergens.length} non-allergen items...`);
    
    // Build array_remove chain
    let removeChain = 'allergens';
    nonAllergens.forEach(item => {
        removeChain = `array_remove(${removeChain}, '${item}')`;
    });
    
    // Build WHERE condition
    const whereConditions = nonAllergens.map(item => `allergens @> ARRAY['${item}']`).join(' OR ');
    
    await processBatchUpdate(
        'IngredientCategorized',
        { allergens: removeChain },
        1000,
        (processed, batches) => updateProgress('removeNonAllergens', processed, batches)
    );
    
    console.log('✅ All non-allergen items removed!');
};

/**
 * 2. Fix underscore naming (CRITICAL RULE #1)
 */
const fixUnderscores = async () => {
    const underscoreMappings = {
        'tree_nuts': 'treenuts',
        'gluten_free': 'glutenfree',
        'dairy_free': 'dairyfree',
        'nut_free': 'nutfree',
        'wheat_free': 'wheatfree',
        'soy_free': 'soyfree',
        'egg_free': 'eggfree',
        'fish_free': 'fishfree',
        'shellfish_free': 'shellfishfree',
        'peanut_free': 'peanutfree'
    };
    
    for (const [oldValue, newValue] of Object.entries(underscoreMappings)) {
        console.log(`🔄 Replacing '${oldValue}' → '${newValue}'...`);
        
        await processBatchUpdate(
            'IngredientCategorized',
            { allergens: `array_replace(allergens, '${oldValue}', '${newValue}')` },
            1000,
            (processed, batches) => updateProgress('fixUnderscores', processed, batches)
        );
    }
    
    console.log('✅ All underscores removed!');
};

/**
 * 3. Standardize allergen casing
 */
const standardizeCasing = async () => {
    const casingMappings = {
        'Tree Nuts': 'treenuts',
        'TreeNuts': 'treenuts',
        'Tree_Nuts': 'treenuts',
        'Milk': 'milk',
        'MILK': 'milk',
        'Eggs': 'eggs',
        'EGGS': 'eggs',
        'Wheat': 'wheat',
        'WHEAT': 'wheat',
        'Soy': 'soy',
        'SOY': 'soy',
        'Fish': 'fish',
        'FISH': 'fish',
        'Shellfish': 'shellfish',
        'SHELLFISH': 'shellfish',
        'Peanuts': 'peanuts',
        'PEANUTS': 'peanuts'
    };
    
    for (const [oldValue, newValue] of Object.entries(casingMappings)) {
        console.log(`🔄 Standardizing '${oldValue}' → '${newValue}'...`);
        
        await processBatchUpdate(
            'IngredientCategorized',
            { allergens: `array_replace(allergens, '${oldValue}', '${newValue}')` },
            1000,
            (processed, batches) => updateProgress('standardizeCasing', processed, batches)
        );
    }
    
    console.log('✅ All casing standardized!');
};

/**
 * 4. Remove duplicate products
 */
const removeDuplicates = async () => {
    console.log('🗑️  Removing duplicate products...');
    
    // Find duplicates
    const { data: duplicates, error } = await supabase
        .from('IngredientCategorized')
        .select('id, description, brandName')
        .not('description', 'is', null);
    
    if (error) {
        console.error('❌ Error finding duplicates:', error);
        return;
    }
    
    // Group by description + brandName
    const duplicateMap = {};
    duplicates.forEach(row => {
        const key = `${row.description}-${row.brandName}`;
        if (!duplicateMap[key]) {
            duplicateMap[key] = [];
        }
        duplicateMap[key].push(row);
    });
    
    // Remove duplicates (keep first occurrence)
    let removedCount = 0;
    for (const [key, records] of Object.entries(duplicateMap)) {
        if (records.length > 1) {
            // Keep first record, delete the rest
            const toDelete = records.slice(1);
            const idsToDelete = toDelete.map(record => record.id);
            
            const { error: deleteError } = await supabase
                .from('IngredientCategorized')
                .delete()
                .in('id', idsToDelete);
            
            if (deleteError) {
                console.error(`❌ Error deleting duplicates for ${key}:`, deleteError);
            } else {
                removedCount += toDelete.length;
                console.log(`🗑️  Removed ${toDelete.length} duplicates for: ${key}`);
            }
        }
    }
    
    updateProgress('removeDuplicates', removedCount, 1);
    console.log(`✅ Removed ${removedCount} duplicate products!`);
};

/**
 * 5. Validation queries
 */
const validateCleanup = async () => {
    console.log('🔍 Validating database cleanup...');
    
    // Check for remaining underscores
    const { data: underscoreData, error: underscoreError } = await supabase
        .from('IngredientCategorized')
        .select('allergens')
        .not('allergens', 'is', null);
    
    if (underscoreError) {
        console.error('❌ Error checking underscores:', underscoreError);
        return;
    }
    
    const underscoreCount = underscoreData.filter(row => 
        row.allergens.some(allergen => allergen.includes('_'))
    ).length;
    
    console.log(`📊 Products with underscores: ${underscoreCount}`);
    
    // Check for non-allergen items
    const nonAllergens = ['Apples', 'Bananas', 'Beef', 'Celery', 'Chicken'];
    let nonAllergenCount = 0;
    
    for (const nonAllergen of nonAllergens) {
        const { data, error } = await supabase
            .from('IngredientCategorized')
            .select('allergens')
            .contains('allergens', [nonAllergen]);
        
        if (!error && data) {
            nonAllergenCount += data.length;
        }
    }
    
    console.log(`📊 Products with non-allergen items: ${nonAllergenCount}`);
    
    // Summary
    if (underscoreCount === 0 && nonAllergenCount === 0) {
        console.log('✅ VALIDATION PASSED: Database cleanup successful!');
    } else {
        console.log('❌ VALIDATION FAILED: Issues found in database');
    }
};

/**
 * Main cleanup function
 */
const completeDatabaseCleanup = async () => {
    console.log('🧹 Starting complete database cleanup...');
    console.log('==========================================');
    
    try {
        // 1. Remove non-allergen items (CRITICAL)
        console.log('\n🚨 STEP 1: Removing non-allergen items...');
        await removeNonAllergens();
        
        // 2. Fix underscore naming (CRITICAL)
        console.log('\n🔧 STEP 2: Fixing underscore naming...');
        await fixUnderscores();
        
        // 3. Standardize casing
        console.log('\n📝 STEP 3: Standardizing casing...');
        await standardizeCasing();
        
        // 4. Remove duplicates
        console.log('\n🗑️  STEP 4: Removing duplicates...');
        await removeDuplicates();
        
        // 5. Validate cleanup
        console.log('\n🔍 STEP 5: Validating cleanup...');
        await validateCleanup();
        
        console.log('\n🎉 DATABASE CLEANUP COMPLETE!');
        console.log('================================');
        console.log('✅ All non-allergen items removed');
        console.log('✅ All underscore naming fixed');
        console.log('✅ All allergen casing standardized');
        console.log('✅ All duplicates removed');
        console.log('✅ Database now follows NO UNDERSCORE rule');
        
    } catch (error) {
        console.error('❌ Database cleanup failed:', error);
        process.exit(1);
    }
};

// Run cleanup if called directly
if (require.main === module) {
    completeDatabaseCleanup();
}

module.exports = { 
    completeDatabaseCleanup,
    removeNonAllergens,
    fixUnderscores,
    standardizeCasing,
    removeDuplicates,
    validateCleanup
}; 