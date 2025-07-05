const { Food, Subcategory } = require('../db/models');
const { Op, Sequelize } = require('sequelize');

async function testEnhancedFiltering() {
  console.log('🧪 Testing Enhanced Filtering Logic\n');
  
  try {
    // Test 1: Check subcategory sizes for basic ingredients
    console.log('1. Checking subcategory sizes for basic ingredients...');
    
    const basicIngredients = ['sugar', 'salt', 'flour', 'milk', 'butter', 'oil', 'yeast', 'egg'];
    
    for (const ingredient of basicIngredients) {
      console.log(`\n--- Testing: ${ingredient.toUpperCase()} ---`);
      
      // Get subcategories that are marked as pure ingredients
      const pureSubcategories = await Subcategory.findAll({
        where: { pure_ingredient: true }
      });
      
      // Count products in each subcategory
      const subcategoryCounts = [];
      for (const subcat of pureSubcategories) {
        const count = await Food.count({
          where: { SubcategoryID: subcat.SubcategoryID }
        });
        
        if (count > 0) {
          subcategoryCounts.push({
            id: subcat.SubcategoryID,
            name: subcat.SubcategoryName,
            count: count,
            isSmall: count < 100
          });
        }
      }
      
      // Show subcategories with their sizes
      console.log(`Subcategories with ${ingredient}-related products:`);
      subcategoryCounts.forEach(sub => {
        const status = sub.isSmall ? '✅ Small' : '⚠️ Large';
        console.log(`  ${status} - ${sub.name}: ${sub.count} products`);
      });
      
      // Test the enhanced filtering query
      const enhancedQuery = {
        where: {
          [Op.and]: [
            Sequelize.literal(`"SubcategoryID" IN (
              SELECT "SubcategoryID" FROM "Subcategories" 
              WHERE "pure_ingredient" = true
              AND "SubcategoryID" IN (
                SELECT "SubcategoryID" FROM "Food" 
                GROUP BY "SubcategoryID" 
                HAVING COUNT(*) < 100
              )
            )`)
          ]
        },
        limit: 5
      };
      
      const filteredProducts = await Food.findAll(enhancedQuery);
      console.log(`Enhanced filtering found ${filteredProducts.length} products from small subcategories`);
    }
    
    // Test 2: Check brand filtering
    console.log('\n2. Testing brand filtering...');
    
    const problematicBrands = ['M&M', 'Hershey', 'Nestle', 'Kraft', 'General Mills'];
    
    for (const brand of problematicBrands) {
      const brandProducts = await Food.findAll({
        where: {
          brandName: { [Op.iLike]: `%${brand}%` }
        },
        limit: 3
      });
      
      console.log(`\nBrand: ${brand}`);
      brandProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.description}`);
      });
    }
    
    // Test 3: Test the complete enhanced filtering for sugar
    console.log('\n3. Testing complete enhanced filtering for sugar...');
    
    const sugarQuery = {
      where: {
        [Op.and]: [
          // Canonical tag matching (simulated)
          { description: { [Op.iLike]: '%sugar%' } },
          
          // Pure ingredient subcategory filtering
          Sequelize.literal(`"SubcategoryID" IN (
            SELECT "SubcategoryID" FROM "Subcategories" 
            WHERE "pure_ingredient" = true
            AND "SubcategoryID" IN (
              SELECT "SubcategoryID" FROM "Food" 
              GROUP BY "SubcategoryID" 
              HAVING COUNT(*) < 100
            )
          )`),
          
          // Brand filtering
          Sequelize.literal(`(
            "brandName" IS NULL OR 
            LOWER("brandName") NOT LIKE '%m&m%' AND
            LOWER("brandName") NOT LIKE '%hershey%' AND
            LOWER("brandName") NOT LIKE '%nestle%' AND
            LOWER("brandName") NOT LIKE '%kraft%' AND
            LOWER("brandName") NOT LIKE '%general mills%'
          )`),
          
          // Description filtering
          Sequelize.literal(`(
            LOWER("description") NOT LIKE '%donut%' AND
            LOWER("description") NOT LIKE '%cookie%' AND
            LOWER("description") NOT LIKE '%cake%' AND
            LOWER("description") NOT LIKE '%cereal%' AND
            LOWER("description") NOT LIKE '%oat%' AND
            LOWER("description") NOT LIKE '%candy%' AND
            LOWER("description") NOT LIKE '%chocolate%'
          )`)
        ]
      },
      limit: 10
    };
    
    const enhancedSugarProducts = await Food.findAll(sugarQuery);
    console.log(`Enhanced filtering for sugar found ${enhancedSugarProducts.length} products:`);
    enhancedSugarProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.brandName || 'No brand'}: ${product.description}`);
    });
    
    // Test 4: Compare with basic filtering
    console.log('\n4. Comparing with basic filtering...');
    
    const basicSugarQuery = {
      where: { description: { [Op.iLike]: '%sugar%' } },
      limit: 10
    };
    
    const basicSugarProducts = await Food.findAll(basicSugarQuery);
    console.log(`Basic filtering for sugar found ${basicSugarProducts.length} products:`);
    basicSugarProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.brandName || 'No brand'}: ${product.description}`);
    });
    
    // Calculate improvement
    const improvement = basicSugarProducts.length - enhancedSugarProducts.length;
    console.log(`\n📊 Filtering Improvement:`);
    console.log(`  Basic filtering: ${basicSugarProducts.length} products`);
    console.log(`  Enhanced filtering: ${enhancedSugarProducts.length} products`);
    console.log(`  Eliminated: ${improvement} false positives (${((improvement/basicSugarProducts.length)*100).toFixed(1)}% reduction)`);
    
  } catch (error) {
    console.error('❌ Error during enhanced filtering test:', error);
  } finally {
    process.exit(0);
  }
}

testEnhancedFiltering(); 