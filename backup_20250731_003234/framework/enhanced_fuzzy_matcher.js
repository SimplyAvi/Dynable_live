const fs = require('fs');
const path = require('path');
const fuzzball = require('fuzzball');
const pluralize = require('pluralize');
const { IngredientToCanonical } = require('./db/models');
const Ingredient = require('./db/models/Ingredient');

// Manual alias map for common patterns
const MANUAL_ALIASES = {
  'red bell pepper': 'bell pepper',
  'red bell peppers': 'bell pepper',
  'ground beef': 'beef',
  'pounds ground beef*': 'beef',
  'vegetable oil': 'oil',
  'canola oil': 'oil',
  'olive oil': 'oil',
  'large red bell pepper': 'bell pepper',
  'large red bell peppers': 'bell pepper',
  'medium red bell peppers': 'bell pepper',
  'small red bell peppers': 'bell pepper',
  'large bell peppers': 'bell pepper',
  'medium onion': 'onion',
  'large tomato': 'tomato',
  'tomatoes': 'tomato',
  'eggs': 'egg',
  'limes': 'lime',
  'lemons': 'lemon',
  'onions': 'onion',
  'peppers': 'pepper',
  'potatoes': 'potato',
  'carrots': 'carrot',
  'apples': 'apple',
  'bananas': 'banana',
  'berries': 'berry',
  'beans': 'bean',
  'greens': 'green',
  'herbs': 'herb',
  'spices': 'spice',
  'sausages': 'sausage',
  'buns': 'bun',
  'breads': 'bread',
  'cakes': 'cake',
  'cookies': 'cookie',
  'nuts': 'nut',
  'seeds': 'seed',
  'milks': 'milk',
  'cheeses': 'cheese',
  'butters': 'butter',
  'creams': 'cream',
  'wines': 'wine',
  'beers': 'beer',
  'broths': 'broth',
  'stocks': 'stock',
  'sauces': 'sauce',
  'oils': 'oil',
  'flours': 'flour',
  'juices': 'juice',
  'vinegars': 'vinegar',
  'yogurts': 'yogurt',
  'mayonnaises': 'mayonnaise',
  'dressings': 'dressing',
  'pastas': 'pasta',
  'rices': 'rice',
  'noodles': 'noodle',
  'meats': 'meat',
  'fish': 'fish',
  'shellfish': 'shellfish',
  'shrimps': 'shrimp',
  'crabs': 'crab',
  'lobsters': 'lobster',
  'clams': 'clam',
  'mussels': 'mussel',
  'oysters': 'oyster',
  'scallops': 'scallop',
  'turkeys': 'turkey',
  'chickens': 'chicken',
  'ducks': 'duck',
  'geese': 'goose',
  'porks': 'pork',
  'beefs': 'beef',
  'lambs': 'lamb',
  'goats': 'goat',
  'veals': 'veal',
  'sausages': 'sausage',
  'bacon': 'bacon',
  'hams': 'ham',
  'salamis': 'salami',
  'pastramis': 'pastrami',
  'pepperonis': 'pepperoni',
  'hot dogs': 'hot dog',
  'franks': 'frank',
  'wieners': 'wiener',
  'brats': 'brat',
  'bratwursts': 'bratwurst',
  'sausages': 'sausage',
  'links': 'link',
  'patties': 'patty',
  'burgers': 'burger',
  'steaks': 'steak',
  'roasts': 'roast',
  'ribs': 'rib',
  'chops': 'chop',
  'cutlets': 'cutlet',
  'fillets': 'fillet',
  'filets': 'filet',
  'tenders': 'tender',
  'strips': 'strip',
  'chunks': 'chunk',
  'pieces': 'piece',
  'slices': 'slice',
  'cubes': 'cube',
  'sticks': 'stick',
  'balls': 'ball',
  'rolls': 'roll',
  'loaves': 'loaf',
  'pies': 'pie',
  'tarts': 'tart',
  'puddings': 'pudding',
  'custards': 'custard',
  'soups': 'soup',
  'stews': 'stew',
  'chilis': 'chili',
  'curries': 'curry',
  'dips': 'dip',
  'spreads': 'spread',
  'salsas': 'salsa',
  'relishes': 'relish',
  'pickles': 'pickle',
  'preserves': 'preserve',
  'jams': 'jam',
  'jellies': 'jelly',
  'marmalades': 'marmalade',
  'compotes': 'compote',
  'sorbets': 'sorbet',
  'ices': 'ice',
  'granitas': 'granita',
  'gelatos': 'gelato',
  'parfaits': 'parfait',
  'trifles': 'trifle',
  'mousses': 'mousse',
  'souffles': 'souffle',
  'crepes': 'crepe',
  'pancakes': 'pancake',
  'waffles': 'waffle',
  'fritters': 'fritter',
  'doughnuts': 'doughnut',
  'donuts': 'donut',
  'croissants': 'croissant',
  'danishes': 'danish',
  'strudels': 'strudel',
  'turnovers': 'turnover',
  'eclairs': 'eclair',
  'profiteroles': 'profiterole',
  'cream puffs': 'cream puff',
  'macarons': 'macaron',
  'macaroons': 'macaroon',
  'biscuits': 'biscuit',
  'scones': 'scone',
  'shortbreads': 'shortbread',
  'brownies': 'brownie',
  'blondies': 'blondie',
  'bars': 'bar',
  'squares': 'square',
  'cookies': 'cookie',
  'crackers': 'cracker',
  'pretzels': 'pretzel',
  'chips': 'chip',
  'crisps': 'crisp',
  'popcorns': 'popcorn',
  'caramels': 'caramel',
  'toffees': 'toffee',
  'fudges': 'fudge',
  'marshmallows': 'marshmallow',
  'nougats': 'nougat',
  'turtles': 'turtle',
  'truffles': 'truffle',
  'bonbons': 'bonbon',
  'pralines': 'praline',
  'divinities': 'divinity',
  'brittles': 'brittle',
  'barks': 'bark',
  'clusters': 'cluster',
  'rocks': 'rock',
  'drops': 'drop',
  'kisses': 'kiss',
  'stars': 'star',
  'wafers': 'wafer',
  'sticks': 'stick',
  'twists': 'twist',
  'ribbons': 'ribbon',
  'laces': 'lace',
  'strings': 'string',
  'ropes': 'rope',
  'belts': 'belt',
  'wheels': 'wheel',
  'rings': 'ring',
  'buttons': 'button',
  'coins': 'coin',
  'gems': 'gem',
  'pearls': 'pearl',
  'beads': 'bead',
  'balls': 'ball',
  'beans': 'bean',
  'eggs': 'egg',
  'nuts': 'nut',
  'seeds': 'seed',
  'fruits': 'fruit',
  'vegetables': 'vegetable',
  'roots': 'root',
  'tubers': 'tuber',
  'bulbs': 'bulb',
  'stems': 'stem',
  'leaves': 'leaf',
  'flowers': 'flower',
  'shoots': 'shoot',
  'sprouts': 'sprout',
  'pods': 'pod',
  'kernels': 'kernel',
  'grains': 'grain',
  'cereals': 'cereal',
  'pulses': 'pulse',
  'legumes': 'legume',
  'fungi': 'fungus',
  'mushrooms': 'mushroom',
  'yeasts': 'yeast',
  'bacteria': 'bacterium',
  'algae': 'alga',
  'seaweeds': 'seaweed',
  'kelps': 'kelp',
  'dulse': 'dulse',
  'nori': 'nori',
  'wakame': 'wakame',
  'kombu': 'kombu',
  'arame': 'arame',
  'hijiki': 'hijiki',
  'agar': 'agar',
  'carrageenans': 'carrageenan',
  'spirulinas': 'spirulina',
  'chlorellas': 'chlorella',
  'dulse': 'dulse',
  'nori': 'nori',
  'wakame': 'wakame',
  'kombu': 'kombu',
  'arame': 'arame',
  'hijiki': 'hijiki',
  'agar': 'agar',
  'carrageenans': 'carrageenan',
  'spirulinas': 'spirulina',
  'chlorellas': 'chlorella',
};

