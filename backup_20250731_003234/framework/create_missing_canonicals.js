const db = require('./db/database.js');

async function createMissingCanonicals() {
  try {
    await db.authenticate();
    const Ingredient = require('./db/models/Ingredient.js');
    
    console.log('🔧 Creating missing canonical ingredients...\n');
    
    const missingCanonicals = [
      { name: 'honey mustard', allergens: [] },
      { name: 'swiss cheese', allergens: ['milk'] },
      { name: 'quinoa', aliases: ['quinoa', 'red quinoa', 'white quinoa', 'black quinoa', 'quinoa grain', 'uncooked quinoa', 'cooked quinoa', 'quinoa, rinsed', 'quinoa, cooked', 'quinoa, uncooked'], allergens: [] }
    ];
    
    for (const canonical of missingCanonicals) {
      console.log(`Creating canonical ingredient: "${canonical.name}"`);
      
      // Check if it already exists
      const existing = await Ingredient.findOne({
        where: { name: canonical.name }
      });
      
      if (existing) {
        console.log(`  ✅ Already exists (ID: ${existing.id})`);
        // Add aliases if missing
        if (canonical.aliases && (!existing.aliases || existing.aliases.length === 0)) {
          existing.aliases = canonical.aliases;
          await existing.save();
          console.log(`  ✅ Aliases added: ${canonical.aliases.join(', ')}`);
        }
      } else {
        const newCanonical = await Ingredient.create({
          name: canonical.name,
          allergens: canonical.allergens,
          aliases: canonical.aliases || []
        });
        console.log(`  ✅ Created (ID: ${newCanonical.id})`);
      }
    }
    
    // Add IngredientToCanonical mappings for quinoa
    const IngredientToCanonical = require('./db/models/IngredientToCanonical.js');
    const quinoaCanonical = await Ingredient.findOne({ where: { name: 'quinoa' } });
    if (quinoaCanonical) {
      const quinoaMappings = [
        'quinoa', 'uncooked quinoa', 'cooked quinoa', 'quinoa, rinsed', 'quinoa, cooked', 'quinoa, uncooked', 'red quinoa', 'white quinoa', 'black quinoa', 'quinoa grain'
      ];
      for (const messyName of quinoaMappings) {
        const existingMapping = await IngredientToCanonical.findOne({ where: { messyName } });
        if (!existingMapping) {
          await IngredientToCanonical.create({ messyName, IngredientId: quinoaCanonical.id });
          console.log(`  ✅ Mapping added: ${messyName} -> quinoa`);
        }
      }
    }
    // Add a IngredientCategorized product for quinoa (real/pure)
    const IngredientCategorized = require('./db/models/IngredientCategorized.js');
    const existingIngredientCategorized = await IngredientCategorized.findOne({ where: { description: '100% natural white quinoa' } });
    if (!existingIngredientCategorized) {
      await IngredientCategorized.create({
        description: '100% natural white quinoa',
        brandOwner: "Nature's Best",
        brandName: "Nature's Best",
        canonicalTag: 'quinoa',
        canonicalTagConfidence: 'confident',
        foodClass: 'Grain',
        servingSize: 45,
        servingSizeUnit: 'g',
        shortDescription: 'Pure white quinoa',
        dataType: 'Branded',
        // Add other fields as needed
      });
      console.log('  ✅ IngredientCategorized product added: 100% natural white quinoa');
    }
    
    console.log('\n🎉 Missing canonical ingredients created!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

createMissingCanonicals(); 