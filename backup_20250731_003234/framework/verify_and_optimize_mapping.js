const { Sequelize } = require('sequelize');
const db = require('./db/database');

async function verifyAndOptimizeMapping() {
  console.log('🔍 VERIFYING AND OPTIMIZING MAPPING\n');
  
  // Test ingredients to verify
  const testRecipeIngredients = [
    'milk', 'bread', 'butter', 'yogurt', 'lemon', 'mayonnaise', 'parmesan cheese', 
    'heavy cream', 'sour cream', 'cream cheese', 'cheddar cheese', 'garlic', 
    'bell pepper', 'tomato', 'carrot', 'potato', 'onion', 'chicken breast', 
    'ground beef', 'bacon', 'ham', 'salmon', 'shrimp', 'rice', 'pasta', 'honey', 
    'vinegar', 'soy sauce', 'ketchup', 'mustard', 'almond', 'walnut', 'peanut'
  ];
  
  console.log('🔍 VERIFYING PRODUCT ACCURACY:\n');
  
  let totalVerified = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  const incorrectMappings = [];
  
  for (const ingredient of testRecipeIngredients) {
    console.log(`🔍 Verifying: ${ingredient}`);
    
    // Get sample products for verification
    const sampleProducts = await db.query(`
      SELECT id, description, "brandOwner", "brandName", "canonicalTag"
      FROM "IngredientCategorized" 
      WHERE "canonicalTag" = :canonical
      ORDER BY RANDOM()
      LIMIT 5
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
    
    for (const product of sampleProducts) {
      const isCorrect = verifyProductAccuracy(product, ingredient);
      
      if (isCorrect) {
        correctCount++;
        console.log(`   ✅ ${product.description.substring(0, 60)}...`);
      } else {
        incorrectCount++;
        console.log(`   ❌ ${product.description.substring(0, 60)}...`);
        incorrectMappings.push({
          ingredient,
          product: product.description,
          brand: product.brandOwner
        });
      }
    }
    
    const accuracy = (correctCount / sampleProducts.length * 100).toFixed(1);
    console.log(`   📈 Accuracy: ${accuracy}% (${correctCount}/${sampleProducts.length})`);
    
    totalVerified += sampleProducts.length;
    totalCorrect += correctCount;
    totalIncorrect += incorrectCount;
    
    console.log('');
  }
  
  // Overall verification results
  console.log('🎯 VERIFICATION RESULTS:\n');
  console.log(`   📊 Total products verified: ${totalVerified}`);
  console.log(`   ✅ Correct mappings: ${totalCorrect} (${(totalCorrect/totalVerified*100).toFixed(1)}%)`);
  console.log(`   ❌ Incorrect mappings: ${totalIncorrect} (${(totalIncorrect/totalVerified*100).toFixed(1)}%)`);
  
  // Show incorrect mappings
  if (incorrectMappings.length > 0) {
    console.log('\n🚨 INCORRECT MAPPINGS FOUND:');
    incorrectMappings.forEach((mapping, index) => {
      console.log(`   ${index + 1}. ${mapping.ingredient} ← ${mapping.product.substring(0, 60)}...`);
    });
  }
  
  // Test ingredient linking verification
  console.log('\n🔗 TESTING INGREDIENT LINKING VERIFICATION:');
  
  const linkingTest = await testIngredientLinking();
  console.log(`   📊 Linking accuracy: ${linkingTest.accuracy}%`);
  console.log(`   ✅ Correct links: ${linkingTest.correct}`);
  console.log(`   ❌ Incorrect links: ${linkingTest.incorrect}`);
  
  // Optimized mapping strategy
  console.log('\n⚡ OPTIMIZED MAPPING STRATEGY:');
  console.log('   1. Use stricter keyword matching');
  console.log('   2. Add ingredient linking verification');
  console.log('   3. Batch process with accuracy checks');
  console.log('   4. Real-time verification during mapping');
  
  process.exit(0);
}

// Verify if a product is correctly mapped to an ingredient
function verifyProductAccuracy(product, ingredient) {
  const description = product.description.toLowerCase();
  const brand = product.brandOwner;
  
  // Basic checks
  if (!brand || brand === 'Generic') {
    return false; // Skip generic products
  }
  
  // Ingredient-specific verification rules
  const verificationRules = {
    'milk': {
      keywords: ['milk'],
      exclusions: ['chocolate', 'almond', 'soy', 'oat', 'coconut', 'rice', 'cashew'],
      required: ['milk']
    },
    'bread': {
      keywords: ['bread'],
      exclusions: ['gingerbread', 'stuffing', 'crumbs', 'croutons'],
      required: ['bread']
    },
    'butter': {
      keywords: ['butter'],
      exclusions: ['peanut butter', 'butter rum', 'buttercream', 'butterscotch'],
      required: ['butter']
    },
    'yogurt': {
      keywords: ['yogurt'],
      exclusions: ['almond', 'soy', 'coconut'],
      required: ['yogurt']
    },
    'lemon': {
      keywords: ['lemon'],
      exclusions: ['juice', 'zest', 'peel', 'extract', 'flavor'],
      required: ['lemon']
    },
    'mayonnaise': {
      keywords: ['mayonnaise'],
      exclusions: ['light', 'fat free', 'olive oil'],
      required: ['mayonnaise']
    },
    'parmesan cheese': {
      keywords: ['parmesan'],
      exclusions: ['romano', 'pecorino'],
      required: ['parmesan']
    },
    'heavy cream': {
      keywords: ['heavy cream'],
      exclusions: ['light', 'half', 'whipping'],
      required: ['heavy cream']
    },
    'sour cream': {
      keywords: ['sour cream'],
      exclusions: ['light', 'fat free'],
      required: ['sour cream']
    },
    'cream cheese': {
      keywords: ['cream cheese'],
      exclusions: ['light', 'fat free', 'whipped'],
      required: ['cream cheese']
    },
    'cheddar cheese': {
      keywords: ['cheddar'],
      exclusions: ['sharp', 'mild', 'aged'],
      required: ['cheddar']
    },
    'garlic': {
      keywords: ['garlic'],
      exclusions: ['powder', 'salt', 'minced', 'chopped'],
      required: ['garlic']
    },
    'bell pepper': {
      keywords: ['bell pepper'],
      exclusions: ['red', 'green', 'yellow', 'orange'],
      required: ['bell pepper']
    },
    'tomato': {
      keywords: ['tomato'],
      exclusions: ['cherry', 'grape', 'roma', 'beefsteak'],
      required: ['tomato']
    },
    'carrot': {
      keywords: ['carrot'],
      exclusions: ['baby', 'shredded', 'diced'],
      required: ['carrot']
    },
    'potato': {
      keywords: ['potato'],
      exclusions: ['sweet', 'russet', 'red', 'yukon'],
      required: ['potato']
    },
    'onion': {
      keywords: ['onion'],
      exclusions: ['red', 'white', 'yellow', 'sweet'],
      required: ['onion']
    },
    'chicken breast': {
      keywords: ['chicken breast'],
      exclusions: ['thigh', 'wing', 'drumstick'],
      required: ['chicken breast']
    },
    'ground beef': {
      keywords: ['ground beef'],
      exclusions: ['lean', 'extra lean', 'organic'],
      required: ['ground beef']
    },
    'bacon': {
      keywords: ['bacon'],
      exclusions: ['turkey', 'veggie', 'turkey bacon'],
      required: ['bacon']
    },
    'ham': {
      keywords: ['ham'],
      exclusions: ['turkey', 'prosciutto', 'serrano'],
      required: ['ham']
    },
    'salmon': {
      keywords: ['salmon'],
      exclusions: ['smoked', 'canned', 'wild'],
      required: ['salmon']
    },
    'shrimp': {
      keywords: ['shrimp'],
      exclusions: ['prawn', 'jumbo', 'medium'],
      required: ['shrimp']
    },
    'rice': {
      keywords: ['rice'],
      exclusions: ['brown', 'wild', 'jasmine', 'basmati'],
      required: ['rice']
    },
    'pasta': {
      keywords: ['pasta'],
      exclusions: ['whole wheat', 'gluten free'],
      required: ['pasta']
    },
    'honey': {
      keywords: ['honey'],
      exclusions: ['raw', 'organic', 'clover'],
      required: ['honey']
    },
    'vinegar': {
      keywords: ['vinegar'],
      exclusions: ['balsamic', 'apple cider', 'white wine'],
      required: ['vinegar']
    },
    'soy sauce': {
      keywords: ['soy sauce'],
      exclusions: ['low sodium', 'tamari'],
      required: ['soy sauce']
    },
    'ketchup': {
      keywords: ['ketchup'],
      exclusions: ['organic', 'no sugar'],
      required: ['ketchup']
    },
    'mustard': {
      keywords: ['mustard'],
      exclusions: ['dijon', 'honey', 'spicy'],
      required: ['mustard']
    },
    'almond': {
      keywords: ['almond'],
      exclusions: ['sliced', 'slivered', 'whole'],
      required: ['almond']
    },
    'walnut': {
      keywords: ['walnut'],
      exclusions: ['chopped', 'halves', 'pieces'],
      required: ['walnut']
    },
    'peanut': {
      keywords: ['peanut'],
      exclusions: ['butter', 'oil', 'sauce'],
      required: ['peanut']
    }
  };
  
  const rule = verificationRules[ingredient];
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

// Test ingredient linking verification
async function testIngredientLinking() {
  const testCases = [
    { ingredient: 'milk', canonical: 'milk', shouldLink: true },
    { ingredient: 'milk chocolate', canonical: 'milk', shouldLink: false },
    { ingredient: 'bread', canonical: 'bread', shouldLink: true },
    { ingredient: 'gingerbread', canonical: 'bread', shouldLink: false },
    { ingredient: 'butter', canonical: 'butter', shouldLink: true },
    { ingredient: 'peanut butter', canonical: 'butter', shouldLink: false },
    { ingredient: 'yogurt', canonical: 'yogurt', shouldLink: true },
    { ingredient: 'almond milk yogurt', canonical: 'yogurt', shouldLink: false }
  ];
  
  let correct = 0;
  let incorrect = 0;
  
  for (const testCase of testCases) {
    const shouldLink = verifyProductAccuracy(
      { description: testCase.ingredient, brandOwner: 'Test Brand' },
      testCase.canonical
    );
    
    if (shouldLink === testCase.shouldLink) {
      correct++;
    } else {
      incorrect++;
    }
  }
  
  return {
    accuracy: (correct / testCases.length * 100).toFixed(1),
    correct,
    incorrect
  };
}

verifyAndOptimizeMapping(); 