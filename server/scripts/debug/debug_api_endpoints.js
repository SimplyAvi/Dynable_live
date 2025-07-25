/**
 * API Endpoint Diagnostic Tool
 * 
 * This script tests all API endpoints independently to identify
 * which endpoints are working and which are failing.
 * 
 * Author: Justin Linzan
 * Date: July 2025
 */

const http = require('http');
const https = require('https');

const API_BASE_URL = 'http://localhost:5001';
const TIMEOUT = 10000; // 10 seconds

const debugApiEndpoints = async () => {
  console.log('🔍 API ENDPOINT DIAGNOSTIC TOOL\n');
  console.log('Testing all API endpoints independently...\n');

  try {
    // Test 1: Health check endpoint
    console.log('🧪 Test 1: Health Check Endpoint');
    const healthTest = await testEndpoint('/api/health', 'GET');
    console.log(`  /api/health: ${healthTest.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (!healthTest.success) {
      console.log(`    Error: ${healthTest.error}`);
    } else {
      console.log(`    Status: ${healthTest.statusCode}`);
      console.log(`    Response: ${healthTest.data.substring(0, 100)}...`);
    }
    console.log('');

    // Test 2: Allergen endpoints
    console.log('🧪 Test 2: Allergen Endpoints');
    const allergenEndpoints = [
      { path: '/api/allergens/allergens', method: 'GET', description: 'Get all allergens' },
      { path: '/api/allergens', method: 'GET', description: 'Alternative allergen endpoint' }
    ];

    for (const endpoint of allergenEndpoints) {
      const test = await testEndpoint(endpoint.path, endpoint.method);
      console.log(`  ${endpoint.path} (${endpoint.description}): ${test.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!test.success) {
        console.log(`    Error: ${test.error}`);
      } else {
        console.log(`    Status: ${test.statusCode}`);
        if (test.data) {
          try {
            const parsed = JSON.parse(test.data);
            console.log(`    Allergens found: ${Object.keys(parsed).length}`);
          } catch (e) {
            console.log(`    Response length: ${test.data.length} characters`);
          }
        }
      }
    }
    console.log('');

    // Test 3: Product search endpoints
    console.log('🧪 Test 3: Product Search Endpoints');
    const productEndpoints = [
      { path: '/api/product/search?name=milk&limit=5', method: 'GET', description: 'Search products by name' },
      { path: '/api/product/search?limit=5', method: 'GET', description: 'Get all products' },
      { path: '/api/product/by-ingredient', method: 'POST', description: 'Search by ingredient', body: JSON.stringify({ ingredientName: 'milk' }) }
    ];

    for (const endpoint of productEndpoints) {
      const test = await testEndpoint(endpoint.path, endpoint.method, endpoint.body);
      console.log(`  ${endpoint.path} (${endpoint.description}): ${test.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!test.success) {
        console.log(`    Error: ${test.error}`);
      } else {
        console.log(`    Status: ${test.statusCode}`);
        if (test.data) {
          try {
            const parsed = JSON.parse(test.data);
            if (parsed.foods) {
              console.log(`    Products found: ${parsed.foods.length}`);
            } else if (parsed.totalCount !== undefined) {
              console.log(`    Total products: ${parsed.totalCount}`);
            } else {
              console.log(`    Response type: ${typeof parsed}`);
            }
          } catch (e) {
            console.log(`    Response length: ${test.data.length} characters`);
          }
        }
      }
    }
    console.log('');

    // Test 4: Recipe endpoints
    console.log('🧪 Test 4: Recipe Endpoints');
    const recipeEndpoints = [
      { path: '/api/recipe/recipes?id=1', method: 'GET', description: 'Get specific recipe' },
      { path: '/api/recipe/recipes?limit=5', method: 'GET', description: 'Get all recipes' },
      { path: '/api/recipe/recipes', method: 'POST', description: 'Search recipes', body: JSON.stringify({ search: 'chicken' }) }
    ];

    for (const endpoint of recipeEndpoints) {
      const test = await testEndpoint(endpoint.path, endpoint.method, endpoint.body);
      console.log(`  ${endpoint.path} (${endpoint.description}): ${test.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!test.success) {
        console.log(`    Error: ${test.error}`);
      } else {
        console.log(`    Status: ${test.statusCode}`);
        if (test.data) {
          try {
            const parsed = JSON.parse(test.data);
            if (Array.isArray(parsed)) {
              console.log(`    Recipes found: ${parsed.length}`);
            } else if (parsed.recipes) {
              console.log(`    Recipes found: ${parsed.recipes.length}`);
            } else {
              console.log(`    Response type: ${typeof parsed}`);
            }
          } catch (e) {
            console.log(`    Response length: ${test.data.length} characters`);
          }
        }
      }
    }
    console.log('');

    // Test 5: Food endpoints
    console.log('🧪 Test 5: Food Endpoints');
    const foodEndpoints = [
      { path: '/api/food/by-ingredient', method: 'POST', description: 'Search food by ingredient', body: JSON.stringify({ ingredientName: 'milk' }) },
      { path: '/api/food/search?name=milk', method: 'GET', description: 'Search food by name' }
    ];

    for (const endpoint of foodEndpoints) {
      const test = await testEndpoint(endpoint.path, endpoint.method, endpoint.body);
      console.log(`  ${endpoint.path} (${endpoint.description}): ${test.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!test.success) {
        console.log(`    Error: ${test.error}`);
      } else {
        console.log(`    Status: ${test.statusCode}`);
        if (test.data) {
          try {
            const parsed = JSON.parse(test.data);
            if (Array.isArray(parsed)) {
              console.log(`    Foods found: ${parsed.length}`);
            } else if (parsed.foods) {
              console.log(`    Foods found: ${parsed.foods.length}`);
            } else {
              console.log(`    Response type: ${typeof parsed}`);
            }
          } catch (e) {
            console.log(`    Response length: ${test.data.length} characters`);
          }
        }
      }
    }
    console.log('');

    // Test 6: Authentication endpoints
    console.log('🧪 Test 6: Authentication Endpoints');
    const authEndpoints = [
      { path: '/api/auth/profile', method: 'GET', description: 'Get user profile' },
      { path: '/api/auth/status', method: 'GET', description: 'Check auth status' }
    ];

    for (const endpoint of authEndpoints) {
      const test = await testEndpoint(endpoint.path, endpoint.method);
      console.log(`  ${endpoint.path} (${endpoint.description}): ${test.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!test.success) {
        console.log(`    Error: ${test.error}`);
      } else {
        console.log(`    Status: ${test.statusCode}`);
      }
    }
    console.log('');

    // Summary and recommendations
    console.log('📊 API ENDPOINT DIAGNOSTIC SUMMARY:');
    
    const allTests = [
      { name: 'Health Check', test: healthTest },
      ...allergenEndpoints.map(e => ({ name: `Allergen: ${e.path}`, test: null })), // Will be filled in loop
      ...productEndpoints.map(e => ({ name: `Product: ${e.path}`, test: null })),
      ...recipeEndpoints.map(e => ({ name: `Recipe: ${e.path}`, test: null })),
      ...foodEndpoints.map(e => ({ name: `Food: ${e.path}`, test: null })),
      ...authEndpoints.map(e => ({ name: `Auth: ${e.path}`, test: null }))
    ];

    console.log(`  Total endpoints tested: ${allTests.length}`);
    console.log(`  Successful endpoints: ${allTests.filter(t => t.test?.success).length}`);
    console.log(`  Failed endpoints: ${allTests.filter(t => t.test && !t.test.success).length}`);
    console.log('');

    if (!healthTest.success) {
      console.log('🚨 ROOT CAUSE IDENTIFIED: Backend server not responding');
      console.log('💡 SOLUTION: Start the backend server');
      console.log('   cd server && npm run dev');
    } else {
      console.log('✅ Backend server is responding');
      console.log('💡 If some endpoints are failing, check:');
      console.log('   - Route definitions in server');
      console.log('   - Database connectivity');
      console.log('   - Environment variables');
      console.log('   - Server logs for specific errors');
    }

  } catch (error) {
    console.error('❌ API diagnostic failed:', error.message);
  }
};

// Helper function to test an endpoint
async function testEndpoint(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = `${API_BASE_URL}${path}`;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Diagnostic-Tool'
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        statusCode: null,
        data: null
      });
    });

    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout',
        statusCode: null,
        data: null
      });
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// Run the diagnostic
debugApiEndpoints(); 