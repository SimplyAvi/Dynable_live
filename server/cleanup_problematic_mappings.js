const db = require('./db/database');

async function cleanupProblematicMappings() {
  console.log('🧹 CLEANUP PROBLEMATIC MAPPINGS\n');
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');

    // Patterns for problematic mappings
    const recipePatterns = [
      /pounds?\s+/i, /teaspoons?\s+/i, /tablespoons?\s+/i, /cups?\s+/i, /ounces?\s+/i, /grams?\s+/i,
      /chopped\s+/i, /diced\s+/i, /sliced\s+/i, /minced\s+/i, /peeled\s+/i, /seeded\s+/i, /cut into\s+/i,
      /quartered\s+/i, /halved\s+/i, /thinly\s+/i, /coarsely\s+/i, /finely\s+/i, /roughly\s+/i, /about\s+/i,
      /such as\s+/i, /divided\s+/i, /optional\s+/i, /or more to taste/i, /for garnish/i, /reserved/i
    ];
    const genericTerms = [
      'recipe', 'slice', 'stick', 'spray', 'powder', 'seeds', 'spice', 'stock',
      'solution', 'soda', 'salad', 'servings', 'toppings', 'tortillas', 'twist',
      'vegetables', 'wedge', 'wheel', 'wrap', 'threads', 'shavings', 'shells'
    ];
    const suspiciousPatterns = [
      /^\d+\//, /^\d+\s*[a-z]+/, /^[a-z]+\s+\d+/, /^\d+$/, /^[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+/i
    ];
    const measurementPattern = /\d+\s*(pound|teaspoon|tablespoon|cup|ounce|gram|ml|g|kg|lb)/i;

    // Get all mappings
    const mappings = await db.query(`
      SELECT id, "messyName" FROM "IngredientToCanonicals"
    `, { type: db.QueryTypes.SELECT });

    let toDelete = [];
    mappings.forEach(mapping => {
      const messy = mapping.messyName.toLowerCase();
      if (
        recipePatterns.some(p => p.test(messy)) ||
        genericTerms.includes(messy) ||
        suspiciousPatterns.some(p => p.test(messy)) ||
        measurementPattern.test(messy)
      ) {
        toDelete.push(mapping.id);
      }
    });

    if (toDelete.length === 0) {
      console.log('✅ No problematic mappings found.');
      await db.close();
      return;
    }

    // Delete problematic mappings in batches
    const batchSize = 500;
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      await db.query(`DELETE FROM "IngredientToCanonicals" WHERE id IN (${batch.join(',')})`);
      console.log(`   🗑️ Deleted ${batch.length} problematic mappings...`);
    }
    console.log(`\n✅ Cleanup complete. Deleted ${toDelete.length} problematic mappings.`);
    await db.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await db.close();
  }
}

cleanupProblematicMappings(); 