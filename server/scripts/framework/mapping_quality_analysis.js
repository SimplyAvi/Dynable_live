const db = require('./db/database.js');

async function mappingQualityAnalysis() {
  try {
    await db.authenticate();
    const IngredientToCanonical = require('./db/models/IngredientToCanonical.js');
    const RecipeIngredient = require('./db/models/Recipe/RecipeIngredient.js');
    const Recipe = require('./db/models/Recipe/Recipe.js');
    
    console.log('🔍 Starting comprehensive mapping quality analysis...\n');
    
    // 1. Analyze overly long/messy mapped names
    console.log('📏 Analyzing overly long/messy mapped names...');
    const longMappings = await IngredientToCanonical.findAll({
      where: db.Sequelize.literal('LENGTH("messyName") > 60 OR array_length(string_to_array("messyName", \' \'), 1) > 10'),
      order: [['messyName', 'ASC']]
    });
    
    console.log(`  Found ${longMappings.length} overly long/messy mappings`);
    console.log('  Sample long mappings:');
    for (let i = 0; i < Math.min(5, longMappings.length); i++) {
      const mapping = longMappings[i];
      const canonical = await RecipeIngredient.findByPk(mapping.IngredientId);
      console.log(`    - "${mapping.messyName}" (${mapping.messyName.length} chars, ${mapping.messyName.split(' ').length} words) → ${canonical ? canonical.name : 'Unknown'}`);
    }
    
    // 2. Analyze low-value mappings (measurements, numbers, etc.)
    console.log('\n📊 Analyzing low-value mappings...');
    const lowValuePatterns = [
      /^\d+/, // starts with number
      /^\d+\/\d+/, // fractions
      /^(cup|tbsp|tsp|oz|lb|g|ml|tablespoon|teaspoon|ounce|pound|gram|milliliter)/, // measurements
      /^(large|small|medium|extra|whole|half|quarter)/, // size descriptors
      /^(fresh|dried|frozen|raw|cooked|baked|roasted)/, // state descriptors
      /^(sliced|chopped|minced|diced|grated|shredded)/, // prep descriptors
    ];
    
    const allMappings = await IngredientToCanonical.findAll();
    const lowValueMappings = [];
    
    for (const mapping of allMappings) {
      for (const pattern of lowValuePatterns) {
        if (pattern.test(mapping.messyName)) {
          lowValueMappings.push(mapping);
          break;
        }
      }
    }
    
    console.log(`  Found ${lowValueMappings.length} potentially low-value mappings`);
    console.log('  Sample low-value mappings:');
    for (let i = 0; i < Math.min(5, lowValueMappings.length); i++) {
      const mapping = lowValueMappings[i];
      const canonical = await RecipeIngredient.findByPk(mapping.IngredientId);
      console.log(`    - "${mapping.messyName}" → ${canonical ? canonical.name : 'Unknown'}`);
    }
    
    // 3. Analyze canonical ingredient mapping distribution
    console.log('\n📈 Analyzing canonical ingredient mapping distribution...');
    const canonicalStats = await db.query(`
      SELECT 
        ci.name as canonical_name,
        COUNT(itc.id) as mapping_count
      FROM "CanonicalRecipeIngredients" ci
      LEFT JOIN "IngredientToCanonicals" itc ON ci.id = itc."IngredientId"
      GROUP BY ci.id, ci.name
      ORDER BY mapping_count DESC
    `, { type: db.QueryTypes.SELECT });
    
    const overMapped = canonicalStats.filter(stat => stat.mapping_count > 50);
    const underMapped = canonicalStats.filter(stat => stat.mapping_count < 3);
    const unmapped = canonicalStats.filter(stat => stat.mapping_count === 0);
    
    console.log(`  Canonical ingredients with >50 mappings: ${overMapped.length}`);
    console.log(`  Canonical ingredients with <3 mappings: ${underMapped.length}`);
    console.log(`  Canonical ingredients with 0 mappings: ${unmapped.length}`);
    
    console.log('  Most over-mapped canonicals:');
    overMapped.slice(0, 5).forEach(stat => {
      console.log(`    - ${stat.canonical_name}: ${stat.mapping_count} mappings`);
    });
    
    console.log('  Most under-mapped canonicals:');
    underMapped.slice(0, 5).forEach(stat => {
      console.log(`    - ${stat.canonical_name}: ${stat.mapping_count} mappings`);
    });
    
    // 4. Find potential duplicates/near-duplicates
    console.log('\n🔄 Analyzing potential duplicates...');
    // Skip similarity analysis for now - function not available
    console.log('  Skipping similarity analysis (function not available)');
    const potentialDuplicates = [];
    
    // Alternative: Find exact duplicates
    const exactDuplicates = await db.query(`
      SELECT 
        itc1."messyName" as name1,
        itc2."messyName" as name2,
        ci1.name as canonical1,
        ci2.name as canonical2
      FROM "IngredientToCanonicals" itc1
      JOIN "IngredientToCanonicals" itc2 ON itc1.id < itc2.id
      JOIN "CanonicalRecipeIngredients" ci1 ON itc1."IngredientId" = ci1.id
      JOIN "CanonicalRecipeIngredients" ci2 ON itc2."IngredientId" = ci2.id
      WHERE itc1."messyName" = itc2."messyName"
      ORDER BY itc1."messyName"
      LIMIT 20
    `, { type: db.QueryTypes.SELECT });
    
    console.log(`  Found ${exactDuplicates.length} exact duplicate mappings`);
    if (exactDuplicates.length > 0) {
      console.log('  Sample exact duplicates:');
      exactDuplicates.slice(0, 5).forEach(dup => {
        console.log(`    - "${dup.name1}" (${dup.canonical1}) vs "${dup.name2}" (${dup.canonical2})`);
      });
    }
    
    // 5. Find frequent unmapped ingredients
    console.log('\n❌ Analyzing frequent unmapped ingredients...');
    const recipes = await Recipe.findAll({
      include: [{ model: RecipeIngredient, as: 'RecipeIngredients' }],
      limit: 500 // Check more recipes for frequency
    });
    
    const ingredientFrequency = {};
    const unmappedRecipeIngredients = new Set();
    
    for (const recipe of recipes) {
      if (!recipe.RecipeIngredients) continue;
      for (const ingredient of recipe.RecipeIngredients) {
        if (!ingredient.name) continue;
        const cleanedName = cleanIngredientName(ingredient.name);
        if (!cleanedName) continue;
        
        ingredientFrequency[cleanedName] = (ingredientFrequency[cleanedName] || 0) + 1;
        
        // Check if mapped
        const mapping = await IngredientToCanonical.findOne({
          where: { messyName: cleanedName.toLowerCase() }
        });
        
        if (!mapping) {
          unmappedRecipeIngredients.add(cleanedName);
        }
      }
    }
    
    // Find most frequent unmapped ingredients
    const frequentUnmapped = Array.from(unmappedRecipeIngredients)
      .map(name => ({ name, frequency: ingredientFrequency[name] }))
      .filter(item => item.frequency >= 3)
      .sort((a, b) => b.frequency - a.frequency);
    
    console.log(`  Found ${frequentUnmapped.length} frequently unmapped ingredients (appears in 3+ recipes)`);
    console.log('  Most frequent unmapped ingredients:');
    frequentUnmapped.slice(0, 10).forEach(item => {
      console.log(`    - "${item.name}": appears in ${item.frequency} recipes`);
    });
    
    // Summary and recommendations
    console.log('\n📋 Summary and Recommendations:');
    console.log(`  Total mappings: ${allMappings.length}`);
    console.log(`  Overly long mappings: ${longMappings.length} (${((longMappings.length / allMappings.length) * 100).toFixed(1)}%)`);
    console.log(`  Low-value mappings: ${lowValueMappings.length} (${((lowValueMappings.length / allMappings.length) * 100).toFixed(1)}%)`);
    console.log(`  Exact duplicates: ${exactDuplicates.length}`);
    console.log(`  Frequent unmapped: ${frequentUnmapped.length}`);
    
    console.log('\n💡 Recommended Actions:');
    if (longMappings.length > 0) {
      console.log(`  1. Clean up ${longMappings.length} overly long mappings`);
    }
    if (lowValueMappings.length > 0) {
      console.log(`  2. Review ${lowValueMappings.length} potentially low-value mappings`);
    }
    if (exactDuplicates.length > 0) {
      console.log(`  3. Remove ${exactDuplicates.length} exact duplicate mappings`);
    }
    if (frequentUnmapped.length > 0) {
      console.log(`  4. Add mappings for ${frequentUnmapped.length} frequently unmapped ingredients`);
    }
    if (overMapped.length > 0) {
      console.log(`  5. Review ${overMapped.length} over-mapped canonical ingredients`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

// Helper function to clean ingredient names
function cleanIngredientName(raw) {
  if (!raw) return '';
  let cleaned = raw.toLowerCase();
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  cleaned = cleaned.replace(/optional|such as.*?\(.*?\)/g, '');
  cleaned = cleaned.replace(/(^|\s)(\d+[\/\d]*\s*)/g, ' ');
  cleaned = cleaned.replace(/(?<=\s|^)(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lb|grams?|kilograms?|kg|liters?|l|milliliters?|ml|package|can|container|envelope|slice|loaf|pinch|dash|quart|qt|pint|pt|gallon|gal|stick|clove|head|bunch|sprig|piece|sheet|bag|bottle|jar|box|packet|drop|ear|stalk|strip|cube|block|bar)(?=\s|$)/g, '');
  cleaned = cleaned.replace(/\b(sliced|chopped|fresh|dried|mild|to taste|and|drained|rinsed|peeled|seeded|halved|quartered|shredded|grated|zested|minced|mashed|crushed|diced|cubed|julienned|optional|with juice|with syrup|with liquid|in juice|in syrup|in liquid|powdered|sweetened|unsweetened|raw|cooked|baked|roasted|steamed|boiled|fried|blanched|toasted|softened|melted|room temperature|cold|warm|hot|refrigerated|frozen|thawed|defrosted|prepared|beaten|whipped|stiff|soft|firm|fine|coarse|crumbled|broken|pieces|chunks|strips|sticks|spears|tips|ends|whole|large|small|medium|extra large|extra small|thin|thick|lean|fatty|boneless|skinless|bone-in|with skin|without skin|with bone|without bone|center cut|end cut|trimmed|untrimmed|pitted|unpitted|seedless|with seeds|without seeds|cored|uncored|stemmed|destemmed|deveined|unveined|cleaned|uncleaned|split|unsplit|shelled|unshelled|hulled|unhulled|deveined|unveined|deveined|unveined|deveined|unveined)\b/g, '');
  cleaned = cleaned.replace(/\b(leaves?|slices?|pieces?|chunks?|strips?|sticks?|spears?|tips|ends?)\b/g, '');
  cleaned = cleaned.replace(/\b(yellow|white|black|red|green|orange|purple|brown|golden|pink|blue|rainbow)\b/g, '');
  cleaned = cleaned.replace(/,\s*$/, '');
  cleaned = cleaned.replace(/^\s*,\s*/, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.trim();
  return cleaned;
}

mappingQualityAnalysis(); 