const { IngredientCategorized, Ingredient } = require('../../db/models');
const { sequelize } = require('../../db/database');

// Core ingredients to ensure pure/real products exist for
const CORE_INGREDIENTS = [
  'flour',
  'sugar',
  'salt',
  'eggs',
  'vanilla',
  'oil',
  'water',
  'butter',
  'milk',
  'baking powder',
  'baking soda',
  'yeast',
  'olive oil',
  'canola oil',
  'vegetable oil',
  'cornstarch',
  'honey',
  'cocoa powder',
  'cream',
  'cheese',
  'rice',
  'bread',
  'pasta',
  'tomato sauce',
  'soy sauce',
  'vinegar',
  'lemon juice',
  'chicken broth',
  'beef broth',
  'onion',
  'garlic',
  'carrot',
  'celery',
  'potato',
  'tomato',
  'lettuce',
  'spinach',
  'mushroom',
  'pepper',
  'cinnamon',
  'vanilla extract',
  'brown sugar',
  'powdered sugar',
  'confectioners sugar',
  'granulated sugar',
  'all-purpose flour',
  'whole wheat flour',
  'kosher salt',
  'sea salt',
  'unsalted butter',
  'egg',
  'large eggs',
  'whole milk',
  'cream cheese',
  'black pepper',
  'olive',
  'avocado oil',
  'coconut oil',
  'peanut oil',
  'sunflower oil',
  'sesame oil',
  'almond',
  'walnut',
  'pecan',
  'cashew',
  'peanut',
  'oats',
  'quinoa',
  'lentil',
  'bean',
  'chickpea',
  'split pea',
  'banana',
  'apple',
  'orange',
  'lemon',
  'lime',
  'strawberry',
  'blueberry',
  'raspberry',
  'blackberry',
  'peach',
  'pear',
  'plum',
  'cherry',
  'pineapple',
  'mango',
  'papaya',
  'kiwi',
  'coconut',
];

async function addCorePureProducts() {
  try {
    console.log('🔍 Ensuring pure/real products exist for core ingredients...\n');
    let addedCanonicals = 0;
    let addedProducts = 0;
    for (const canonicalName of CORE_INGREDIENTS) {
      try {
        // Ensure canonical exists
        let canonical = await Ingredient.findOne({ where: { name: canonicalName } });
        if (!canonical) {
          canonical = await Ingredient.create({
            name: canonicalName,
            canonicalTag: true,
            canonicalTagConfidence: 0.9
          });
          addedCanonicals++;
          console.log(`✅ Added canonical: ${canonicalName}`);
        }
        // Add a pure product for this canonical if missing
        const existingProduct = await IngredientCategorized.findOne({ where: { description: canonicalName } });
        if (!existingProduct) {
          await IngredientCategorized.create({
            description: canonicalName,
            canonicalTag: canonicalName,
            canonicalTagConfidence: 0.9,
            isPureProduct: true
          });
          addedProducts++;
          console.log(`  ✅ Added product: ${canonicalName}`);
        }
      } catch (error) {
        console.log(`❌ Error adding ${canonicalName}: ${error.message}`);
      }
    }
    console.log(`\n📊 Summary:`);
    console.log(`   Added ${addedCanonicals} new canonicals`);
    console.log(`   Added ${addedProducts} new products`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

addCorePureProducts(); 