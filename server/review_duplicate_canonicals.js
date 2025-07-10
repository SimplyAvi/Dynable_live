const db = require('./db/database');

async function reviewDuplicateCanonicals() {
  console.log('🔍 REVIEWING DUPLICATE CANONICAL MAPPINGS\n');
  
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');
    
    // Get all canonical ingredients with their mapping counts
    const canonicals = await db.query(`
      SELECT 
        ci.name as "canonicalName",
        COUNT(itc.id) as "mappingCount",
        ARRAY_AGG(itc."messyName" ORDER BY itc."messyName") as "messyNames"
      FROM "CanonicalIngredients" ci
      JOIN "IngredientToCanonicals" itc ON ci.id = itc."CanonicalIngredientId"
      GROUP BY ci.id, ci.name
      HAVING COUNT(itc.id) > 1
      ORDER BY COUNT(itc.id) DESC
    `, { type: db.QueryTypes.SELECT });
    
    console.log(`📊 Found ${canonicals.length} canonical ingredients with multiple mappings\n`);
    
    // Categorize duplicates
    const categories = {
      genericTerms: [],
      realIngredients: [],
      suspicious: []
    };
    
    // Generic terms that should be removed
    const genericTerms = [
      'slices', 'cup', 'cups', 'ounces', 'cloves', 'sticks', 'threads', 'shavings',
      'shells', 'wedges', 'wheels', 'servings', 'toppings', 'vegetables', 'powder',
      'seeds', 'spice', 'stock', 'solution', 'soda', 'salad', 'tortillas', 'twist',
      'wrap', 'recipe', 'slice', 'stick', 'spray', 'wedge', 'wheel', 'thread',
      'shaving', 'shell', 'serving', 'topping', 'vegetable'
    ];
    
    // Real ingredients that might have legitimate variants
    const realIngredients = [
      'garlic', 'egg', 'chicken', 'oil', 'lettuce', 'lemon', 'flour', 'onion',
      'tomato', 'potato', 'carrot', 'celery', 'pepper', 'mushroom', 'cheese',
      'milk', 'butter', 'bread', 'rice', 'pasta', 'sauce', 'vinegar', 'juice',
      'broth', 'spinach', 'kale', 'cucumber', 'zucchini', 'squash', 'corn',
      'peas', 'beans', 'apple', 'banana', 'orange', 'grape', 'strawberry',
      'almond', 'walnut', 'peanut', 'seed', 'herb', 'spice'
    ];
    
    canonicals.forEach(canonical => {
      const name = canonical.canonicalName.toLowerCase();
      
      if (genericTerms.includes(name)) {
        categories.genericTerms.push(canonical);
      } else if (realIngredients.includes(name)) {
        categories.realIngredients.push(canonical);
      } else {
        categories.suspicious.push(canonical);
      }
    });
    
    // Report findings
    console.log('🚨 CATEGORIES:\n');
    console.log(`🔤 Generic terms (should be removed): ${categories.genericTerms.length}`);
    console.log(`🥕 Real ingredients (review for variants): ${categories.realIngredients.length}`);
    console.log(`❓ Suspicious (need manual review): ${categories.suspicious.length}\n`);
    
    // Show top generic terms
    if (categories.genericTerms.length > 0) {
      console.log('🔤 TOP GENERIC TERMS (RECOMMENDED FOR REMOVAL):');
      categories.genericTerms.slice(0, 10).forEach(canonical => {
        console.log(`   "${canonical.canonicalName}": ${canonical.mappingCount} mappings`);
        canonical.messyNames.slice(0, 5).forEach(messy => {
          console.log(`     - "${messy}"`);
        });
        if (canonical.messyNames.length > 5) {
          console.log(`     ... and ${canonical.messyNames.length - 5} more`);
        }
        console.log('');
      });
    }
    
    // Show top real ingredients
    if (categories.realIngredients.length > 0) {
      console.log('🥕 TOP REAL INGREDIENTS (REVIEW FOR VARIANTS):');
      categories.realIngredients.slice(0, 10).forEach(canonical => {
        console.log(`   "${canonical.canonicalName}": ${canonical.mappingCount} mappings`);
        canonical.messyNames.slice(0, 5).forEach(messy => {
          console.log(`     - "${messy}"`);
        });
        if (canonical.messyNames.length > 5) {
          console.log(`     ... and ${canonical.messyNames.length - 5} more`);
        }
        console.log('');
      });
    }
    
    // Show suspicious ones
    if (categories.suspicious.length > 0) {
      console.log('❓ SUSPICIOUS (NEED MANUAL REVIEW):');
      categories.suspicious.slice(0, 10).forEach(canonical => {
        console.log(`   "${canonical.canonicalName}": ${canonical.mappingCount} mappings`);
        canonical.messyNames.slice(0, 5).forEach(messy => {
          console.log(`     - "${messy}"`);
        });
        if (canonical.messyNames.length > 5) {
          console.log(`     ... and ${canonical.messyNames.length - 5} more`);
        }
        console.log('');
      });
    }
    
    // Summary statistics
    const totalGenericMappings = categories.genericTerms.reduce((sum, c) => sum + parseInt(c.mappingCount), 0);
    const totalRealMappings = categories.realIngredients.reduce((sum, c) => sum + parseInt(c.mappingCount), 0);
    const totalSuspiciousMappings = categories.suspicious.reduce((sum, c) => sum + parseInt(c.mappingCount), 0);
    
    console.log('📊 SUMMARY:');
    console.log(`   Generic term mappings: ${totalGenericMappings} (recommended for removal)`);
    console.log(`   Real ingredient mappings: ${totalRealMappings} (review for variants)`);
    console.log(`   Suspicious mappings: ${totalSuspiciousMappings} (manual review needed)`);
    console.log(`   Total duplicate mappings: ${totalGenericMappings + totalRealMappings + totalSuspiciousMappings}`);
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.close();
  }
}

reviewDuplicateCanonicals(); 