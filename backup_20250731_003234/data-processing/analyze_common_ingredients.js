const db = require('./db/database');

async function analyzeCommonIngredients() {
  try {
    console.log('🔍 ANALYZING COMMON INGREDIENTS');
    console.log('Finding ingredients that appear more than 10 times...\n');

    // Get ingredient frequency
    const ingredientFrequency = await db.query(`
      SELECT 
        i.name,
        COUNT(*) as frequency,
        COUNT(DISTINCT i."RecipeId") as unique_recipes
      FROM "Ingredients" i
      GROUP BY i.name
      HAVING COUNT(*) > 10
      ORDER BY frequency DESC
      LIMIT 50
    `, { type: require('sequelize').QueryTypes.SELECT });

    console.log('📊 TOP 50 MOST COMMON INGREDIENTS (>10 occurrences):');
    console.log('==================================================');
    
    let totalOccurrences = 0;
    let mappedIngredients = 0;
    let unmappedIngredients = [];

    for (const ingredient of ingredientFrequency) {
      totalOccurrences += ingredient.frequency;
      
      // Check if this ingredient has a canonical mapping
      const canonicalMapping = await db.query(`
        SELECT f."canonicalTag", f."canonicalTagConfidence"
        FROM "Food" f
        WHERE LOWER(REPLACE(f."canonicalTag", ' ', '')) = LOWER(REPLACE(:ingredientName, ' ', ''))
        AND f."canonicalTagConfidence" = 'confident'
        LIMIT 1
      `, { 
        replacements: { ingredientName: ingredient.name },
        type: require('sequelize').QueryTypes.SELECT 
      });

      if (canonicalMapping.length > 0) {
        mappedIngredients += ingredient.frequency;
        console.log(`✅ ${ingredient.name}: ${ingredient.frequency} times (${ingredient.unique_recipes} recipes) → ${canonicalMapping[0].canonicalTag}`);
      } else {
        unmappedIngredients.push(ingredient);
        console.log(`❌ ${ingredient.name}: ${ingredient.frequency} times (${ingredient.unique_recipes} recipes) → NO MAPPING`);
      }
    }

    console.log('\n📈 COVERAGE SUMMARY:');
    console.log('====================');
    console.log(`Total occurrences: ${totalOccurrences}`);
    console.log(`Mapped occurrences: ${mappedIngredients}`);
    console.log(`Unmapped occurrences: ${totalOccurrences - mappedIngredients}`);
    console.log(`Mapping coverage: ${((mappedIngredients / totalOccurrences) * 100).toFixed(1)}%`);

    console.log('\n🎯 TOP UNMAPPED INGREDIENTS TO TARGET:');
    console.log('=====================================');
    unmappedIngredients.slice(0, 20).forEach((ingredient, index) => {
      console.log(`${index + 1}. ${ingredient.name} (${ingredient.frequency} times, ${ingredient.unique_recipes} recipes)`);
    });

    // Also check for ingredients that might be variations of common ones
    console.log('\n🔍 POTENTIAL VARIATIONS TO CHECK:');
    console.log('================================');
    const potentialVariations = await db.query(`
      SELECT 
        i.name,
        COUNT(*) as frequency
      FROM "Ingredients" i
      WHERE i.name ILIKE '%egg%' 
         OR i.name ILIKE '%flour%'
         OR i.name ILIKE '%milk%'
         OR i.name ILIKE '%butter%'
         OR i.name ILIKE '%salt%'
         OR i.name ILIKE '%sugar%'
         OR i.name ILIKE '%oil%'
         OR i.name ILIKE '%cheese%'
         OR i.name ILIKE '%tomato%'
         OR i.name ILIKE '%onion%'
      GROUP BY i.name
      HAVING COUNT(*) > 5
      ORDER BY frequency DESC
      LIMIT 20
    `, { type: require('sequelize').QueryTypes.SELECT });

    potentialVariations.forEach(variation => {
      console.log(`- ${variation.name} (${variation.frequency} times)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

analyzeCommonIngredients(); 