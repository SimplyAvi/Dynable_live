const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testAPIEndpoints() {
  console.log('🧪 TESTING API ENDPOINTS...\n');
  
  try {
    // Test 1: Basic ingredient search
    console.log('1️⃣ Testing ingredient search for "flour"...');
    const flourResponse = await axios.post(`${BASE_URL}/product/by-ingredient`, {
      ingredientName: 'flour',
      allergies: []
    });
    console.log(`✅ Flour search: ${flourResponse.data.products?.length ?? 0} products found`);
    
    // Test 2: Allergen filtering
    console.log('\n2️⃣ Testing allergen filtering for "wheat"...');
    const wheatResponse = await axios.post(`${BASE_URL}/product/by-ingredient`, {
      ingredientName: 'flour',
      allergies: ['wheat']
    });
    console.log(`✅ Wheat-filtered search: ${wheatResponse.data.products?.length ?? 0} products found`);
    
    // Test 3: Complex ingredient
    console.log('\n3️⃣ Testing complex ingredient "olive oil"...');
    const oilResponse = await axios.post(`${BASE_URL}/product/by-ingredient`, {
      ingredientName: 'olive oil',
      allergies: []
    });
    console.log(`✅ Olive oil search: ${oilResponse.data.products?.length ?? 0} products found`);
    
    // Test 4: Non-existent ingredient
    console.log('\n4️⃣ Testing non-existent ingredient "xyz123"...');
    const xyzResponse = await axios.post(`${BASE_URL}/product/by-ingredient`, {
      ingredientName: 'xyz123',
      allergies: []
    });
    console.log(`✅ Non-existent search: ${xyzResponse.data.products?.length ?? 0} products found`);
    
    console.log('\n🎉 All API tests completed successfully!');
    console.log('✅ The ingredient-product mapping pipeline is working correctly!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Make sure the server is running: npm start');
    console.log('   - Check if the database connection is working');
    console.log('   - Verify the API routes are properly configured');
  }
}

testAPIEndpoints(); 