// 🧪 CONNECTION WARMUP TEST
// Run this in the browser console to test the connection warmup fix

console.log('🧪 Connection Warmup Test');

// Function to check connection warmup status
window.checkConnectionWarmup = () => {
    console.log('=== CHECKING CONNECTION WARMUP ===');
    
    const isWarmedUp = window.connectionWarmedUp;
    console.log('Connection warmed up:', isWarmedUp);
    
    if (isWarmedUp) {
        console.log('✅ Database connection is warmed up');
    } else {
        console.log('❌ Database connection is not warmed up');
    }
    
    return isWarmedUp;
};

// Function to manually warm up connection
window.manualWarmupConnection = async () => {
    console.log('=== MANUAL CONNECTION WARMUP ===');
    
    try {
        const { supabase } = await import('./src/utils/supabaseClient');
        
        console.log('🔥 Manually warming up database connection...');
        const startTime = Date.now();
        
        const { data, error } = await supabase
            .from('Products')
            .select('id')
            .limit(1);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (!error) {
            window.connectionWarmedUp = true;
            console.log(`✅ Database connection warmed up successfully in ${duration}ms`);
            console.log('Sample data:', data);
        } else {
            console.error('❌ Database connection warmup failed:', error);
        }
        
        return { success: !error, duration, data, error };
    } catch (error) {
        console.error('❌ Error during manual warmup:', error);
        return { success: false, error };
    }
};

// Function to test query performance
window.testQueryPerformance = async () => {
    console.log('=== TESTING QUERY PERFORMANCE ===');
    
    try {
        const { searchProductsUnified } = await import('./src/utils/supabaseQueries');
        
        console.log('🔥 Testing first query performance...');
        const startTime = Date.now();
        
        const result = await searchProductsUnified({
            page: 1,
            limit: 20,
            searchTerm: '',
            allergens: [],
            userType: 'anonymous',
            includeCount: true
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✅ Query completed in ${duration}ms`);
        console.log('Result:', result);
        
        return { success: true, duration, result };
    } catch (error) {
        console.error('❌ Query performance test failed:', error);
        return { success: false, error };
    }
};

// Function to test multiple queries
window.testMultipleQueries = async () => {
    console.log('=== TESTING MULTIPLE QUERIES ===');
    
    try {
        const { searchProductsUnified } = await import('./src/utils/supabaseQueries');
        
        const results = [];
        
        for (let i = 1; i <= 3; i++) {
            console.log(`🔥 Testing query ${i}/3...`);
            const startTime = Date.now();
            
            const result = await searchProductsUnified({
                page: i,
                limit: 5,
                searchTerm: '',
                allergens: [],
                userType: 'anonymous',
                includeCount: false
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`✅ Query ${i} completed in ${duration}ms`);
            results.push({ query: i, duration, success: true });
        }
        
        console.log('All query results:', results);
        return results;
    } catch (error) {
        console.error('❌ Multiple queries test failed:', error);
        return { success: false, error };
    }
};

// Function to test timeout scenarios
window.testTimeoutScenarios = async () => {
    console.log('=== TESTING TIMEOUT SCENARIOS ===');
    
    try {
        const { resilientSupabaseQuery } = await import('./src/utils/supabaseQueries');
        const { searchProductsUnified } = await import('./src/utils/supabaseQueries');
        
        console.log('🔥 Testing with short timeout (should fail)...');
        
        const result = await resilientSupabaseQuery(
            () => searchProductsUnified({
                page: 1,
                limit: 20,
                searchTerm: '',
                allergens: [],
                userType: 'anonymous',
                includeCount: true
            }),
            {
                operationName: 'timeout_test',
                timeout: 1000, // Very short timeout
                maxRetries: 1
            }
        );
        
        console.log('✅ Timeout test completed');
        return result;
    } catch (error) {
        console.log('❌ Timeout test failed as expected:', error.message);
        return { success: false, error: error.message };
    }
};

// Main test function
window.runConnectionWarmupTest = async () => {
    console.log('🔍 RUNNING CONNECTION WARMUP TEST');
    console.log('=====================================');
    
    // Check current status
    window.checkConnectionWarmup();
    
    // Test manual warmup
    await window.manualWarmupConnection();
    
    // Test query performance
    await window.testQueryPerformance();
    
    console.log('=====================================');
    console.log('Additional tests available:');
    console.log('- window.testMultipleQueries() - Test multiple queries');
    console.log('- window.testTimeoutScenarios() - Test timeout handling');
};

// Run test immediately
window.runConnectionWarmupTest(); 