const { Food, CanonicalIngredient, IngredientToCanonical } = require('../../db/models');
const { sequelize } = require('../../db/database');

async function addComplexIngredientMappings() {
  try {
    console.log('🔍 Adding mappings for complex ingredient descriptors...\n');

    // Complex ingredient mappings: messyName -> canonicalName
    const complexMappings = [
      // Processed foods and descriptors
      { messy: 'store bought hummus', canonical: 'hummus' },
      { messy: 'fine quality bittersweet chocolate chopped', canonical: 'chocolate' },
      { messy: 'baker\'s semi sweet chocolate', canonical: 'chocolate' },
      { messy: 'double acting baking powder', canonical: 'baking powder' },
      { messy: 'frozen pound cake thawed', canonical: 'pound cake' },
      { messy: 'cooked frozen breaded chicken chopped', canonical: 'breaded chicken' },
      { messy: 'smoke flavored almonds finely chopped', canonical: 'almonds' },
      { messy: 'blanched almonds toasted lightly', canonical: 'almonds' },
      { messy: 'warm water )', canonical: 'water' },
      { messy: 'recipe pastry for a single pie crust', canonical: 'pie crust' },
      { messy: 'recipe pastry for a double crust pie', canonical: 'pie crust' },
      { messy: 'simmered rice', canonical: 'rice' },
      { messy: 'carrots cut slices', canonical: 'carrots' },
      { messy: 'red potatoes quartered and cut', canonical: 'potatoes' },
      
      // Campbell's soups (generic equivalents)
      { messy: 'campbell\'s condensed cream mushroom soup', canonical: 'cream of mushroom soup' },
      { messy: 'campbell\'s condensed cream chicken soup', canonical: 'cream of chicken soup' },
      { messy: 'campbell\'s condensed cream chicken with herbs soup', canonical: 'cream of chicken soup' },
      { messy: 'campbell\'s tomato juice tomato juice', canonical: 'tomato juice' },
      
      // Yeast (generic)
      { messy: 'fleischmann\'s rapidrise yeast', canonical: 'rapidrise yeast' },
      
      // Ignore: brand-specific requests, frozen blends, etc.
      // These will remain unmapped as intended
    ];

    let addedMappings = 0;
    let skippedMappings = 0;

    for (const mapping of complexMappings) {
      try {
        // Check if canonical exists
        const canonical = await CanonicalIngredient.findOne({
          where: { name: mapping.canonical }
        });

        if (!canonical) {
          console.log(`⚠️  Canonical '${mapping.canonical}' not found - skipping mapping`);
          skippedMappings++;
          continue;
        }

        // Check if mapping already exists
        const existingMapping = await IngredientToCanonical.findOne({
          where: { 
            messyName: mapping.messy,
            CanonicalIngredientId: canonical.id
          }
        });

        if (existingMapping) {
          console.log(`ℹ️  Mapping already exists: '${mapping.messy}' -> '${mapping.canonical}'`);
          continue;
        }

        // Add the mapping
        await IngredientToCanonical.create({
          messyName: mapping.messy,
          CanonicalIngredientId: canonical.id
        });

        addedMappings++;
        console.log(`✅ Added mapping: '${mapping.messy}' -> '${mapping.canonical}'`);

      } catch (error) {
        console.log(`❌ Error adding mapping for '${mapping.messy}': ${error.message}`);
        skippedMappings++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Added ${addedMappings} new mappings`);
    console.log(`   Skipped ${skippedMappings} mappings (missing canonicals or errors)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

addComplexIngredientMappings(); 