const cleanIngredientName = require('./scripts/data-processing/cleanIngredientName');

const testRecipeIngredients = [
  'pure® cooking spray',
  'fleischmann\'s® rapidrise yeast',
  'olive oil, , plus more',
  'very water',
  'chicken breast, cut up',
  'water )',
  'cherry filling',
  'kosher salt, , plus more',
  'dry crumbs',
  'mazola® corn oil',
  'campbell\'s® cream of mushroom soup',
  'johnsonville® italian sausage',
  'jell-o strawberry gelatin',
  'shrimp, or , chicken breast, -inch',
  'fully , breaded chicken',
  'masa flour or meal',
  'mazola oil',
  'chips or vegetables',
  'tomato, wedges',
  'cheese, such as cheddar',
  'angel hair-style cabbage',
  'seasoned vinegar',
  'recipe a single -inch crust',
  'peach, into',
  'pace taco seasoning',
  'carrots, cut crosswise into -inch',
  'potatoes, lengthwise cut crosswise into -inch',
  'of celery, cut crosswise into -inch',
  'jell-o strawberry gelatin',
  'campbell\'s condensed cream of chicken soup',
  'johnsonville andouille dinner sausage, -inch',
  '/ cups all purpose flour',
  '/ teaspoons kosher salt',
  'envelopes fleischmann\'s rapidrise yeast',
  'campbell\'s condensed cream mushroom soup',
  '/ pounds',
  'frozen pound cake thawed',
  'ounce baker\'s semi sweet chocolate',
  '/ cups cherry pie',
  'ounces raw peeled and',
  'packages cream cheese softened',
  'cans sweetened condensed milk'
];

console.log('Testing improved cleaning function:\n');

testRecipeIngredients.forEach(ingredient => {
  const cleaned = cleanIngredientName(ingredient);
  console.log(`Original: '${ingredient}'`);
  console.log(`Cleaned: '${cleaned}'`);
  console.log('---');
}); 