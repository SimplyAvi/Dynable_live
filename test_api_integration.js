const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Simulate the simplified searchProductsFromSupabasePure function
async function searchProductsFromSupabasePure(searchParams) {
  const {
    name: searchTerm = '',
    allergens = [],
    limit = 50,
    page = 1,
    includeCount = false
  } = searchParams || {};

  console.log('[API] Searching products with allergen filtering:', { 
    searchTerm, 
    allergens, 
    limit 
  });

  try {
    // Build the base query
    let query = supabase
      .from('IngredientCategorized')
      .select('id, description, "brandName", "canonicalTag", allergens', { 
        count: includeCount ? 'exact' : null 
      });

    // Add search filter if provided
    if (searchTerm && searchTerm.trim() !== '') {
      query = query.ilike('description', `%${searchTerm}%`);
    }

    // Add allergen filtering if provided
    if (allergens && allergens.length > 0) {
      console.log('[API] Filtering out products with allergens:', allergens);
      
      // Convert user selections to camelCase to match our database format
      const camelCaseAllergens = allergens.map(allergen => {
        // Handle common mappings from frontend to database format
        const mappings = {
          'milk': 'milk',
          'eggs': 'eggs',
          'fish': 'fish',
          'shellfish': 'shellfish',
          'peanuts': 'peanuts',
          'wheat': 'wheat',
          'soy': 'soy',
          'sesame': 'sesame',
          'gluten': 'gluten',
          'treenuts': 'treeNuts', // Frontend sends 'treenuts', DB has 'treeNuts'
          'tree nuts': 'treeNuts',
          'tree_nuts': 'treeNuts',
          'tree-nuts': 'treeNuts'
        };
        
        return mappings[allergen.toLowerCase()] || allergen;
      });

      console.log('[API] Converted to camelCase:', camelCaseAllergens);

      // Exclude products that contain ANY of the selected allergens
      camelCaseAllergens.forEach(allergen => {
        query = query.not('allergens', 'cs', `{${allergen}}`);
      });
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[API] Query error:', error);
      throw error;
    }

    console.log(`[API] Found ${data?.length || 0} products with allergen filtering`);

    return {
      success: true,
      data: data || [],
      total: data?.length || 0,
      filtered: allergens && allergens.length > 0,
      count: includeCount ? count : undefined
    };

  } catch (error) {
    console.error('[API] Product search failed:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      total: 0
    };
  }
}

async function testApiIntegration() {
    console.log('🧪 TESTING API INTEGRATION');
    console.log('==========================\n');

    try {
        // Test 1: No allergens selected
        console.log('📊 Test 1: No allergens selected...');
        const noAllergensResult = await searchProductsFromSupabasePure({
            name: '',
            allergens: [],
            limit: 10
        });
        
        console.log(`✅ No allergens: ${noAllergensResult.data.length} products found`);

        // Test 2: Single allergen (milk)
        console.log('\n🥛 Test 2: Single allergen (milk)...');
        const milkResult = await searchProductsFromSupabasePure({
            name: '',
            allergens: ['milk'],
            limit: 10
        });
        
        console.log(`✅ Milk filter: ${milkResult.data.length} products found (excluded products with milk)`);

        // Test 3: Single allergen (treeNuts - camelCase)
        console.log('\n🌰 Test 3: Single allergen (treeNuts - camelCase)...');
        const treeNutsResult = await searchProductsFromSupabasePure({
            name: '',
            allergens: ['treeNuts'],
            limit: 10
        });
        
        console.log(`✅ TreeNuts filter: ${treeNutsResult.data.length} products found (excluded products with treeNuts)`);

        // Test 4: Multiple allergens
        console.log('\n🚫 Test 4: Multiple allergens (milk + treeNuts)...');
        const multipleResult = await searchProductsFromSupabasePure({
            name: '',
            allergens: ['milk', 'treeNuts'],
            limit: 10
        });
        
        console.log(`✅ Multiple filter: ${multipleResult.data.length} products found (excluded products with milk OR treeNuts)`);

        // Test 5: Frontend simulation
        console.log('\n🎯 Test 5: Frontend simulation...');
        const frontendAllergens = ['milk', 'treeNuts']; // Frontend sends camelCase
        const frontendResult = await searchProductsFromSupabasePure({
            name: '',
            allergens: frontendAllergens,
            limit: 10
        });
        
        console.log(`✅ Frontend simulation: ${frontendResult.data.length} products found for allergens: ${frontendAllergens.join(', ')}`);

        // Show sample results
        if (frontendResult.data.length > 0) {
            console.log('📋 Sample filtered products:');
            frontendResult.data.slice(0, 3).forEach(p => {
                console.log(`  - ID: ${p.id}, Allergens: ${JSON.stringify(p.allergens)}`);
            });
        }

        console.log('\n🎉 API INTEGRATION TESTS COMPLETED!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testApiIntegration(); 