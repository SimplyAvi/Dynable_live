const axios = require('axios');

async function testApiEndpoint() {
  try {
    console.log('🔍 Testing API endpoint for problematic ingredients...\n');
    
    const testIngredients = [
      'honey mustard',
      'garlic powder',
      'crushed red pepper', 
      'swiss cheese'
    ];
    
    for (const ingredient of testIngredients) {
      console.log(`Testing: "${ingredient}"`);
      
      try {
        const response = await axios.post('http://localhost:5001/api/product/by-ingredient', {
          ingredientName: ingredient,
          allergens: [],
          substituteName: null
        });
        
        console.log(`  API returned ${response.data.length} products:`);
        
        response.data.slice(0, 5).forEach((product, index) => {
          const type = product.brandName === 'Generic' ? '🟡 Generic' : '✅ Real';
          console.log(`    ${index + 1}. ${type} - ${product.description} (${product.brandName})`);
        });
        
        if (response.data.length > 5) {
          console.log(`    ... and ${response.data.length - 5} more products`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        if (error.response) {
          console.log(`  Response: ${JSON.stringify(error.response.data)}`);
        }
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testApiEndpoint(); 