// Enhanced noise patterns
const NOISE_PATTERNS = [
  /\b(cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|ounce|ounces|pound|pounds|gram|grams|kg|ml|tbsp|tsp|oz|lb|g|l|liter|liters)\b/gi,
  /\b(chopped|sliced|diced|minced|cut|drained|rinsed|peeled|seeded|cored|trimmed|washed|dried|crushed|grated|shredded|julienned|cubed|striped|quartered)\b/gi,
  /\b(and|into|fresh|large|small|medium|extra|virgin|pure|organic|natural|artificial|flavored|unflavored|sweetened|unsweetened)\b/gi,
  /\b(raw|cooked|roasted|grilled|fried|baked|steamed|boiled|sauteed|broiled|smoked|pickled|fermented)\b/gi,
  /\b(optional|as needed|as desired|to taste|for garnish|for serving|for decoration|for dusting|for topping|for drizzling|for frying|for greasing|for brushing|for dipping|for rolling|for coating|for sprinkling|for dusting|for finishing|for the pan|for the dish|for the pot|for the grill|for the oven|for the baking sheet|for the skillet|for the wok|for the sauce|for the soup|for the stew|for the salad|for the dressing|for the marinade|for the rub|for the glaze|for the syrup|for the batter|for the dough|for the crust|for the filling|for the topping|for the base|for the mixture|for the blend|for the mix|for the seasoning|for the spice|for the herb|for the cheese|for the meat|for the fish|for the seafood|for the vegetable|for the fruit|for the nut|for the seed|for the grain|for the legume|for the bean|for the pulse|for the tuber|for the root|for the bulb|for the stem|for the leaf|for the flower|for the shoot|for the sprout|for the pod|for the kernel|for the cereal|for the fungus|for the mushroom|for the yeast|for the bacteria|for the algae|for the seaweed|for the kelp|for the dulse|for the nori|for the wakame|for the kombu|for the arame|for the hijiki|for the agar|for the carrageenan|for the spirulina|for the chlorella)\b/gi,
  /\b\d+\/\d+\b/g, // fractions
  /\b\d+\b/g, // numbers
  /[\(\)\[\]\{\}]/g, // brackets
  /\s{2,}/g // extra spaces
];

