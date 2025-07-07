const db = require('./db/database.js');

async function createMissingCanonicals() {
  try {
    await db.authenticate();
    const CanonicalIngredient = require('./db/models/CanonicalIngredient.js');
    
    console.log('🔧 Creating missing canonical ingredients...\n');
    
    const missingCanonicals = [
      { name: 'honey mustard', allergens: [] },
      { name: 'swiss cheese', allergens: ['milk'] }
    ];
    
    for (const canonical of missingCanonicals) {
      console.log(`Creating canonical ingredient: "${canonical.name}"`);
      
      // Check if it already exists
      const existing = await CanonicalIngredient.findOne({
        where: { name: canonical.name }
      });
      
      if (existing) {
        console.log(`  ✅ Already exists (ID: ${existing.id})`);
      } else {
        const newCanonical = await CanonicalIngredient.create({
          name: canonical.name,
          allergens: canonical.allergens
        });
        console.log(`  ✅ Created (ID: ${newCanonical.id})`);
      }
    }
    
    console.log('\n🎉 Missing canonical ingredients created!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

createMissingCanonicals(); 