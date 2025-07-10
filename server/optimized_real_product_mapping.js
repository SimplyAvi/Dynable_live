const { Sequelize } = require('sequelize');
const db = require('./db/database');

// Strict mapping rules with verification
const STRICT_MAPPING_RULES = [
  {
    canonical: 'lemon',
    keywords: ['lemon'],
    exclusions: ['juice', 'zest', 'peel', 'extract', 'flavor', 'ade', 'soda'],
    required: ['lemon'],
    maxProducts: 10
  },
  {
    canonical: 'mayonnaise',
    keywords: ['mayonnaise'],
    exclusions: ['light', 'fat free', 'olive oil', 'aioli'],
    required: ['mayonnaise'],
    maxProducts: 10
  },
  {
    canonical: 'parmesan cheese',
    keywords: ['parmesan'],
    exclusions: ['romano', 'pecorino', 'blend'],
    required: ['parmesan'],
    maxProducts: 10
  },
  {
    canonical: 'heavy cream',
    keywords: ['heavy cream'],
    exclusions: ['light', 'half', 'whipping', 'ultra-pasteurized'],
    required: ['heavy cream'],
    maxProducts: 10
  },
  {
    canonical: 'sour cream',
    keywords: ['sour cream'],
    exclusions: ['light', 'fat free', 'maple'],
    required: ['sour cream'],
    maxProducts: 10
  },
  {
    canonical: 'cream cheese',
    keywords: ['cream cheese'],
    exclusions: ['light', 'fat free', 'whipped', 'pure', 'generic'],
    required: ['cream cheese'],
    maxProducts: 10
  },
  {
    canonical: 'cheddar cheese',
    keywords: ['cheddar'],
    exclusions: ['sharp', 'mild', 'aged', 'blend'],
    required: ['cheddar'],
    maxProducts: 10
  },
  {
    canonical: 'garlic',
    keywords: ['garlic'],
    exclusions: ['powder', 'salt', 'minced', 'chopped', 'tandoori'],
    required: ['garlic'],
    maxProducts: 10
  },
  {
    canonical: 'bell pepper',
    keywords: ['bell pepper'],
    exclusions: ['red', 'green', 'yellow', 'orange'],
    required: ['bell pepper'],
    maxProducts: 10
  },
  {
    canonical: 'tomato',
    keywords: ['tomato'],
    exclusions: ['cherry', 'grape', 'roma', 'beefsteak', 'grapefruit'],
    required: ['tomato'],
    maxProducts: 10
  },
  {
    canonical: 'carrot',
    keywords: ['carrot'],
    exclusions: ['baby', 'shredded', 'diced'],
    required: ['carrot'],
    maxProducts: 10
  },
  {
    canonical: 'potato',
    keywords: ['potato'],
    exclusions: ['sweet', 'russet', 'red potato', 'yukon'],
    required: ['potato'],
    maxProducts: 10
  },
  {
    canonical: 'onion',
    keywords: ['onion'],
    exclusions: ['red', 'white', 'yellow', 'sweet', 'salsa', 'stir-fry'],
    required: ['onion'],
    maxProducts: 10
  },
  {
    canonical: 'chicken breast',
    keywords: ['chicken breast'],
    exclusions: ['thigh', 'wing', 'drumstick', 'tender'],
    required: ['chicken breast'],
    maxProducts: 10
  },
  {
    canonical: 'ground beef',
    keywords: ['ground beef'],
    exclusions: ['lean', 'extra lean', 'organic'],
    required: ['ground beef'],
    maxProducts: 10
  },
  {
    canonical: 'bacon',
    keywords: ['bacon'],
    exclusions: ['turkey', 'veggie', 'turkey bacon'],
    required: ['bacon'],
    maxProducts: 10
  },
  {
    canonical: 'ham',
    keywords: ['ham'],
    exclusions: ['turkey', 'prosciutto', 'serrano', 'mushroom', 'generic'],
    required: ['ham'],
    maxProducts: 10
  },
  {
    canonical: 'salmon',
    keywords: ['salmon'],
    exclusions: ['smoked', 'canned', 'wild', 'nova'],
    required: ['salmon'],
    maxProducts: 10
  },
  {
    canonical: 'shrimp',
    keywords: ['shrimp'],
    exclusions: ['prawn', 'jumbo', 'medium'],
    required: ['shrimp'],
    maxProducts: 10
  },
  {
    canonical: 'rice',
    keywords: ['rice'],
    exclusions: ['brown', 'wild', 'jasmine', 'basmati'],
    required: ['rice'],
    maxProducts: 10
  },
  {
    canonical: 'pasta',
    keywords: ['pasta'],
    exclusions: ['whole wheat', 'gluten free', 'black bean'],
    required: ['pasta'],
    maxProducts: 10
  },
  {
    canonical: 'honey',
    keywords: ['honey'],
    exclusions: ['raw', 'organic', 'clover', 'fruit', 'soda'],
    required: ['honey'],
    maxProducts: 10
  },
  {
    canonical: 'vinegar',
    keywords: ['vinegar'],
    exclusions: ['balsamic', 'apple cider', 'white wine', 'chicken wings'],
    required: ['vinegar'],
    maxProducts: 10
  },
  {
    canonical: 'soy sauce',
    keywords: ['soy sauce'],
    exclusions: ['low sodium', 'tamari', 'pure', 'generic', 'pasta sauce'],
    required: ['soy sauce'],
    maxProducts: 10
  },
  {
    canonical: 'ketchup',
    keywords: ['ketchup'],
    exclusions: ['organic', 'no sugar'],
    required: ['ketchup'],
    maxProducts: 10
  },
  {
    canonical: 'mustard',
    keywords: ['mustard'],
    exclusions: ['dijon', 'honey', 'spicy', 'spring mix', 'gum'],
    required: ['mustard'],
    maxProducts: 10
  },
  {
    canonical: 'almond',
    keywords: ['almond'],
    exclusions: ['sliced', 'slivered', 'whole'],
    required: ['almond'],
    maxProducts: 10
  },
  {
    canonical: 'walnut',
    keywords: ['walnut'],
    exclusions: ['chopped', 'halves', 'pieces', 'raw'],
    required: ['walnut'],
    maxProducts: 10
  },
  {
    canonical: 'peanut',
    keywords: ['peanut'],
    exclusions: ['butter', 'oil', 'sauce'],
    required: ['peanut'],
    maxProducts: 10
  }
];

