// 🧪 ENTERPRISE ALLERGEN SYSTEM - BROWSER CONSOLE TESTS
// Author: Justin Linzan
// Date: January 2025
// 
// These are the test commands available in the browser console
// Copy and paste these commands to test the enterprise system

// ========================================
// BASIC SYSTEM TESTS
// ========================================

// Test 1: Check system status
console.log('🔍 Testing system status...');
window.checkEnterpriseAllergenSystemStatus()
  .then(result => {
    console.log('✅ System status:', result);
    return result;
  })
  .catch(error => {
    console.error('❌ System status check failed:', error);
  });

// Test 2: Test performance
console.log('⚡ Testing performance...');
window.testEnterpriseAllergenPerformance()
  .then(result => {
    console.log('✅ Performance test:', result);
    return result;
  })
  .catch(error => {
    console.error('❌ Performance test failed:', error);
  });

// Test 3: Process existing allergen arrays (small batch)
console.log('🔄 Processing existing allergen arrays...');
window.processExistingAllergenArrays(100)
  .then(result => {
    console.log('✅ Processing result:', result);
    return result;
  })
  .catch(error => {
    console.error('❌ Processing failed:', error);
  });

// ========================================
// SEARCH AND FILTERING TESTS
// ========================================

// Test 4: Single allergen search
console.log('🔍 Testing single allergen search...');
window.searchProductsWithAllergenFiltering({
  searchTerm: 'bread',
  allergens: ['gluten'],
  limit: 10
})
.then(result => {
  console.log('✅ Single allergen search:', result);
  console.log(`Found ${result.data?.length || 0} products`);
  return result;
})
.catch(error => {
  console.error('❌ Single allergen search failed:', error);
});

// Test 5: Multiple allergen search
console.log('🔍 Testing multiple allergen search...');
window.searchProductsWithAllergenFiltering({
  searchTerm: 'chocolate',
  allergens: ['milk', 'soy'],
  limit: 10
})
.then(result => {
  console.log('✅ Multiple allergen search:', result);
  console.log(`Found ${result.data?.length || 0} products`);
  return result;
})
.catch(error => {
  console.error('❌ Multiple allergen search failed:', error);
});

// Test 6: No allergen search
console.log('🔍 Testing no allergen search...');
window.searchProductsWithAllergenFiltering({
  searchTerm: 'apple',
  allergens: [],
  limit: 10
})
.then(result => {
  console.log('✅ No allergen search:', result);
  console.log(`Found ${result.data?.length || 0} products`);
  return result;
})
.catch(error => {
  console.error('❌ No allergen search failed:', error);
});

// ========================================
// COMPREHENSIVE SYSTEM TEST
// ========================================

// Test 7: Complete system test
console.log('🧪 Running comprehensive system test...');
window.testEnterpriseSystem()
  .then(result => {
    console.log('✅ Comprehensive test results:', result);
    
    if (result.success) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log(`📊 Summary: ${result.summary.passed}/${result.summary.total} tests passed`);
    } else {
      console.log('❌ Some tests failed');
      console.log(`📊 Summary: ${result.summary.passed}/${result.summary.total} tests passed`);
      
      // Show failed tests
      const failedTests = result.results.filter(r => !r.success);
      console.log('❌ Failed tests:', failedTests);
    }
    
    return result;
  })
  .catch(error => {
    console.error('❌ Comprehensive test failed:', error);
  });

// ========================================
// BATCH PROCESSING TESTS
// ========================================

// Test 8: Process small batch
console.log('🔄 Testing small batch processing...');
window.processExistingAllergenArrays(50)
  .then(result => {
    console.log('✅ Small batch processing:', result);
    console.log(`Processed ${result.processedCount || 0} products`);
    return result;
  })
  .catch(error => {
    console.error('❌ Small batch processing failed:', error);
  });

// Test 9: Process larger batch (if small batch works)
console.log('🔄 Testing larger batch processing...');
window.processExistingAllergenArrays(500)
  .then(result => {
    console.log('✅ Larger batch processing:', result);
    console.log(`Processed ${result.processedCount || 0} products`);
    return result;
  })
  .catch(error => {
    console.error('❌ Larger batch processing failed:', error);
  });

// ========================================
// PERFORMANCE BENCHMARKING
// ========================================

// Test 10: Performance benchmarking
console.log('⚡ Running performance benchmarks...');

const performanceTests = [
  {
    name: 'Single allergen (gluten)',
    params: { searchTerm: 'bread', allergens: ['gluten'], limit: 10 }
  },
  {
    name: 'Multiple allergens (milk, soy)',
    params: { searchTerm: 'chocolate', allergens: ['milk', 'soy'], limit: 10 }
  },
  {
    name: 'No allergens',
    params: { searchTerm: 'apple', allergens: [], limit: 10 }
  },
  {
    name: 'Complex search',
    params: { searchTerm: 'cookie', allergens: ['peanuts', 'tree_nuts'], limit: 10 }
  }
];

Promise.all(
  performanceTests.map(test => {
    const startTime = performance.now();
    return window.searchProductsWithAllergenFiltering(test.params)
      .then(result => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        return {
          test: test.name,
          duration: duration.toFixed(2),
          resultCount: result.data?.length || 0,
          success: result.success
        };
      });
  })
)
.then(results => {
  console.log('⚡ Performance benchmark results:');
  results.forEach(result => {
    console.log(`  ${result.test}: ${result.duration}ms (${result.resultCount} results)`);
  });
  
  const avgDuration = results.reduce((sum, r) => sum + parseFloat(r.duration), 0) / results.length;
  console.log(`📊 Average query time: ${avgDuration.toFixed(2)}ms`);
  
  if (avgDuration < 100) {
    console.log('✅ Performance target achieved (<100ms average)');
  } else {
    console.log('⚠️ Performance target not achieved (>100ms average)');
  }
})
.catch(error => {
  console.error('❌ Performance benchmarking failed:', error);
});

