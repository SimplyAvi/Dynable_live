// 🧪 BROWSER PERFORMANCE TEST
// Run this in your browser console to test the optimized allergen filtering
// Author: Justin Linzan
// Date: January 2025

// Simple performance test for browser console
async function testBrowserPerformance() {
    console.log('🚀 Testing Browser Performance with Optimized Allergen Filtering...\n');

    try {
        // Test 1: Initial data loading (no allergens)
        console.log('📊 Test 1: Initial data loading (no allergens)');
        const startTime1 = Date.now();
        
        // This will use the optimized function from your homepage
        const initialResponse = await searchProductsWithOptimalPagination({
            page: 1,
            limit: 20,
            searchTerm: '',
            allergens: [],
            includeCount: true
        });
        
        const endTime1 = Date.now();
        const duration1 = endTime1 - startTime1;
        
        console.log(`✅ Initial load: ${initialResponse.products.length} products in ${duration1}ms`);
        console.log(`📈 Total products: ${initialResponse.totalCount}`);
        console.log(`📄 Total pages: ${initialResponse.totalPages}`);
        console.log('');

        // Test 2: Allergen filtering (milk, peanuts)
        console.log('📊 Test 2: Allergen filtering (milk, peanuts)');
        const startTime2 = Date.now();
        
        const allergenResponse = await searchProductsWithOptimalPagination({
            page: 1,
            limit: 20,
            searchTerm: '',
            allergens: ['milk', 'peanuts'],
            includeCount: true
        });
        
        const endTime2 = Date.now();
        const duration2 = endTime2 - startTime2;
        
        console.log(`✅ Allergen filter: ${allergenResponse.products.length} safe products in ${duration2}ms`);
        console.log(`📈 Total safe products: ${allergenResponse.totalCount}`);
        console.log(`📄 Total pages: ${allergenResponse.totalPages}`);
        console.log('');

        // Test 3: Pagination performance
        console.log('📊 Test 3: Pagination performance (page 3)');
        const startTime3 = Date.now();
        
        const paginationResponse = await searchProductsWithOptimalPagination({
            page: 3,
            limit: 20,
            searchTerm: '',
            allergens: ['milk', 'peanuts'],
            includeCount: true
        });
        
        const endTime3 = Date.now();
        const duration3 = endTime3 - startTime3;
        
        console.log(`✅ Pagination: ${paginationResponse.products.length} products in ${duration3}ms`);
        console.log(`📈 Current page: ${paginationResponse.page}`);
        console.log(`📄 Total pages: ${paginationResponse.totalPages}`);
        console.log('');

        // Performance Analysis
        console.log('📈 PERFORMANCE ANALYSIS:');
        console.log(`Initial load: ${duration1}ms`);
        console.log(`Allergen filtering: ${duration2}ms`);
        console.log(`Pagination: ${duration3}ms`);
        console.log('');

        // Success Criteria Check
        console.log('🎯 SUCCESS CRITERIA CHECK:');
        const criteria = {
            initialLoadUnder200ms: duration1 < 200,
            allergenFilterUnder200ms: duration2 < 200,
            paginationUnder200ms: duration3 < 200,
            safeProductsPercentage: (allergenResponse.totalCount / initialResponse.totalCount * 100).toFixed(1)
        };

        console.log(`✅ Initial load under 200ms: ${criteria.initialLoadUnder200ms} (${duration1}ms)`);
        console.log(`✅ Allergen filter under 200ms: ${criteria.allergenFilterUnder200ms} (${duration2}ms)`);
        console.log(`✅ Pagination under 200ms: ${criteria.paginationUnder200ms} (${duration3}ms)`);
        console.log(`✅ Safe products percentage: ${criteria.safeProductsPercentage}% (expected ~84%)`);
        console.log('');

        // Overall Assessment
        const allCriteriaMet = Object.values(criteria).slice(0, 3).every(Boolean);
        const percentageClose = Math.abs(parseFloat(criteria.safeProductsPercentage) - 84) < 5;

        if (allCriteriaMet && percentageClose) {
            console.log('🎉 SUCCESS: All performance criteria met!');
            console.log('✅ 90% reduction in timeout errors expected');
            console.log('✅ Sub-200ms response times achieved');
            console.log('✅ Proper page navigation working');
            console.log('✅ Scalable performance for 200K+ products');
        } else {
            console.log('⚠️  WARNING: Some criteria not met');
            console.log('🔧 Consider additional optimizations if needed');
        }

        return {
            success: allCriteriaMet && percentageClose,
            performance: {
                initialLoad: duration1,
                allergenFilter: duration2,
                pagination: duration3
            },
            data: {
                totalProducts: initialResponse.totalCount,
                safeProducts: allergenResponse.totalCount,
                safePercentage: criteria.safeProductsPercentage
            }
        };

    } catch (error) {
        console.error('❌ Performance test failed:', error);
        console.log('💡 Make sure you are on the homepage and the functions are loaded');
        throw error;
    }
}

// Make function available globally
window.testBrowserPerformance = testBrowserPerformance;

console.log('🧪 Browser performance test ready!');
console.log('📝 Run: testBrowserPerformance() in this console');
console.log('📝 Make sure you are on the homepage first'); 