const db = require('../../db/database.js');
const IngredientToCanonical = require('../../db/models/IngredientToCanonical.js');
const CanonicalIngredient = require('../../db/models/CanonicalIngredient.js');
const Food = require('../../db/models/Food.js');
const { Op } = require('sequelize');
const fs = require('fs');
const { isCleanIngredientName } = require('./validate_clean_ingredient_name');

// Frequently unmapped ingredients from the audit (appear in 3+ recipes)
const FREQUENTLY_UNMAPPED = [
  'agave nectar',
  'almond butter',
  'smoked paprika',
  'salt ground pepper',
  'fluid juice',
  'cans tomatoes',
  'almond paste',
  'ground almonds',
  'uncooked rice',
  'elbow macaroni',
  'bay leaves',
  'pine nuts',
  'mirin',
  'sake',
  'clam juice',
  'tomato paste',
  'confectioners sugar',
  'brown sugar',
  'soy sauce',
  'dijon mustard',
  'lemon pepper seasoning',
  'creole seasoning'
];

// Additional common unmapped ingredients from recent audit
const COMMON_UNMAPPED = [
  'cooked and shelled shrimp',
  'cooked shelled shrimp',
  'minced dill',
  'heavy cream, whipped',
  'softened cream cheese',
  'canned pumpkin',
  'coarse sea salt',
  'lemon, thinly sliced',
  'olive oil, divided',
  'sweet onion, thinly sliced',
  'red bell peppers',
  'french bread, toasted',
  'vine-ripened tomato',
  'fresh parsley leaves',
  'medium-large onion',
  'eggplant',
  'yellow squash',
  'zucchini',
  'fresh thyme leaves',
  'baby spinach',
  'radicchio',
  'pine nuts, toasted',
  'finely grated lemon peel',
  'whole coriander seeds',
  'romaine lettuce',
  'frozen puff pastry',
  'brie cheese',
  'seedless raspberry jam',
  'catfish fillets',
  'garlic herb seasoning blend',
  'shredded carrot',
  'chinese cooking wine',
  'grated fresh ginger',
  'glutinous rice',
  'chinese cabbage',
  'ground pork',
  'frozen cooked shrimp',
  'oil and vinegar salad dressing',
  'bottled clam juice',
  'fresh crabmeat',
  'old bay seasoning',
  'clam-tomato juice',
  'fresh basil',
  'asparagus, trimmed',
  'spicy brown mustard',
  'finely grated lemon peel',
  'whole side of salmon',
  'bacon, crumbled',
  'confectioners sugar, or as needed',
  'white sugar, or to taste',
  'bittersweet chocolate',
  'semisweet chocolate',
  'tomato juice',
  'garlic, crushed'
];

// Replace ALL_INGREDIENTS_TO_ADD with reviewed mappings
const ALL_INGREDIENTS_TO_ADD = [
  { messy: 'cream of mushroom soup', canonical: 'cream of mushroom soup' },
  { messy: 'cream of chicken soup', canonical: 'cream of chicken soup' },
  { messy: 'apple juice', canonical: 'apple juice' },
  { messy: 'fennel', canonical: 'fennel' },
  { messy: 'cannellini beans', canonical: 'cannellini beans' },
  { messy: 'sun-dried tomato', canonical: 'sun-dried tomato' },
  { messy: 'sherry vinegar', canonical: 'sherry vinegar' },
  { messy: 'condensed tomato soup', canonical: 'condensed tomato soup' },
  { messy: 'tomato juice', canonical: 'tomato juice' },
  { messy: 'bean sprouts', canonical: 'bean sprouts' },
  { messy: 'corn oil', canonical: 'corn oil' },
  { messy: 'prosciutto', canonical: 'prosciutto' },
  { messy: 'mexican cheese blend', canonical: 'mexican cheese blend' },
];