function cleanIngredient(ingredient) {
  let cleaned = ingredient.toLowerCase().trim();
  // Manual alias
  if (MANUAL_ALIASES[cleaned]) {
    cleaned = MANUAL_ALIASES[cleaned];
  }
  // Plural normalization
  cleaned = pluralize.singular(cleaned);
  // Remove noise
  for (const pattern of NOISE_PATTERNS) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

function getMemoryUsageMB() {
  const mem = process.memoryUsage();
  return (mem.rss / 1024 / 1024).toFixed(1);
}

async function enhancedFuzzyMatch() {
  console.log('🚀 Enhanced Fuzzy Matcher (Optimized)');
  console.log('========================');
  const startTime = Date.now();

  // Load Ingredient names and aliases, prioritize by usage (if available)
  const canonicals = await Ingredient.findAll({ attributes: ['id', 'name', 'aliases'] });
  // TODO: If you have usage stats, sort canonicals by usage here
  const canonicalList = [];
  const canonicalSet = new Set();
  for (const c of canonicals) {
    canonicalList.push({ id: c.id, name: c.name });
    canonicalSet.add(c.name.toLowerCase());
    if (Array.isArray(c.aliases)) {
      for (const alias of c.aliases) {
        if (!alias) continue;
        canonicalList.push({ id: c.id, name: alias });
        canonicalSet.add(alias.toLowerCase());
      }
    }
  }

  // Load unmapped ingredients
  const unmappedPath = path.join(__dirname, 'unmapped_ingredients.txt');
  if (!fs.existsSync(unmappedPath)) {
    console.error('❌ unmapped_ingredients.txt not found');
    return;
  }
  const lines = fs.readFileSync(unmappedPath, 'utf8').split('\n').filter(Boolean);

  // Preload existing mappings
  const existingMappings = await IngredientToCanonical.findAll({ attributes: ['messyName'] });
  const existingSet = new Set(existingMappings.map(m => m.messyName.toLowerCase()));

  // Load already processed ingredients from enhanced_fuzzy_suggestions.json
  const suggestionsPath = path.join(__dirname, 'enhanced_fuzzy_suggestions.json');
  let alreadyProcessed = new Set();
  let existingSuggestions = [];
  if (fs.existsSync(suggestionsPath)) {
    existingSuggestions = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8'));
    for (const s of existingSuggestions) {
      alreadyProcessed.add(s.messyName.toLowerCase());
    }
  }
  let processed = 0;
  let highConfidence = existingSuggestions.length;
  let suggestions = [...existingSuggestions];
  const chunkSize = 1000;
  let chunkNum = 0;
  let runningTotal = highConfidence;
  let globalIndex = 0;
  for (let chunkStart = 0; chunkStart < lines.length && chunkNum < 10; chunkStart += chunkSize, chunkNum++) {
    const chunk = lines.slice(chunkStart, chunkStart + chunkSize);
    const chunkStartTime = Date.now();
    let chunkMatches = 0;
    for (let i = 0; i < chunk.length; i++) {
      globalIndex++;
      const original = chunk[i].trim();
      if (!original || existingSet.has(original.toLowerCase()) || alreadyProcessed.has(original.toLowerCase())) continue;
      const cleaned = cleanIngredient(original);
      if (!cleaned) continue;
      // 1. Exact alias match (fast path)
      if (canonicalSet.has(cleaned)) {
        const match = canonicalList.find(c => c.name.toLowerCase() === cleaned);
        suggestions.push({ messyName: original, IngredientId: match.id, canonicalName: match.name, confidence: 100 });
        highConfidence++;
        chunkMatches++;
        runningTotal++;
        alreadyProcessed.add(original.toLowerCase());
        continue;
      }
      // 2. Fuzzy match
      let best = { id: null, name: null, score: 0 };
      for (const c of canonicalList) {
        const score1 = fuzzball.token_set_ratio(cleaned, c.name.toLowerCase());
        const score2 = fuzzball.partial_ratio(cleaned, c.name.toLowerCase());
        const score = Math.max(score1, score2);
        if (score > best.score) {
          best = { id: c.id, name: c.name, score };
          if (score === 100) break; // Early termination
        }
      }
      if (best.score >= 80) {
        suggestions.push({ messyName: original, IngredientId: best.id, canonicalName: best.name, confidence: best.score });
        highConfidence++;
        chunkMatches++;
        runningTotal++;
        alreadyProcessed.add(original.toLowerCase());
      }
      processed++;
      if (processed % 500 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const mem = getMemoryUsageMB();
        console.log(`Processed ${processed} | Chunk ${chunkNum + 1}/10 | Matches: ${runningTotal} | Mem: ${mem}MB | Time: ${elapsed}s`);
      }
    }
    const chunkElapsed = ((Date.now() - chunkStartTime) / 1000).toFixed(1);
    console.log(`Chunk ${chunkNum + 1} done: ${chunk.length} ingredients in ${chunkElapsed}s | Matches this chunk: ${chunkMatches} | Running total: ${runningTotal} | Mem: ${getMemoryUsageMB()}MB`);
  }

  // Save suggestions
  fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2));
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n💾 Saved ${suggestions.length} suggestions to ${suggestionsPath}`);
  console.log(`🎯 High-confidence matches (≥85%): ${highConfidence}`);
  console.log(`⏱️  Total time: ${totalElapsed}s | Mem: ${getMemoryUsageMB()}MB`);
  console.log('Sample matches:');
  for (const s of suggestions.slice(-10)) {
    console.log(`  - ${s.messyName} → ${s.canonicalName} (${s.confidence}%)`);
  }
  console.log('\n🚦 Enhanced fuzzy matching complete.');
}

if (require.main === module) {
  enhancedFuzzyMatch();
}

module.exports = { enhancedFuzzyMatch }; 