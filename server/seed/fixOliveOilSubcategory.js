const Subcategory = require('../db/models/Categories/Subcategory');

async function fixOliveOilSubcategory() {
  try {
    // Set subcategory 245 (which contains legitimate olive oil products) as pure_ingredient = true
    const subcategory = await Subcategory.findByPk(245);
    if (subcategory) {
      subcategory.pure_ingredient = true;
      await subcategory.save();
      console.log(`✅ Set subcategory ID 245 ("${subcategory.name}") as pure_ingredient = true`);
    } else {
      console.log('❌ Subcategory 245 not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixOliveOilSubcategory(); 