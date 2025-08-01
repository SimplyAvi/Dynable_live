/**
 * Recipe Mapping System Master Script
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * This script orchestrates the entire recipe-to-product mapping system to solve
 * database timeout issues. It runs all three phases in sequence:
 * 
 * Phase 1: Product Canonical Mapping
 * Phase 2: Ingredient Canonical Mapping  
 * Phase 3: Substitute Mapping Generation
 * 
 * Features:
 * - Runs all mapping scripts in the correct order
 * - Provides comprehensive progress tracking
 * - Handles errors gracefully
 * - Generates performance reports
 * - Can be run as a scheduled job
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import the mapping scripts
const { runProductCanonicalMapping } = require('./product_canonical_mapping.js');
const { runIngredientCanonicalMapping } = require('./ingredient_canonical_mapping.js');
const { runSubstituteMappingGenerator } = require('./substitute_mapping_generator.js');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🚀 RECIPE MAPPING SYSTEM MASTER SCRIPT');
console.log('======================================\n');

/**
 * Run the complete recipe mapping system
 */
async function runRecipeMappingSystem() {
    const startTime = Date.now();
    const results = {
        phase1: { success: false, duration: 0, mappings: 0 },
        phase2: { success: false, duration: 0, mappings: 0 },
        phase3: { success: false, duration: 0, substitutes: 0 },
        total: { success: false, duration: 0 }
    };
    
    try {
        console.log('📊 PHASE 1: PRODUCT CANONICAL MAPPING');
        console.log('=====================================\n');
        
        const phase1Start = Date.now();
        await runProductCanonicalMapping();
        const phase1Duration = Date.now() - phase1Start;
        
        results.phase1 = {
            success: true,
            duration: phase1Duration,
            mappings: 0 // Will be updated with actual count
        };
        
        console.log(`✅ Phase 1 completed in ${phase1Duration}ms\n`);
        
        // Small delay between phases
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📊 PHASE 2: INGREDIENT CANONICAL MAPPING');
        console.log('========================================\n');
        
        const phase2Start = Date.now();
        await runIngredientCanonicalMapping();
        const phase2Duration = Date.now() - phase2Start;
        
        results.phase2 = {
            success: true,
            duration: phase2Duration,
            mappings: 0 // Will be updated with actual count
        };
        
        console.log(`✅ Phase 2 completed in ${phase2Duration}ms\n`);
        
        // Small delay between phases
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📊 PHASE 3: SUBSTITUTE MAPPING GENERATION');
        console.log('==========================================\n');
        
        const phase3Start = Date.now();
        await runSubstituteMappingGenerator();
        const phase3Duration = Date.now() - phase3Start;
        
        results.phase3 = {
            success: true,
            duration: phase3Duration,
            substitutes: 0 // Will be updated with actual count
        };
        
        console.log(`✅ Phase 3 completed in ${phase3Duration}ms\n`);
        
        // Generate final summary
        await generateFinalSummary(results);
        
        const totalDuration = Date.now() - startTime;
        results.total = {
            success: true,
            duration: totalDuration
        };
        
        console.log('\n🎉 RECIPE MAPPING SYSTEM COMPLETED SUCCESSFULLY!');
        console.log('==================================================');
        console.log(`⏱️ Total execution time: ${totalDuration}ms`);
        console.log(`📊 Total mappings created: ${results.phase1.mappings + results.phase2.mappings}`);
        console.log(`🔄 Total substitutes generated: ${results.phase3.substitutes}`);
        
    } catch (error) {
        console.error('❌ Recipe mapping system failed:', error);
        results.total = {
            success: false,
            error: error.message
        };
    }
    
    return results;
}

/**
 * Generate final summary with database statistics
 */
