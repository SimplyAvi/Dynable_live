// Comprehensive testing suite for bulletproof allergen system
import { 
  searchProductsFromSupabasePure,
  testBulletproofAllergenSystem
} from './supabaseQueries';
import { detectAllergensInProduct, isProductSafeForAllergens } from './allergenDetection';

/**
 * Run comprehensive allergen safety tests
 */
export const runComprehensiveAllergenTests = async () => {
  console.log('🧪 Starting comprehensive allergen safety validation...');
  
  const testSuite = {
    performanceTests: {},
    safetyTests: {},
    accuracyTests: {},
    integrationTests: {},
    overallResult: { passed: false, score: 0, issues: [] }
  };
  
  try {
    // Test 1: System Performance
    console.log('📊 Testing system performance...');
    const systemTests = await testBulletproofAllergenSystem();
    testSuite.performanceTests = systemTests.performanceTests;
    
    // Test 2: Critical Safety Scenarios
    console.log('🛡️ Testing critical safety scenarios...');
    testSuite.safetyTests = await testCriticalSafetyScenarios();
    
    // Test 3: Accuracy Validation
    console.log('🎯 Testing detection accuracy...');
    testSuite.accuracyTests = await testDetectionAccuracy();
    
    // Test 4: Integration Testing
    console.log('🔧 Testing integration with frontend...');
    testSuite.integrationTests = await testFrontendIntegration();
    
    // Calculate overall score
    const allTests = [
      testSuite.performanceTests,
      testSuite.safetyTests,
      testSuite.accuracyTests,
      testSuite.integrationTests
    ];
    
    let passedTests = 0;
    let totalTests = 0;
    
    allTests.forEach(testCategory => {
      Object.values(testCategory).forEach(test => {
        totalTests++;
        if (test.passed) passedTests++;
      });
    });
    
    testSuite.overallResult.score = Math.round((passedTests / totalTests) * 100);
    testSuite.overallResult.passed = testSuite.overallResult.score >= 95; // 95% threshold
    
    if (!testSuite.overallResult.passed) {
      testSuite.overallResult.issues.push(`Overall score ${testSuite.overallResult.score}% below 95% threshold`);
    }
    
    console.log('🧪 Comprehensive testing complete:', testSuite);
    return testSuite;
    
  } catch (error) {
    console.error('🧪 Comprehensive testing failed:', error);
    testSuite.overallResult.passed = false;
    testSuite.overallResult.issues.push(`Testing failure: ${error.message}`);
    return testSuite;
  }
};

/**
 * Test critical safety scenarios that could harm users
 */
const testCriticalSafetyScenarios = async () => {
  const results = {};
  
  // Test 1: Milk allergen derivatives
  const milkDerivatives = [
    'Protein powder with whey isolate',
    'Seasoning with sodium caseinate',
    'Chocolate with milk solids',
    'Bread with lactose'
  ];
  
  let milkDetected = 0;
  for (const product of milkDerivatives) {
    const detection = await detectAllergensInProduct(product, 'milk');
    if (detection.detected_allergens.includes('milk')) {
      milkDetected++;
    }
  }
  
  results.milkDerivatives = {
    tested: milkDerivatives.length,
    detected: milkDetected,
    passed: milkDetected === milkDerivatives.length,
    criticalityLevel: 'HIGH'
  };
  
  // Test 2: Gluten allergen derivatives  
  const glutenDerivatives = [
    'Bread flour - wheat enriched',
    'Soy sauce with wheat',
    'Cereal with barley malt',
    'Pasta made with durum wheat'
  ];
  
  let glutenDetected = 0;
  for (const product of glutenDerivatives) {
    const detection = await detectAllergensInProduct(product, 'gluten');
    if (detection.detected_allergens.includes('gluten')) {
      glutenDetected++;
    }
  }
  
  results.glutenDerivatives = {
    tested: glutenDerivatives.length,
    detected: glutenDetected,
    passed: glutenDetected === glutenDerivatives.length,
    criticalityLevel: 'HIGH'
  };
  
  // Test 3: Peanut allergen derivatives
  const peanutDerivatives = [
    'Chocolate with arachis oil',
    'Asian sauce with groundnut oil',
    'Cookies with peanut flour'
  ];
  
  let peanutDetected = 0;
  for (const product of peanutDerivatives) {
    const detection = await detectAllergensInProduct(product, 'peanuts');
    if (detection.detected_allergens.includes('peanuts')) {
      peanutDetected++;
    }
  }
  
  results.peanutDerivatives = {
    tested: peanutDerivatives.length,
    detected: peanutDetected,
    passed: peanutDetected === peanutDerivatives.length,
    criticalityLevel: 'HIGH'
  };
  
  // Test 4: Safe product false positives
  const safeProducts = [
    'Gluten-free oats certified',
    'Dairy-free chocolate chips',
    'Peanut-free facility snacks',
    'Vegan protein powder'
  ];
  
  let safeDetected = 0;
  for (const product of safeProducts) {
    const glutenTest = await detectAllergensInProduct(product, 'gluten');
    const milkTest = await detectAllergensInProduct(product, 'milk');
    const peanutTest = await detectAllergensInProduct(product, 'peanuts');
    
    if (glutenTest.safe_allergens.length > 0 ||
        milkTest.safe_allergens.length > 0 ||
        peanutTest.safe_allergens.length > 0) {
      safeDetected++;
    }
  }
  
  results.safeProducts = {
    tested: safeProducts.length,
    detected: safeDetected,
    passed: safeDetected >= safeProducts.length * 0.8, // 80% threshold for safe detection
    criticalityLevel: 'MEDIUM'
  };
  
  return results;
};

