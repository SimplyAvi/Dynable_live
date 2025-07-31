// Shared utility to robustly clean ingredient names for mapping
module.exports = function cleanIngredientName(raw) {
  if (!raw) return '';
  let cleaned = raw.toLowerCase();
  // Remove parenthetical and bracketed content
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  cleaned = cleaned.replace(/\[[^\]]*\]/g, '');

  // Remove numbers (but not ingredient words)
  cleaned = cleaned.replace(/\b\d+(\.\d+)?\b/g, '');

  // Remove measurement units and packaging words (EXCLUDE ingredient names like rice, cloves, shrimp, crab, zest, lobster, seed, sprig)
  cleaned = cleaned.replace(/\b(inch|inches|cm|mm|oz|lb|g|kg|package|can|bottle|bag|box|container|packet|envelope|sheet|loaf|stick|clove|head|bunch|piece|drop|ear|stalk|strip|cube|block|bar|fillet|filet|link|drumstick|wing|leg|thigh|breast|rib|loin|chop|steak|roast|shank|shoulder|neck|tail|foot|tongue|cheek|snout|jowl|hock|trotter|knuckle|tip|bone|skin|fat|marrow|liver|gizzard|heart|kidney|tripe|sweetbread|testicle|oyster|clam|mussel|scallop|prawn|crab|lobster|roe|yolk|white|shell|meat|muscle|tendon|cartilage|gristle|sinew|membrane|fatback|crackling|rind|peel|pith|core|pit|stone|pod)\b/gi, '');

  // Remove leading slashes and common measurement patterns
  cleaned = cleaned.replace(/^\/\s*/, '');
  cleaned = cleaned.replace(/\s*\/\s*/, ' ');

  // Remove brand names and trademark symbols (but keep the actual food)
  cleaned = cleaned.replace(/\b(pure®|fleischmann's®|campbell's®|johnsonville®|mazola®|pace)\b/gi, '');
  cleaned = cleaned.replace(/®/g, '');
  cleaned = cleaned.replace(/\bjell-o\b/gi, '');

  // Handle specific problematic patterns
  cleaned = cleaned.replace(/\b(fully|recipe a single|of)\b/gi, '');
  cleaned = cleaned.replace(/\b(into|crosswise|lengthwise)\b/gi, '');

  // Remove extra punctuation and whitespace
  cleaned = cleaned.replace(/[.,;:!\-]+/g, ' ');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.trim();

  // Remove leading numbers, fractions, and slashes (e.g., '1/2', '2', '/ cups')
  cleaned = cleaned.replace(/^(\s*[\d\/\.]+\s*)+/, '');
  cleaned = cleaned.replace(/^\s*\/\s*/, '');

  // Remove measurement units and packaging words at the start (EXCLUDE ingredient names)
  cleaned = cleaned.replace(/^(cups?|tablespoons?|tbsp|teaspoons?|tsp|envelopes?|ounces?|oz|pounds?|lb|lbs?|grams?|g|kilograms?|kg|liters?|l|milliliters?|ml|packages?|cans?|containers?|sheets?|loaves?|sticks?|cloves?|heads?|bunches?|sprigs?|pieces?|drops?|ears?|stalks?|strips?|cubes?|blocks?|bars?|fillets?|filets?|links?|drumsticks?|wings?|legs?|thighs?|breasts?|ribs?|loins?|chops?|steaks?|roasts?|shanks?|shoulders?|necks?|tails?|feet?|tongues?|cheeks?|snouts?|jowls?|hocks?|trotters?|knuckles?|tips?|bones?|skins?|fats?|marrow|livers?|gizzards?|hearts?|kidneys?|tripes?|sweetbreads?|testicles?|oysters?|clams?|mussels?|scallops?|shrimps?|prawns?|crabs?|lobsters?|crawfishes?|fishes?|roes?|yolks?|whites?|shells?|meats?|muscles?|tendons?|cartilages?|gristles?|sinews?|membranes?|fatbacks?|cracklings?|rinds?|peels?|zests?|piths?|cores?|pits?|seeds?|stones?|pods?|beans?|peas?|lentils?|chickpeas?|splits?|grains?|rices?|barleys?|oats?|corns?|millets?|sorghums?|teffs?|quinoas?|buckwheats?|amaranths?|spelts?|kamuts?|triticales?|farros?|freekehs?|bulgurs?|couscous|semolina|durum|graham)\b[\s,\-]*/i, '');

  // Remove any remaining numbers, fractions, or slashes anywhere
  cleaned = cleaned.replace(/[\d\/\.]+/g, '');

  // Remove descriptors and stopwords as separate words only (EXCLUDE rice, cloves, shrimp, crab, zest, lobster, seed, sprig)
  // Expanded descriptors and action words for aggressive cleaning
  const descriptors = [
    'large', 'small', 'medium', 'whole', 'extra large', 'extra small', 'thin', 'thick', 'lean', 'fatty', 'boneless', 'skinless', 'bone-in',
    'with skin', 'without skin', 'with bone', 'without bone', 'center cut', 'end cut', 'trimmed', 'untrimmed', 'pitted', 'unpitted', 'seedless',
    'with seeds', 'without seeds', 'cored', 'uncored', 'stemmed', 'destemmed', 'deveined', 'unveined', 'cleaned', 'uncleaned', 'split', 'unsplit',
    'shelled', 'unshelled', 'hulled', 'unhulled', 'generous', 'for serving', 'for garnish', 'for frying', 'for greasing', 'for dusting',
    'for coating', 'for topping', 'for decoration', 'for drizzling', 'for brushing', 'for dipping', 'for the pan', 'for pan', 'garnish', 'serving',
    'frying', 'greasing', 'dusting', 'coating', 'topping', 'decoration', 'drizzling', 'brushing', 'dipping', 'pan', 'very', 'cut up', 'cut into',
    'filling', 'mix', 'freshly', 'fresh', 'ground', 'minced', 'diced', 'sliced', 'chopped', 'crushed', 'grated', 'shredded', 'cubed', 'julienned',
    'pureed', 'mashed', 'whipped', 'beaten', 'separated', 'room temperature', 'cold', 'hot', 'warm', 'frozen', 'canned', 'dried', 'dehydrated',
    'smoked', 'roasted', 'toasted', 'fried', 'baked', 'grilled', 'steamed', 'optional', 'to taste', 'about', 'as needed', 'plus more', 'divided',
    'prepared', 'combined', 'mixed', 'blended', 'powdered', 'crumbled', 'broken', 'pieces', 'chunks', 'strips', 'sticks', 'spears', 'tips', 'ends',
    'and', 'or', 'and/or', 'such as', 'like', 'including', 'style', 'type', 'brand', 'variety', 'form', 'flavor', 'spray', 'pinch',
    // Aggressive action/prep words:
    'thawed', 'chilled', 'peeled', 'drained', 'melted', 'softened', 'cut', 'finely', 'thinly', 'halves', 'wedges', 'more', 'plus', 'superfine',
    'unsalted', 'salted', 'ripe', 'raw', 'cooked', 'ends', 'tips', 'whole', 'squeezed', 'zested', 'seeded', 'quartered', 'smashed', 'rinsed', 'sifted', 'beaten', 'crumbled', 'mashed', 'shelled', 'shredded', 'sliced', 'diced', 'chopped', 'minced', 'grated', 'crushed', 'pressed', 'julienned', 'cubed', 'broken', 'torn', 'split', 'uncooked', 'unpeeled', 'untrimmed', 'unseeded', 'unrinsed', 'unblanched', 'unroasted', 'unbaked', 'unfried', 'unsteamed', 'unseasoned', 'unflavored', 'unmarinated', 'unmixed', 'unblended', 'unmashed', 'unshredded', 'uncrumbled', 'unbeaten', 'unwhipped', 'unseparated', 'unpowdered', 'uncrumbled', 'unbroken', 'uncrushed', 'ungrated', 'unminced', 'unchopped', 'unsliced', 'undiced', 'unjulienned', 'uncubed', 'untorn', 'unsplit'
  ];
  descriptors.forEach(desc => {
    const regex = new RegExp(`\\b${desc.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.trim();

  // Normalization dictionary for common variants (expanded for top unmapped cases)
  const normalizationDict = {
    'all purpose flour': 'flour',
    'bread flour': 'flour',
    'cake flour': 'flour',
    'self rising flour': 'flour',
    'whole wheat flour': 'flour',
    'brown sugar': 'sugar',
    'granulated sugar': 'sugar',
    'powdered sugar': 'sugar',
    'confectioners sugar': 'sugar',
    'extra virgin olive oil': 'olive oil',
    'olive oil': 'olive oil',
    'canola oil': 'oil',
    'vegetable oil': 'oil',
    'sea salt': 'salt',
    'kosher salt': 'salt',
    'butter softened': 'butter',
    'butter melted': 'butter',
    'unsalted butter': 'butter',
    'unsalted butter softened': 'butter',
    'eggs lightly': 'eggs',
    'egg lightly': 'egg',
    'golden brown sugar': 'sugar',
    'packed light brown sugar': 'sugar',
    'packed brown sugar': 'sugar',
    'light brown sugar': 'sugar',
    'dark brown sugar': 'sugar',
    'garlic peeled': 'garlic',
    'garlic finely': 'garlic',
    'garlic cloves finely': 'garlic',
    'onion thinly': 'onion',
    'red onion thinly': 'onion',
    'yellow onion thinly': 'onion',
    'finely lemon zest': 'lemon zest',
    'lemon zest finely': 'lemon zest',
    'sifted all purpose flour': 'flour',
    'sifted flour': 'flour',
    'graham cracker crumbs': 'graham cracker',
    'cream of mushroom soup': 'cream of mushroom soup',
    'condensed cream mushroom soup': 'cream of mushroom soup',
    'condensed cream chicken soup': 'cream of chicken soup',
    'low salt chicken broth': 'chicken broth',
    'low sodium chicken broth': 'chicken broth',
    'chicken cut': 'chicken',
    'cooked chicken': 'chicken',
    'shrimp peeled': 'shrimp',
    'shrimp deveined': 'shrimp',
    'shrimp peeled deveined': 'shrimp',
    'mushrooms': 'mushroom',
    'peas': 'pea',
    'black beans rinsed drained': 'black beans',
    'pineapple drained': 'pineapple',
    'unsalted butter cut': 'butter',
    'butter cut': 'butter',
    'yellow mustard': 'mustard',
    'blue cheese': 'cheese',
    'instant vanilla pudding': 'vanilla pudding',
    'yellow cake': 'cake',
    'cornmeal': 'cornmeal', // keep as is, but included for clarity
    'dill weed': 'dill',
    'cream tartar': 'cream of tartar',
    'finely onion': 'onion',
    'finely chopped onion': 'onion',
    'finely chopped garlic': 'garlic',
    'finely chopped parsley': 'parsley',
    'finely chopped cilantro': 'cilantro',
    'finely chopped walnuts': 'walnuts',
    'finely chopped pecans': 'pecans',
    'finely chopped basil': 'basil',
    'finely chopped ginger': 'ginger',
    'finely chopped dill': 'dill',
    'finely chopped mint': 'mint',
    'finely chopped rosemary': 'rosemary',
    'finely chopped thyme': 'thyme',
    'finely chopped sage': 'sage',
    'finely chopped chives': 'chives',
    'finely chopped scallions': 'scallions',
    'finely chopped shallots': 'shallots',
    'finely chopped celery': 'celery',
    'finely chopped carrot': 'carrot',
    'finely chopped bell pepper': 'bell pepper',
    'finely chopped red pepper': 'red pepper',
    'finely chopped green pepper': 'green pepper',
    'finely chopped jalapeno': 'jalapeno',
    'finely chopped chili': 'chili',
    'finely chopped tomato': 'tomato',
    'finely chopped cucumber': 'cucumber',
    'finely chopped zucchini': 'zucchini',
    'finely chopped squash': 'squash',
    'finely chopped eggplant': 'eggplant',
    'finely chopped spinach': 'spinach',
    'finely chopped kale': 'kale',
    'finely chopped arugula': 'arugula',
    'finely chopped lettuce': 'lettuce',
    'finely chopped cabbage': 'cabbage',
    'finely chopped broccoli': 'broccoli',
    'finely chopped cauliflower': 'cauliflower',
    'finely chopped mushroom': 'mushroom',
    'finely chopped apple': 'apple',
    'finely chopped pear': 'pear',
    'finely chopped peach': 'peach',
    'finely chopped plum': 'plum',
    'finely chopped apricot': 'apricot',
    'finely chopped cherry': 'cherry',
    'finely chopped grape': 'grape',
    'finely chopped orange': 'orange',
    'finely chopped lemon': 'lemon',
    'finely chopped lime': 'lime',
    'finely chopped pineapple': 'pineapple',
    'finely chopped mango': 'mango',
    'finely chopped papaya': 'papaya',
    'finely chopped melon': 'melon',
    'finely chopped watermelon': 'watermelon',
    'finely chopped cantaloupe': 'cantaloupe',
    'finely chopped honeydew': 'honeydew',
    'finely chopped berry': 'berry',
    'finely chopped strawberry': 'strawberry',
    'finely chopped blueberry': 'blueberry',
    'finely chopped raspberry': 'raspberry',
    'finely chopped blackberry': 'blackberry',
    'finely chopped cranberry': 'cranberry',
    'finely chopped date': 'date',
    'finely chopped fig': 'fig',
    'finely chopped raisin': 'raisin',
    'finely chopped nut': 'nut',
    'finely chopped almond': 'almond',
    'finely chopped cashew': 'cashew',
    'finely chopped hazelnut': 'hazelnut',
    'finely chopped macadamia': 'macadamia',
    'finely chopped pecan': 'pecan',
    'finely chopped pistachio': 'pistachio',
    'finely chopped walnut': 'walnut',
    'cream cheese softened': 'cream cheese',
    'unsalted butter melted': 'butter',
    'onion finely': 'onion',
    'yellow onion': 'onion',
    'red onion': 'onion',
    'peeled ginger': 'ginger',
    'jalapeno pepper seeded': 'jalapeno',
    'avocado peeled': 'avocado',
    'pumpkin puree': 'pumpkin',
    'corn kernels': 'corn',
    'cooked ham': 'ham',
    'unbleached all purpose flour': 'flour',
    'light corn syrup': 'corn syrup',
    'dry onion soup': 'onion soup',
    'vanilla pudding': 'pudding',
    'cream of chicken soup': 'cream of chicken soup',
    'black beans': 'beans',
    'green beans': 'beans',
    'pea': 'peas',
    'taco seasoning': 'seasoning',
    'coarse kosher salt': 'salt',
    'slices bacon': 'bacon',
    'salt black pepper': 'salt and pepper',
    'salt pepper': 'salt and pepper',
    'packed dark brown sugar': 'brown sugar',
    'firmly packed brown sugar': 'brown sugar',
    'crystallized ginger': 'ginger',
    'liquid smoke flavoring': 'liquid smoke',
    'old fashioned oats': 'oats',
    'panko bread crumbs': 'panko',
    'artichoke hearts': 'artichoke',
    'red food coloring': 'food coloring',
    'lemon pepper': 'lemon pepper',
    'rice wine vinegar': 'rice vinegar',
    'red cabbage': 'cabbage',
    'fennel bulb': 'fennel',
    'button mushrooms': 'mushroom',
    'baby spinach leaves': 'spinach',
    'butter cooled': 'butter',
    'tablespoons sugar': 'sugar',
    'gingerroot': 'ginger',
    'sun tomatoes': 'sun-dried tomato',
    'hard boiled eggs': 'egg',
    'pineapple with juice': 'pineapple',
    'bittersweet semisweet chocolate': 'chocolate',
    'italian seasoned bread crumbs': 'bread crumbs',
    'brown sugar': 'sugar',
    'butter margarine': 'butter',
    'butter at': 'butter',
    'tortillas': 'tortilla',
    'oats': 'oat',
    'tomatoes with green chile peppers': 'tomato',
    'coarsely black pepper': 'black pepper',
    'onion coarsely': 'onion',
    'semi sweet chocolate chips': 'chocolate chips',
    'soft goat cheese': 'goat cheese',
    'green cabbage': 'cabbage',
    'tomatoes with juice': 'tomato',
  };
  if (normalizationDict.hasOwnProperty(cleaned)) {
    cleaned = normalizationDict[cleaned];
  }

  // Final cleanup - remove any remaining leading/trailing commas or dashes
  cleaned = cleaned.replace(/^[,\-\s]+/, '');
  cleaned = cleaned.replace(/[,\-\s]+$/, '');

  return cleaned;
}; 