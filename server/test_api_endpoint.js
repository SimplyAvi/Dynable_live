const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function checkEndpoint(name, method, url, data = null) {
  try {
    let response;
    if (method === 'GET') {
      response = await axios.get(url);
    } else if (method === 'POST') {
      response = await axios.post(url, data);
    } else {
      throw new Error('Unsupported HTTP method');
    }
    const result = response.data;
    let length = Array.isArray(result) ? result.length : (result && typeof result === 'object' ? Object.keys(result).length : 'N/A');
    console.log(`✅ [${name}] ${method} ${url} - Success (${length} items)`);
    if (Array.isArray(result)) {
      result.slice(0, 3).forEach((item, i) => {
        console.log(`   ${i + 1}. ${JSON.stringify(item).slice(0, 200)}${JSON.stringify(item).length > 200 ? '...' : ''}`);
      });
      if (result.length > 3) console.log(`   ...and ${result.length - 3} more`);
    } else {
      console.log(`   Sample: ${JSON.stringify(result).slice(0, 200)}${JSON.stringify(result).length > 200 ? '...' : ''}`);
    }
  } catch (error) {
    console.log(`❌ [${name}] ${method} ${url} - Error: ${error.message}`);
    if (error.response) {
      console.log(`   Response: ${JSON.stringify(error.response.data)}`);
    }
  }
  console.log('');
}

async function testApiEndpoints() {
  console.log('🔍 Testing all main API endpoints (corrected paths)...\n');

  // 1. Allergens
  await checkEndpoint('Allergens', 'GET', `${BASE_URL}/allergens`);

  // 2. Allergen Derivatives (with query param)
  await checkEndpoint('Allergen Derivatives', 'GET', `${BASE_URL}/allergens/derivatives?allergen=milk`);

  // 3. Food Categories
  await checkEndpoint('Food Categories', 'GET', `${BASE_URL}/foodCategories`);

  // 4. Product: foods list
  await checkEndpoint('Product Foods', 'GET', `${BASE_URL}/product/foods`);

  // 5. Product: search (GET)
  await checkEndpoint('Product Search', 'GET', `${BASE_URL}/product/search?name=flour`);

  // 6. Product by ingredient (POST)
  const testIngredients = [
    'honey mustard',
    'garlic powder',
    'crushed red pepper',
    'swiss cheese'
  ];
  for (const ingredient of testIngredients) {
    await checkEndpoint(
      `ProductByIngredient: ${ingredient}`,
      'POST',
      `${BASE_URL}/product/by-ingredient`,
      { ingredientName: ingredient, allergens: [], substituteName: null }
    );
  }

  // 7. Recipe: search/filter (POST)
  await checkEndpoint('Recipe Search', 'POST', `${BASE_URL}/recipe/`, { search: 'chicken', excludeIngredients: [] });

  // 8. Recipe: get by id (GET)
  await checkEndpoint('Recipe By ID', 'GET', `${BASE_URL}/recipe/?id=1`);

  // 9. Recipe: substitute products (GET)
  await checkEndpoint('Recipe Substitute Products', 'GET', `${BASE_URL}/recipe/substitute-products`);

  // 10. Recipe: substitute products (GET with canonicalIngredient)
  await checkEndpoint('Recipe Substitute Products (flour)', 'GET', `${BASE_URL}/recipe/substitute-products?canonicalIngredient=flour`);

  // Add more endpoints as needed...

  console.log('✅ Endpoint health check complete.');
  process.exit(0);
}

testApiEndpoints(); 