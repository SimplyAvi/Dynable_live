const { CanonicalIngredient, IngredientToCanonical } = require('./db/models');

async function fixRemainingWhalerMappings() {
  try {
    console.log('🔧 Adding canonical mappings for remaining Whaler Fish Sandwich ingredients...');
    
    // Ingredients that need canonical mappings
    const missingMappings = [
      { messyName: 'chopped parsley', canonicalName: 'parsley' },
      { messyName: 'flounder fillets', canonicalName: 'flounder' },
      { messyName: 'sesame- hamburger buns', canonicalName: 'hamburger buns' },
      { messyName: 'leaves romaine lettuce', canonicalName: 'romaine lettuce' },
      { messyName: 'tomato, sliced', canonicalName: 'tomato' },
      { messyName: 'slices mild cheese, such as mild cheddar', canonicalName: 'cheddar cheese' }
    ];
    
    for (const mapping of missingMappings) {
      try {
        // Find or create the canonical ingredient
        const [canonical, created] = await CanonicalIngredient.findOrCreate({
          where: { name: mapping.canonicalName },
          defaults: { name: mapping.canonicalName, allergens: [] }
        });
        
        if (created) {
          console.log(`✅ Created canonical ingredient: ${mapping.canonicalName}`);
        }
        
        // Add the mapping
        const [ingredientMapping, mappingCreated] = await IngredientToCanonical.findOrCreate({
          where: { 
            messyName: mapping.messyName.toLowerCase(),
            CanonicalIngredientId: canonical.id
          },
          defaults: {
            messyName: mapping.messyName.toLowerCase(),
            CanonicalIngredientId: canonical.id
          }
        });
        
        if (mappingCreated) {
          console.log(`✅ Added mapping: "${mapping.messyName}" → "${mapping.canonicalName}"`);
        } else {
          console.log(`⚠️  Mapping already exists: "${mapping.messyName}" → "${mapping.canonicalName}"`);
        }
        
      } catch (error) {
        console.error(`❌ Error adding mapping for ${mapping.messyName}:`, error.message);
      }
    }
    
    console.log('\n🎉 Remaining Whaler Fish Sandwich mappings complete!');
    
  } catch (error) {
    console.error('Error fixing remaining Whaler mappings:', error);
  }
}

fixRemainingWhalerMappings(); 