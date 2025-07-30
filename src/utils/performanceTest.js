/**
 * Performance Testing Utilities for Allergen Filtering
 * Use these functions to monitor and test database performance
 */

import { supabase } from './supabaseClient';
import { testAllergenQueryPerformance, testSpecificAllergenCombination } from './supabaseQueries';

/**
 * Comprehensive performance test suite
 */
export const runPerformanceTestSuite = async () => {
    console.log('🚀 Starting comprehensive performance test suite...');
    
    const results = {
        timestamp: new Date().toISOString(),
        tests: {},
        summary: {}
    };
    
    try {
        // Test 1: Basic allergen query performance
        console.log('\n📊 Test 1: Basic allergen query performance');
        const basicTest = await testAllergenQueryPerformance();
        results.tests.basicPerformance = basicTest;
        
        // Test 2: Common allergen combinations
        console.log('\n📊 Test 2: Common allergen combinations');
        const commonCombinations = [
            ['milk'],
            ['peanuts'],
            ['gluten'],
            ['milk', 'peanuts'],
            ['milk', 'gluten', 'eggs'],
            ['peanuts', 'treeNuts', 'soy']
        ];
        
        results.tests.commonCombinations = {};
        for (const combination of commonCombinations) {
            const testResult = await testSpecificAllergenCombination(combination);
            results.tests.commonCombinations[combination.join(',')] = testResult;
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Test 3: Search + allergen combination
        console.log('\n📊 Test 3: Search + allergen combination');
        const searchAllergenTest = await testSearchWithAllergens('chicken', ['soy']);
        results.tests.searchWithAllergens = searchAllergenTest;
        
        // Test 4: Database connection and basic query
        console.log('\n📊 Test 4: Database connection test');
        const connectionTest = await testDatabaseConnection();
        results.tests.databaseConnection = connectionTest;
        
        // Generate summary
        results.summary = generatePerformanceSummary(results);
        
        console.log('\n✅ Performance test suite completed!');
        console.log('📋 Summary:', results.summary);
        
        return results;
        
    } catch (error) {
        console.error('❌ Performance test suite failed:', error);
        return { error: error.message, timestamp: new Date().toISOString() };
    }
};

/**
 * Test search functionality with allergen filtering
 */
export const testSearchWithAllergens = async (searchTerm, allergens) => {
    console.log(`[PERFORMANCE TEST] Testing search "${searchTerm}" with allergens:`, allergens);
    const startTime = Date.now();
    
    try {
        let query = supabase
            .from('IngredientCategorized')
            .select('id, description, brandName')
            .ilike('description', `%${searchTerm}%`)
            .neq('brandName', 'generic');
        
        // Apply allergen filters
        allergens.forEach(allergen => {
            query = query.not('description', 'ilike', `%${allergen}%`);
        });
        
        const { data, error } = await query.limit(100);
        
        if (error) {
            console.error('[PERFORMANCE TEST] Search + allergen combination failed:', error);
            return { success: false, error };
        }
        
        const duration = Date.now() - startTime;
        console.log(`[PERFORMANCE TEST] Search + allergen combination completed in ${duration}ms, found ${data?.length || 0} products`);
        
        return { success: true, duration, count: data?.length || 0 };
        
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[PERFORMANCE TEST] Search + allergen combination failed after ${duration}ms:`, error);
        return { success: false, error, duration };
    }
};

/**
 * Test database connection and basic functionality
 */
export const testDatabaseConnection = async () => {
    console.log('[PERFORMANCE TEST] Testing database connection...');
    const startTime = Date.now();
    
    try {
        // Test basic connection
        const { data, error } = await supabase
            .from('IngredientCategorized')
            .select('COUNT(*)')
            .limit(1);
        
        if (error) {
            console.error('[PERFORMANCE TEST] Database connection failed:', error);
            return { success: false, error };
        }
        
        const duration = Date.now() - startTime;
        console.log(`[PERFORMANCE TEST] Database connection successful in ${duration}ms`);
        
        return { success: true, duration };
        
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[PERFORMANCE TEST] Database connection failed after ${duration}ms:`, error);
        return { success: false, error, duration };
    }
};

/**
 * Generate performance summary from test results
 */
const generatePerformanceSummary = (results) => {
    const summary = {
        totalTests: 0,
        successfulTests: 0,
        failedTests: 0,
        averageDuration: 0,
        slowestTest: null,
        fastestTest: null,
        recommendations: []
    };
    
    let totalDuration = 0;
    let testCount = 0;
    
    // Analyze basic performance test
    if (results.tests.basicPerformance) {
        testCount++;
        if (results.tests.basicPerformance.success) {
            summary.successfulTests++;
            totalDuration += results.tests.basicPerformance.duration;
            
            if (!summary.slowestTest || results.tests.basicPerformance.duration > summary.slowestTest.duration) {
                summary.slowestTest = { name: 'Basic Performance', duration: results.tests.basicPerformance.duration };
            }
            if (!summary.fastestTest || results.tests.basicPerformance.duration < summary.fastestTest.duration) {
                summary.fastestTest = { name: 'Basic Performance', duration: results.tests.basicPerformance.duration };
            }
        } else {
            summary.failedTests++;
        }
    }
    
    // Analyze common combinations
    if (results.tests.commonCombinations) {
        Object.entries(results.tests.commonCombinations).forEach(([combination, result]) => {
            testCount++;
            if (result.success) {
                summary.successfulTests++;
                totalDuration += result.duration;
                
                if (!summary.slowestTest || result.duration > summary.slowestTest.duration) {
                    summary.slowestTest = { name: `Combination: ${combination}`, duration: result.duration };
                }
                if (!summary.fastestTest || result.duration < summary.fastestTest.duration) {
                    summary.fastestTest = { name: `Combination: ${combination}`, duration: result.duration };
                }
            } else {
                summary.failedTests++;
            }
        });
    }
    
    // Analyze other tests
    ['searchWithAllergens', 'databaseConnection'].forEach(testName => {
        if (results.tests[testName]) {
            testCount++;
            if (results.tests[testName].success) {
                summary.successfulTests++;
                totalDuration += results.tests[testName].duration;
            } else {
                summary.failedTests++;
            }
        }
    });
    
    summary.totalTests = testCount;
    summary.averageDuration = testCount > 0 ? Math.round(totalDuration / testCount) : 0;
    
    // Generate recommendations
    if (summary.averageDuration > 2000) {
        summary.recommendations.push('⚠️ Average query time exceeds 2 seconds - consider additional database optimization');
    }
    if (summary.failedTests > 0) {
        summary.recommendations.push('❌ Some tests failed - check database indexes and connection');
    }
    if (summary.successfulTests === summary.totalTests) {
        summary.recommendations.push('✅ All tests passed - allergen filtering is working correctly');
    }
    
    return summary;
};

/**
 * Monitor real-time performance during user interactions
 */
export const trackQueryPerformance = (queryName, startTime) => {
    const duration = Date.now() - startTime;
    console.log(`[PERFORMANCE] ${queryName}: ${duration}ms`);
    
    // Alert if query takes >2 seconds
    if (duration > 2000) {
        console.warn(`[PERFORMANCE WARNING] ${queryName} took ${duration}ms (target: <2000ms)`);
        
        // Could send to monitoring service here
        // analytics.track('slow_query', { queryName, duration });
    }
    
    return duration;
};

export default {
    runPerformanceTestSuite,
    testSearchWithAllergens,
    testDatabaseConnection,
    trackQueryPerformance
}; 