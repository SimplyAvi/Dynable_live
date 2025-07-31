const { Sequelize } = require('sequelize');
const db = require('./db/database');

async function comprehensiveProductVerification() {
  console.log('🔍 COMPREHENSIVE PRODUCT VERIFICATION\n');
  
  // Test all ingredients that have been tagged
  const testRecipeIngredients = [
    'milk', 'bread', 'butter', 'yogurt', 'lemon', 'mayonnaise', 'parmesan cheese', 
    'heavy cream', 'sour cream', 'cream cheese', 'cheddar cheese', 'garlic', 
    'bell pepper', 'tomato', 'carrot', 'potato', 'onion', 'chicken breast', 
    'ground beef', 'bacon', 'ham', 'salmon', 'shrimp', 'rice', 'pasta', 'honey', 
    'vinegar', 'soy sauce', 'ketchup', 'mustard', 'almond', 'walnut', 'peanut',
    'salt', 'sugar', 'water', 'egg', 'olive oil', 'extra virgin olive oil',
    'unsalted butter', 'bittersweet chocolate', 'dijon mustard', 'kosher salt',
    'all-purpose flour', 'granulated sugar', 'large eggs', 'vanilla extract',
    'black pepper', 'sea salt', 'brown sugar', 'powdered sugar', 'baking soda',
    'cornstarch', 'flour', 'vegetable oil', 'canola oil', 'sesame oil', 
    'coconut oil', 'maple syrup', 'molasses', 'agave nectar'
  ];
  
  console.log('🔍 VERIFYING ALL PRODUCT MAPPINGS:\n');
  
  let totalVerified = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  const incorrectMappings = [];
  const suspiciousMappings = [];
  
  for (const ingredient of testRecipeIngredients) {
    console.log(`🔍 Verifying: ${ingredient}`);
    
    // Get sample products for verification
    const sampleProducts = await db.query(`
      SELECT id, description, "brandOwner", "brandName", "canonicalTag"
      FROM "IngredientCategorized" 
      WHERE "canonicalTag" = :canonical
      ORDER BY RANDOM()
      LIMIT 8
    `, {
      replacements: { canonical: ingredient },
      type: Sequelize.QueryTypes.SELECT
    });
    
    if (sampleProducts.length === 0) {
      console.log(`   ⚠️  No products found for ${ingredient}`);
      continue;
    }
    
    console.log(`   📊 Found ${sampleProducts.length} sample products:`);
    
    let correctCount = 0;
    let incorrectCount = 0;
    let suspiciousCount = 0;
    
    for (const product of sampleProducts) {
      const verification = verifyProductAccuracyDetailed(product, ingredient);
      
      if (verification.status === 'correct') {
        correctCount++;
        console.log(`   ✅ ${product.description.substring(0, 60)}...`);
      } else if (verification.status === 'suspicious') {
        suspiciousCount++;
        console.log(`   ⚠️  ${product.description.substring(0, 60)}...`);
        suspiciousMappings.push({
          ingredient,
          product: product.description,
          brand: product.brandOwner,
          reason: verification.reason
        });
      } else {
        incorrectCount++;
        console.log(`   ❌ ${product.description.substring(0, 60)}...`);
        incorrectMappings.push({
          ingredient,
          product: product.description,
          brand: product.brandOwner,
          reason: verification.reason
        });
      }
    }
    
    const accuracy = (correctCount / sampleProducts.length * 100).toFixed(1);
    console.log(`   📈 Accuracy: ${accuracy}% (${correctCount}/${sampleProducts.length})`);
    
    if (suspiciousCount > 0) {
      console.log(`   ⚠️  Suspicious: ${suspiciousCount}`);
    }
    
    totalVerified += sampleProducts.length;
    totalCorrect += correctCount;
    totalIncorrect += incorrectCount;
    
    console.log('');
  }
  
  // Overall verification results
  console.log('🎯 COMPREHENSIVE VERIFICATION RESULTS:\n');
  console.log(`   📊 Total products verified: ${totalVerified}`);
  console.log(`   ✅ Correct mappings: ${totalCorrect} (${(totalCorrect/totalVerified*100).toFixed(1)}%)`);
  console.log(`   ❌ Incorrect mappings: ${totalIncorrect} (${(totalIncorrect/totalVerified*100).toFixed(1)}%)`);
  console.log(`   ⚠️  Suspicious mappings: ${suspiciousMappings.length}`);
  
  // Show incorrect mappings
  if (incorrectMappings.length > 0) {
    console.log('\n🚨 INCORRECT MAPPINGS FOUND:');
    incorrectMappings.forEach((mapping, index) => {
      console.log(`   ${index + 1}. ${mapping.ingredient} ← ${mapping.product.substring(0, 60)}...`);
      console.log(`      Reason: ${mapping.reason}`);
    });
  }
  
  // Show suspicious mappings
  if (suspiciousMappings.length > 0) {
    console.log('\n⚠️  SUSPICIOUS MAPPINGS FOUND:');
    suspiciousMappings.forEach((mapping, index) => {
      console.log(`   ${index + 1}. ${mapping.ingredient} ← ${mapping.product.substring(0, 60)}...`);
      console.log(`      Reason: ${mapping.reason}`);
    });
  }
  
  // Check for any obviously wrong patterns
  console.log('\n🔍 CHECKING FOR WRONG PATTERNS:');
  
  const wrongPatterns = await db.query(`
    SELECT "canonicalTag", COUNT(*) as count
    FROM "IngredientCategorized" 
    WHERE "canonicalTag" IS NOT NULL
    GROUP BY "canonicalTag"
    ORDER BY count DESC
    LIMIT 15
  `, { type: Sequelize.QueryTypes.SELECT });
  
  console.log('   📊 Top tagged ingredients by count:');
  wrongPatterns.forEach((tag, index) => {
    console.log(`      ${index + 1}. ${tag.canonicalTag}: ${tag.count} products`);
  });
  
  // Check for products that might be incorrectly tagged
  console.log('\n🔍 CHECKING FOR POTENTIAL MISMATCHES:');
  
  const potentialMismatches = await db.query(`
    SELECT description, "brandOwner", "canonicalTag"
    FROM "IngredientCategorized" 
    WHERE "canonicalTag" IS NOT NULL
      AND description NOT ILIKE '%' || "canonicalTag" || '%'
    ORDER BY RANDOM()
    LIMIT 10
  `, { type: Sequelize.QueryTypes.SELECT });
  
  console.log('   🔍 Products that might be incorrectly tagged:');
  potentialMismatches.forEach((product, index) => {
    console.log(`      ${index + 1}. ${product.description.substring(0, 60)}...`);
    console.log(`         Tagged as: ${product.canonicalTag}`);
    console.log(`         Brand: ${product.brandOwner}`);
  });
  
  // Overall assessment
  const overallAccuracy = (totalCorrect / totalVerified * 100).toFixed(1);
  console.log(`\n🎯 OVERALL ASSESSMENT:`);
  console.log(`   📊 Overall accuracy: ${overallAccuracy}%`);
  
  if (parseFloat(overallAccuracy) >= 95) {
    console.log(`   ✅ EXCELLENT - Ready to proceed with confidence!`);
  } else if (parseFloat(overallAccuracy) >= 85) {
    console.log(`   ⚠️  GOOD - Some issues to address before proceeding`);
  } else {
    console.log(`   ❌ POOR - Major issues need fixing before proceeding`);
  }
  
  process.exit(0);
}

