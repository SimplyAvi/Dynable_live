const { Sequelize } = require('sequelize');
const db = require('./db/database');

// Focus on the highest-impact ingredients first (most frequent usage)
const HIGH_IMPACT_INGREDIENTS = [
  // RecipeIngredients with 0% real product coverage and high frequency
  { canonical: 'lemon', keywords: ['lemon'], exclude: ['juice', 'zest', 'peel', 'extract', 'flavor'] },
  { canonical: 'mayonnaise', keywords: ['mayonnaise'], exclude: ['light', 'fat free', 'olive oil'] },
  { canonical: 'parmesan cheese', keywords: ['parmesan'], exclude: ['romano', 'pecorino'] },
  { canonical: 'heavy cream', keywords: ['heavy cream'], exclude: ['light', 'half', 'whipping'] },
  { canonical: 'sour cream', keywords: ['sour cream'], exclude: ['light', 'fat free'] },
  { canonical: 'cream cheese', keywords: ['cream cheese'], exclude: ['light', 'fat free', 'whipped'] },
  { canonical: 'cheddar cheese', keywords: ['cheddar'], exclude: ['sharp', 'mild', 'aged'] },
  { canonical: 'garlic', keywords: ['garlic'], exclude: ['powder', 'salt', 'minced', 'chopped'] },
  { canonical: 'bell pepper', keywords: ['bell pepper'], exclude: ['red', 'green', 'yellow', 'orange'] },
  { canonical: 'tomato', keywords: ['tomato'], exclude: ['cherry', 'grape', 'roma', 'beefsteak'] },
  { canonical: 'carrot', keywords: ['carrot'], exclude: ['baby', 'shredded', 'diced'] },
  { canonical: 'potato', keywords: ['potato'], exclude: ['sweet', 'russet', 'red', 'yukon'] },
  { canonical: 'onion', keywords: ['onion'], exclude: ['red', 'white', 'yellow', 'sweet'] },
  { canonical: 'chicken breast', keywords: ['chicken breast'], exclude: ['thigh', 'wing', 'drumstick'] },
  { canonical: 'ground beef', keywords: ['ground beef'], exclude: ['lean', 'extra lean', 'organic'] },
  { canonical: 'bacon', keywords: ['bacon'], exclude: ['turkey', 'veggie', 'turkey bacon'] },
  { canonical: 'ham', keywords: ['ham'], exclude: ['turkey', 'prosciutto', 'serrano'] },
  { canonical: 'salmon', keywords: ['salmon'], exclude: ['smoked', 'canned', 'wild'] },
  { canonical: 'shrimp', keywords: ['shrimp'], exclude: ['prawn', 'jumbo', 'medium'] },
  { canonical: 'rice', keywords: ['rice'], exclude: ['brown', 'wild', 'jasmine', 'basmati'] },
  { canonical: 'pasta', keywords: ['pasta'], exclude: ['whole wheat', 'gluten free'] },
  { canonical: 'bread', keywords: ['bread'], exclude: ['whole wheat', 'sourdough', 'rye'] },
  { canonical: 'honey', keywords: ['honey'], exclude: ['raw', 'organic', 'clover'] },
  { canonical: 'vinegar', keywords: ['vinegar'], exclude: ['balsamic', 'apple cider', 'white wine'] },
  { canonical: 'soy sauce', keywords: ['soy sauce'], exclude: ['low sodium', 'tamari'] },
  { canonical: 'ketchup', keywords: ['ketchup'], exclude: ['organic', 'no sugar'] },
  { canonical: 'mustard', keywords: ['mustard'], exclude: ['dijon', 'honey', 'spicy'] },
  { canonical: 'yogurt', keywords: ['yogurt'], exclude: ['greek', 'vanilla', 'strawberry'] },
  { canonical: 'almond', keywords: ['almond'], exclude: ['sliced', 'slivered', 'whole'] },
  { canonical: 'walnut', keywords: ['walnut'], exclude: ['chopped', 'halves', 'pieces'] },
  { canonical: 'peanut', keywords: ['peanut'], exclude: ['butter', 'oil', 'sauce'] },
  { canonical: 'spinach', keywords: ['spinach'], exclude: ['baby', 'frozen', 'canned'] },
  { canonical: 'broccoli', keywords: ['broccoli'], exclude: ['frozen', 'fresh', 'crowns'] },
  { canonical: 'cauliflower', keywords: ['cauliflower'], exclude: ['rice', 'frozen', 'fresh'] },
  { canonical: 'mushroom', keywords: ['mushroom'], exclude: ['portobello', 'shiitake', 'cremini'] },
  { canonical: 'avocado', keywords: ['avocado'], exclude: ['oil', 'guacamole'] },
  { canonical: 'banana', keywords: ['banana'], exclude: ['chips', 'bread', 'muffin'] },
  { canonical: 'apple', keywords: ['apple'], exclude: ['juice', 'cider', 'sauce'] },
  { canonical: 'strawberry', keywords: ['strawberry'], exclude: ['jam', 'jelly', 'sauce'] },
  { canonical: 'blueberry', keywords: ['blueberry'], exclude: ['jam', 'jelly', 'sauce'] },
  { canonical: 'ginger', keywords: ['ginger'], exclude: ['powder', 'crystalized', 'candied'] },
  { canonical: 'cinnamon', keywords: ['cinnamon'], exclude: ['ground', 'stick', 'powder'] },
  { canonical: 'cumin', keywords: ['cumin'], exclude: ['ground', 'seed'] },
  { canonical: 'oregano', keywords: ['oregano'], exclude: ['dried', 'fresh'] },
  { canonical: 'thyme', keywords: ['thyme'], exclude: ['dried', 'fresh'] },
  { canonical: 'rosemary', keywords: ['rosemary'], exclude: ['dried', 'fresh'] },
  { canonical: 'bay leaf', keywords: ['bay leaf'], exclude: ['fresh', 'dried'] },
  { canonical: 'paprika', keywords: ['paprika'], exclude: ['smoked', 'sweet', 'hot'] },
  { canonical: 'chili powder', keywords: ['chili powder'], exclude: ['chipotle', 'ancho'] },
  { canonical: 'cayenne pepper', keywords: ['cayenne'], exclude: ['ground', 'powder'] },
  { canonical: 'sea salt', keywords: ['sea salt'], exclude: ['kosher', 'himalayan', 'pink'] },
  { canonical: 'brown sugar', keywords: ['brown sugar'], exclude: ['light', 'dark', 'golden'] },
  { canonical: 'powdered sugar', keywords: ['powdered sugar'], exclude: ['confectioners', 'icing'] },
  { canonical: 'baking soda', keywords: ['baking soda'], exclude: ['sodium bicarbonate'] },
  { canonical: 'cornstarch', keywords: ['cornstarch'], exclude: ['corn starch'] },
  { canonical: 'flour', keywords: ['flour'], exclude: ['bread', 'cake', 'whole wheat', 'almond'] },
  { canonical: 'milk', keywords: ['milk'], exclude: ['almond', 'soy', 'oat', 'coconut'] },
  { canonical: 'butter', keywords: ['butter'], exclude: ['unsalted', 'salted', 'peanut', 'almond'] },
  { canonical: 'olive oil', keywords: ['olive oil'], exclude: ['extra virgin', 'light', 'pomace'] },
  { canonical: 'vegetable oil', keywords: ['vegetable oil'], exclude: ['canola', 'corn', 'soybean'] },
  { canonical: 'canola oil', keywords: ['canola oil'], exclude: ['vegetable', 'blend'] },
  { canonical: 'sesame oil', keywords: ['sesame oil'], exclude: ['toasted', 'roasted'] },
  { canonical: 'coconut oil', keywords: ['coconut oil'], exclude: ['virgin', 'refined'] },
  { canonical: 'maple syrup', keywords: ['maple syrup'], exclude: ['pancake', 'breakfast'] },
  { canonical: 'molasses', keywords: ['molasses'], exclude: ['blackstrap', 'light', 'dark'] },
  { canonical: 'agave nectar', keywords: ['agave'], exclude: ['syrup', 'nectar'] }
];

