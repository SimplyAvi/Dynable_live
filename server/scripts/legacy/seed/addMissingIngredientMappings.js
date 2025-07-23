const { IngredientToCanonical, Ingredient } = require('../db/models');

const newRecipeIngredients = [
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
];

async function addMissingIngredientMappings() {
  let added = 0;
  for (const name of newRecipeIngredients) {
    const canonical = await Ingredient.findOne({ where: { name } });
    if (canonical) {
      await IngredientToCanonical.findOrCreate({
        where: { messyName: name },
        defaults: { IngredientId: canonical.id }
      });
      console.log(`✅ Mapped: '${name}' → '${name}'`);
      added++;
    } else {
      console.log(`❌ Canonical ingredient not found for: '${name}'`);
    }
  }
  console.log(`\nSummary: Added ${added} new ingredient-to-canonical mappings.`);
}

addMissingIngredientMappings(); 