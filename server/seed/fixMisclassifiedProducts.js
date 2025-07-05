const { Food, Subcategory } = require('../db/models');
const { Op, Sequelize } = require('sequelize');

async function fixMisclassifiedProducts() {
  try {
    console.log('=== FIXING MISCLASSIFIED PRODUCTS ===\n');

    // Find products that contain "sugar" but are assigned to pure ingredient subcategories
    // These should be reassigned to null or to appropriate non-pure subcategories
    const problematicProducts = await Food.findAll({
      where: {
        description: { [Op.iLike]: '%sugar%' },
        SubcategoryID: {
          [Op.in]: [
            // Get IDs of pure ingredient subcategories
            Sequelize.literal(`(
              SELECT "SubcategoryID" FROM "Subcategories" 
              WHERE "pure_ingredient" = true
            )`)
          ]
        }
      },
      include: [{ model: Subcategory, as: 'Subcategory' }]
    });

    console.log(`Found ${problematicProducts.length} products with sugar that are assigned to pure ingredient subcategories:`);
    
    const productsToFix = [];
    
    for (const product of problematicProducts) {
      const desc = product.description.toLowerCase();
      
      // Check if this is actually a processed food, not a pure ingredient
      const isProcessedFood = 
        desc.includes('donut') || 
        desc.includes('cookie') || 
        desc.includes('cake') || 
        desc.includes('cereal') || 
        desc.includes('oat') ||
        desc.includes('candy') ||
        desc.includes('chocolate') ||
        desc.includes('pastry') ||
        desc.includes('bread') ||
        desc.includes('muffin') ||
        desc.includes('brownie') ||
        desc.includes('bar') ||
        desc.includes('mix') ||
        desc.includes('frosted') ||
        desc.includes('iced') ||
        desc.includes('decorated');
      
      if (isProcessedFood) {
        productsToFix.push(product);
        console.log(`- ${product.brandName || 'No brand'}: ${product.description?.slice(0, 80)}`);
        console.log(`  Current subcategory: ${product.Subcategory?.SubcategoryName} (pure_ingredient: ${product.Subcategory?.pure_ingredient})`);
      }
    }

    if (productsToFix.length > 0) {
      console.log(`\nFixing ${productsToFix.length} misclassified products...`);
      
      // Set SubcategoryID to null for these products
      for (const product of productsToFix) {
        await product.update({ SubcategoryID: null });
        console.log(`✓ Fixed: ${product.brandName || 'No brand'}: ${product.description?.slice(0, 60)}`);
      }
      
      console.log('\n✅ All misclassified products have been fixed!');
    } else {
      console.log('✅ No misclassified products found!');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

fixMisclassifiedProducts(); 