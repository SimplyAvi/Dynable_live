const { IngredientToCanonical, CanonicalIngredient } = require('../db/models');
const fs = require('fs');

// Enhanced cleaning function to normalize ingredient variants
function cleanIngredientName(raw) {
  if (!raw) return '';
  let cleaned = raw.toLowerCase();
  cleaned = cleaned.replace(/\([^)]*\)/g, ''); // remove parentheticals
  cleaned = cleaned.replace(/optional|such as.*?\(.*?\)/g, ''); // remove optional text
  cleaned = cleaned.replace(/(^|\s)(\d+[\/\d]*\s*)/g, ' '); // remove numbers/fractions at start or after space
  cleaned = cleaned.replace(/(?<=\s|^)(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lb|grams?|kilograms?|kg|liters?|l|milliliters?|ml|package|can|container|envelope|slice|loaf|pinch|dash|quart|qt|pint|pt|gallon|gal|stick|clove|head|bunch|sprig|piece|sheet|bag|bottle|jar|box|packet|drop|ear|stalk|strip|cube|block|bar|fluid ounces?|fl oz)(?=\s|$)/g, '');
  cleaned = cleaned.replace(/\b(sliced|chopped|fresh|dried|mild|to taste|and|drained|rinsed|peeled|seeded|halved|quartered|shredded|grated|zested|minced|mashed|crushed|diced|cubed|julienned|optional|with juice|with syrup|with liquid|in juice|in syrup|in liquid|powdered|sweetened|unsweetened|raw|cooked|baked|roasted|steamed|boiled|fried|blanched|toasted|softened|melted|room temperature|cold|warm|hot|refrigerated|frozen|thawed|defrosted|prepared|beaten|whipped|stiff|soft|firm|fine|coarse|crumbled|broken|pieces|chunks|strips|sticks|spears|tips|ends|whole|large|small|medium|extra large|extra small|thin|thick|lean|fatty|boneless|skinless|bone-in|with skin|without skin|with bone|without bone|center cut|end cut|trimmed|untrimmed|pitted|unpitted|seedless|with seeds|without seeds|cored|uncored|stemmed|destemmed|deveined|unveined|cleaned|uncleaned|split|unsplit|shelled|unshelled|hulled|unhulled|deveined|unveined|deveined|unveined|deveined|unveined|generous|about|approximately|or more|as needed|for serving|for garnish)\b/g, '');
  cleaned = cleaned.replace(/\b(leaves?|slices?|pieces?|chunks?|strips?|sticks?|spears?|tips?|ends?)\b/g, '');
  cleaned = cleaned.replace(/\b(yellow|white|black|red|green|orange|purple|brown|golden|pink|blue|rainbow)\b/g, '');
  cleaned = cleaned.replace(/,\s*$/, ''); // remove trailing commas
  cleaned = cleaned.replace(/^\s*,\s*/, ''); // remove leading commas
  cleaned = cleaned.replace(/\s{2,}/g, ' '); // collapse spaces
  cleaned = cleaned.trim();
  return cleaned;
}

