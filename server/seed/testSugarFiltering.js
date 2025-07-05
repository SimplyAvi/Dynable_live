const { Food, Subcategory } = require('../db/models');
const { Op, Sequelize } = require('sequelize');

async function testSugarFiltering() {
  try {
    console.log('=== TESTING SUGAR FILTERING ===\n');

    // Test the new strict sugar filtering logic
    const cleanedName = 'sugar';
    
    // Build the patterns for sugar
    const patterns = [
      'sugar', 'sugar.', 'sugar,', 'sugar ',
      '100% sugar', 'pure sugar', 'granulated sugar', 'organic sugar', 'raw sugar',
      'white sugar', 'brown sugar', 'powdered sugar', 'confectioners sugar', 'cane sugar', 'beet sugar'
    ];
    
    const where = {
      [Op.or]: patterns.map(pattern => ({
        description: { [Op.iLike]: `%${pattern}` }
      })),
      [Op.and]: [
        Sequelize.literal(`"Food"."SubcategoryID" IN (
          SELECT "SubcategoryID" FROM "Subcategories" 
          WHERE "pure_ingredient" = true
        )`)
      ]
    };

    const products = await Food.findAll({
      where,
      include: [{ model: Subcategory, as: 'Subcategory' }],
      order: [['description', 'ASC']]
    });

    console.log(`Found ${products.length} pure sugar products:`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.brandName || 'No brand'}: ${product.description?.slice(0, 80)}`);
      console.log(`   Subcategory: ${product.Subcategory?.name || 'None'}`);
    });

    // Check for any problematic products that might have slipped through
    console.log('\n=== CHECKING FOR PROBLEMATIC PRODUCTS ===');
    const problematicProducts = products.filter(p => 
      p.description?.toLowerCase().includes('donut') ||
      p.description?.toLowerCase().includes('cookie') ||
      p.description?.toLowerCase().includes('cake') ||
      p.description?.toLowerCase().includes('candy') ||
      p.description?.toLowerCase().includes('oat') ||
      p.description?.toLowerCase().includes('cereal')
    );
    
    if (problematicProducts.length > 0) {
      console.log(`⚠️  Found ${problematicProducts.length} potentially problematic products:`);
      problematicProducts.forEach(p => {
        console.log(`   - ${p.brandName || 'No brand'}: ${p.description?.slice(0, 60)}`);
      });
    } else {
      console.log('✅ No problematic products found - filtering is working correctly!');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testSugarFiltering(); 