const db = require('./db/database');
const { IngredientToCanonical, Ingredient } = require('./db/models');

async function reviewIngredientMappings() {
  console.log('🔍 REVIEWING INGREDIENT MAPPINGS\n');
  
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');
    
    // Get all mappings with canonical ingredient names
    const mappings = await db.query(`
      SELECT 
        itc."messyName",
        ci.name as "canonicalName",
        itc."createdAt"
      FROM "IngredientToCanonicals" itc
      JOIN "CanonicalRecipeIngredients" ci ON itc."IngredientId" = ci.id
      ORDER BY itc."messyName"
    `, { type: db.QueryTypes.SELECT });
    
    console.log(`📊 Total mappings found: ${mappings.length}\n`);
    
    // Show first 50 mappings
    console.log('📋 FIRST 50 MAPPINGS:');
    console.log('='.repeat(80));
    mappings.slice(0, 50).forEach((mapping, index) => {
      console.log(`${(index + 1).toString().padStart(3)}. "${mapping.messyName}" → "${mapping.canonicalName}"`);
    });
    
    // Check for problematic ingredients
    const problematicRecipeIngredients = [
      'soy sauce', 'ketchup', 'tomato', 'salmon', 'honey', 'vinegar', 
      'almond', 'peanut', 'onion', 'cheddar cheese', 'garlic', 'carrot', 
      'potato', 'chicken breast', 'ground beef', 'bacon', 'ham', 'shrimp', 
      'rice', 'pasta', 'lemon', 'mayonnaise', 'parmesan cheese', 'heavy cream', 
      'sour cream', 'cream cheese', 'bell pepper', 'water', 'egg', 'olive oil', 
      'extra virgin olive oil', 'unsalted butter', 'bittersweet chocolate', 
      'dijon mustard', 'kosher salt', 'all-purpose flour', 'granulated sugar', 
      'large eggs', 'vanilla extract', 'black pepper', 'sea salt', 'brown sugar', 
      'powdered sugar', 'baking soda', 'cornstarch', 'flour', 'vegetable oil', 
      'canola oil', 'sesame oil', 'coconut oil', 'maple syrup', 'molasses', 
      'agave nectar'
    ];
    
    console.log('\n🚨 PROBLEMATIC INGREDIENT MAPPINGS:');
    console.log('='.repeat(80));
    
    const problematicMappings = mappings.filter(mapping => 
      problematicRecipeIngredients.some(ingredient => 
        mapping.messyName.toLowerCase().includes(ingredient.toLowerCase()) ||
        mapping.canonicalName.toLowerCase().includes(ingredient.toLowerCase())
      )
    );
    
    if (problematicMappings.length > 0) {
      problematicMappings.forEach((mapping, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. "${mapping.messyName}" → "${mapping.canonicalName}"`);
      });
    } else {
      console.log('No problematic ingredient mappings found.');
    }
    
    // Check for mappings that might be too broad
    console.log('\n⚠️  POTENTIALLY BROAD MAPPINGS:');
    console.log('='.repeat(80));
    
    const broadMappings = mappings.filter(mapping => {
      const messy = mapping.messyName.toLowerCase();
      const canonical = mapping.canonicalName.toLowerCase();
      
      // Check for very short or generic names
      return messy.length <= 3 || 
             canonical.length <= 3 ||
             ['oil', 'salt', 'sugar', 'flour', 'milk', 'egg', 'water'].includes(canonical) ||
             ['oil', 'salt', 'sugar', 'flour', 'milk', 'egg', 'water'].includes(messy);
    });
    
    if (broadMappings.length > 0) {
      broadMappings.forEach((mapping, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. "${mapping.messyName}" → "${mapping.canonicalName}"`);
      });
    } else {
      console.log('No potentially broad mappings found.');
    }
    
    // Check for mappings with brand names or processed terms
    console.log('\n🏷️  MAPPINGS WITH BRAND/PROCESSED TERMS:');
    console.log('='.repeat(80));
    
    const brandTerms = ['campbell', 'kraft', 'heinz', 'nestle', 'pure', 'organic', 'natural', 'fresh', 'frozen', 'canned', 'dried', 'powder', 'extract', 'sauce', 'paste', 'juice', 'concentrate'];
    
    const brandMappings = mappings.filter(mapping => 
      brandTerms.some(term => 
        mapping.messyName.toLowerCase().includes(term.toLowerCase()) ||
        mapping.canonicalName.toLowerCase().includes(term.toLowerCase())
      )
    );
    
    if (brandMappings.length > 0) {
      brandMappings.forEach((mapping, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. "${mapping.messyName}" → "${mapping.canonicalName}"`);
      });
    } else {
      console.log('No brand/processed term mappings found.');
    }
    
    // Summary statistics
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Total mappings: ${mappings.length}`);
    console.log(`Problematic ingredient mappings: ${problematicMappings.length}`);
    console.log(`Potentially broad mappings: ${broadMappings.length}`);
    console.log(`Brand/processed term mappings: ${brandMappings.length}`);
    
    // Check for duplicate canonical names
    const canonicalCounts = {};
    mappings.forEach(mapping => {
      canonicalCounts[mapping.canonicalName] = (canonicalCounts[mapping.canonicalName] || 0) + 1;
    });
    
    const duplicates = Object.entries(canonicalCounts).filter(([name, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log('\n🔄 DUPLICATE CANONICAL NAMES:');
      console.log('='.repeat(80));
      duplicates.forEach(([name, count]) => {
        console.log(`"${name}": ${count} mappings`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

reviewIngredientMappings(); 