// Expanded canonical map with more variants
const canonicalMap = {
  // Basic ingredients
  'salt': 'salt',
  'sugar': 'sugar',
  'egg': 'egg, chicken',
  'eggs': 'egg, chicken',
  'milk': 'milk, cow',
  'flour': 'flour, wheat',
  'all-purpose flour': 'flour, wheat',
  'bread flour': 'flour, wheat',
  'wheat flour': 'flour, wheat',
  'butter': 'butter',
  'oil': 'olive oil',
  'olive oil': 'olive oil',
  'canola oil': 'canola oil',
  'vegetable oil': 'vegetable oil',
  'cheddar cheese': 'cheese, cheddar',
  'mozzarella cheese': 'mozzarella cheese',
  'yogurt': 'yogurt',
  'cream': 'cream',
  'mayonnaise': 'mayonnaise',
  'peanut butter': 'peanut',
  'peanuts': 'peanut',
  'almonds': 'almond',
  'almond': 'almond',
  'cashew': 'cashew',
  'walnut': 'walnut',
  'shrimp': 'shrimp',
  'crab': 'crab',
  'lobster': 'lobster',
  'salmon': 'salmon',
  'tuna': 'tuna',
  'soy': 'soybean',
  'tofu': 'tofu',
  'sesame': 'sesame',
  'water': 'water',
  'rice': 'rice',
  'rice flour': 'rice flour',
  'oat flour': 'oat flour',
  'coconut flour': 'coconut flour',
  'almond flour': 'almond flour',
  'coconut milk': 'coconut milk',
  'oat milk': 'oat milk',
  'soy milk': 'soy milk',
  'almond milk': 'almond milk',
  'banana': 'banana',
  'applesauce': 'applesauce',
  'chia seeds': 'chia egg',
  'flaxseed': 'flax egg',
  'flax seed': 'flax egg',
  'chickpeas': 'chickpeas',
  'lentils': 'lentils',
  'poppy seeds': 'poppy seeds',
  'pumpkin seeds': 'pumpkin seeds',
  'sunflower seeds': 'sunflower seeds',
  'sunflower seed butter': 'sunflower seed butter',
  'soy nut butter': 'soy nut butter',
  'tempeh': 'tempeh',
  'seitan': 'seitan',
  'jackfruit': 'jackfruit',
  'psyllium husk': 'psyllium husk',
  'gluten-free flour blend': 'gluten-free flour blend',
  'gluten free flour blend': 'gluten-free flour blend',
  'gf flour blend': 'gluten-free flour blend',
  'gluten-free bread': 'gluten-free bread',
  'rice cakes': 'rice cakes',
  'vegan cheddar': 'vegan cheddar',
  'vegan mozzarella': 'vegan mozzarella',
  'nutritional yeast': 'nutritional yeast',
  'coconut yogurt': 'coconut yogurt',
  'coconut oil': 'coconut oil',
  
  // New additions from previous round
  'ground cinnamon': 'ground cinnamon',
  'baking powder': 'baking powder',
  'parmesan cheese': 'parmesan cheese',
  'garlic': 'garlic',
  'paprika': 'paprika',
  'garlic powder': 'garlic powder',
  'ground black pepper': 'ground black pepper',
  'vanilla extract': 'vanilla extract',
  'curry paste': 'curry paste',
  'extra virgin olive oil': 'extra virgin olive oil',
  'dried oregano': 'dried oregano',
  'red bell pepper': 'red bell pepper',
  'unsalted butter': 'unsalted butter',
  'heavy cream': 'heavy cream',
  'baking soda': 'baking soda',
  'lemon juice': 'lemon juice',
  'sour cream': 'sour cream',
  'confectioners sugar': 'confectioners\' sugar',
  'chopped walnuts': 'chopped walnuts',
  'vegetable oil': 'vegetable oil',
  'brown sugar': 'brown sugar',
  'dark rum': 'dark rum',
  'ground ginger': 'ground ginger',
  'olive oil or chicken fat': 'olive oil or chicken fat',
  'brisket of beef': 'brisket of beef',
  'ground allspice': 'ground allspice',
  'tomato puree': 'tomato puree',
  'beef stock': 'beef stock',
  'yellow onions': 'yellow onions',
  'ground cloves': 'ground cloves',
  'nutmeg': 'nutmeg',
  'fresh ginger root': 'fresh ginger root',
  'tamarind juice': 'tamarind juice',
  'curry leaves': 'curry leaves',
  'whole cloves': 'whole cloves',
  'chopped shallots': 'chopped shallots',
  'packed brown sugar': 'packed brown sugar',
  'to taste': 'to taste',
  'and pepper to taste': 'and pepper to taste',
  'baking spices': 'baking spices',
  
  // New variants from latest audit
  'fresh lemon juice': 'lemon juice',
  'barbecue sauce': 'barbecue sauce',
  'garlic chopped': 'garlic',
  'beef brisket': 'brisket of beef',
  'soy sauce': 'soy sauce',
  'liquid smoke': 'liquid smoke',
  'beef consomme': 'beef consomme',
  'white onion': 'yellow onions',
  'green bell pepper': 'red bell pepper',
  'penne pasta': 'penne pasta',
  'sliced almonds': 'almond',
  'sifted confectioners sugar': 'confectioners\' sugar',
  'orange marmalade': 'orange marmalade',
  'finely chopped almonds': 'almond',
  'grated orange zest': 'orange zest',
  'ground cloves': 'ground cloves',
  'ground nutmeg': 'nutmeg',
  'shortening': 'shortening',
  'orange juice': 'orange juice',
  'sun-dried tomatoes': 'sun-dried tomatoes',
  'chopped dried apricots': 'dried apricots',
  'pine nuts': 'pine nuts',
  'honey': 'honey',
  'chopped seeded plum tomatoes': 'tomato',
  'minced peeled fresh ginger': 'fresh ginger root',
  'chopped jalapeño chili': 'jalapeño',
  'chopped white onion': 'yellow onions',
  'chopped fresh cilantro': 'cilantro',
  'confectioners sugar sifted': 'confectioners\' sugar',
  'light corn syrup': 'corn syrup',
  'unsweetened chocolate': 'chocolate',
  'almond extract': 'almond extract',
  'dijon mustard': 'mustard',
  'grated parmesan cheese': 'parmesan cheese',
  // Final batch mappings
  'white vinegar': 'white vinegar',
  'cider vinegar': 'cider vinegar',
  'apple cider vinegar': 'apple cider vinegar',
  'worcestershire sauce': 'worcestershire sauce',
  'vodka': 'vodka',
  'granny smith apples': 'granny smith apples',
  'apple pie spice': 'apple pie spice',
  'cinnamon': 'cinnamon',
  'rhubarb': 'rhubarb',
  'cornstarch': 'cornstarch',
  'vanilla ice cream': 'vanilla ice cream',
  'pastry dough': 'pastry dough',
  'raspberries': 'raspberries',
  'blueberries': 'blueberries',
  'chicken breast': 'chicken breast',
  'kosher salt': 'kosher salt',
  'cayenne pepper': 'cayenne pepper',
  'freshly ground black pepper': 'freshly ground black pepper',
  'chipotle pepper': 'chipotle pepper',
  'rolled oats': 'rolled oats',
  'candy-coated chocolate pieces': 'candy-coated chocolate pieces',
  'margarine': 'margarine',
  'light brown sugar': 'light brown sugar',
  'semisweet chocolate chips': 'semisweet chocolate chips',
  'dried thyme': 'dried thyme',
  'brown lentils': 'brown lentils',
  'pearl barley': 'pearl barley',
  'currants': 'currants',
  'currant jelly': 'currant jelly',
  'ground mace': 'ground mace',
  'sea salt': 'sea salt',
  'cheese culture': 'cheese culture',
  'rennet': 'rennet',
  'chloride': 'chloride',
};

async function autoMapAndAddIngredientMappings() {
  const lines = fs.readFileSync('unmapped_ingredients.txt', 'utf-8').split('\n');
  let added = 0;
  let skipped = 0;
  for (const messy of lines) {
    const cleaned = cleanIngredientName(messy);
    const canonicalName = canonicalMap[cleaned];
    if (canonicalName) {
      const canonical = await CanonicalIngredient.findOne({ where: { name: canonicalName } });
      if (canonical) {
        await IngredientToCanonical.findOrCreate({
          where: { messyName: messy },
          defaults: { CanonicalIngredientId: canonical.id }
        });
        console.log(`✅ Mapped: '${messy}' → '${canonicalName}'`);
        added++;
      } else {
        console.log(`❌ Canonical ingredient not found for: '${canonicalName}'`);
        skipped++;
      }
    } else {
      skipped++;
    }
  }
  console.log(`\nSummary: Added ${added} mappings, Skipped ${skipped}`);
}

autoMapAndAddIngredientMappings(); 