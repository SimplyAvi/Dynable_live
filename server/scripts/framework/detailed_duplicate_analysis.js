const db = require('./db/database');
const fs = require('fs');

async function detailedDuplicateAnalysis() {
  console.log('🔍 DETAILED DUPLICATE CANONICAL ANALYSIS\n');
  
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');
    
    // Get all canonical ingredients with their mapping details
    const canonicals = await db.query(`
      SELECT 
        ci.id as "canonicalId",
        ci.name as "canonicalName",
        COUNT(itc.id) as "mappingCount",
        ARRAY_AGG(itc."messyName" ORDER BY itc."messyName") as "messyNames"
      FROM "CanonicalRecipeIngredients" ci
      JOIN "IngredientToCanonicals" itc ON ci.id = itc."IngredientId"
      GROUP BY ci.id, ci.name
      HAVING COUNT(itc.id) > 1
      ORDER BY COUNT(itc.id) DESC
    `, { type: db.QueryTypes.SELECT });
    
    console.log(`📊 Found ${canonicals.length} canonical ingredients with multiple mappings\n`);
    
    // Detailed categorization
    const analysis = {
      definitelyRemove: [], // Generic terms, measurements, non-ingredients
      definitelyKeep: [],   // Real ingredients with legitimate variants
      needsReview: [],      // Borderline cases that need manual decision
      suspicious: []        // Potentially problematic but unclear
    };
    
    // Definitely remove - generic terms, measurements, non-ingredients
    const removeTerms = [
      'slices', 'cup', 'cups', 'ounces', 'cloves', 'sticks', 'threads', 'shavings',
      'shells', 'wedges', 'wheels', 'servings', 'toppings', 'vegetables', 'powder',
      'seeds', 'spice', 'stock', 'solution', 'soda', 'salad', 'tortillas', 'twist',
      'wrap', 'recipe', 'slice', 'stick', 'spray', 'wedge', 'wheel', 'thread',
      'shaving', 'shell', 'serving', 'topping', 'vegetable', 'grated', 'sprigs'
    ];
    
    // Definitely keep - real ingredients with legitimate variants
    const keepTerms = [
      'garlic', 'egg', 'chicken', 'oil', 'lettuce', 'lemon', 'flour', 'onion',
      'tomato', 'potato', 'carrot', 'celery', 'pepper', 'mushroom', 'cheese',
      'milk', 'butter', 'bread', 'rice', 'pasta', 'sauce', 'vinegar', 'juice',
      'broth', 'spinach', 'kale', 'cucumber', 'zucchini', 'squash', 'corn',
      'peas', 'beans', 'apple', 'banana', 'orange', 'grape', 'strawberry',
      'almond', 'walnut', 'peanut', 'seed', 'herb', 'spice', 'lime', 'eggs',
      'vanilla', 'sugar', 'salt', 'scallions', 'cream', 'cinnamon'
    ];
    
    // Analyze each canonical
    canonicals.forEach(canonical => {
      const name = canonical.canonicalName.toLowerCase();
      const messyNames = canonical.messyNames;
      
      // Check if it's a definitely remove term
      if (removeTerms.includes(name)) {
        analysis.definitelyRemove.push({
          ...canonical,
          reason: 'Generic term, measurement, or non-ingredient',
          recommendation: 'Remove all mappings'
        });
        return;
      }
      
      // Check if it's a definitely keep term
      if (keepTerms.includes(name)) {
        analysis.definitelyKeep.push({
          ...canonical,
          reason: 'Real ingredient with legitimate variants',
          recommendation: 'Review and merge legitimate variants'
        });
        return;
      }
      
      // Check for suspicious patterns in messy names
      const hasRecipePatterns = messyNames.some(messy => 
        /pounds?\s+|teaspoons?\s+|tablespoons?\s+|cups?\s+|ounces?\s+|chopped\s+|diced\s+|sliced\s+|minced\s+|peeled\s+|seeded\s+|cut into\s+|quartered\s+|halved\s+|thinly\s+|coarsely\s+|finely\s+|roughly\s+|about\s+|such as\s+|divided\s+|optional\s+|or more to taste|for garnish|reserved/i.test(messy.toLowerCase())
      );
      
      const hasMeasurements = messyNames.some(messy => 
        /\d+\s*(pound|teaspoon|tablespoon|cup|ounce|gram|ml|g|kg|lb)/i.test(messy.toLowerCase())
      );
      
      const hasGenericPatterns = messyNames.some(messy => 
        /^\d+\//.test(messy) || /^\d+\s*[a-z]+/.test(messy) || /^[a-z]+\s+\d+/.test(messy) || /^\d+$/.test(messy)
      );
      
      if (hasRecipePatterns || hasMeasurements || hasGenericPatterns) {
        analysis.definitelyRemove.push({
          ...canonical,
          reason: 'Contains recipe text, measurements, or generic patterns',
          recommendation: 'Remove all mappings'
        });
        return;
      }
      
      // Check for legitimate ingredient variants
      const hasLegitimateVariants = messyNames.some(messy => {
        const lowerMessy = messy.toLowerCase();
        return (
          lowerMessy.includes('clove') || lowerMessy.includes('bulb') || 
          lowerMessy.includes('white') || lowerMessy.includes('yolk') ||
          lowerMessy.includes('breast') || lowerMessy.includes('thigh') ||
          lowerMessy.includes('olive') || lowerMessy.includes('vegetable') ||
          lowerMessy.includes('romaine') || lowerMessy.includes('iceberg') ||
          lowerMessy.includes('juiced') || lowerMessy.includes('zested') ||
          lowerMessy.includes('whole wheat') || lowerMessy.includes('all-purpose')
        );
      });
      
      if (hasLegitimateVariants) {
        analysis.definitelyKeep.push({
          ...canonical,
          reason: 'Contains legitimate ingredient variants',
          recommendation: 'Review and merge legitimate variants'
        });
        return;
      }
      
      // Borderline cases that need manual review
      if (messyNames.length > 10) {
        analysis.needsReview.push({
          ...canonical,
          reason: 'High number of mappings, needs manual review',
          recommendation: 'Manual review required'
        });
        return;
      }
      
      // Suspicious cases
      analysis.suspicious.push({
        ...canonical,
        reason: 'Unclear category, needs manual review',
        recommendation: 'Manual review required'
      });
    });
    
    // Generate detailed report
    let report = '# DETAILED DUPLICATE CANONICAL ANALYSIS\n\n';
    report += `## Summary\n`;
    report += `- **Total duplicate canonicals:** ${canonicals.length}\n`;
    report += `- **Definitely remove:** ${analysis.definitelyRemove.length}\n`;
    report += `- **Definitely keep:** ${analysis.definitelyKeep.length}\n`;
    report += `- **Needs review:** ${analysis.needsReview.length}\n`;
    report += `- **Suspicious:** ${analysis.suspicious.length}\n\n`;
    
    // Definitely remove section
    report += `## 🔴 DEFINITELY REMOVE (${analysis.definitelyRemove.length})\n\n`;
    analysis.definitelyRemove.forEach(item => {
      report += `### ${item.canonicalName} (${item.mappingCount} mappings)\n`;
      report += `**Reason:** ${item.reason}\n`;
      report += `**Recommendation:** ${item.recommendation}\n`;
      report += `**Messy names:**\n`;
      item.messyNames.forEach(messy => {
        report += `- "${messy}"\n`;
      });
      report += `\n`;
    });
    
    // Definitely keep section
    report += `## 🟢 DEFINITELY KEEP (${analysis.definitelyKeep.length})\n\n`;
    analysis.definitelyKeep.forEach(item => {
      report += `### ${item.canonicalName} (${item.mappingCount} mappings)\n`;
      report += `**Reason:** ${item.reason}\n`;
      report += `**Recommendation:** ${item.recommendation}\n`;
      report += `**Messy names:**\n`;
      item.messyNames.forEach(messy => {
        report += `- "${messy}"\n`;
      });
      report += `\n`;
    });
    
    // Needs review section
    report += `## 🟡 NEEDS REVIEW (${analysis.needsReview.length})\n\n`;
    analysis.needsReview.forEach(item => {
      report += `### ${item.canonicalName} (${item.mappingCount} mappings)\n`;
      report += `**Reason:** ${item.reason}\n`;
      report += `**Recommendation:** ${item.recommendation}\n`;
      report += `**Messy names:**\n`;
      item.messyNames.forEach(messy => {
        report += `- "${messy}"\n`;
      });
      report += `\n`;
    });
    
    // Suspicious section
    report += `## ❓ SUSPICIOUS (${analysis.suspicious.length})\n\n`;
    analysis.suspicious.forEach(item => {
      report += `### ${item.canonicalName} (${item.mappingCount} mappings)\n`;
      report += `**Reason:** ${item.reason}\n`;
      report += `**Recommendation:** ${item.recommendation}\n`;
      report += `**Messy names:**\n`;
      item.messyNames.forEach(messy => {
        report += `- "${messy}"\n`;
      });
      report += `\n`;
    });
    
    // Write detailed report to file
    fs.writeFileSync('detailed_duplicate_analysis.md', report);
    
    // Console summary
    console.log('📊 ANALYSIS COMPLETE:\n');
    console.log(`🔴 Definitely remove: ${analysis.definitelyRemove.length} canonicals`);
    console.log(`🟢 Definitely keep: ${analysis.definitelyKeep.length} canonicals`);
    console.log(`🟡 Needs review: ${analysis.needsReview.length} canonicals`);
    console.log(`❓ Suspicious: ${analysis.suspicious.length} canonicals\n`);
    
    console.log('📄 Detailed report written to: detailed_duplicate_analysis.md');
    
    // Show top examples from each category
    if (analysis.definitelyRemove.length > 0) {
      console.log('\n🔴 TOP DEFINITELY REMOVE:');
      analysis.definitelyRemove.slice(0, 5).forEach(item => {
        console.log(`   "${item.canonicalName}": ${item.mappingCount} mappings - ${item.reason}`);
      });
    }
    
    if (analysis.definitelyKeep.length > 0) {
      console.log('\n🟢 TOP DEFINITELY KEEP:');
      analysis.definitelyKeep.slice(0, 5).forEach(item => {
        console.log(`   "${item.canonicalName}": ${item.mappingCount} mappings - ${item.reason}`);
      });
    }
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.close();
  }
}

detailedDuplicateAnalysis(); 