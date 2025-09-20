// 🧪 Test Edge Function Locally
// This script tests the recipe-processor Edge Function

const testRecipeProcessing = async () => {
  console.log('🧪 Testing Edge Function locally...');
  
  try {
    // Test data
    const testData = {
      recipeId: 10245, // Use a real recipe ID from your database
      userAllergens: ['milk', 'gluten']
    };
    
    console.log('📋 Test data:', testData);
    
    // Call the Edge Function
    const response = await fetch('http://localhost:54321/functions/v1/recipe-processor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Edge Function test successful!');
      console.log('📊 Processing stats:');
      console.log(`   - Processing time: ${result.data.processingTime.toFixed(2)}ms`);
      console.log(`   - Total products: ${result.data.totalProducts}`);
      console.log(`   - Total ingredients: ${result.data.ingredients.length}`);
      
      console.log('🥘 Recipe details:');
      console.log(`   - Title: ${result.data.title}`);
      console.log(`   - Source: ${result.data.source}`);
      
      console.log('🧂 Ingredients processed:');
      result.data.ingredients.forEach((ingredient, index) => {
        console.log(`   ${index + 1}. ${ingredient.name} (${ingredient.canonical})`);
        console.log(`      - Products found: ${ingredient.products.length}`);
        console.log(`      - Substitutes found: ${ingredient.substitutes.length}`);
        console.log(`      - Has allergens: ${ingredient.hasAllergens}`);
        if (ingredient.allergenNotes.length > 0) {
          console.log(`      - Allergen notes: ${ingredient.allergenNotes.join(', ')}`);
        }
      });
      
      console.log('🎉 All tests passed! The Edge Function is working correctly.');
      
    } else {
      console.error('❌ Edge Function returned error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('💡 Make sure:');
    console.log('   1. Supabase is running locally: supabase start');
    console.log('   2. Edge Function is deployed: supabase functions serve');
    console.log('   3. Environment variables are set correctly');
  }
};

// Run the test
testRecipeProcessing();