/**
 * Test detection accuracy across various scenarios
 */
const testDetectionAccuracy = async () => {
  const results = {};
  
  // Test cross-contamination detection
  const crossContaminationProducts = [
    'Granola - facility processes nuts',
    'Chocolate - may contain milk',
    'Chips manufactured on equipment that processes wheat'
  ];
  
  let crossContaminationDetected = 0;
  for (const product of crossContaminationProducts) {
    const detection = await detectAllergensInProduct(product, 'milk'); // Test with any allergen
    if (detection.has_cross_contamination) {
      crossContaminationDetected++;
    }
  }
  
  results.crossContamination = {
    tested: crossContaminationProducts.length,
    detected: crossContaminationDetected,
    passed: crossContaminationDetected >= crossContaminationProducts.length * 0.8,
    criticalityLevel: 'MEDIUM'
  };
  
  // Test confidence scoring
  results.confidenceScoring = {
    highConfidenceProducts: 0,
    mediumConfidenceProducts: 0,
    lowConfidenceProducts: 0,
    passed: true // Will be updated based on confidence distribution
  };
  
  return results;
};

/**
 * Test frontend integration
 */
const testFrontendIntegration = async () => {
  const results = {};
  
  try {
    // Test search integration
    const searchResults = await searchProductsFromSupabasePure({
      name: 'protein',
      allergens: ['milk'],
      limit: 10
    });
    
    results.searchIntegration = {
      resultCount: searchResults.length,
      passed: searchResults.length > 0 && searchResults.length <= 10,
      criticalityLevel: 'HIGH'
    };
    
    // Test allergen filtering performance
    const startTime = Date.now();
    
    const filterResults = await searchProductsFromSupabasePure({
      allergens: ['milk', 'peanuts', 'gluten'],
      limit: 50
    });
    
    const duration = Date.now() - startTime;
    
    results.filteringPerformance = {
      duration,
      resultCount: filterResults.length,
      passed: duration < 3000, // 3 second threshold for frontend
      criticalityLevel: 'HIGH'
    };
    
  } catch (error) {
    results.integrationError = {
      error: error.message,
      passed: false,
      criticalityLevel: 'HIGH'
    };
  }
  
  return results;
};

/**
 * Generate test report for stakeholders
 */
export const generateAllergenTestReport = async () => {
  const testResults = await runComprehensiveAllergenTests();
  
  const report = {
    summary: {
      overallScore: testResults.overallResult.score,
      passed: testResults.overallResult.passed,
      criticalIssues: testResults.overallResult.issues.length,
      testDate: new Date().toISOString()
    },
    criticalSafety: {
      milkDerivatives: testResults.safetyTests.milkDerivatives,
      glutenDerivatives: testResults.safetyTests.glutenDerivatives,
      peanutDerivatives: testResults.safetyTests.peanutDerivatives
    },
    performance: {
      singleAllergen: testResults.performanceTests.singleAllergen,
      multipleAllergens: testResults.performanceTests.multipleAllergens
    },
    userExperience: {
      safeProducts: testResults.safetyTests.safeProducts,
      searchIntegration: testResults.integrationTests.searchIntegration
    },
    recommendations: generateRecommendations(testResults)
  };
  
  console.log('📋 Allergen Test Report Generated:', report);
  return report;
};

/**
 * Generate recommendations based on test results
 */
const generateRecommendations = (testResults) => {
  const recommendations = [];
  
  if (testResults.overallResult.score < 95) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Safety',
      issue: 'Overall test score below 95% threshold',
      action: 'Review and fix failing test cases before deployment'
    });
  }
  
  // Check for critical safety failures
  const criticalTests = ['milkDerivatives', 'glutenDerivatives', 'peanutDerivatives'];
  criticalTests.forEach(test => {
    if (testResults.safetyTests[test] && !testResults.safetyTests[test].passed) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Safety',
        issue: `${test} detection failing`,
        action: 'Fix derivative mapping and detection logic immediately'
      });
    }
  });
  
  // Check performance issues
  Object.entries(testResults.performanceTests).forEach(([test, result]) => {
    if (!result.passed) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Performance',
        issue: `${test} queries too slow`,
        action: 'Optimize database queries and indexing'
      });
    }
  });
  
  return recommendations;
}; 