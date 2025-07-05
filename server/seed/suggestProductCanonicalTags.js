const { Food } = require('../db/models');
const IngredientToCanonical = require('../db/models/IngredientToCanonical');
const CanonicalIngredient = require('../db/models/CanonicalIngredient');
const { Op } = require('sequelize');
const { cleanIngredientName } = require('../api/foodRoutes');
const fs = require('fs');

// Enhanced ingredient detection patterns
const INGREDIENT_PATTERNS = {
  confident: {
    sugar: [
      /^sugar$/i,
      /^granulated sugar$/i,
      /^white sugar$/i,
      /^brown sugar$/i,
      /^powdered sugar$/i,
      /^confectioners sugar$/i,
      /^cane sugar$/i,
      /^beet sugar$/i,
      /^raw sugar$/i,
      /^organic sugar$/i,
      /^pure sugar$/i,
      /^100% sugar$/i,
      /^sugar,?$/i,
      /^sugar\.?$/i
    ],
    flour: [
      /^flour$/i,
      /^all-purpose flour$/i,
      /^bread flour$/i,
      /^cake flour$/i,
      /^whole wheat flour$/i,
      /^white flour$/i,
      /^unbleached flour$/i,
      /^bleached flour$/i,
      /^self-rising flour$/i,
      /^pastry flour$/i,
      /^rye flour$/i,
      /^almond flour$/i,
      /^coconut flour$/i,
      /^pure flour$/i,
      /^100% flour$/i,
      /^flour,?$/i,
      /^flour\.?$/i
    ],
    salt: [
      /^salt$/i,
      /^table salt$/i,
      /^sea salt$/i,
      /^kosher salt$/i,
      /^iodized salt$/i,
      /^rock salt$/i,
      /^pickling salt$/i,
      /^pure salt$/i,
      /^100% salt$/i,
      /^salt,?$/i,
      /^salt\.?$/i
    ],
    oil: [
      /^oil$/i,
      /^olive oil$/i,
      /^vegetable oil$/i,
      /^canola oil$/i,
      /^coconut oil$/i,
      /^avocado oil$/i,
      /^sesame oil$/i,
      /^sunflower oil$/i,
      /^pure oil$/i,
      /^100% oil$/i,
      /^oil,?$/i,
      /^oil\.?$/i
    ],
    milk: [
      /^milk$/i,
      /^whole milk$/i,
      /^skim milk$/i,
      /^2% milk$/i,
      /^1% milk$/i,
      /^organic milk$/i,
      /^pure milk$/i,
      /^100% milk$/i,
      /^milk,?$/i,
      /^milk\.?$/i
    ],
    butter: [
      /^butter$/i,
      /^unsalted butter$/i,
      /^salted butter$/i,
      /^sweet cream butter$/i,
      /^organic butter$/i,
      /^pure butter$/i,
      /^100% butter$/i,
      /^butter,?$/i,
      /^butter\.?$/i
    ],
    eggs: [
      /^eggs$/i,
      /^egg$/i,
      /^large eggs$/i,
      /^fresh eggs$/i,
      /^organic eggs$/i,
      /^farm fresh eggs$/i,
      /^eggs,?$/i,
      /^eggs\.?$/i,
      /^egg,?$/i,
      /^egg\.?$/i
    ],
    yeast: [
      /^yeast$/i,
      /^active dry yeast$/i,
      /^instant yeast$/i,
      /^rapid rise yeast$/i,
      /^bread yeast$/i,
      /^baking yeast$/i,
      /^fresh yeast$/i,
      /^pure yeast$/i,
      /^100% yeast$/i,
      /^yeast,?$/i,
      /^yeast\.?$/i
    ],
    'olive oil': [
      /^olive oil$/i,
      /^extra virgin olive oil$/i,
      /^virgin olive oil$/i,
      /^pure olive oil$/i,
      /^light olive oil$/i,
      /^100% olive oil$/i,
      /^olive oil,?$/i,
      /^olive oil\.?$/i
    ],
    'pizza sauce': [
      /^pizza sauce$/i,
      /^tomato sauce$/i,
      /^marinara sauce$/i,
      /^pizza marinara$/i,
      /^pure pizza sauce$/i,
      /^100% pizza sauce$/i,
      /^pizza sauce,?$/i,
      /^pizza sauce\.?$/i
    ],
    pepperoni: [
      /^pepperoni$/i,
      /^pepperoni slices$/i,
      /^pepperoni meat$/i,
      /^sliced pepperoni$/i,
      /^pure pepperoni$/i,
      /^100% pepperoni$/i,
      /^pepperoni,?$/i,
      /^pepperoni\.?$/i
    ],
    'mozzarella cheese': [
      /^mozzarella cheese$/i,
      /^mozzarella$/i,
      /^fresh mozzarella$/i,
      /^shredded mozzarella$/i,
      /^pure mozzarella$/i,
      /^100% mozzarella$/i,
      /^mozzarella cheese,?$/i,
      /^mozzarella cheese\.?$/i
    ],
    water: [
      /^water$/i,
      /^warm water$/i,
      /^hot water$/i,
      /^boiling water$/i,
      /^cold water$/i,
      /^pure water$/i,
      /^100% water$/i,
      /^water,?$/i,
      /^water\.?$/i
    ],
    'cooking spray': [
      /^cooking spray$/i,
      /^non-stick cooking spray$/i,
      /^vegetable cooking spray$/i,
      /^canola cooking spray$/i,
      /^pure cooking spray$/i,
      /^100% cooking spray$/i,
      /^cooking spray,?$/i,
      /^cooking spray\.?$/i
    ],
    // Substitute ingredients
    'rice flour': [
      /^rice flour$/i,
      /^white rice flour$/i,
      /^brown rice flour$/i,
      /^sweet rice flour$/i,
      /^glutinous rice flour$/i,
      /^pure rice flour$/i,
      /^100% rice flour$/i,
      /^rice flour,?$/i,
      /^rice flour\.?$/i,
      /rice flour/i,  // More flexible matching
      /^.*rice flour.*$/i  // Any product containing "rice flour"
    ],
    'almond flour': [
      /^almond flour$/i,
      /^blanched almond flour$/i,
      /^pure almond flour$/i,
      /^100% almond flour$/i,
      /^almond flour,?$/i,
      /^almond flour\.?$/i,
      /almond flour/i,  // More flexible matching
      /^.*almond flour.*$/i  // Any product containing "almond flour"
    ],
    'coconut flour': [
      /^coconut flour$/i,
      /^pure coconut flour$/i,
      /^100% coconut flour$/i,
      /^coconut flour,?$/i,
      /^coconut flour\.?$/i,
      /coconut flour/i,  // More flexible matching
      /^.*coconut flour.*$/i  // Any product containing "coconut flour"
    ],
    'oat flour': [
      /^oat flour$/i,
      /^rolled oat flour$/i,
      /^pure oat flour$/i,
      /^100% oat flour$/i,
      /^oat flour,?$/i,
      /^oat flour\.?$/i,
      /oat flour/i,  // More flexible matching
      /^.*oat flour.*$/i  // Any product containing "oat flour"
    ],
    'gluten-free flour blend': [
      /^gluten-free flour blend$/i,
      /^gluten free flour blend$/i,
      /^gf flour blend$/i,
      /^gluten-free flour$/i,
      /^gluten free flour$/i,
      /^pure gluten-free flour blend$/i,
      /^100% gluten-free flour blend$/i,
      /gluten.?free flour/i,  // More flexible matching
      /^.*gluten.?free flour.*$/i  // Any product containing "gluten-free flour"
    ],
    'almond milk': [
      /^almond milk$/i,
      /^unsweetened almond milk$/i,
      /^vanilla almond milk$/i,
      /^chocolate almond milk$/i,
      /^pure almond milk$/i,
      /^100% almond milk$/i,
      /^almond milk,?$/i,
      /^almond milk\.?$/i,
      /almond milk/i,  // More flexible matching
      /^.*almond milk.*$/i  // Any product containing "almond milk"
    ],
    'soy milk': [
      /^soy milk$/i,
      /^unsweetened soy milk$/i,
      /^vanilla soy milk$/i,
      /^chocolate soy milk$/i,
      /^pure soy milk$/i,
      /^100% soy milk$/i,
      /^soy milk,?$/i,
      /^soy milk\.?$/i,
      /soy milk/i,  // More flexible matching
      /^.*soy milk.*$/i  // Any product containing "soy milk"
    ],
    'oat milk': [
      /^oat milk$/i,
      /^unsweetened oat milk$/i,
      /^vanilla oat milk$/i,
      /^chocolate oat milk$/i,
      /^pure oat milk$/i,
      /^100% oat milk$/i,
      /^oat milk,?$/i,
      /^oat milk\.?$/i,
      /oat milk/i,  // More flexible matching
      /^.*oat milk.*$/i  // Any product containing "oat milk"
    ],
    'coconut milk': [
      /^coconut milk$/i,
      /^full fat coconut milk$/i,
      /^light coconut milk$/i,
      /^pure coconut milk$/i,
      /^100% coconut milk$/i,
      /^coconut milk,?$/i,
      /^coconut milk\.?$/i,
      /coconut milk/i,  // More flexible matching
      /^.*coconut milk.*$/i  // Any product containing "coconut milk"
    ],
    'tofu': [
      /^tofu$/i,
      /^firm tofu$/i,
      /^soft tofu$/i,
      /^silken tofu$/i,
      /^extra firm tofu$/i,
      /^pure tofu$/i,
      /^100% tofu$/i,
      /^tofu,?$/i,
      /^tofu\.?$/i,
      /tofu/i,  // More flexible matching
      /^.*tofu.*$/i  // Any product containing "tofu"
    ],
    'tempeh': [
      /^tempeh$/i,
      /^soy tempeh$/i,
      /^pure tempeh$/i,
      /^100% tempeh$/i,
      /^tempeh,?$/i,
      /^tempeh\.?$/i,
      /tempeh/i,  // More flexible matching
      /^.*tempeh.*$/i  // Any product containing "tempeh"
    ],
    'sunflower seeds': [
      /^sunflower seeds$/i,
      /^raw sunflower seeds$/i,
      /^roasted sunflower seeds$/i,
      /^shelled sunflower seeds$/i,
      /^pure sunflower seeds$/i,
      /^100% sunflower seeds$/i,
      /^sunflower seeds,?$/i,
      /^sunflower seeds\.?$/i
    ],
    'pumpkin seeds': [
      /^pumpkin seeds$/i,
      /^raw pumpkin seeds$/i,
      /^roasted pumpkin seeds$/i,
      /^shelled pumpkin seeds$/i,
      /^pure pumpkin seeds$/i,
      /^100% pumpkin seeds$/i,
      /^pumpkin seeds,?$/i,
      /^pumpkin seeds\.?$/i
    ],
    'sunflower seed butter': [
      /^sunflower seed butter$/i,
      /^sunflower butter$/i,
      /^pure sunflower seed butter$/i,
      /^100% sunflower seed butter$/i
    ],
    'soy nut butter': [
      /^soy nut butter$/i,
      /^soynut butter$/i,
      /^pure soy nut butter$/i,
      /^100% soy nut butter$/i
    ],
    'chickpeas': [
      /^chickpeas$/i,
      /^garbanzo beans$/i,
      /^canned chickpeas$/i,
      /^dried chickpeas$/i,
      /^pure chickpeas$/i,
      /^100% chickpeas$/i,
      /^chickpeas,?$/i,
      /^chickpeas\.?$/i
    ],
    'lentils': [
      /^lentils$/i,
      /^red lentils$/i,
      /^green lentils$/i,
      /^brown lentils$/i,
      /^dried lentils$/i,
      /^pure lentils$/i,
      /^100% lentils$/i,
      /^lentils,?$/i,
      /^lentils\.?$/i
    ],
    'poppy seeds': [
      /^poppy seeds$/i,
      /^blue poppy seeds$/i,
      /^pure poppy seeds$/i,
      /^100% poppy seeds$/i,
      /^poppy seeds,?$/i,
      /^poppy seeds\.?$/i
    ],
    'flax egg': [
      /^flax egg$/i,
      /^ground flax seed$/i,
      /^flaxseed$/i,
      /^pure flax seed$/i,
      /^100% flax seed$/i
    ],
    'chia egg': [
      /^chia egg$/i,
      /^chia seeds$/i,
      /^pure chia seeds$/i,
      /^100% chia seeds$/i
    ],
    'banana': [
      /^banana$/i,
      /^ripe banana$/i,
      /^mashed banana$/i,
      /^pure banana$/i,
      /^100% banana$/i,
      /^banana,?$/i,
      /^banana\.?$/i
    ],
    'applesauce': [
      /^applesauce$/i,
      /^unsweetened applesauce$/i,
      /^pure applesauce$/i,
      /^100% applesauce$/i,
      /^applesauce,?$/i,
      /^applesauce\.?$/i
    ]
  },
  
  // Medium confidence patterns that might be the ingredient
  suggested: {
    sugar: [
      /sugar$/i,  // ends with sugar
      /^sugar\s/i,  // starts with sugar followed by space
      /\ssugar$/i,  // space followed by sugar at end
      /\ssugar\s/i,  // space-sugar-space
      /sugar,?$/i,  // sugar at end with optional comma
      /sugar\.?$/i   // sugar at end with optional period
    ],
    flour: [
      /flour$/i,
      /^flour\s/i,
      /\sflour$/i,
      /\sflour\s/i,
      /flour,?$/i,
      /flour\.?$/i
    ],
    salt: [
      /salt$/i,
      /^salt\s/i,
      /\ssalt$/i,
      /\ssalt\s/i,
      /salt,?$/i,
      /salt\.?$/i
    ]
  },
  
  // Exclusion patterns that indicate this is NOT the ingredient
  exclude: {
    sugar: [
      /no sugar/i,
      /0 sugar/i,
      /zero sugar/i,
      /sugar free/i,
      /sugarless/i,
      /unsweetened/i,
      /artificial sweetener/i,
      /stevia/i,
      /splenda/i,
      /aspartame/i,
      /protein.*sugar/i,
      /sugar.*protein/i,
      /shake.*sugar/i,
      /sugar.*shake/i,
      /bar.*sugar/i,
      /sugar.*bar/i,
      /cereal.*sugar/i,
      /sugar.*cereal/i,
      /candy.*sugar/i,
      /sugar.*candy/i,
      /chocolate.*sugar/i,
      /sugar.*chocolate/i,
      /cookie/i,
      /donut/i,
      /ice cream/i,
      /yogurt/i,
      /pudding/i
    ],
    flour: [
      /no flour/i,
      /flourless/i,
      /gluten free.*flour/i,
      /flour.*gluten free/i,
      /bread.*flour/i,
      /flour.*bread/i,
      /tortilla.*flour/i,
      /flour.*tortilla/i,
      /pasta.*flour/i,
      /flour.*pasta/i,
      /cake.*flour/i,
      /flour.*cake/i
    ],
    salt: [
      /no salt/i,
      /salt free/i,
      /unsalted/i,
      /low sodium/i,
      /reduced sodium/i,
      /sodium free/i,
      /tuna.*salt/i,
      /salt.*tuna/i,
      /fish.*salt/i,
      /salt.*fish/i
    ],
    oil: [
      /no oil/i,
      /oil free/i,
      /blend/i,
      /dressing/i,
      /mayonnaise/i,
      /spread/i,
      /margarine/i
    ],
    milk: [
      /no milk/i,
      /milk free/i,
      /almond milk/i,
      /soy milk/i,
      /oat milk/i,
      /coconut milk/i,
      /rice milk/i,
      /cashew milk/i,
      /chocolate milk/i,
      /shake/i,
      /bar/i,
      /ice cream/i,
      /yogurt/i,
      /pudding/i
    ],
    butter: [
      /no butter/i,
      /butter free/i,
      /peanut butter/i,
      /cookie/i,
      /bar/i,
      /ice cream/i,
      /yogurt/i,
      /pudding/i
    ],
    eggs: [
      /no eggs/i,
      /egg free/i,
      /egg substitute/i,
      /eggless/i,
      /bar/i,
      /cookie/i,
      /ice cream/i,
      /yogurt/i,
      /pudding/i
    ],
    yeast: [
      /no yeast/i,
      /yeast free/i,
      /yeastless/i,
      /bread.*yeast/i,
      /yeast.*bread/i,
      /pizza.*yeast/i,
      /yeast.*pizza/i
    ],
    'olive oil': [
      /no olive oil/i,
      /olive oil free/i,
      /blend/i,
      /dressing/i,
      /marinade/i,
      /sauce/i,
      /spread/i,
      /mayonnaise/i
    ],
    'pizza sauce': [
      /no pizza sauce/i,
      /pizza sauce free/i,
      /pizza.*sauce/i,
      /sauce.*pizza/i,
      /pasta.*sauce/i,
      /sauce.*pasta/i
    ],
    pepperoni: [
      /no pepperoni/i,
      /pepperoni free/i,
      /pizza.*pepperoni/i,
      /pepperoni.*pizza/i,
      /sandwich.*pepperoni/i,
      /pepperoni.*sandwich/i
    ],
    'mozzarella cheese': [
      /no mozzarella/i,
      /mozzarella free/i,
      /pizza.*mozzarella/i,
      /mozzarella.*pizza/i,
      /sandwich.*mozzarella/i,
      /mozzarella.*sandwich/i
    ],
    water: [
      /no water/i,
      /water free/i,
      /sparkling water/i,
      /carbonated water/i,
      /flavored water/i,
      /soda water/i
    ],
    'cooking spray': [
      /no cooking spray/i,
      /cooking spray free/i,
      /oil.*spray/i,
      /spray.*oil/i
    ],
    // Substitute ingredient exclusions
    'rice flour': [
      /no rice flour/i,
      /rice flour free/i,
      /rice.*bread/i,
      /bread.*rice/i,
      /pasta/i,
      /spaghetti/i,
      /noodles/i,
      /penne/i,
      /fettuccine/i,
      /macaroni/i,
      /lasagna/i,
      /ravioli/i,
      /tortellini/i,
      /cookie/i,
      /cracker/i,
      /bar/i,
      /mix/i,
      /cake/i,
      /muffin/i,
      /bread/i,
      /pancake/i,
      /waffle/i,
      /brownie/i,
      /chip/i
    ],
    'almond flour': [
      /no almond flour/i,
      /almond flour free/i,
      /almond.*bread/i,
      /bread.*almond/i,
      /pasta/i,
      /spaghetti/i,
      /noodles/i,
      /penne/i,
      /fettuccine/i,
      /macaroni/i,
      /lasagna/i,
      /ravioli/i,
      /tortellini/i,
      /cookie/i,
      /cracker/i,
      /bar/i,
      /mix/i,
      /cake/i,
      /muffin/i,
      /bread/i,
      /pancake/i,
      /waffle/i,
      /brownie/i,
      /chip/i
    ],
    'coconut flour': [
      /no coconut flour/i,
      /coconut flour free/i,
      /coconut.*bread/i,
      /bread.*coconut/i,
      /pasta/i,
      /spaghetti/i,
      /noodles/i,
      /penne/i,
      /fettuccine/i,
      /macaroni/i,
      /lasagna/i,
      /ravioli/i,
      /tortellini/i,
      /cookie/i,
      /cracker/i,
      /bar/i,
      /mix/i,
      /cake/i,
      /muffin/i,
      /bread/i,
      /pancake/i,
      /waffle/i,
      /brownie/i,
      /chip/i
    ],
    'oat flour': [
      /no oat flour/i,
      /oat flour free/i,
      /oat.*bread/i,
      /bread.*oat/i,
      /pasta/i,
      /spaghetti/i,
      /noodles/i,
      /penne/i,
      /fettuccine/i,
      /macaroni/i,
      /lasagna/i,
      /ravioli/i,
      /tortellini/i,
      /cookie/i,
      /cracker/i,
      /bar/i,
      /mix/i,
      /cake/i,
      /muffin/i,
      /bread/i,
      /pancake/i,
      /waffle/i,
      /brownie/i,
      /chip/i
    ],
    'gluten-free flour blend': [
      /no gluten-free flour/i,
      /gluten-free flour free/i,
      /gluten.*bread/i,
      /bread.*gluten/i,
      /pasta/i,
      /spaghetti/i,
      /noodles/i,
      /penne/i,
      /fettuccine/i,
      /macaroni/i,
      /lasagna/i,
      /ravioli/i,
      /tortellini/i,
      /cookie/i,
      /cracker/i,
      /bar/i,
      /mix/i,
      /cake/i,
      /muffin/i,
      /bread/i,
      /pancake/i,
      /waffle/i,
      /brownie/i,
      /chip/i
    ],
    'almond milk': [
      /no almond milk/i,
      /almond milk free/i,
      /almond.*yogurt/i,
      /yogurt.*almond/i
    ],
    'soy milk': [
      /no soy milk/i,
      /soy milk free/i,
      /soy.*yogurt/i,
      /yogurt.*soy/i
    ],
    'oat milk': [
      /no oat milk/i,
      /oat milk free/i,
      /oat.*yogurt/i,
      /yogurt.*oat/i
    ],
    'coconut milk': [
      /no coconut milk/i,
      /coconut milk free/i,
      /coconut.*yogurt/i,
      /yogurt.*coconut/i
    ],
    'tofu': [
      /no tofu/i,
      /tofu free/i,
      /tofu.*soup/i,
      /soup.*tofu/i
    ],
    'tempeh': [
      /no tempeh/i,
      /tempeh free/i,
      /tempeh.*soup/i,
      /soup.*tempeh/i
    ],
    'sunflower seeds': [
      /no sunflower seeds/i,
      /sunflower seeds free/i,
      /sunflower.*bread/i,
      /bread.*sunflower/i
    ],
    'pumpkin seeds': [
      /no pumpkin seeds/i,
      /pumpkin seeds free/i,
      /pumpkin.*bread/i,
      /bread.*pumpkin/i
    ],
    'sunflower seed butter': [
      /no sunflower seed butter/i,
      /sunflower seed butter free/i,
      /sunflower.*bread/i,
      /bread.*sunflower/i
    ],
    'soy nut butter': [
      /no soy nut butter/i,
      /soy nut butter free/i,
      /soy.*bread/i,
      /bread.*soy/i
    ],
    'chickpeas': [
      /no chickpeas/i,
      /chickpeas free/i,
      /chickpeas.*soup/i,
      /soup.*chickpeas/i
    ],
    'lentils': [
      /no lentils/i,
      /lentils free/i,
      /lentils.*soup/i,
      /soup.*lentils/i
    ],
    'poppy seeds': [
      /no poppy seeds/i,
      /poppy seeds free/i,
      /poppy.*bread/i,
      /bread.*poppy/i
    ],
    'flax egg': [
      /no flax egg/i,
      /flax egg free/i,
      /flax.*bread/i,
      /bread.*flax/i
    ],
    'chia egg': [
      /no chia egg/i,
      /chia egg free/i,
      /chia.*bread/i,
      /bread.*chia/i
    ],
    'banana': [
      /no banana/i,
      /banana free/i,
      /banana.*bread/i,
      /bread.*banana/i
    ],
    'applesauce': [
      /no applesauce/i,
      /applesauce free/i,
      /applesauce.*bread/i,
      /bread.*applesauce/i
    ]
  }
};