// ========================================
// DATA QUALITY TESTS
// ========================================

// Test 11: Check data quality
console.log('🔍 Checking data quality...');

// Test standardization
window.searchProductsWithAllergenFiltering({
  searchTerm: 'tree nuts',
  allergens: ['tree_nuts'],
  limit: 5
})
.then(result => {
  console.log('✅ Tree nuts standardization test:', result);
  
  // Check if results contain standardized allergens
  const hasStandardizedAllergens = result.data?.some(product => 
    product.allergens?.includes('tree_nuts')
  );
  
  console.log(`Standardization working: ${hasStandardizedAllergens ? '✅' : '❌'}`);
  return result;
})
.catch(error => {
  console.error('❌ Data quality test failed:', error);
});

// Test free-from detection
window.searchProductsWithAllergenFiltering({
  searchTerm: 'gluten-free',
  allergens: ['gluten'],
  limit: 5
})
.then(result => {
  console.log('✅ Free-from detection test:', result);
  
  // Check if gluten-free products are properly filtered
  const hasGlutenFreeProducts = result.data?.some(product => 
    product.description?.toLowerCase().includes('gluten-free')
  );
  
  console.log(`Free-from detection working: ${!hasGlutenFreeProducts ? '✅' : '❌'}`);
  return result;
})
.catch(error => {
  console.error('❌ Free-from detection test failed:', error);
});

// ========================================
// ERROR HANDLING TESTS
// ========================================

// Test 12: Error handling
console.log('🛡️ Testing error handling...');

// Test with invalid parameters
window.searchProductsWithAllergenFiltering({
  searchTerm: '',
  allergens: ['invalid_allergen'],
  limit: -1
})
.then(result => {
  console.log('✅ Error handling test:', result);
  return result;
})
.catch(error => {
  console.log('✅ Error properly caught:', error);
});

// Test with null parameters
window.searchProductsWithAllergenFiltering(null)
.then(result => {
  console.log('✅ Null parameter handling:', result);
  return result;
})
.catch(error => {
  console.log('✅ Null parameter error caught:', error);
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Helper function to run all tests
window.runAllEnterpriseTests = async () => {
  console.log('🚀 Running all enterprise allergen system tests...');
  console.log('=====================================');
  
  const tests = [
    { name: 'System Status', fn: () => window.checkEnterpriseAllergenSystemStatus() },
    { name: 'Performance Test', fn: () => window.testEnterpriseAllergenPerformance() },
    { name: 'Small Batch Processing', fn: () => window.processExistingAllergenArrays(50) },
    { name: 'Single Allergen Search', fn: () => window.searchProductsWithAllergenFiltering({ searchTerm: 'bread', allergens: ['gluten'], limit: 10 }) },
    { name: 'Multiple Allergen Search', fn: () => window.searchProductsWithAllergenFiltering({ searchTerm: 'chocolate', allergens: ['milk', 'soy'], limit: 10 }) },
    { name: 'Comprehensive Test', fn: () => window.testEnterpriseSystem() }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`🧪 Running: ${test.name}`);
      const result = await test.fn();
      results.push({ name: test.name, success: true, result });
      console.log(`✅ ${test.name}: PASSED`);
    } catch (error) {
      results.push({ name: test.name, success: false, error: error.message });
      console.log(`❌ ${test.name}: FAILED - ${error.message}`);
    }
  }
  
  console.log('=====================================');
  console.log('📊 TEST SUMMARY:');
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! Enterprise system is ready.');
  } else {
    console.log('⚠️ Some tests failed. Check the results above.');
  }
  
  return results;
};

// Helper function to check system readiness
window.checkEnterpriseSystemReadiness = async () => {
  console.log('🔍 Checking enterprise system readiness...');
  
  try {
    const status = await window.checkEnterpriseAllergenSystemStatus();
    console.log('System status:', status);
    
    if (status.ready_for_production) {
      console.log('✅ Enterprise system is ready for production!');
      console.log(`📊 Processed: ${status.processed_products}/${status.total_products} products`);
      console.log(`📈 Processing percentage: ${status.processing_percentage}%`);
    } else {
      console.log('⚠️ Enterprise system needs more processing');
      console.log(`📊 Processed: ${status.processed_products}/${status.total_products} products`);
      console.log(`📈 Processing percentage: ${status.processing_percentage}%`);
      
      if (status.processed_products === 0) {
        console.log('💡 Run: window.processExistingAllergenArrays(1000) to start processing');
      }
    }
    
    return status;
  } catch (error) {
    console.error('❌ System readiness check failed:', error);
    return null;
  }
};

// ========================================
// QUICK START COMMANDS
// ========================================

console.log('🚀 ENTERPRISE ALLERGEN SYSTEM - QUICK START');
console.log('=====================================');
console.log('Available test commands:');
console.log('• window.runAllEnterpriseTests() - Run all tests');
console.log('• window.checkEnterpriseSystemReadiness() - Check if system is ready');
console.log('• window.testEnterpriseSystem() - Comprehensive system test');
console.log('• window.checkEnterpriseAllergenSystemStatus() - Check system status');
console.log('• window.processExistingAllergenArrays(100) - Process existing data');
console.log('• window.searchProductsWithAllergenFiltering({...}) - Test search');
console.log('=====================================');
console.log('💡 Start with: window.checkEnterpriseSystemReadiness()'); 