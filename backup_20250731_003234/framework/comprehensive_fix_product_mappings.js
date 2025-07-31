const { Sequelize } = require('sequelize');
const db = require('./db/database');

async function comprehensiveFixProductMappings() {
  console.log('🔧 COMPREHENSIVE PRODUCT MAPPING FIXES\n');
  
  // Step 1: Remove all generic/missing brand products
  console.log('🧹 STEP 1: Removing generic products...');
  
  const genericRemoval = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" IS NOT NULL
      AND ("brandOwner" IS NULL OR "brandOwner" = 'Generic' OR "brandOwner" = '')
  `);
  
  console.log(`   ✅ Removed generic products from ${genericRemoval[1]} records`);
  
  // Step 2: Fix specific ingredient issues with improved rules
  console.log('\n🔧 STEP 2: Fixing specific ingredient mappings...');
  
  // Fix cheddar cheese - allow sharp varieties
  const cheddarFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'cheddar cheese'
      AND description NOT ILIKE '%cheddar%'
  `);
  console.log(`   ✅ Fixed cheddar cheese: ${cheddarFix[1]} records`);
  
  // Fix tomato - allow roma and other varieties
  const tomatoFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'tomato'
      AND description NOT ILIKE '%tomato%'
  `);
  console.log(`   ✅ Fixed tomato: ${tomatoFix[1]} records`);
  
  // Fix rice - allow jasmine, brown, etc.
  const riceFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'rice'
      AND description NOT ILIKE '%rice%'
  `);
  console.log(`   ✅ Fixed rice: ${riceFix[1]} records`);
  
  // Fix vinegar - allow apple cider and other varieties
  const vinegarFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'vinegar'
      AND description NOT ILIKE '%vinegar%'
  `);
  console.log(`   ✅ Fixed vinegar: ${vinegarFix[1]} records`);
  
  // Fix soy sauce - remove completely wrong mappings
  const soySauceFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'soy sauce'
      AND description NOT ILIKE '%soy sauce%'
  `);
  console.log(`   ✅ Fixed soy sauce: ${soySauceFix[1]} records`);
  
  // Fix honey - allow organic varieties
  const honeyFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'honey'
      AND description NOT ILIKE '%honey%'
  `);
  console.log(`   ✅ Fixed honey: ${honeyFix[1]} records`);
  
  // Fix salmon - allow wild varieties
  const salmonFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'salmon'
      AND description NOT ILIKE '%salmon%'
  `);
  console.log(`   ✅ Fixed salmon: ${salmonFix[1]} records`);
  
  // Fix potato - allow sweet potatoes
  const potatoFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'potato'
      AND description NOT ILIKE '%potato%'
  `);
  console.log(`   ✅ Fixed potato: ${potatoFix[1]} records`);
  
  // Fix carrot - allow baby carrots
  const carrotFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'carrot'
      AND description NOT ILIKE '%carrot%'
  `);
  console.log(`   ✅ Fixed carrot: ${carrotFix[1]} records`);
  
  // Fix onion - allow colored varieties
  const onionFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'onion'
      AND description NOT ILIKE '%onion%'
  `);
  console.log(`   ✅ Fixed onion: ${onionFix[1]} records`);
  
  // Fix chicken breast - allow tenderloins
  const chickenFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'chicken breast'
      AND description NOT ILIKE '%chicken breast%'
  `);
  console.log(`   ✅ Fixed chicken breast: ${chickenFix[1]} records`);
  
  // Fix ground beef - allow lean varieties
  const beefFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'ground beef'
      AND description NOT ILIKE '%ground beef%'
  `);
  console.log(`   ✅ Fixed ground beef: ${beefFix[1]} records`);
  
  // Fix bacon - allow turkey bacon
  const baconFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'bacon'
      AND description NOT ILIKE '%bacon%'
  `);
  console.log(`   ✅ Fixed bacon: ${baconFix[1]} records`);
  
  // Fix ham - allow deli ham
  const hamFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'ham'
      AND description NOT ILIKE '%ham%'
  `);
  console.log(`   ✅ Fixed ham: ${hamFix[1]} records`);
  
  // Fix shrimp - allow peeled varieties
  const shrimpFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'shrimp'
      AND description NOT ILIKE '%shrimp%'
  `);
  console.log(`   ✅ Fixed shrimp: ${shrimpFix[1]} records`);
  
  // Fix pasta - allow sauce varieties
  const pastaFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'pasta'
      AND description NOT ILIKE '%pasta%'
  `);
  console.log(`   ✅ Fixed pasta: ${pastaFix[1]} records`);
  
  // Fix ketchup - allow tomato ketchup
  const ketchupFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'ketchup'
      AND description NOT ILIKE '%ketchup%'
  `);
  console.log(`   ✅ Fixed ketchup: ${ketchupFix[1]} records`);
  
  // Fix mustard - allow yellow mustard
  const mustardFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'mustard'
      AND description NOT ILIKE '%mustard%'
  `);
  console.log(`   ✅ Fixed mustard: ${mustardFix[1]} records`);
  
  // Fix almond - allow roasted varieties
  const almondFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'almond'
      AND description NOT ILIKE '%almond%'
  `);
  console.log(`   ✅ Fixed almond: ${almondFix[1]} records`);
  
  // Fix walnut - allow halves and pieces
  const walnutFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'walnut'
      AND description NOT ILIKE '%walnut%'
  `);
  console.log(`   ✅ Fixed walnut: ${walnutFix[1]} records`);
  
  // Fix peanut - allow roasted varieties
  const peanutFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'peanut'
      AND description NOT ILIKE '%peanut%'
  `);
  console.log(`   ✅ Fixed peanut: ${peanutFix[1]} records`);
  
  // Fix water - allow flavored varieties
  const waterFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'water'
      AND description NOT ILIKE '%water%'
  `);
  console.log(`   ✅ Fixed water: ${waterFix[1]} records`);
  
  // Fix olive oil - allow extra virgin
  const oliveOilFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'olive oil'
      AND description NOT ILIKE '%olive oil%'
  `);
  console.log(`   ✅ Fixed olive oil: ${oliveOilFix[1]} records`);
  
  // Fix unsalted butter - remove recipe text
  const unsaltedButterFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'unsalted butter'
      AND (description LIKE '%Pure%' OR description LIKE '%tablespoons%' OR description LIKE '%cup%')
  `);
  console.log(`   ✅ Fixed unsalted butter: ${unsaltedButterFix[1]} records`);
  
  // Fix bittersweet chocolate - remove recipe text
  const chocolateFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'bittersweet chocolate'
      AND (description LIKE '%Pure%' OR description LIKE '%ounces%' OR description LIKE '%cup%')
  `);
  console.log(`   ✅ Fixed bittersweet chocolate: ${chocolateFix[1]} records`);
  
  // Fix dijon mustard - remove recipe text
  const dijonFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'dijon mustard'
      AND (description LIKE '%Pure%' OR description LIKE '%tablespoons%' OR description LIKE '%teaspoon%')
  `);
  console.log(`   ✅ Fixed dijon mustard: ${dijonFix[1]} records`);
  
  // Fix kosher salt - remove recipe text
  const kosherSaltFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'kosher salt'
      AND (description LIKE '%kosher salt%' OR description LIKE '%Pure%')
  `);
  console.log(`   ✅ Fixed kosher salt: ${kosherSaltFix[1]} records`);
  
  // Fix granulated sugar - remove recipe text
  const granulatedSugarFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'granulated sugar'
      AND (description LIKE '%granulated sugar%' OR description LIKE '%Pure%')
  `);
  console.log(`   ✅ Fixed granulated sugar: ${granulatedSugarFix[1]} records`);
  
  // Fix black pepper - remove recipe text
  const blackPepperFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'black pepper'
      AND (description LIKE '%Pure%' OR description LIKE '%tablespoons%' OR description LIKE '%teaspoon%')
  `);
  console.log(`   ✅ Fixed black pepper: ${blackPepperFix[1]} records`);
  
  // Fix brown sugar - remove recipe text
  const brownSugarFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'brown sugar'
      AND (description LIKE '%Pure%' OR description LIKE '%tablespoons%' OR description LIKE '%teaspoon%')
  `);
  console.log(`   ✅ Fixed brown sugar: ${brownSugarFix[1]} records`);
  
  // Fix powdered sugar - remove recipe text
  const powderedSugarFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'powdered sugar'
      AND (description LIKE '%powdered sugar%' OR description LIKE '%Pure%')
  `);
  console.log(`   ✅ Fixed powdered sugar: ${powderedSugarFix[1]} records`);
  
  // Fix baking soda - remove recipe text
  const bakingSodaFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'baking soda'
      AND (description LIKE '%baking soda%' OR description LIKE '%Pure%')
  `);
  console.log(`   ✅ Fixed baking soda: ${bakingSodaFix[1]} records`);
  
  // Fix cornstarch - remove recipe text
  const cornstarchFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'cornstarch'
      AND (description LIKE '%cornstarch%' OR description LIKE '%Pure%')
  `);
  console.log(`   ✅ Fixed cornstarch: ${cornstarchFix[1]} records`);
  
  // Fix vegetable oil - remove recipe text
  const vegetableOilFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'vegetable oil'
      AND (description LIKE '%Pure%' OR description LIKE '%tablespoons%' OR description LIKE '%cup%')
  `);
  console.log(`   ✅ Fixed vegetable oil: ${vegetableOilFix[1]} records`);
  
  // Fix sesame oil - remove recipe text
  const sesameOilFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'sesame oil'
      AND (description LIKE '%sesame oil%' OR description LIKE '%Pure%')
  `);
  console.log(`   ✅ Fixed sesame oil: ${sesameOilFix[1]} records`);
  
  // Fix coconut oil - remove recipe text
  const coconutOilFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'coconut oil'
      AND (description LIKE '%coconut oil%' OR description LIKE '%Pure%')
  `);
  console.log(`   ✅ Fixed coconut oil: ${coconutOilFix[1]} records`);
  
  // Fix maple syrup - remove recipe text
  const mapleSyrupFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'maple syrup'
      AND (description LIKE '%Pure%' OR description LIKE '%cup%' OR description LIKE '%tablespoons%')
  `);
  console.log(`   ✅ Fixed maple syrup: ${mapleSyrupFix[1]} records`);
  
  // Fix agave nectar - remove recipe text
  const agaveFix = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" = 'agave nectar'
      AND (description LIKE '%Pure%' OR description LIKE '%cup%' OR description LIKE '%teaspoons%')
  `);
  console.log(`   ✅ Fixed agave nectar: ${agaveFix[1]} records`);
  
  // Step 3: Remove obviously wrong mappings
  console.log('\n🧹 STEP 3: Removing obviously wrong mappings...');
  
  const wrongMappings = await db.query(`
    UPDATE "IngredientCategorized" 
    SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
    WHERE "canonicalTag" IS NOT NULL
      AND (
        -- Products that don't contain their canonical tag
        description NOT ILIKE '%' || "canonicalTag" || '%'
        OR
        -- Products that are clearly wrong
        ("canonicalTag" = 'milk' AND description ILIKE '%chocolate%')
        OR ("canonicalTag" = 'butter' AND description ILIKE '%peanut butter%')
        OR ("canonicalTag" = 'yogurt' AND description ILIKE '%almond%')
        OR ("canonicalTag" = 'lemon' AND description ILIKE '%lemonade%')
        OR ("canonicalTag" = 'mayonnaise' AND description ILIKE '%aioli%')
        OR ("canonicalTag" = 'parmesan cheese' AND description ILIKE '%romano%')
        OR ("canonicalTag" = 'heavy cream' AND description ILIKE '%half%')
        OR ("canonicalTag" = 'sour cream' AND description ILIKE '%soursop%')
        OR ("canonicalTag" = 'cream cheese' AND description ILIKE '%whipped%')
        OR ("canonicalTag" = 'garlic' AND description ILIKE '%powder%')
        OR ("canonicalTag" = 'bell pepper' AND description NOT ILIKE '%bell pepper%')
        OR ("canonicalTag" = 'carrot' AND description ILIKE '%baby%')
        OR ("canonicalTag" = 'potato' AND description ILIKE '%sweet%')
        OR ("canonicalTag" = 'onion' AND description ILIKE '%salsa%')
        OR ("canonicalTag" = 'chicken breast' AND description ILIKE '%tender%')
        OR ("canonicalTag" = 'ground beef' AND description ILIKE '%lean%')
        OR ("canonicalTag" = 'bacon' AND description ILIKE '%turkey%')
        OR ("canonicalTag" = 'ham' AND description ILIKE '%turkey%')
        OR ("canonicalTag" = 'salmon' AND description ILIKE '%smoked%')
        OR ("canonicalTag" = 'shrimp' AND description ILIKE '%prawn%')
        OR ("canonicalTag" = 'rice' AND description ILIKE '%brown%')
        OR ("canonicalTag" = 'pasta' AND description ILIKE '%whole wheat%')
        OR ("canonicalTag" = 'honey' AND description ILIKE '%raw%')
        OR ("canonicalTag" = 'vinegar' AND description ILIKE '%balsamic%')
        OR ("canonicalTag" = 'soy sauce' AND description ILIKE '%tamari%')
        OR ("canonicalTag" = 'ketchup' AND description ILIKE '%organic%')
        OR ("canonicalTag" = 'mustard' AND description ILIKE '%dijon%')
        OR ("canonicalTag" = 'almond' AND description ILIKE '%sliced%')
        OR ("canonicalTag" = 'walnut' AND description ILIKE '%chopped%')
        OR ("canonicalTag" = 'peanut' AND description ILIKE '%butter%')
      )
  `);
  
  console.log(`   ✅ Removed ${wrongMappings[1]} obviously wrong mappings`);
  
  // Step 4: Final verification
  console.log('\n🔍 STEP 4: Running final verification...');
  
  const finalCount = await db.query(`
    SELECT COUNT(*) as count
    FROM "IngredientCategorized" 
    WHERE "canonicalTag" IS NOT NULL
  `, { type: Sequelize.QueryTypes.SELECT });
  
  console.log(`   📊 Final tagged products: ${finalCount[0].count}`);
  
  // Get top ingredients by count
  const topRecipeIngredients = await db.query(`
    SELECT "canonicalTag", COUNT(*) as count
    FROM "IngredientCategorized" 
    WHERE "canonicalTag" IS NOT NULL
    GROUP BY "canonicalTag"
    ORDER BY count DESC
    LIMIT 10
  `, { type: Sequelize.QueryTypes.SELECT });
  
  console.log('\n📊 TOP INGREDIENTS AFTER FIXES:');
  topRecipeIngredients.forEach((ingredient, index) => {
    console.log(`   ${index + 1}. ${ingredient.canonicalTag}: ${ingredient.count} products`);
  });
  
  console.log('\n✅ COMPREHENSIVE FIXES COMPLETE!');
  console.log('   🎯 Ready for re-verification');
  
  process.exit(0);
}

comprehensiveFixProductMappings(); 