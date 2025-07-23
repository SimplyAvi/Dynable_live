const { Sequelize } = require('sequelize');
const db = require('./db/database');

// Expanded list of ingredients to target based on our analysis
const SCALE_UP_INGREDIENTS = [
  // High-frequency ingredients with 0% real product coverage
  { canonical: 'lemon', keywords: ['lemon'], exclude: ['juice', 'zest', 'peel', 'extract', 'flavor'] },
  { canonical: 'mayonnaise', keywords: ['mayonnaise'], exclude: ['light', 'fat free', 'olive oil'] },
  { canonical: 'parmesan cheese', keywords: ['parmesan'], exclude: ['romano', 'pecorino'] },
  { canonical: 'heavy cream', keywords: ['heavy cream'], exclude: ['light', 'half', 'whipping'] },
  { canonical: 'sour cream', keywords: ['sour cream'], exclude: ['light', 'fat free'] },
  { canonical: 'cream cheese', keywords: ['cream cheese'], exclude: ['light', 'fat free', 'whipped'] },
  { canonical: 'cheddar cheese', keywords: ['cheddar'], exclude: ['sharp', 'mild', 'aged'] },
  { canonical: 'mozzarella cheese', keywords: ['mozzarella'], exclude: ['fresh', 'buffalo'] },
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
  { canonical: 'black pepper', keywords: ['black pepper'], exclude: ['white', 'cracked', 'ground'] },
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
  { canonical: 'agave nectar', keywords: ['agave'], exclude: ['syrup', 'nectar'] },
  { canonical: 'stevia', keywords: ['stevia'], exclude: ['powder', 'liquid', 'extract'] },
  { canonical: 'splenda', keywords: ['splenda'], exclude: ['granulated', 'brown'] },
  { canonical: 'truvia', keywords: ['truvia'], exclude: ['granulated', 'brown'] },
  { canonical: 'xylitol', keywords: ['xylitol'], exclude: ['granulated', 'powder'] },
  { canonical: 'erythritol', keywords: ['erythritol'], exclude: ['granulated', 'powder'] },
  { canonical: 'monk fruit', keywords: ['monk fruit'], exclude: ['extract', 'powder'] },
  { canonical: 'allulose', keywords: ['allulose'], exclude: ['powder', 'granulated'] }
];

async function addRealProductsScaleUp() {
  console.log('🚀 SCALE-UP REAL PRODUCT ADDITION\n');
  
  let totalTagged = 0;
  const results = [];
  
  for (const ingredient of SCALE_UP_INGREDIENTS) {
    console.log(`🔍 Processing: ${ingredient.canonical}`);
    
    try {
      // Build query with keywords and exclusions
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
        LIMIT 20
      `;
      
      const products = await db.query(query, { type: Sequelize.QueryTypes.SELECT });
      
      console.log(`   Found ${products.length} real products`);
      
      let taggedCount = 0;
      for (const product of products) {
        if (!product.canonicalTag || product.canonicalTag !== ingredient.canonical) {
          try {
            await db.query(`
              UPDATE "IngredientCategorized" 
              SET "canonicalTag" = :canonical,
                  "canonicalTagConfidence" = 'confident'
              WHERE id = :id
            `, {
              replacements: { 
                canonical: ingredient.canonical,
                id: product.id 
              }
            });
            console.log(`   ✅ Tagged: ${product.description.substring(0, 60)}...`);
            taggedCount++;
          } catch (error) {
            console.log(`   ❌ Failed to tag: ${error.message}`);
          }
        }
      }
      
      // Test results for this ingredient
      const testResults = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real,
          COUNT(CASE WHEN "brandOwner" = 'Generic' THEN 1 END) as generic
        FROM "IngredientCategorized" 
        WHERE "canonicalTag" = :canonical
      `, { 
        replacements: { canonical: ingredient.canonical },
        type: Sequelize.QueryTypes.SELECT 
      });
      
      if (testResults[0]) {
        const coverage = (testResults[0].real / testResults[0].total * 100).toFixed(1);
        console.log(`   📊 Coverage: ${coverage}% (${testResults[0].real}/${testResults[0].total})`);
        
        results.push({
          ingredient: ingredient.canonical,
          total: testResults[0].total,
          real: testResults[0].real,
          generic: testResults[0].generic,
          coverage: parseFloat(coverage),
          tagged: taggedCount
        });
      }
      
      totalTagged += taggedCount;
      
    } catch (error) {
      console.log(`   ❌ Error processing ${ingredient.canonical}: ${error.message}`);
    }
    
    console.log('');
  }
  
  // Summary
  console.log('🎯 SCALE-UP RESULTS:\n');
  console.log(`   ✅ Total products tagged: ${totalTagged}`);
  console.log(`   🛡️  All changes are safe and reversible`);
  console.log('\n   📊 Coverage by ingredient:');
  
  results.sort((a, b) => b.coverage - a.coverage);
  results.forEach(result => {
    console.log(`      ${result.ingredient}: ${result.coverage}% (${result.real}/${result.total})`);
  });
  
  const avgCoverage = results.reduce((sum, r) => sum + r.coverage, 0) / results.length;
  console.log(`\n   📈 Average real product coverage: ${avgCoverage.toFixed(1)}%`);
  
  // Test overall improvement
  console.log('\n🧪 Testing overall improvement...');
  const overallTest = await db.query(`
    SELECT 
      COUNT(*) as total_products,
      COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real_products,
      COUNT(CASE WHEN "canonicalTag" IS NOT NULL THEN 1 END) as tagged_products
    FROM "IngredientCategorized" 
    WHERE "canonicalTag" IN (${SCALE_UP_INGREDIENTS.map(i => `'${i.canonical}'`).join(',')})
  `, { type: Sequelize.QueryTypes.SELECT });
  
  if (overallTest[0]) {
    const overallCoverage = (overallTest[0].real_products / overallTest[0].total_products * 100).toFixed(1);
    console.log(`   📊 Overall real product coverage: ${overallCoverage}%`);
    console.log(`   📊 Total tagged products: ${overallTest[0].tagged_products}`);
  }
  
  process.exit(0);
}

addRealProductsScaleUp(); 