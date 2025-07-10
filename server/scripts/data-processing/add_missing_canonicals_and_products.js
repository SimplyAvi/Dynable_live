const { Food, CanonicalIngredient, IngredientToCanonical } = require('../../db/models');
const { sequelize } = require('../../db/database');

async function addMissingCanonicalsAndProducts() {
  try {
    console.log('🔍 Adding missing canonicals and products...\n');

    // List of missing canonicals and their pure products
    const missingItems = [
      // Yeast and baking
      { canonical: 'rapidrise yeast', products: ['rapidrise yeast'] },
      { canonical: 'bread crumbs', products: ['bread crumbs'] },
      { canonical: 'condensed cream of chicken soup', products: ['condensed cream of chicken soup'] },
      { canonical: 'flavor gelatin', products: ['flavor gelatin'] },
      { canonical: 'andouille sausage', products: ['andouille sausage'] },
      { canonical: 'breaded chicken', products: ['breaded chicken'] },
      { canonical: 'masa flour', products: ['masa flour'] },
      { canonical: 'corn oil', products: ['corn oil'] },
      { canonical: 'vegetable chips', products: ['vegetable chips'] },
      { canonical: 'tomato wedges', products: ['tomato wedges'] },
      { canonical: 'cheddar cheese', products: ['cheddar cheese'] },
      { canonical: 'angel hair cabbage', products: ['angel hair cabbage'] },
      { canonical: 'seasoned vinegar', products: ['seasoned vinegar'] },
      { canonical: 'taco seasoning', products: ['taco seasoning'] },
      { canonical: 'carrots cut crosswise', products: ['carrots cut crosswise'] },
      { canonical: 'potatoes cut lengthwise', products: ['potatoes cut lengthwise'] },
      
      // Core ingredients that might be missing
      { canonical: 'black pepper', products: ['black pepper'] },
      { canonical: 'all-purpose flour', products: ['all-purpose flour'] },
      { canonical: 'large eggs', products: ['large eggs'] },
      { canonical: 'whole milk', products: ['whole milk'] },
      { canonical: 'cream cheese', products: ['cream cheese'] },
      { canonical: 'shrimp', products: ['shrimp'] },
      { canonical: 'sesame seeds', products: ['sesame seeds'] },
      { canonical: 'green peas', products: ['green peas'] },
      { canonical: 'kidney beans', products: ['kidney beans'] },
      { canonical: 'peaches', products: ['peaches'] },
      { canonical: 'ground cinnamon', products: ['ground cinnamon'] },
      { canonical: 'bay leaves', products: ['bay leaves'] },
      { canonical: 'shallots', products: ['shallots'] },
      { canonical: 'leeks', products: ['leeks'] },
      { canonical: 'parsnips', products: ['parsnips'] },
      { canonical: 'turnips', products: ['turnips'] },
      { canonical: 'radishes', products: ['radishes'] },
      { canonical: 'beets', products: ['beets'] },
      { canonical: 'yams', products: ['yams'] },
      { canonical: 'brussels sprouts', products: ['brussels sprouts'] },
      { canonical: 'butter lettuce', products: ['butter lettuce'] },
      { canonical: 'romaine lettuce', products: ['romaine lettuce'] },
      { canonical: 'iceberg lettuce', products: ['iceberg lettuce'] }
    ];

    let addedCanonicals = 0;
    let addedProducts = 0;

    for (const item of missingItems) {
      try {
        // Check if canonical already exists
        let canonical = await CanonicalIngredient.findOne({
          where: { name: item.canonical }
        });

        if (!canonical) {
          canonical = await CanonicalIngredient.create({
            name: item.canonical,
            canonicalTag: true,
            canonicalTagConfidence: 0.9
          });
          addedCanonicals++;
          console.log(`✅ Added canonical: ${item.canonical}`);
        }

        // Add products for this canonical
        for (const productName of item.products) {
          const existingProduct = await Food.findOne({
            where: { description: productName }
          });

          if (!existingProduct) {
            await Food.create({
              description: productName,
              canonicalTag: item.canonical,
              canonicalTagConfidence: 0.9,
              isPureProduct: true
            });
            addedProducts++;
            console.log(`  ✅ Added product: ${productName}`);
          }
        }
      } catch (error) {
        console.log(`❌ Error adding ${item.canonical}: ${error.message}`);
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

addMissingCanonicalsAndProducts(); 