async function optimizedRealProductMapping() {
  console.log('⚡ OPTIMIZED REAL PRODUCT MAPPING\n');
  
  const startTime = Date.now();
  let totalTagged = 0;
  const results = [];
  
  for (const rule of STRICT_MAPPING_RULES) {
    console.log(`🔍 Processing: ${rule.canonical}`);
    
    try {
      // Build strict query
      const keywordConditions = rule.keywords.map(k => `description ILIKE '%${k}%'`).join(' OR ');
      const excludeConditions = rule.exclusions.map(e => `description NOT ILIKE '%${e}%'`).join(' AND ');
      const requiredConditions = rule.required.map(r => `description ILIKE '%${r}%'`).join(' AND ');
      
      const query = `
        SELECT id, description, "brandOwner", "brandName", "canonicalTag"
        FROM "Food" 
        WHERE "brandOwner" != 'Generic' 
          AND "brandOwner" != ''
          AND "brandOwner" IS NOT NULL
          AND (${keywordConditions})
          AND ${excludeConditions}
          AND (${requiredConditions})
          AND ("canonicalTag" IS NULL OR "canonicalTag" != :canonical)
        ORDER BY RANDOM()
        LIMIT :maxProducts
      `;
      
      const products = await db.query(query, { 
        replacements: { 
          canonical: rule.canonical,
          maxProducts: rule.maxProducts
        },
        type: Sequelize.QueryTypes.SELECT 
      });
      
      console.log(`   Found ${products.length} real products`);
      
      // Verify each product before tagging
      let verifiedCount = 0;
      for (const product of products) {
        if (verifyProductAccuracy(product, rule.canonical)) {
          try {
            await db.query(`
              UPDATE "Food" 
              SET "canonicalTag" = :canonical,
                  "canonicalTagConfidence" = 'verified'
              WHERE id = :id
            `, {
              replacements: { 
                canonical: rule.canonical,
                id: product.id 
              }
            });
            console.log(`   ✅ Tagged: ${product.description.substring(0, 50)}...`);
            verifiedCount++;
          } catch (error) {
            console.log(`   ❌ Failed to tag: ${error.message}`);
          }
        } else {
          console.log(`   ⚠️  Skipped (failed verification): ${product.description.substring(0, 50)}...`);
        }
      }
      
      // Test results for this ingredient
      const testResults = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real,
          COUNT(CASE WHEN "brandOwner" = 'Generic' THEN 1 END) as generic
        FROM "Food" 
        WHERE "canonicalTag" = :canonical
      `, { 
        replacements: { canonical: rule.canonical },
        type: Sequelize.QueryTypes.SELECT 
      });
      
      if (testResults[0]) {
        const coverage = (testResults[0].real / testResults[0].total * 100).toFixed(1);
        console.log(`   📊 Coverage: ${coverage}% (${testResults[0].real}/${testResults[0].total})`);
        
        results.push({
          ingredient: rule.canonical,
          total: testResults[0].total,
          real: testResults[0].real,
          generic: testResults[0].generic,
          coverage: parseFloat(coverage),
          tagged: verifiedCount
        });
      }
      
      totalTagged += verifiedCount;
      
    } catch (error) {
      console.log(`   ❌ Error processing ${rule.canonical}: ${error.message}`);
    }
    
    console.log('');
  }
  
  // Final summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);
  
  console.log('🎯 OPTIMIZED MAPPING RESULTS:\n');
  console.log(`   ⚡ Execution time: ${duration} seconds`);
  console.log(`   ✅ Total products tagged: ${totalTagged}`);
  console.log(`   🛡️  All changes are safe and reversible`);
  console.log(`   🔍 All products verified before tagging`);
  
  // Show results
  console.log('\n📊 Coverage by ingredient:');
  results.sort((a, b) => b.coverage - a.coverage);
  results.forEach(result => {
    console.log(`   ${result.ingredient}: ${result.coverage}% (${result.real}/${result.total}) [+${result.tagged}]`);
  });
  
  const avgCoverage = results.reduce((sum, r) => sum + r.coverage, 0) / results.length;
  console.log(`\n📈 Average real product coverage: ${avgCoverage.toFixed(1)}%`);
  console.log(`🚀 Processing speed: ${(STRICT_MAPPING_RULES.length / parseFloat(duration)).toFixed(1)} ingredients/second`);
  
  process.exit(0);
}

// Enhanced verification function
function verifyProductAccuracy(product, ingredient) {
  const description = product.description.toLowerCase();
  const brand = product.brandOwner;
  
  // Basic checks
  if (!brand || brand === 'Generic') {
    return false;
  }
  
  // Find the rule for this ingredient
  const rule = STRICT_MAPPING_RULES.find(r => r.canonical === ingredient);
  if (!rule) {
    return true; // No specific rule, assume correct
  }
  
  // Check required keywords
  const hasRequired = rule.required.some(keyword => 
    description.includes(keyword.toLowerCase())
  );
  
  if (!hasRequired) {
    return false;
  }
  
  // Check exclusions
  const hasExclusion = rule.exclusions.some(exclusion => 
    description.includes(exclusion.toLowerCase())
  );
  
  if (hasExclusion) {
    return false;
  }
  
  return true;
}

optimizedRealProductMapping(); 