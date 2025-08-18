const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Performance test configuration
const TEST_CONFIG = {
    rangeBatching: {
        batchSize: 1000,
        maxBatches: 5
    },
    pagination: {
        batchSize: 5000,
        maxBatches: 5
    }
};

// Range-based batching (current approach)
async function testRangeBatching() {
    console.log('🔍 Testing Range-Based Batching...\n');
    
    const results = {
        totalTime: 0,
        totalRecords: 0,
        batches: [],
        errors: 0
    };
    
    const startTime = Date.now();
    
    try {
        for (let batch = 0; batch < TEST_CONFIG.rangeBatching.maxBatches; batch++) {
            const offset = batch * TEST_CONFIG.rangeBatching.batchSize;
            const batchStartTime = Date.now();
            
            console.log(`📊 Batch ${batch + 1}: Offset ${offset} to ${offset + TEST_CONFIG.rangeBatching.batchSize - 1}`);
            
            const { data, error, count } = await supabase
                .from('IngredientCanonical')
                .select('id, canonical_ingredient', { count: 'exact' })
                .range(offset, offset + TEST_CONFIG.rangeBatching.batchSize - 1)
                .order('id');
            
            const batchTime = Date.now() - batchStartTime;
            
            if (error) {
                console.error(`   ❌ Error in batch ${batch + 1}:`, error);
                results.errors++;
            } else {
                const recordCount = data?.length || 0;
                results.totalRecords += recordCount;
                results.batches.push({
                    batch: batch + 1,
                    records: recordCount,
                    time: batchTime,
                    offset: offset
                });
                
                console.log(`   ✅ Records: ${recordCount}, Time: ${batchTime}ms`);
                
                // Stop if no more records
                if (recordCount < TEST_CONFIG.rangeBatching.batchSize) {
                    console.log(`   🏁 No more records found, stopping at batch ${batch + 1}`);
                    break;
                }
            }
        }
        
        results.totalTime = Date.now() - startTime;
        
    } catch (error) {
        console.error('❌ Range batching test failed:', error);
        results.errors++;
    }
    
    return results;
}

// Pagination with ID cursors (proposed approach)
async function testPaginationBatching() {
    console.log('🔍 Testing Pagination with ID Cursors...\n');
    
    const results = {
        totalTime: 0,
        totalRecords: 0,
        batches: [],
        errors: 0
    };
    
    const startTime = Date.now();
    let lastProcessedId = 0;
    
    try {
        for (let batch = 0; batch < TEST_CONFIG.pagination.maxBatches; batch++) {
            const batchStartTime = Date.now();
            
            console.log(`📊 Batch ${batch + 1}: Starting from ID > ${lastProcessedId}`);
            
            const { data, error, count } = await supabase
                .from('IngredientCanonical')
                .select('id, canonical_ingredient', { count: 'exact' })
                .gt('id', lastProcessedId)
                .order('id')
                .limit(TEST_CONFIG.pagination.batchSize);
            
            const batchTime = Date.now() - batchStartTime;
            
            if (error) {
                console.error(`   ❌ Error in batch ${batch + 1}:`, error);
                results.errors++;
            } else {
                const recordCount = data?.length || 0;
                results.totalRecords += recordCount;
                
                // Update cursor for next batch
                if (data && data.length > 0) {
                    lastProcessedId = data[data.length - 1].id;
                }
                
                results.batches.push({
                    batch: batch + 1,
                    records: recordCount,
                    time: batchTime,
                    lastId: lastProcessedId
                });
                
                console.log(`   ✅ Records: ${recordCount}, Time: ${batchTime}ms, Last ID: ${lastProcessedId}`);
                
                // Stop if no more records
                if (recordCount < TEST_CONFIG.pagination.batchSize) {
                    console.log(`   🏁 No more records found, stopping at batch ${batch + 1}`);
                    break;
                }
            }
        }
        
        results.totalTime = Date.now() - startTime;
        
    } catch (error) {
        console.error('❌ Pagination batching test failed:', error);
        results.errors++;
    }
    
    return results;
}

