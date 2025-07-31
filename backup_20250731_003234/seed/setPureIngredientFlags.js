const sequelize = require('../db/database');
const Subcategory = require('../db/models/Categories/Subcategory');

async function setPureIngredientFlags() {
  try {
    await sequelize.sync({ force: false });
    
    // Define which subcategories are pure ingredients
    const pureIngredientSubcategories = [
      // Pure sugars
      'sugar', 'brown sugar', 'white sugar',
      
      // Pure salts
      'salt',
      
      // Pure yeasts
      'yeast',
      
      // Pure baking ingredients
      'baking soda', 'baking powder',
      
      // Pure oils
      'olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'sesame oil', 'grapeseed oil',
      
      // Pure spices and seasonings
      'black pepper', 'garlic', 'onion', 'cinnamon', 'nutmeg', 'ginger', 'basil', 'parsley',
      'cayenne pepper', 'celery seed', 'cloves', 'bay leaf', 'sage', 'dill', 'mint',
      'oregano', 'thyme', 'cumin', 'cardamom', 'coriander', 'turmeric', 'paprika',
      'curry powder', 'mustard', 'vinegar', 'honey', 'molasses', 'agave nectar',
      
      // Pure flours
      'all-purpose flour', 'bread flour', 'whole wheat flour', 'cornmeal', 'cornstarch',
      
      // Pure dairy (when not flavored/processed)
      'whole milk', 'skim milk', 'butter', 'unsalted butter', 'salted butter',
      
      // Pure eggs
      'egg', 'large egg',
      
      // Pure nuts and seeds (when not roasted/flavored)
      'almond', 'walnut', 'cashew', 'pecan', 'pine nuts', 'peanuts', 'hazelnuts',
      'sunflower seeds', 'poppy seeds', 'flax seeds', 'sesame seeds',
      
      // Pure grains
      'white rice', 'brown rice', 'quinoa', 'oats', 'barley', 'couscous', 'millet',
      'amaranth', 'wheat bran', 'basmati rice', 'arborio rice',
      
      // Pure extracts
      'vanilla extract', 'cocoa powder',
      
      // Pure liquids
      'water', 'boiling water'
    ];
    
    // Update all subcategories to set pure_ingredient flag
    const allSubcategories = await Subcategory.findAll();
    
    for (const subcategory of allSubcategories) {
      const isPureIngredient = pureIngredientSubcategories.some(pureName => 
        subcategory.SubcategoryName.toLowerCase().includes(pureName.toLowerCase())
      );
      
      await subcategory.update({ pure_ingredient: isPureIngredient });
    }
    
    // Log the results
    const pureCount = await Subcategory.count({ where: { pure_ingredient: true } });
    const totalCount = await Subcategory.count();
    
    console.log(`✅ Updated ${totalCount} subcategories`);
    console.log(`✅ Set ${pureCount} subcategories as pure ingredients`);
    console.log(`✅ Set ${totalCount - pureCount} subcategories as non-pure ingredients`);
    
    // Show some examples
    const pureExamples = await Subcategory.findAll({ 
      where: { pure_ingredient: true },
      limit: 10,
      order: [['SubcategoryName', 'ASC']]
    });
    
    const nonPureExamples = await Subcategory.findAll({ 
      where: { pure_ingredient: false },
      limit: 10,
      order: [['SubcategoryName', 'ASC']]
    });
    
    console.log('\n📋 Examples of pure ingredients:');
    pureExamples.forEach(sub => console.log(`  - ${sub.SubcategoryName}`));
    
    console.log('\n📋 Examples of non-pure ingredients:');
    nonPureExamples.forEach(sub => console.log(`  - ${sub.SubcategoryName}`));
    
  } catch (error) {
    console.error('❌ Error setting pure ingredient flags:', error);
  } finally {
    await sequelize.close();
  }
}

setPureIngredientFlags(); 