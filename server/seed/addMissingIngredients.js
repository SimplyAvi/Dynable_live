const { CanonicalIngredient, IngredientToCanonical } = require('../db/models');
const sequelize = require('../db/database');

const newIngredients = [
  'ground cinnamon',
  'baking powder',
  'parmesan cheese',
  'garlic',
  'paprika',
  'garlic powder',
  'ground black pepper',
  'vanilla extract',
  'curry paste',
  'extra virgin olive oil',
  'dried oregano',
  'red bell pepper',
  'unsalted butter',
  'heavy cream',
  'baking soda',
  'lemon juice',
  'sour cream',
  'confectioners\' sugar',
  'chopped walnuts',
  'vegetable oil',
  'brown sugar',
  'dark rum',
  'ground ginger',
  'olive oil or chicken fat',
  'brisket of beef',
  'ground allspice',
  'tomato puree',
  'beef stock',
  'yellow onions',
  'ground cloves',
  'nutmeg',
  'fresh ginger root',
  'tamarind juice',
  'curry leaves',
  'whole cloves',
  'chopped shallots',
  'packed brown sugar',
  'to taste',
  'and pepper to taste',
  'baking spices',
  'barbecue sauce',
  'soy sauce',
  'liquid smoke',
  'beef consomme',
  'penne pasta',
  'orange marmalade',
  'orange zest',
  'shortening',
  'orange juice',
  'sun-dried tomatoes',
  'dried apricots',
  'pine nuts',
  'honey',
  'tomato',
  'jalapeño',
  'cilantro',
  'corn syrup',
  'chocolate',
  'almond extract',
  'mustard',
  // Final batch to complete backend
  'white vinegar',
  'cider vinegar',
  'apple cider vinegar',
  'worcestershire sauce',
  'vodka',
  'granny smith apples',
  'apple pie spice',
  'cinnamon',
  'rhubarb',
  'cornstarch',
  'vanilla ice cream',
  'pastry dough',
  'raspberries',
  'blueberries',
  'chicken breast',
  'kosher salt',
  'cayenne pepper',
  'freshly ground black pepper',
  'chipotle pepper',
  'rolled oats',
  'candy-coated chocolate pieces',
  'margarine',
  'light brown sugar',
  'semisweet chocolate chips',
  'dried thyme',
  'brown lentils',
  'pearl barley',
  'currants',
  'currant jelly',
  'ground mace',
  'sea salt',
  'cheese culture',
  'rennet',
  'chloride',
];

async function addMissingIngredients() {
    console.log('➕ Adding Missing Ingredients to Canonical Database\n');

    try {
        await sequelize.sync({ force: false });

        let addedCount = 0;
        let skippedCount = 0;

        for (const name of newIngredients) {
            // Check if ingredient already exists
            const existing = await CanonicalIngredient.findOne({
                where: { name }
            });

            if (existing) {
                console.log(`⚠️  Skipping ${name} - already exists`);
                skippedCount++;
            } else {
                // Add the ingredient
                const newIngredient = await CanonicalIngredient.create({
                    name
                });
                console.log(`✅ Added: ${name}`);
                addedCount++;

                // Add mappings for the aliases
                await IngredientToCanonical.findOrCreate({
                    where: { messyName: name.toLowerCase() },
                    defaults: { CanonicalIngredientId: newIngredient.id }
                });
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`✅ Added: ${addedCount} ingredients`);
        console.log(`⚠️  Skipped: ${skippedCount} ingredients (already existed)`);

        // Verify the additions
        console.log(`\n🔍 Verifying additions...`);
        const allIngredients = await CanonicalIngredient.findAll();
        console.log(`Total canonical ingredients: ${allIngredients.length}`);

        // Show the newly added ingredients
        const newIngredientNames = newIngredients;
        console.log(`\n📋 Newly added ingredients:`);
        for (const name of newIngredientNames) {
            const match = allIngredients.find(ci => ci.name === name);
            if (match) {
                console.log(`   ✅ ${name}: ${match.aliases?.join(', ') || 'no aliases'}`);
            } else {
                console.log(`   ❌ ${name}: Not found`);
            }
        }

        console.log('\n🎉 Missing ingredients addition complete!');
        console.log('Now run the canonical tag suggestion script again to tag products with these ingredients.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
    }
}

addMissingIngredients(); 