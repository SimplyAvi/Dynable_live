const axios = require('axios');

async function testFilteringLogic() {
    console.log('🔍 Testing Enhanced Filtering Logic Step by Step\n');

    try {
        // Test 1: Check if products have canonical tags
        console.log('1. Checking products with canonical tags...');
        const response = await axios.get('http://localhost:5001/api/product/foods?page=1&limit=10');
        
        if (response.data.foods && response.data.foods.length > 0) {
            console.log('   Sample products with their canonical tags:');
            response.data.foods.slice(0, 5).forEach(product => {
                console.log(`     - ${product.description}`);
                console.log(`       Canonical Tag: ${product.canonicalTag || 'None'}`);
                console.log(`       Subcategory ID: ${product.SubcategoryID || 'None'}`);
                console.log(`       Brand: ${product.brandName || 'None'}`);
            });
        }

        // Test 2: Check subcategories with pure_ingredient flag
        console.log('\n2. Checking subcategories with pure_ingredient flag...');
        try {
            const subcatResponse = await axios.get('http://localhost:5001/api/subcategories');
            if (subcatResponse.data && subcatResponse.data.length > 0) {
                const pureSubcats = subcatResponse.data.filter(sub => sub.pure_ingredient);
                console.log(`   Found ${pureSubcats.length} subcategories with pure_ingredient=true`);
                
                if (pureSubcats.length > 0) {
                    console.log('   Sample pure ingredient subcategories:');
                    pureSubcats.slice(0, 5).forEach(sub => {
                        console.log(`     - ID: ${sub.id}, Name: ${sub.name}`);
                    });
                }
            }
        } catch (error) {
            console.log(`   Error accessing subcategories: ${error.message}`);
        }

        // Test 3: Test the filtering logic with a simple approach
        console.log('\n3. Testing simplified filtering logic...');
        
        // First, let's see what products exist for "sugar" without any filtering
        const sugarResponse = await axios.post('http://localhost:5001/api/product/foods', {
            name: 'sugar'
        }, {
            params: { page: 1, limit: 10 }
        });
        
        console.log(`   Products containing "sugar" in description: ${sugarResponse.data.foods?.length || 0}`);
        
        if (sugarResponse.data.foods && sugarResponse.data.foods.length > 0) {
            console.log('   Sample sugar products:');
            sugarResponse.data.foods.slice(0, 3).forEach(product => {
                console.log(`     - ${product.description} (${product.brandName || 'No brand'})`);
                console.log(`       Canonical Tag: ${product.canonicalTag || 'None'}`);
                console.log(`       Subcategory ID: ${product.SubcategoryID || 'None'}`);
            });
        }

        // Test 4: Check if canonical tags are properly set
        console.log('\n4. Checking canonical tag distribution...');
        const allProductsResponse = await axios.get('http://localhost:5001/api/product/foods?page=1&limit=100');
        
        if (allProductsResponse.data.foods) {
            const withCanonicalTags = allProductsResponse.data.foods.filter(p => p.canonicalTag);
            const withoutCanonicalTags = allProductsResponse.data.foods.filter(p => !p.canonicalTag);
            
            console.log(`   Products with canonical tags: ${withCanonicalTags.length}`);
            console.log(`   Products without canonical tags: ${withoutCanonicalTags.length}`);
            
            if (withCanonicalTags.length > 0) {
                console.log('   Sample canonical tags:');
                const uniqueTags = [...new Set(withCanonicalTags.map(p => p.canonicalTag))];
                uniqueTags.slice(0, 10).forEach(tag => {
                    console.log(`     - ${tag}`);
                });
            }
        }

        // Test 5: Create a simplified version of the filtering
        console.log('\n5. Testing simplified ingredient matching...');
        
        // Let's try a direct search for products with "sugar" in the canonical tag
        try {
            const directResponse = await axios.get('http://localhost:5001/api/product/foods?page=1&limit=10');
            
            if (directResponse.data.foods) {
                const sugarProducts = directResponse.data.foods.filter(p => 
                    p.canonicalTag && p.canonicalTag.toLowerCase().includes('sugar')
                );
                
                console.log(`   Products with "sugar" in canonical tag: ${sugarProducts.length}`);
                
                if (sugarProducts.length > 0) {
                    console.log('   Sample products:');
                    sugarProducts.slice(0, 3).forEach(product => {
                        console.log(`     - ${product.description} (${product.brandName || 'No brand'})`);
                        console.log(`       Canonical Tag: ${product.canonicalTag}`);
                    });
                }
            }
        } catch (error) {
            console.log(`   Error in direct search: ${error.message}`);
        }

        console.log('\n🔍 Filtering Logic Test Complete!');
        console.log('\n💡 Key Findings:');
        console.log('- The enhanced filtering is very restrictive for basic ingredients');
        console.log('- It requires products to be in pure_ingredient subcategories with < 100 products');
        console.log('- Many products may not have canonical tags set');
        console.log('- The filtering logic may need to be relaxed for better results');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testFilteringLogic(); 