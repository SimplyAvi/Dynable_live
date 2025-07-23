const { Sequelize } = require('sequelize');
const db = require('../../db/database');

// Validation rules for canonical ingredients
const VALIDATION_RULES = {
  // Minimum length
  minLength: 3,
  
  // Blacklisted words that aren't ingredients
  blacklist: [
    'ice', 'pie', 'up', 'chopped', 'ed', 'ing', 'ly', 'er', 'est',
    'and', 'or', 'with', 'for', 'the', 'a', 'an', 'of', 'in', 'on',
    'to', 'from', 'by', 'at', 'is', 'are', 'was', 'were', 'be',
    'cup', 'cups', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons',
    'ounce', 'ounces', 'pound', 'pounds', 'gram', 'grams', 'kg', 'ml',
    'tbsp', 'tsp', 'oz', 'lb', 'g', 'l', 'liter', 'liters'
  ],
  
  // Preparation methods (not ingredients)
  preparationMethods: [
    'chopped', 'sliced', 'diced', 'minced', 'cut', 'drained', 'rinsed',
    'peeled', 'seeded', 'cored', 'trimmed', 'washed', 'dried', 'crushed',
    'grated', 'shredded', 'julienned', 'cubed', 'striped', 'quartered',
    'beaten', 'melted', 'softened', 'hardened', 'frozen', 'thawed',
    'cooked', 'raw', 'fresh', 'dried', 'canned', 'frozen'
  ],
  
  // Valid ingredient categories
  validCategories: [
    'vegetable', 'fruit', 'meat', 'fish', 'dairy', 'grain', 'nut', 'seed',
    'spice', 'herb', 'oil', 'sauce', 'condiment', 'sweetener', 'beverage'
  ]
};

async function validateCanonicalIngredients() {
  console.log('🔍 VALIDATING CANONICAL INGREDIENTS\n');
  
  try {
    // Get all canonical ingredients
    const ingredients = await db.query('SELECT id, name, aliases FROM "Ingredients" ORDER BY name', {
      type: Sequelize.QueryTypes.SELECT
    });
    
    console.log(`📊 Found ${ingredients.length} canonical ingredients to validate\n`);
    
    const issues = [];
    const validIngredients = [];
    
    for (const ingredient of ingredients) {
      const name = ingredient.name.toLowerCase();
      const problems = [];
      
      // Check minimum length
      if (name.length < VALIDATION_RULES.minLength) {
        problems.push(`Too short (${name.length} chars)`);
      }
      
      // Check blacklist
      if (VALIDATION_RULES.blacklist.includes(name)) {
        problems.push('Blacklisted word');
      }
      
      // Check preparation methods
      if (VALIDATION_RULES.preparationMethods.includes(name)) {
        problems.push('Preparation method, not ingredient');
      }
      
      // Check for common non-ingredient patterns
      if (name.match(/^(and|or|with|for|the|a|an|of|in|on|to|from|by|at)$/)) {
        problems.push('Common word, not ingredient');
      }
      
      // Check for measurement units
      if (name.match(/^(cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|ounce|ounces|pound|pounds|gram|grams|kg|ml|tbsp|tsp|oz|lb|g|l|liter|liters)$/)) {
        problems.push('Measurement unit, not ingredient');
      }
      
      if (problems.length > 0) {
        issues.push({
          id: ingredient.id,
          name: ingredient.name,
          problems,
          aliases: ingredient.aliases
        });
      } else {
        validIngredients.push(ingredient.name);
      }
    }
    
    // Report results
    console.log('❌ PROBLEMATIC INGREDIENTS:');
    console.log('=' .repeat(50));
    
    if (issues.length === 0) {
      console.log('✅ No problematic ingredients found!');
    } else {
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. "${issue.name}" (ID: ${issue.id})`);
        issue.problems.forEach(problem => console.log(`   - ${problem}`));
        if (issue.aliases && typeof issue.aliases === 'string') {
          console.log(`   - Has ${issue.aliases.split(',').length} aliases`);
        }
        console.log('');
      });
    }
    
    console.log('✅ VALID INGREDIENTS:');
    console.log('=' .repeat(50));
    console.log(`Found ${validIngredients.length} valid ingredients`);
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Total ingredients: ${ingredients.length}`);
    console.log(`Valid: ${validIngredients.length}`);
    console.log(`Problematic: ${issues.length}`);
    console.log(`Success rate: ${((validIngredients.length / ingredients.length) * 100).toFixed(1)}%`);
    
    // Recommendations
    if (issues.length > 0) {
      console.log('\n🔧 RECOMMENDATIONS:');
      console.log('1. Review and fix problematic ingredients');
      console.log('2. Map aliases to proper ingredients');
      console.log('3. Add validation to prevent future issues');
      console.log('4. Consider splitting complex ingredients');
    }
    
  } catch (error) {
    console.error('❌ Error during validation:', error);
  } finally {
    await db.close();
  }
}

// Run validation
validateCanonicalIngredients().catch(console.error); 