async function addFrequentlyUnmappedMappings() {
  await db.authenticate();
  
  console.log('🔧 Starting to add mappings for frequently unmapped ingredients...\n');
  console.log(`Processing ${ALL_INGREDIENTS_TO_ADD.length} ingredients...\n`);
  
  let createdCanonicals = 0;
  let foundCanonicals = 0;
  let createdMappings = 0;
  let skippedMappings = 0;
  let updatedProducts = 0;
  let log = [];
  
  for (const mapping of ALL_INGREDIENTS_TO_ADD) {
    const ingredient = mapping.messy;
    const canonicalName = mapping.canonical;
    try {
      if (!isCleanIngredientName(ingredient)) {
        log.push(`Skipped: ${ingredient} (not a clean ingredient name)`);
        continue;
      }
      let canonical = await CanonicalIngredient.findOne({
        where: { name: { [Op.iLike]: canonicalName } }
      });
      if (!canonical) {
        canonical = await CanonicalIngredient.create({
          name: canonicalName,
          aliases: []
        });
        createdCanonicals++;
        log.push(`Created canonical: ${canonicalName}`);
        console.log(`  ✅ Created canonical: ${canonicalName}`);
      } else {
        foundCanonicals++;
        console.log(`  Found canonical: ${canonicalName} (ID: ${canonical.id})`);
      }
      const existingMapping = await IngredientToCanonical.findOne({
        where: { messyName: ingredient, CanonicalIngredientId: canonical.id }
      });
      if (!existingMapping) {
        await IngredientToCanonical.create({
          messyName: ingredient,
          CanonicalIngredientId: canonical.id
        });
        createdMappings++;
        log.push(`Added mapping: ${ingredient} -> ${canonicalName}`);
        console.log(`  ✅ Mapped: ${ingredient} -> ${canonicalName}`);
      } else {
        skippedMappings++;
        console.log(`  ⚠️  Mapping already exists for: ${ingredient} -> ${canonicalName}`);
      }
      // (Optional: update products as before)
    } catch (error) {
      log.push(`Error processing ${ingredient}: ${error.message}`);
      console.log(`  ❌ Error processing ${ingredient}: ${error.message}`);
    }
  }
  
  // Write log to file
  fs.writeFileSync('server/scripts/data-processing/add_frequently_unmapped.log', log.join('\n'));
  
  console.log('\n📊 Summary:');
  console.log(`  Canonical ingredients: ${foundCanonicals} found, ${createdCanonicals} created`);
  console.log(`  Mappings: ${createdMappings} created, ${skippedMappings} skipped`);
  console.log(`  Products updated: ${updatedProducts}`);
  console.log(`  Total ingredients processed: ${ALL_INGREDIENTS_TO_ADD.length}`);
  
  // Verify results
  console.log('\n🔍 Verifying results...');
  
  const totalMappings = await IngredientToCanonical.count();
  const brokenMappings = await IngredientToCanonical.count({
    where: { CanonicalIngredientId: null }
  });
  
  console.log(`  Total mappings: ${totalMappings}`);
  console.log(`  Broken mappings: ${brokenMappings}`);
  console.log(`  Working mappings: ${totalMappings - brokenMappings}`);
  
  // Test a few key ingredients
  const testIngredients = ['agave nectar', 'almond butter', 'smoked paprika', 'bay leaves'];
  for (const testIngredient of testIngredients) {
    const mapping = await IngredientToCanonical.findOne({
      where: { messyName: testIngredient }
    });
    
    if (mapping && mapping.CanonicalIngredientId) {
      const canonical = await CanonicalIngredient.findByPk(mapping.CanonicalIngredientId);
      const products = await Food.count({
        where: { canonicalTag: canonical.name }
      });
      console.log(`  ✅ ${testIngredient}: ${products} products found`);
    } else {
      console.log(`  ❌ ${testIngredient}: No mapping found`);
    }
  }
  
  console.log('\n🎉 Frequently unmapped ingredients mapping completed!');
  console.log('📝 Log saved to: server/scripts/data-processing/add_frequently_unmapped.log');
  
  await db.close();
}

addFrequentlyUnmappedMappings().catch(console.error); 