// Compare performance results
function comparePerformance(rangeResults, paginationResults) {
    console.log('\n📊 Performance Comparison:\n');
    
    console.log('🔍 RANGE-BASED BATCHING:');
    console.log(`   ⏱️ Total Time: ${rangeResults.totalTime}ms`);
    console.log(`   📊 Total Records: ${rangeResults.totalRecords}`);
    console.log(`   📈 Avg Time per Record: ${(rangeResults.totalTime / rangeResults.totalRecords).toFixed(2)}ms`);
    console.log(`   📦 Avg Records per Second: ${((rangeResults.totalRecords / rangeResults.totalTime) * 1000).toFixed(0)}`);
    console.log(`   ❌ Errors: ${rangeResults.errors}`);
    console.log('');
    
    console.log('🔍 PAGINATION WITH ID CURSORS:');
    console.log(`   ⏱️ Total Time: ${paginationResults.totalTime}ms`);
    console.log(`   📊 Total Records: ${paginationResults.totalRecords}`);
    console.log(`   📈 Avg Time per Record: ${(paginationResults.totalTime / paginationResults.totalRecords).toFixed(2)}ms`);
    console.log(`   📦 Avg Records per Second: ${((paginationResults.totalRecords / paginationResults.totalTime) * 1000).toFixed(0)}`);
    console.log(`   ❌ Errors: ${paginationResults.errors}`);
    console.log('');
    
    // Calculate improvements
    const timeImprovement = ((rangeResults.totalTime - paginationResults.totalTime) / rangeResults.totalTime * 100).toFixed(1);
    const speedImprovement = ((paginationResults.totalRecords / paginationResults.totalTime) / (rangeResults.totalRecords / rangeResults.totalTime) * 100).toFixed(1);
    
    console.log('📈 PERFORMANCE IMPROVEMENTS:');
    console.log(`   ⚡ Time Improvement: ${timeImprovement}% faster`);
    console.log(`   🚀 Speed Improvement: ${speedImprovement}% more records/second`);
    console.log(`   📦 Batch Size Increase: ${TEST_CONFIG.pagination.batchSize / TEST_CONFIG.rangeBatching.batchSize}x larger`);
    console.log('');
}

// Test optimal batch sizes for pagination
async function testOptimalBatchSizes() {
    console.log('🔍 Testing Optimal Batch Sizes for Pagination...\n');
    
    const batchSizes = [1000, 3000, 5000, 10000, 15000];
    const results = [];
    
    for (const batchSize of batchSizes) {
        console.log(`📊 Testing batch size: ${batchSize}`);
        
        const startTime = Date.now();
        let lastProcessedId = 0;
        let totalRecords = 0;
        let batchCount = 0;
        
        try {
            // Test 3 batches for each size
            for (let i = 0; i < 3; i++) {
                const { data, error } = await supabase
                    .from('IngredientCanonical')
                    .select('id, canonical_ingredient')
                    .gt('id', lastProcessedId)
                    .order('id')
                    .limit(batchSize);
                
                if (error) {
                    console.log(`   ❌ Error: ${error.message}`);
                    break;
                }
                
                const recordCount = data?.length || 0;
                totalRecords += recordCount;
                batchCount++;
                
                if (data && data.length > 0) {
                    lastProcessedId = data[data.length - 1].id;
                }
                
                if (recordCount < batchSize) break;
            }
            
            const totalTime = Date.now() - startTime;
            const avgTimePerRecord = totalTime / totalRecords;
            const recordsPerSecond = (totalRecords / totalTime) * 1000;
            
            results.push({
                batchSize,
                totalTime,
                totalRecords,
                batchCount,
                avgTimePerRecord,
                recordsPerSecond
            });
            
            console.log(`   ✅ Time: ${totalTime}ms, Records: ${totalRecords}, Avg: ${avgTimePerRecord.toFixed(2)}ms/record`);
            
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
        }
    }
    
    // Find optimal batch size
    const optimal = results.reduce((best, current) => 
        current.recordsPerSecond > best.recordsPerSecond ? current : best
    );
    
    console.log('\n📈 Optimal Batch Size Analysis:');
    results.forEach(result => {
        const isOptimal = result.batchSize === optimal.batchSize;
        console.log(`   ${isOptimal ? '🏆' : '  '} ${result.batchSize}: ${result.recordsPerSecond.toFixed(0)} records/sec`);
    });
    
    console.log(`\n🎯 RECOMMENDED BATCH SIZE: ${optimal.batchSize}`);
    console.log(`   📊 Records per second: ${optimal.recordsPerSecond.toFixed(0)}`);
    console.log(`   ⏱️ Avg time per record: ${optimal.avgTimePerRecord.toFixed(2)}ms`);
    
    return optimal.batchSize;
}

// Main function
async function runBatchingPerformanceTest() {
    console.log('🚀 Starting Batching Performance Test...\n');
    
    console.log('📋 Test Configuration:');
    console.log(`   Range Batching: ${TEST_CONFIG.rangeBatching.batchSize} records, ${TEST_CONFIG.rangeBatching.maxBatches} batches`);
    console.log(`   Pagination: ${TEST_CONFIG.pagination.batchSize} records, ${TEST_CONFIG.pagination.maxBatches} batches`);
    console.log('');
    
    // Test range-based batching
    const rangeResults = await testRangeBatching();
    
    // Test pagination batching
    const paginationResults = await testPaginationBatching();
    
    // Compare results
    comparePerformance(rangeResults, paginationResults);
    
    // Test optimal batch sizes
    const optimalBatchSize = await testOptimalBatchSizes();
    
    console.log('\n🎉 Performance Test Complete!');
    console.log('\n📋 Recommendations:');
    console.log(`   🎯 Switch to pagination with ID cursors`);
    console.log(`   📦 Use batch size: ${optimalBatchSize}`);
    console.log(`   ⚡ Expected improvement: ${((paginationResults.totalRecords / paginationResults.totalTime) / (rangeResults.totalRecords / rangeResults.totalTime) * 100).toFixed(1)}% faster`);
    console.log(`   🔄 Ready to implement separation with optimized batching`);
}

runBatchingPerformanceTest().catch(console.error); 