const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Database connection (you'll need to set up your connection)
const db = require('./server/db/database');

async function analyzeCanonicalTagBug() {
  console.log('🔍 ANALYZING CANONICAL TAG SUBSTRING EXTRACTION BUG\n');
  
  try {
    // 1. Find products with problematic canonical tags
    console.log('1️⃣ FINDING PROBLEMATIC CANONICAL TAGS');
    console.log('=' .repeat(50));
    
    const problematicQueries = [
      // Products with "sliced" that got "ice" tag
      `SELECT id, description, "canonicalTag", "brandOwner" 
       FROM "IngredientCategorized" 
       WHERE LOWER(description) LIKE '%sliced%' 
       AND "canonicalTag" = 'ice'`,
      
      // Products with "pieces" that got "pie" tag  
      `SELECT id, description, "canonicalTag", "brandOwner" 
       FROM "IngredientCategorized" 
       WHERE LOWER(description) LIKE '%pieces%' 
       AND "canonicalTag" = 'pie'`,
      
      // Products with "cup" that got "up" tag
      `SELECT id, description, "canonicalTag", "brandOwner" 
       FROM "IngredientCategorized" 
       WHERE LOWER(description) LIKE '%cup%' 
       AND "canonicalTag" = 'up'`,
      
      // Products with "chopped" that got "chopped" tag
      `SELECT id, description, "canonicalTag", "brandOwner" 
       FROM "IngredientCategorized" 
       WHERE LOWER(description) LIKE '%chopped%' 
       AND "canonicalTag" = 'chopped'`,
      
      // Generic "Pure" products with wrong tags
      `SELECT id, description, "canonicalTag", "brandOwner" 
       FROM "IngredientCategorized" 
       WHERE "brandOwner" = 'Generic' 
       AND LOWER(description) LIKE 'pure%' 
       AND "canonicalTag" IS NOT NULL`
    ];
    
    const problematicResults = {};
    for (let i = 0; i < problematicQueries.length; i++) {
      const results = await db.query(problematicQueries[i], { 
        type: Sequelize.QueryTypes.SELECT 
      });
      problematicResults[`query_${i+1}`] = results;
      console.log(`Query ${i+1}: Found ${results.length} problematic products`);
    }
    
    // 2. Analyze the pattern recognition scripts
    console.log('\n2️⃣ ANALYZING PATTERN RECOGNITION SCRIPTS');
    console.log('=' .repeat(50));
    
    // Check if pattern recognition files exist
    const patternFiles = [
      'server/scripts/utilities/pattern_recognition_engine.js',
      'server/scripts/utilities/pattern_recognition_mapper_v2.js',
      'server/scripts/utilities/food_table_analysis.js',
      'server/scripts/utilities/batch_canonical_tagger.js'
    ];
    
    for (const file of patternFiles) {
      if (fs.existsSync(file)) {
        console.log(`✅ Found: ${file}`);
        const content = fs.readFileSync(file, 'utf-8');
        
        // Look for substring extraction patterns
        const substringPatterns = [
          /\.substring\(/g,
          /\.slice\(/g,
          /\.substr\(/g,
          /toLowerCase\(\)/g,
          /replace\(/g
        ];
        
        for (const pattern of substringPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            console.log(`  ⚠️  Found ${matches.length} potential substring operations`);
          }
        }
      } else {
        console.log(`❌ Missing: ${file}`);
      }
    }
    
    // 3. Check the food analysis results
    console.log('\n3️⃣ ANALYZING FOOD ANALYSIS RESULTS');
    console.log('=' .repeat(50));
    
    const analysisFile = 'server/scripts/utilities/food_analysis_results.json';
    if (fs.existsSync(analysisFile)) {
      const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf-8'));
      console.log(`✅ Found food analysis results with ${analysis.suggestions?.length || 0} suggestions`);
      
      // Look for problematic suggestions
      if (analysis.suggestions) {
        const problematicSuggestions = analysis.suggestions.filter(s => 
          s.suggestedCanonical && 
          ['ice', 'pie', 'up', 'chopped'].includes(s.suggestedCanonical)
        );
        
        console.log(`Found ${problematicSuggestions.length} problematic suggestions:`);
        problematicSuggestions.slice(0, 5).forEach(s => {
          console.log(`  "${s.description}" → ${s.suggestedCanonical}`);
        });
      }
    }
    
    // 4. Check pattern recognition suggestions
    console.log('\n4️⃣ ANALYZING PATTERN RECOGNITION SUGGESTIONS');
    console.log('=' .repeat(50));
    
    const suggestionFiles = [
      'server/scripts/utilities/pattern_recognition_suggestions.json',
      'server/scripts/utilities/pattern_recognition_mapper_v2_suggestions.json'
    ];
    
    for (const file of suggestionFiles) {
      if (fs.existsSync(file)) {
        const suggestions = JSON.parse(fs.readFileSync(file, 'utf-8'));
        console.log(`✅ Found ${suggestions.length} suggestions in ${file}`);
        
        const problematicSuggestions = suggestions.filter(s => 
          s.suggestedCanonical && 
          ['ice', 'pie', 'up', 'chopped'].includes(s.suggestedCanonical)
        );
        
        if (problematicSuggestions.length > 0) {
          console.log(`Found ${problematicSuggestions.length} problematic suggestions:`);
          problematicSuggestions.slice(0, 3).forEach(s => {
            console.log(`  "${s.description}" → ${s.suggestedCanonical}`);
          });
        }
      }
    }
    
    // 5. Check for substring extraction in tokenization
    console.log('\n5️⃣ ANALYZING TOKENIZATION LOGIC');
    console.log('=' .repeat(50));
    
    // Look for the tokenize function in pattern recognition scripts
    const patternRecognitionContent = fs.readFileSync('server/scripts/utilities/pattern_recognition_mapper_v2.js', 'utf-8');
    
    // Extract the tokenize function
    const tokenizeMatch = patternRecognitionContent.match(/function tokenize\([^)]*\)\s*\{[\s\S]*?\}/);
    if (tokenizeMatch) {
      console.log('Found tokenize function:');
      console.log(tokenizeMatch[0]);
      
      // Check if it's doing substring extraction
      if (tokenizeMatch[0].includes('substring') || tokenizeMatch[0].includes('slice')) {
        console.log('⚠️  WARNING: Tokenize function contains substring operations!');
      }
    }
    
    // 6. Check for keyword matching logic
    console.log('\n6️⃣ ANALYZING KEYWORD MATCHING LOGIC');
    console.log('=' .repeat(50));
    
    // Look for the getTopKeywords function
    const getTopKeywordsMatch = patternRecognitionContent.match(/function getTopKeywords\([^)]*\)\s*\{[\s\S]*?\}/);
    if (getTopKeywordsMatch) {
      console.log('Found getTopKeywords function:');
      console.log(getTopKeywordsMatch[0]);
    }
    
    // 7. Check for scoring logic that might cause substring extraction
    console.log('\n7️⃣ ANALYZING SCORING LOGIC');
    console.log('=' .repeat(50));
    
    // Look for scoring patterns
    const scoringPatterns = [
      /score\s*\+=\s*\d+/g,
      /tokens\[/g,
      /includes\(/g,
      /toLowerCase\(\)/g
    ];
    
    for (const pattern of scoringPatterns) {
      const matches = patternRecognitionContent.match(pattern);
      if (matches) {
        console.log(`Found ${matches.length} scoring operations: ${matches.slice(0, 3).join(', ')}`);
      }
    }
    
    // 8. Generate summary report
    console.log('\n8️⃣ SUMMARY REPORT');
    console.log('=' .repeat(50));
    
    const summary = {
      problematicProducts: Object.values(problematicResults).flat().length,
      patternFilesFound: patternFiles.filter(f => fs.existsSync(f)).length,
      analysisFileExists: fs.existsSync(analysisFile),
      suggestionFilesFound: suggestionFiles.filter(f => fs.existsSync(f)).length,
      hasSubstringOperations: patternRecognitionContent.includes('substring') || patternRecognitionContent.includes('slice'),
      potentialBugSources: []
    };
    
    // Identify potential bug sources
    if (summary.hasSubstringOperations) {
      summary.potentialBugSources.push('Substring operations in tokenization');
    }
    
    if (patternRecognitionContent.includes('tokens[0] === canonical')) {
      summary.potentialBugSources.push('First token matching in scoring');
    }
    
    if (patternRecognitionContent.includes('tokens.slice(0, 3)')) {
      summary.potentialBugSources.push('First 3 tokens matching in scoring');
    }
    
    console.log('Summary:', summary);
    
    // 9. Recommendations
    console.log('\n9️⃣ RECOMMENDATIONS');
    console.log('=' .repeat(50));
    
    console.log('1. IMMEDIATE FIXES:');
    console.log('   - Remove substring operations from tokenization');
    console.log('   - Use word boundary matching instead of substring matching');
    console.log('   - Add validation to prevent short canonical tags');
    console.log('   - Filter out generic "Pure" products from pattern recognition');
    
    console.log('\n2. VALIDATION CHECKS:');
    console.log('   - Add minimum length check for canonical tags');
    console.log('   - Add blacklist for problematic words (ice, pie, up, etc.)');
    console.log('   - Add whitelist for valid ingredient names');
    
    console.log('\n3. DATA CLEANUP:');
    console.log('   - Remove all problematic canonical tags');
    console.log('   - Re-run pattern recognition with fixes');
    console.log('   - Validate all new canonical tag assignments');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await db.close();
  }
}

// Run the analysis
analyzeCanonicalTagBug().catch(console.error); 