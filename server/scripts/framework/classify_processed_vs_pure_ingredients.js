const { Subcategory, Ingredient } = require('./db/models');
const sequelize = require('./db/database');

async function classifyProcessedVsPureRecipeIngredients() {
  try {
    console.log('🔍 CLASSIFYING PROCESSED VS PURE INGREDIENTS\n');
    
    // Define processed ingredients that should be marked as processed_food
    const processedRecipeIngredients = [
      // Condiments and sauces
      'mayonnaise', 'ketchup', 'mustard', 'hot sauce', 'soy sauce', 'worcestershire sauce',
      'barbecue sauce', 'ranch dressing', 'italian dressing', 'caesar dressing',
      'aioli', 'hollandaise', 'béarnaise', 'remoulade',
      
      // Processed dairy
      'cream cheese', 'sour cream', 'whipped cream', 'half and half', 'heavy cream',
      'buttermilk', 'yogurt', 'greek yogurt', 'cottage cheese', 'ricotta cheese',
      
      // Processed meats
      'bacon', 'sausage', 'hot dogs', 'deli meat', 'pepperoni', 'salami',
      'chicken nuggets', 'fish sticks', 'breaded chicken', 'breaded fish',
      
      // Baked goods
      'bread', 'buns', 'rolls', 'croissants', 'muffins', 'cookies', 'crackers',
      'tortillas', 'pita bread', 'naan', 'focaccia',
      
      // Processed grains
      'pasta', 'noodles', 'couscous', 'quinoa', 'rice pilaf', 'wild rice blend',
      
      // Processed vegetables
      'pickles', 'olives', 'sauerkraut', 'kimchi', 'salsa', 'guacamole',
      'hummus', 'baba ganoush', 'tzatziki',
      
      // Processed fruits
      'jam', 'jelly', 'preserves', 'marmalade', 'apple sauce', 'fruit leather',
      
      // Processed nuts/seeds
      'peanut butter', 'almond butter', 'cashew butter', 'tahini', 'nutella',
      
      // Processed sweeteners
      'honey', 'maple syrup', 'agave nectar', 'corn syrup', 'molasses',
      
      // Processed oils and fats
      'margarine', 'shortening', 'cooking spray', 'vegetable oil spread',
      
      // Processed seasonings
      'seasoning blend', 'taco seasoning', 'italian seasoning', 'cajun seasoning',
      'garlic powder', 'onion powder', 'chili powder', 'curry powder',
      
      // Processed beverages
      'juice', 'soda', 'energy drinks', 'sports drinks', 'almond milk', 'soy milk',
      'oat milk', 'coconut milk', 'rice milk',
      
      // Processed snacks
      'chips', 'popcorn', 'pretzels', 'nuts', 'trail mix', 'granola',
      
      // Processed desserts
      'ice cream', 'sorbet', 'pudding', 'jello', 'cake mix', 'brownie mix',
      'pancake mix', 'waffle mix', 'muffin mix'
    ];
    
    // Define pure ingredients (already in your setPureIngredientFlags.js)
    const pureRecipeIngredients = [
      // Pure sugars
      'sugar', 'brown sugar', 'white sugar', 'powdered sugar',
      
      // Pure salts
      'salt', 'sea salt', 'kosher salt', 'table salt',
      
      // Pure yeasts
      'yeast', 'active dry yeast', 'instant yeast',
      
      // Pure baking ingredients
      'baking soda', 'baking powder', 'cream of tartar',
      
      // Pure oils
      'olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'sesame oil', 
      'grapeseed oil', 'avocado oil', 'sunflower oil',
      
      // Pure spices and seasonings
      'black pepper', 'white pepper', 'garlic', 'onion', 'cinnamon', 'nutmeg', 
      'ginger', 'basil', 'parsley', 'cayenne pepper', 'celery seed', 'cloves', 
      'bay leaf', 'sage', 'dill', 'mint', 'oregano', 'thyme', 'cumin', 
      'cardamom', 'coriander', 'turmeric', 'paprika', 'mustard seeds',
      
      // Pure flours
      'all-purpose flour', 'bread flour', 'whole wheat flour', 'cake flour',
      'pastry flour', 'cornmeal', 'cornstarch', 'arrowroot powder',
      
      // Pure dairy (when not flavored/processed)
      'whole milk', 'skim milk', '2% milk', '1% milk', 'butter', 
      'unsalted butter', 'salted butter',
      
      // Pure eggs
      'egg', 'large egg', 'medium egg', 'small egg',
      
      // Pure nuts and seeds (when not roasted/flavored)
      'almond', 'walnut', 'cashew', 'pecan', 'pine nuts', 'peanuts', 'hazelnuts',
      'sunflower seeds', 'poppy seeds', 'flax seeds', 'sesame seeds', 'pumpkin seeds',
      
      // Pure grains
      'white rice', 'brown rice', 'quinoa', 'oats', 'barley', 'couscous', 'millet',
      'amaranth', 'wheat bran', 'basmati rice', 'arborio rice', 'jasmine rice',
      
      // Pure extracts
      'vanilla extract', 'almond extract', 'cocoa powder', 'chocolate',
      
      // Pure liquids
      'water', 'boiling water', 'cold water',
      
      // Pure vegetables (fresh)
      'tomato', 'lettuce', 'spinach', 'kale', 'carrot', 'onion', 'garlic',
      'bell pepper', 'cucumber', 'celery', 'broccoli', 'cauliflower',
      
      // Pure fruits (fresh)
      'apple', 'banana', 'orange', 'lemon', 'lime', 'strawberry', 'blueberry',
      'raspberry', 'blackberry', 'grape', 'peach', 'pear', 'plum'
    ];
    
    console.log('📋 CLASSIFICATION RULES:');
    console.log(`   Pure ingredients: ${pureRecipeIngredients.length}`);
    console.log(`   Processed ingredients: ${processedRecipeIngredients.length}`);
    
    // Update subcategories based on classification
    const allSubcategories = await Subcategory.findAll();
    let pureCount = 0;
    let processedCount = 0;
    let unchangedCount = 0;
    
    for (const subcategory of allSubcategories) {
      const subcategoryName = subcategory.SubcategoryName.toLowerCase();
      let isPure = false;
      let isProcessed = false;
      
      // Check if it's a pure ingredient
      for (const pureIngredient of pureRecipeIngredients) {
        if (subcategoryName.includes(pureIngredient.toLowerCase())) {
          isPure = true;
          break;
        }
      }
      
      // Check if it's a processed ingredient
      for (const processedIngredient of processedRecipeIngredients) {
        if (subcategoryName.includes(processedIngredient.toLowerCase())) {
          isProcessed = true;
          break;
        }
      }
      
      // Update the subcategory
      const updates = {};
      if (isPure && !subcategory.pure_ingredient) {
        updates.pure_ingredient = true;
        pureCount++;
      } else if (!isPure && subcategory.pure_ingredient) {
        updates.pure_ingredient = false;
        unchangedCount++;
      }
      
      if (isProcessed && !subcategory.is_processed_food) {
        updates.is_processed_food = true;
        processedCount++;
      } else if (!isProcessed && subcategory.is_processed_food) {
        updates.is_processed_food = false;
        unchangedCount++;
      }
      
      if (Object.keys(updates).length > 0) {
        await subcategory.update(updates);
      } else {
        unchangedCount++;
      }
    }
    
    // Show results
    console.log('\n📊 CLASSIFICATION RESULTS:');
    console.log(`   Subcategories marked as pure: ${pureCount}`);
    console.log(`   Subcategories marked as processed: ${processedCount}`);
    console.log(`   Unchanged subcategories: ${unchangedCount}`);
    
    // Show examples
    console.log('\n📋 EXAMPLES OF PURE INGREDIENTS:');
    const pureExamples = await Subcategory.findAll({
      where: { pure_ingredient: true },
      limit: 10,
      order: [['SubcategoryName', 'ASC']]
    });
    pureExamples.forEach(sub => console.log(`   ✅ ${sub.SubcategoryName}`));
    
    console.log('\n📋 EXAMPLES OF PROCESSED FOODS:');
    const processedExamples = await Subcategory.findAll({
      where: { is_processed_food: true },
      limit: 10,
      order: [['SubcategoryName', 'ASC']]
    });
    processedExamples.forEach(sub => console.log(`   🔄 ${sub.SubcategoryName}`));
    
    console.log('\n✅ CLASSIFICATION COMPLETE!');
    
  } catch (error) {
    console.error('❌ Error classifying ingredients:', error);
  } finally {
    await sequelize.close();
  }
}

classifyProcessedVsPureRecipeIngredients(); 