// Function to check if a product description matches ingredient patterns
function analyzeIngredientMatch(description, ingredientName) {
  const desc = description.toLowerCase();
  const cleanedDesc = cleanIngredientName(description);
  
  // Check exclusion patterns first
  const excludePatterns = INGREDIENT_PATTERNS.exclude[ingredientName] || [];
  for (const pattern of excludePatterns) {
    if (pattern.test(desc)) {
      return { match: false, reason: 'excluded', confidence: 'none' };
    }
  }
  
  // Check confident patterns
  const confidentPatterns = INGREDIENT_PATTERNS.confident[ingredientName] || [];
  for (const pattern of confidentPatterns) {
    if (pattern.test(cleanedDesc) || pattern.test(desc)) {
      return { match: true, reason: 'confident_pattern', confidence: 'confident' };
    }
  }
  
  // Check for exact match with cleaned description
  if (cleanedDesc === ingredientName.toLowerCase()) {
    return { match: true, reason: 'exact_cleaned_match', confidence: 'confident' };
  }
  
  // Check for substring match (lowest confidence)
  if (desc.includes(ingredientName.toLowerCase())) {
    return { match: true, reason: 'substring_match', confidence: 'low' };
  }
  
  return { match: false, reason: 'no_match', confidence: 'none' };
}