// Enhanced verification function with detailed analysis
function verifyProductAccuracyDetailed(product, ingredient) {
  const description = product.description.toLowerCase();
  const brand = product.brandOwner;
  
  // Basic checks
  if (!brand || brand === 'Generic') {
    return { status: 'incorrect', reason: 'Generic or missing brand' };
  }
  
  // Ingredient-specific verification rules
  const verificationRules = {
    'milk': {
      keywords: ['milk'],
      exclusions: ['chocolate', 'almond', 'soy', 'oat', 'coconut', 'rice', 'cashew', 'protein powder', 'ricotta', 'half & half', 'half and half'],
      required: ['milk'],
      suspicious: ['powder', 'shake', 'drink']
    },
    'bread': {
      keywords: ['bread'],
      exclusions: ['gingerbread', 'stuffing', 'crumbs', 'croutons'],
      required: ['bread'],
      suspicious: ['stick', 'roll', 'bun']
    },
    'butter': {
      keywords: ['butter'],
      exclusions: ['peanut butter', 'butter rum', 'buttercream', 'butterscotch'],
      required: ['butter'],
      suspicious: ['spread', 'margarine']
    },
    'yogurt': {
      keywords: ['yogurt'],
      exclusions: ['almond', 'soy', 'coconut'],
      required: ['yogurt'],
      suspicious: ['drink', 'smoothie']
    },
    'lemon': {
      keywords: ['lemon'],
      exclusions: ['juice', 'zest', 'peel', 'extract', 'flavor', 'ade', 'soda'],
      required: ['lemon'],
      suspicious: ['candy', 'hard candy']
    },
    'mayonnaise': {
      keywords: ['mayonnaise'],
      exclusions: ['light', 'fat free', 'olive oil', 'aioli'],
      required: ['mayonnaise'],
      suspicious: ['dressing', 'sauce']
    },
    'parmesan cheese': {
      keywords: ['parmesan'],
      exclusions: ['romano', 'pecorino', 'blend'],
      required: ['parmesan'],
      suspicious: ['grated', 'shredded']
    },
    'heavy cream': {
      keywords: ['heavy cream'],
      exclusions: ['light', 'half', 'whipping', 'ultra-pasteurized'],
      required: ['heavy cream'],
      suspicious: ['ultra', 'pasteurized']
    },
    'sour cream': {
      keywords: ['sour cream'],
      exclusions: ['light', 'fat free', 'maple'],
      required: ['sour cream'],
      suspicious: ['dip', 'sauce']
    },
    'cream cheese': {
      keywords: ['cream cheese'],
      exclusions: ['light', 'fat free', 'whipped', 'pure', 'generic'],
      required: ['cream cheese'],
      suspicious: ['spread', 'dip']
    },
    'cheddar cheese': {
      keywords: ['cheddar'],
      exclusions: ['sharp', 'mild', 'aged', 'blend'],
      required: ['cheddar'],
      suspicious: ['slices', 'shredded']
    },
    'garlic': {
      keywords: ['garlic'],
      exclusions: ['powder', 'salt', 'minced', 'chopped', 'tandoori'],
      required: ['garlic'],
      suspicious: ['seasoning', 'herb']
    },
    'bell pepper': {
      keywords: ['bell pepper'],
      exclusions: ['red', 'green', 'yellow', 'orange'],
      required: ['bell pepper'],
      suspicious: ['mix', 'blend']
    },
    'tomato': {
      keywords: ['tomato'],
      exclusions: ['cherry', 'grape', 'roma', 'beefsteak', 'grapefruit'],
      required: ['tomato'],
      suspicious: ['sauce', 'paste']
    },
    'carrot': {
      keywords: ['carrot'],
      exclusions: ['baby', 'shredded', 'diced'],
      required: ['carrot'],
      suspicious: ['sticks', 'chips']
    },
    'potato': {
      keywords: ['potato'],
      exclusions: ['sweet', 'russet', 'red potato', 'yukon'],
      required: ['potato'],
      suspicious: ['chips', 'fries']
    },
    'onion': {
      keywords: ['onion'],
      exclusions: ['red', 'white', 'yellow', 'sweet', 'salsa', 'stir-fry'],
      required: ['onion'],
      suspicious: ['rings', 'powder']
    },
    'chicken breast': {
      keywords: ['chicken breast'],
      exclusions: ['thigh', 'wing', 'drumstick', 'tender'],
      required: ['chicken breast'],
      suspicious: ['strips', 'nuggets']
    },
    'ground beef': {
      keywords: ['ground beef'],
      exclusions: ['lean', 'extra lean', 'organic'],
      required: ['ground beef'],
      suspicious: ['patty', 'burger']
    },
    'bacon': {
      keywords: ['bacon'],
      exclusions: ['turkey', 'veggie', 'turkey bacon'],
      required: ['bacon'],
      suspicious: ['bits', 'pieces']
    },
    'ham': {
      keywords: ['ham'],
      exclusions: ['turkey', 'prosciutto', 'serrano', 'mushroom', 'generic'],
      required: ['ham'],
      suspicious: ['deli', 'lunch meat']
    },
    'salmon': {
      keywords: ['salmon'],
      exclusions: ['smoked', 'canned', 'wild', 'nova'],
      required: ['salmon'],
      suspicious: ['farmed', 'atlantic']
    },
    'shrimp': {
      keywords: ['shrimp'],
      exclusions: ['prawn', 'jumbo', 'medium'],
      required: ['shrimp'],
      suspicious: ['peeled', 'cooked']
    },
    'rice': {
      keywords: ['rice'],
      exclusions: ['brown', 'wild', 'jasmine', 'basmati'],
      required: ['rice'],
      suspicious: ['white', 'enriched']
    },
    'pasta': {
      keywords: ['pasta'],
      exclusions: ['whole wheat', 'gluten free', 'black bean'],
      required: ['pasta'],
      suspicious: ['sauce', 'meal']
    },
    'honey': {
      keywords: ['honey'],
      exclusions: ['raw', 'organic', 'clover', 'fruit', 'soda'],
      required: ['honey'],
      suspicious: ['syrup', 'sweetener']
    },
    'vinegar': {
      keywords: ['vinegar'],
      exclusions: ['balsamic', 'apple cider', 'white wine', 'chicken wings'],
      required: ['vinegar'],
      suspicious: ['distilled', 'white']
    },
    'soy sauce': {
      keywords: ['soy sauce'],
      exclusions: ['low sodium', 'tamari', 'pure', 'generic', 'pasta sauce'],
      required: ['soy sauce'],
      suspicious: ['sauce', 'seasoning']
    },
    'ketchup': {
      keywords: ['ketchup'],
      exclusions: ['organic', 'no sugar'],
      required: ['ketchup'],
      suspicious: ['tomato', 'sauce']
    },
    'mustard': {
      keywords: ['mustard'],
      exclusions: ['dijon', 'honey', 'spicy', 'spring mix', 'gum'],
      required: ['mustard'],
      suspicious: ['yellow', 'prepared']
    },
    'almond': {
      keywords: ['almond'],
      exclusions: ['sliced', 'slivered', 'whole'],
      required: ['almond'],
      suspicious: ['roasted', 'salted']
    },
    'walnut': {
      keywords: ['walnut'],
      exclusions: ['chopped', 'halves', 'pieces', 'raw'],
      required: ['walnut'],
      suspicious: ['shelled', 'unshelled']
    },
    'peanut': {
      keywords: ['peanut'],
      exclusions: ['butter', 'oil', 'sauce'],
      required: ['peanut'],
      suspicious: ['roasted', 'salted']
    }
  };
  
  const rule = verificationRules[ingredient];
  if (!rule) {
    return { status: 'correct', reason: 'No specific rule' };
  }
  
  // Check required keywords
  const hasRequired = rule.required.some(keyword => 
    description.includes(keyword.toLowerCase())
  );
  
  if (!hasRequired) {
    return { status: 'incorrect', reason: `Missing required keyword: ${rule.required.join(', ')}` };
  }
  
  // Check exclusions
  const hasExclusion = rule.exclusions.some(exclusion => 
    description.includes(exclusion.toLowerCase())
  );
  
  if (hasExclusion) {
    return { status: 'incorrect', reason: `Contains excluded term: ${rule.exclusions.find(e => description.includes(e.toLowerCase()))}` };
  }
  
  // Check suspicious terms
  const hasSuspicious = rule.suspicious.some(suspicious => 
    description.includes(suspicious.toLowerCase())
  );
  
  if (hasSuspicious) {
    return { status: 'suspicious', reason: `Contains suspicious term: ${rule.suspicious.find(s => description.includes(s.toLowerCase()))}` };
  }
  
  return { status: 'correct', reason: 'Passes all checks' };
}

comprehensiveProductVerification(); 