async function generateFinalSummary(results) {
    console.log('📊 GENERATING FINAL SUMMARY');
    console.log('===========================\n');
    
    try {
        // Get ProductCanonical statistics
        const { data: productCanonicals, error: pcError } = await supabase
            .from('ProductCanonical')
            .select('canonical_product_name, product_category, product_ids');
        
        if (!pcError && productCanonicals) {
            results.phase1.mappings = productCanonicals.length;
            console.log(`📈 ProductCanonical mappings: ${productCanonicals.length}`);
            
            const categoryCounts = {};
            let totalProducts = 0;
            
            productCanonicals.forEach(mapping => {
                const category = mapping.product_category || 'unknown';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                totalProducts += mapping.product_ids?.length || 0;
            });
            
            console.log('📊 Product mappings by category:');
            Object.entries(categoryCounts).forEach(([category, count]) => {
                console.log(`   ${category}: ${count} mappings`);
            });
            console.log(`📊 Total products mapped: ${totalProducts}`);
        }
        
        // Get IngredientCanonical statistics
        const { data: ingredientCanonicals, error: icError } = await supabase
            .from('IngredientCanonical')
            .select('canonical_ingredient, ingredient_category, matching_products, substitute_ingredients');
        
        if (!icError && ingredientCanonicals) {
            results.phase2.mappings = ingredientCanonicals.length;
            console.log(`📈 IngredientCanonical mappings: ${ingredientCanonicals.length}`);
            
            const categoryCounts = {};
            let totalProductMatches = 0;
            let totalSubstitutes = 0;
            
            ingredientCanonicals.forEach(mapping => {
                const category = mapping.ingredient_category || 'unknown';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                totalProductMatches += mapping.matching_products?.length || 0;
                totalSubstitutes += mapping.substitute_ingredients?.length || 0;
            });
            
            console.log('📊 Ingredient mappings by category:');
            Object.entries(categoryCounts).forEach(([category, count]) => {
                console.log(`   ${category}: ${count} mappings`);
            });
            console.log(`📊 Total product matches: ${totalProductMatches}`);
            console.log(`📊 Total substitute ingredients: ${totalSubstitutes}`);
        }
        
        // Get SubstituteMappings statistics
        const { data: substituteMappings, error: smError } = await supabase
            .from('SubstituteMappings')
            .select('original_product_canonical, substitute_product_canonical, confidence_score, dietary_categories');
        
        if (!smError && substituteMappings) {
            results.phase3.substitutes = substituteMappings.length;
            console.log(`📈 SubstituteMappings: ${substituteMappings.length}`);
            
            const categoryCounts = {};
            let totalConfidence = 0;
            
            substituteMappings.forEach(mapping => {
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
            
            const avgConfidence = substituteMappings.length > 0 ? totalConfidence / substituteMappings.length : 0;
            console.log(`📊 Average confidence score: ${avgConfidence.toFixed(2)}`);
        }
        
        // Performance analysis
        console.log('\n⚡ PERFORMANCE ANALYSIS');
        console.log('=======================');
        console.log(`Phase 1 duration: ${results.phase1.duration}ms`);
        console.log(`Phase 2 duration: ${results.phase2.duration}ms`);
        console.log(`Phase 3 duration: ${results.phase3.duration}ms`);
        console.log(`Total duration: ${results.total.duration}ms`);
        
        const totalMappings = results.phase1.mappings + results.phase2.mappings;
        if (totalMappings > 0) {
            const mappingsPerSecond = (totalMappings / (results.total.duration / 1000)).toFixed(2);
            console.log(`📊 Processing rate: ${mappingsPerSecond} mappings/second`);
        }
        
    } catch (error) {
        console.error('❌ Error generating final summary:', error);
    }
}

/**
 * Test the new mapping system with a sample recipe
 */
async function testMappingSystem() {
    console.log('🧪 TESTING MAPPING SYSTEM');
    console.log('==========================\n');
    
    try {
        // Test ingredient lookup
        const testIngredient = 'diced tomatoes';
        console.log(`🔍 Testing ingredient: "${testIngredient}"`);
        
        const { data: ingredientMapping, error: icError } = await supabase
            .from('IngredientCanonical')
            .select('*')
            .eq('original_ingredient', testIngredient)
            .single();
        
        if (!icError && ingredientMapping) {
            console.log(`✅ Found mapping: "${ingredientMapping.original_ingredient}" → "${ingredientMapping.canonical_ingredient}"`);
            console.log(`📊 Product matches: ${ingredientMapping.matching_products?.length || 0}`);
            console.log(`🔄 Substitute ingredients: ${ingredientMapping.substitute_ingredients?.length || 0}`);
        } else {
            console.log(`ℹ️ No mapping found for "${testIngredient}"`);
        }
        
        // Test substitute lookup
        const testProduct = 'flour';
        console.log(`\n🔍 Testing substitutes for: "${testProduct}"`);
        
        const { data: substitutes, error: smError } = await supabase
            .from('SubstituteMappings')
            .select('*')
            .eq('original_product_canonical', testProduct)
            .order('confidence_score', { ascending: false });
        
        if (!smError && substitutes) {
            console.log(`✅ Found ${substitutes.length} substitutes for "${testProduct}":`);
            substitutes.slice(0, 3).forEach(substitute => {
                console.log(`   - ${substitute.substitute_product_canonical} (confidence: ${substitute.confidence_score})`);
            });
        } else {
            console.log(`ℹ️ No substitutes found for "${testProduct}"`);
        }
        
        console.log('\n✅ Mapping system test completed');
        
    } catch (error) {
        console.error('❌ Error testing mapping system:', error);
    }
}

/**
 * Clean up old data (optional)
 */
async function cleanupOldData() {
    console.log('🧹 CLEANING UP OLD DATA');
    console.log('========================\n');
    
    try {
        // Check for orphaned mappings
        const { data: orphanedMappings, error } = await supabase
            .from('IngredientCanonical')
            .select('*')
            .is('matching_products', null);
        
        if (!error && orphanedMappings && orphanedMappings.length > 0) {
            console.log(`🗑️ Found ${orphanedMappings.length} orphaned ingredient mappings`);
            
            // Optionally delete orphaned mappings
            // const { error: deleteError } = await supabase
            //     .from('IngredientCanonical')
            //     .delete()
            //     .is('matching_products', null);
            
            // if (!deleteError) {
            //     console.log('✅ Cleaned up orphaned mappings');
            // }
        }
        
        console.log('✅ Cleanup completed');
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'run';
    
    switch (command) {
        case 'run':
            console.log('🚀 Running complete recipe mapping system...\n');
            await runRecipeMappingSystem();
            break;
            
        case 'test':
            console.log('🧪 Testing mapping system...\n');
            await testMappingSystem();
            break;
            
        case 'cleanup':
            console.log('🧹 Cleaning up old data...\n');
            await cleanupOldData();
            break;
            
        case 'phase1':
            console.log('📊 Running Phase 1: Product Canonical Mapping...\n');
            await runProductCanonicalMapping();
            break;
            
        case 'phase2':
            console.log('📊 Running Phase 2: Ingredient Canonical Mapping...\n');
            await runIngredientCanonicalMapping();
            break;
            
        case 'phase3':
            console.log('📊 Running Phase 3: Substitute Mapping Generation...\n');
            await runSubstituteMappingGenerator();
            break;
            
        default:
            console.log('Usage: node run_recipe_mapping_system.js [command]');
            console.log('Commands:');
            console.log('  run      - Run complete mapping system (default)');
            console.log('  test     - Test the mapping system');
            console.log('  cleanup  - Clean up old data');
            console.log('  phase1   - Run only Phase 1 (Product Canonical)');
            console.log('  phase2   - Run only Phase 2 (Ingredient Canonical)');
            console.log('  phase3   - Run only Phase 3 (Substitute Generation)');
            break;
    }
}

// Run the script
if (require.main === module) {
    main().then(() => {
        console.log('\n✅ Recipe mapping system script completed');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runRecipeMappingSystem,
    testMappingSystem,
    cleanupOldData,
    generateFinalSummary
}; 