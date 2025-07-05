const { Food } = require('../db/models');
const Subcategory = require('../db/models/Categories/Subcategory');

async function debugOliveOilSubcategories() {
  console.log('=== DEBUGGING OLIVE OIL SUBCATEGORIES ===\n');
  
  // Find all products with 'olive oil' in description
  const oliveOilProducts = await Food.findAll({
    where: {
      description: {
        [require('sequelize').Op.iLike]: '%olive oil%'
      }
    },
    include: [{
      model: Subcategory,
      as: 'Subcategory'
    }]
  });
  
  console.log(`Found ${oliveOilProducts.length} products with 'olive oil' in description:\n`);
  
  // Group by subcategory
  const subcategoryGroups = {};
  for (const product of oliveOilProducts) {
    const subcatName = product.Subcategory ? product.Subcategory.name : 'No Subcategory';
    const subcatId = product.SubcategoryID;
    const pureFlag = product.Subcategory ? product.Subcategory.pure_ingredient : false;
    
    if (!subcategoryGroups[subcatId]) {
      subcategoryGroups[subcatId] = {
        name: subcatName,
        pure_ingredient: pureFlag,
        products: []
      };
    }
    subcategoryGroups[subcatId].products.push(product.description);
  }
  
  for (const [subcatId, info] of Object.entries(subcategoryGroups)) {
    console.log(`Subcategory ID ${subcatId}: "${info.name}" (pure_ingredient: ${info.pure_ingredient})`);
    console.log(`  Products (${info.products.length}):`);
    info.products.slice(0, 5).forEach(desc => {
      console.log(`    - ${desc}`);
    });
    if (info.products.length > 5) {
      console.log(`    ... and ${info.products.length - 5} more`);
    }
    console.log('');
  }
  
  // Check which subcategories are marked as pure ingredients
  const pureSubcategories = await Subcategory.findAll({
    where: { pure_ingredient: true }
  });
  
  console.log('=== ALL PURE INGREDIENT SUBCATEGORIES ===');
  pureSubcategories.forEach(subcat => {
    console.log(`ID ${subcat.SubcategoryID}: "${subcat.name}"`);
  });
  
  process.exit(0);
}

debugOliveOilSubcategories(); 