async function suggestProductCanonicalTags() {
  console.log('🔍 Starting Enhanced Canonical Tag Suggestion...\n');
  
  // Get all canonical ingredient names
  const canonicalIngredients = await CanonicalIngredient.findAll();
  const canonicalNames = canonicalIngredients.map(ci => ci.name.toLowerCase());
  const allAliases = canonicalIngredients.flatMap(ci => (ci.aliases || []).map(a => a.toLowerCase()));
  const allTags = Array.from(new Set([...canonicalNames, ...allAliases]));
  
  console.log(`📊 Found ${canonicalIngredients.length} canonical ingredients with ${allTags.length} total tags`);
  
  // Get all products
  const products = await Food.findAll();
  console.log(`📦 Processing ${products.length} products...\n`);
  
  let confidentUpdates = 0;
  let suggestedUpdates = 0;
  let lowUpdates = 0;
  let noMatchCount = 0;
  const confidentLog = [];
  
  for (const product of products) {
    let bestMatch = null;
    let bestConfidence = 'none';
    let bestReason = 'no_match';
    
    // Test against each canonical ingredient
    for (const tag of allTags) {
      // Only use strict patterns for basic ingredients
      const isBasic = [
        'sugar', 'flour', 'salt', 'oil', 'butter', 'eggs', 'milk', 'yeast', 'olive oil', 'pizza sauce', 'pepperoni', 'mozzarella cheese', 'water', 'cooking spray',
        // Substitute ingredients
        'rice flour', 'almond flour', 'coconut flour', 'oat flour', 'gluten-free flour blend',
        'almond milk', 'soy milk', 'oat milk', 'coconut milk',
        'tofu', 'tempeh',
        'sunflower seeds', 'pumpkin seeds', 'sunflower seed butter', 'soy nut butter',
        'chickpeas', 'lentils', 'poppy seeds',
        'flax egg', 'chia egg', 'banana', 'applesauce'
      ].includes(tag);
      const analysis = isBasic
        ? analyzeIngredientMatch(product.description, tag)
        : { match: false, reason: 'not_basic', confidence: 'none' };
      
      if (analysis.match) {
        // Prioritize by confidence level
        const confidenceOrder = { 'confident': 3, 'suggested': 2, 'low': 1 };
        const currentScore = confidenceOrder[analysis.confidence] || 0;
        const bestScore = confidenceOrder[bestConfidence] || 0;
        
        if (currentScore > bestScore) {
          bestMatch = tag;
          bestConfidence = analysis.confidence;
          bestReason = analysis.reason;
        }
      }
    }
    
    // Update product if we found a better match
    if (bestMatch && bestConfidence === 'confident' && (product.canonicalTag !== bestMatch || product.canonicalTagConfidence !== bestConfidence)) {
      product.canonicalTag = bestMatch;
      product.canonicalTagConfidence = bestConfidence;
      await product.save();
      confidentUpdates++;
      confidentLog.push({ description: product.description, canonicalTag: bestMatch });
      console.log(`✅ CONFIDENT (${bestReason}): '${product.description}' → '${bestMatch}'`);
    } else if (!bestMatch) {
      noMatchCount++;
    }
  }
  
  // Write confident matches to CSV for review
  const csv = ['description,canonicalTag'];
  confidentLog.forEach(row => {
    csv.push(`"${row.description.replace(/"/g, '""')}","${row.canonicalTag}"`);
  });
  fs.writeFileSync('confident_matches.csv', csv.join('\n'));
  console.log('\n📤 Confident matches written to confident_matches.csv');
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Confident updates: ${confidentUpdates}`);
  console.log(`❌ No matches: ${noMatchCount}`);
  console.log(`📝 Total products processed: ${products.length}`);
  
  process.exit(0);
}

suggestProductCanonicalTags(); 