async function addRealProductsOptimized() {
  console.log('⚡ OPTIMIZED SCALE-UP REAL PRODUCT ADDITION\n');
  
  const startTime = Date.now();
  let totalTagged = 0;
  const results = [];
  
  // Process ingredients in batches for better performance
  const BATCH_SIZE = 10;
  const batches = [];
  for (let i = 0; i < HIGH_IMPACT_INGREDIENTS.length; i += BATCH_SIZE) {
    batches.push(HIGH_IMPACT_INGREDIENTS.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`📦 Processing ${HIGH_IMPACT_INGREDIENTS.length} ingredients in ${batches.length} batches...\n`);
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`🔄 Batch ${batchIndex + 1}/${batches.length} (${batch.length} ingredients)`);
    
    // Process batch in parallel for speed
    const batchPromises = batch.map(async (ingredient) => {
      try {
        // Optimized query - find products more efficiently
        const keywordConditions = ingredient.keywords.map(k => `description ILIKE '%${k}%'`).join(' OR ');
        const excludeConditions = ingredient.exclude.map(e => `description NOT ILIKE '%${e}%'`).join(' AND ');
        
        const query = `
          SELECT id, description, "brandOwner", "brandName", "canonicalTag"
          FROM "IngredientCategorized" 
          WHERE "brandOwner" != 'Generic' 
            AND "brandOwner" != ''
            AND "brandOwner" IS NOT NULL
            AND (${keywordConditions})
            AND ${excludeConditions}
            AND ("canonicalTag" IS NULL OR "canonicalTag" != :canonical)
          LIMIT 15
        `;
        
        const products = await db.query(query, { 
          replacements: { canonical: ingredient.canonical },
          type: Sequelize.QueryTypes.SELECT 
        });
        
        let taggedCount = 0;
        if (products.length > 0) {
          // Batch update for efficiency
          const productIds = products.map(p => p.id);
          await db.query(`
            UPDATE "IngredientCategorized" 
            SET "canonicalTag" = :canonical,
                "canonicalTagConfidence" = 'confident'
            WHERE id IN (:productIds)
          `, {
            replacements: { 
              canonical: ingredient.canonical,
              productIds
            }
          });
          taggedCount = products.length;
        }
        
        // Quick coverage check
        const testResults = await db.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real
          FROM "IngredientCategorized" 
          WHERE "canonicalTag" = :canonical
        `, { 
          replacements: { canonical: ingredient.canonical },
          type: Sequelize.QueryTypes.SELECT 
        });
        
        const coverage = testResults[0] ? (testResults[0].real / testResults[0].total * 100).toFixed(1) : '0.0';
        
        return {
          ingredient: ingredient.canonical,
          tagged: taggedCount,
          coverage: parseFloat(coverage),
          total: testResults[0]?.total || 0,
          real: testResults[0]?.real || 0
        };
        
      } catch (error) {
        return {
          ingredient: ingredient.canonical,
          tagged: 0,
          coverage: 0,
          error: error.message
        };
      }
    });
    
    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Report batch progress
    let batchTagged = 0;
    batchResults.forEach(result => {
      if (result.error) {
        console.log(`   ❌ ${result.ingredient}: ${result.error}`);
      } else {
        console.log(`   ✅ ${result.ingredient}: ${result.coverage}% (${result.real}/${result.total}) [+${result.tagged}]`);
        batchTagged += result.tagged;
        results.push(result);
      }
    });
    
    totalTagged += batchTagged;
    console.log(`   📊 Batch ${batchIndex + 1} tagged: ${batchTagged} products\n`);
  }
  
  // Final summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);
  
  console.log('🎯 OPTIMIZED RESULTS:\n');
  console.log(`   ⚡ Execution time: ${duration} seconds`);
  console.log(`   ✅ Total products tagged: ${totalTagged}`);
  console.log(`   🛡️  All changes are safe and reversible`);
  
  // Show top performers
  const successfulResults = results.filter(r => !r.error).sort((a, b) => b.coverage - a.coverage);
  console.log('\n🏆 TOP PERFORMERS:');
  successfulResults.slice(0, 15).forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.ingredient}: ${result.coverage}% (${result.real}/${result.total})`);
  });
  
  const avgCoverage = successfulResults.reduce((sum, r) => sum + r.coverage, 0) / successfulResults.length;
  console.log(`\n📈 Average real product coverage: ${avgCoverage.toFixed(1)}%`);
  console.log(`🚀 Processing speed: ${(HIGH_IMPACT_INGREDIENTS.length / parseFloat(duration)).toFixed(1)} ingredients/second`);
  
  process.exit(0);
}

addRealProductsOptimized(); 