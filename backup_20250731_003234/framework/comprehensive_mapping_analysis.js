const db = require('./db/database');
const { IngredientToCanonical, Ingredient } = require('./db/models');

async function comprehensiveMappingAnalysis() {
  console.log('🔍 COMPREHENSIVE MAPPING ANALYSIS\n');
  
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
    
    // Analyze problematic patterns
    const issues = {
      recipeText: [],
      measurements: [],
      genericTerms: [],
      suspiciousMappings: [],
      duplicateCanonicals: {}
    };
    
    // Check for recipe text patterns
    const recipePatterns = [
      /pounds?\s+/i,
      /teaspoons?\s+/i,
      /tablespoons?\s+/i,
      /cups?\s+/i,
      /ounces?\s+/i,
      /grams?\s+/i,
      /chopped\s+/i,
      /diced\s+/i,
      /sliced\s+/i,
      /minced\s+/i,
      /peeled\s+/i,
      /seeded\s+/i,
      /cut into\s+/i,
      /quartered\s+/i,
      /halved\s+/i,
      /thinly\s+/i,
      /coarsely\s+/i,
      /finely\s+/i,
      /roughly\s+/i,
      /about\s+/i,
      /such as\s+/i,
      /divided\s+/i,
      /optional\s+/i,
      /or more to taste/i,
      /for garnish/i,
      /reserved/i
    ];
    
    // Check for generic terms that shouldn't be mapped
    const genericTerms = [
      'recipe', 'slice', 'stick', 'spray', 'powder', 'seeds', 'spice', 'stock',
      'solution', 'soda', 'salad', 'servings', 'toppings', 'tortillas', 'twist',
      'vegetables', 'wedge', 'wheel', 'wrap', 'threads', 'shavings', 'shells'
    ];
    
    // Check for suspicious mappings
    const suspiciousPatterns = [
      /^\d+\//, // Fractions
      /^\d+\s*[a-z]+/, // Numbers followed by text
      /^[a-z]+\s+\d+/, // Text followed by numbers
      /^\d+$/, // Just numbers
      /^[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+/i // Very long ingredient names
    ];
    
    mappings.forEach(mapping => {
      const messyName = mapping.messyName.toLowerCase();
      const canonicalName = mapping.canonicalName;
      
      // Check for recipe text patterns
      const hasRecipePattern = recipePatterns.some(pattern => pattern.test(messyName));
      if (hasRecipePattern) {
        issues.recipeText.push(mapping);
      }
      
      // Check for generic terms
      if (genericTerms.includes(messyName)) {
        issues.genericTerms.push(mapping);
      }
      
      // Check for suspicious patterns
      const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(messyName));
      if (hasSuspiciousPattern) {
        issues.suspiciousMappings.push(mapping);
      }
      
      // Check for measurements
      if (/\d+\s*(pound|teaspoon|tablespoon|cup|ounce|gram|ml|g|kg|lb)/i.test(messyName)) {
        issues.measurements.push(mapping);
      }
      
      // Track duplicate canonicals
      if (!issues.duplicateCanonicals[canonicalName]) {
        issues.duplicateCanonicals[canonicalName] = [];
      }
      issues.duplicateCanonicals[canonicalName].push(mapping);
    });
    
    // Filter out canonicals with only one mapping
    Object.keys(issues.duplicateCanonicals).forEach(canonical => {
      if (issues.duplicateCanonicals[canonical].length === 1) {
        delete issues.duplicateCanonicals[canonical];
      }
    });
    
    // Report findings
    console.log('🚨 ISSUES FOUND:\n');
    console.log(`📝 Recipe text mappings: ${issues.recipeText.length}`);
    console.log(`📏 Measurement mappings: ${issues.measurements.length}`);
    console.log(`🔤 Generic term mappings: ${issues.genericTerms.length}`);
    console.log(`❓ Suspicious mappings: ${issues.suspiciousMappings.length}`);
    console.log(`🔄 Duplicate canonical mappings: ${Object.keys(issues.duplicateCanonicals).length}\n`);
    
    // Show examples of each issue type
    if (issues.recipeText.length > 0) {
      console.log('📝 RECIPE TEXT EXAMPLES:');
      issues.recipeText.slice(0, 10).forEach(mapping => {
        console.log(`   "${mapping.messyName}" → "${mapping.canonicalName}"`);
      });
      console.log('');
    }
    
    if (issues.measurements.length > 0) {
      console.log('📏 MEASUREMENT EXAMPLES:');
      issues.measurements.slice(0, 10).forEach(mapping => {
        console.log(`   "${mapping.messyName}" → "${mapping.canonicalName}"`);
      });
      console.log('');
    }
    
    if (issues.genericTerms.length > 0) {
      console.log('🔤 GENERIC TERM EXAMPLES:');
      issues.genericTerms.slice(0, 10).forEach(mapping => {
        console.log(`   "${mapping.messyName}" → "${mapping.canonicalName}"`);
      });
      console.log('');
    }
    
    // Show top duplicate canonicals
    const topDuplicates = Object.entries(issues.duplicateCanonicals)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10);
    
    if (topDuplicates.length > 0) {
      console.log('🔄 TOP DUPLICATE CANONICALS:');
      topDuplicates.forEach(([canonical, mappings]) => {
        console.log(`   "${canonical}": ${mappings.length} mappings`);
        mappings.slice(0, 3).forEach(mapping => {
          console.log(`     - "${mapping.messyName}"`);
        });
        if (mappings.length > 3) {
          console.log(`     ... and ${mappings.length - 3} more`);
        }
        console.log('');
      });
    }
    
    // Calculate statistics
    const totalIssues = issues.recipeText.length + issues.measurements.length + 
                       issues.genericTerms.length + issues.suspiciousMappings.length;
    const issuePercentage = ((totalIssues / mappings.length) * 100).toFixed(1);
    
    console.log(`📊 SUMMARY:`);
    console.log(`   Total mappings: ${mappings.length}`);
    console.log(`   Problematic mappings: ${totalIssues} (${issuePercentage}%)`);
    console.log(`   Clean mappings: ${mappings.length - totalIssues} (${(100 - parseFloat(issuePercentage)).toFixed(1)}%)`);
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.close();
  }
}

comprehensiveMappingAnalysis(); 