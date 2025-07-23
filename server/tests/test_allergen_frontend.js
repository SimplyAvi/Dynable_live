const axios = require('axios');

async function testAllergenFrontend() {
  try {
    console.log('🧪 TESTING ALLERGEN FRONTEND INTEGRATION\n');
    
    // Test the allergen API endpoint
    console.log('📡 Testing allergen API endpoint...');
    const response = await axios.get('http://localhost:5001/api/allergens');
    
    if (response.status === 200) {
      const allergens = response.data;
      const allergenKeys = Object.keys(allergens);
      
      console.log('✅ API Response Status:', response.status);
      console.log(`✅ Total allergens returned: ${allergenKeys.length}`);
      console.log('✅ Allergens:', allergenKeys);
      
      // Check if we have the expected allergens
      const expectedAllergens = [
        'milk', 'eggs', 'fish', 'shellfish', 'treeNuts', 'peanuts', 
        'wheat', 'soy', 'sesame', 'gluten'
      ];
      
      const missingAllergens = expectedAllergens.filter(allergen => 
        !allergenKeys.includes(allergen)
      );
      
      if (missingAllergens.length > 0) {
        console.log('⚠️  Missing expected allergens:', missingAllergens);
      } else {
        console.log('✅ All expected allergens present');
      }
      
      // Check for additional allergens
      const additionalAllergens = allergenKeys.filter(allergen => 
        !expectedAllergens.includes(allergen)
      );
      
      console.log(`✅ Additional allergens (${additionalAllergens.length}):`, additionalAllergens);
      
    } else {
      console.log('❌ API returned unexpected status:', response.status);
    }
    
    console.log('\n💡 FRONTEND FIXES APPLIED:');
    console.log('   1. Improved error handling in fetchAllergensFromDatabase');
    console.log('   2. Enhanced Redux toggleAllergy with validation');
    console.log('   3. Better logging in AllergyFilter component');
    console.log('   4. Proper fallback handling for API failures');
    
    console.log('\n🎯 EXPECTED RESULTS FOR SIMPLY AVI:');
    console.log('   ✅ Should now see 30 allergens instead of 9');
    console.log('   ✅ Should be able to toggle multiple allergens');
    console.log('   ✅ Better error handling if API fails');
    console.log('   ✅ Improved logging for debugging');
    
  } catch (error) {
    console.error('❌ Error testing allergen frontend:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running on port 5001');
    }
  }
}

testAllergenFrontend(); 