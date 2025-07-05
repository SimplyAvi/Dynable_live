const { Food } = require('../db/models');
const cleanIngredientName = require('../api/foodRoutes').cleanIngredientName;

async function testWhalerFishSandwichMatching() {
  console.log('Testing product matching for Whaler Fish Sandwich ingredients...\n');
  
  const ingredients = [
    'cup whole milk',
    'eggs', 
    'egg',
    '1/2 cups flour',
    'cup yellow cornmeal',
    'tablespoons chopped parsley',
    'flounder fillets',
    'and pepper to taste',
    'tablespoons canola oil',
    'sesame-seed hamburger buns',
    'leaves romaine lettuce',
    'tomato, sliced',
    'slices mild cheese, such as mild cheddar (optional)',
    'cup mayonnaise',
    'tablespoons pickle relish',
    'tablespoon lemon juice',
    'dash Tabasco sauce'
  ];

  // Define comprehensive ingredient-specific product matching rules
  const ingredientProductRules = {
    // Baking & Flour
    'flour': {
      primary: ['bread', 'tortilla', 'pasta', 'bun', 'muffin', 'biscuit', 'cake', 'cookie', 'pastry', 'flour'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert', 'm&m', 'cereal']
    },
    'cornmeal': {
      primary: ['cornmeal', 'corn bread', 'corn muffin', 'polenta'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    
    // Dairy
    'milk': {
      primary: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'whole milk': {
      primary: ['whole milk', 'milk'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'cheese': {
      primary: ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'swiss', 'american cheese'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'mild cheese': {
      primary: ['mild cheddar', 'cheddar cheese', 'american cheese', 'cheese'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    
    // Eggs
    'egg': {
      primary: ['egg', 'mayonnaise'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'eggs': {
      primary: ['egg', 'mayonnaise'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    
    // Fish & Seafood
    'fish': {
      primary: ['fish', 'salmon', 'tuna', 'cod', 'tilapia', 'flounder'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'flounder': {
      primary: ['flounder fillet', 'flounder', 'fish fillet'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'flounder fillets': {
      primary: ['flounder fillet', 'flounder', 'fish fillet'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    
    // Bread & Buns
    'bun': {
      primary: ['bun', 'hamburger bun', 'sandwich bun', 'bread'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'hamburger buns': {
      primary: ['hamburger bun', 'bun', 'sandwich bun'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'sesame-seed hamburger buns': {
      primary: ['sesame bun', 'hamburger bun', 'bun', 'sandwich bun'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    
    // Vegetables
    'lettuce': {
      primary: ['lettuce', 'romaine lettuce', 'iceberg lettuce'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'romaine lettuce': {
      primary: ['romaine lettuce', 'lettuce'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'tomato': {
      primary: ['tomato', 'tomatoes'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    
    // Condiments & Sauces
    'mayonnaise': {
      primary: ['mayonnaise', 'mayo'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'pickle relish': {
      primary: ['pickle relish', 'relish'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    
    // Oils & Fats
    'oil': {
      primary: ['oil', 'olive oil', 'vegetable oil', 'canola oil', 'sunflower oil'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'canola oil': {
      primary: ['canola oil', 'oil'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    
    // Seasonings & Spices
    'salt': {
      primary: ['salt', 'sea salt', 'kosher salt'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'pepper': {
      primary: ['pepper', 'black pepper', 'white pepper'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'parsley': {
      primary: ['parsley', 'fresh parsley', 'dried parsley'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'lemon': {
      primary: ['lemon', 'lemon juice', 'lemon zest'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    'lemon juice': {
      primary: ['lemon juice', 'lemon'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    },
    
    // Hot Sauces & Spices
    'tabasco': {
      primary: ['tabasco sauce', 'hot sauce'],
      exclude: ['candy', 'chocolate', 'snack', 'dessert']
    }
  };

  for (const ingredient of ingredients) {
    console.log(`\n=== Testing: "${ingredient}" ===`);
    
    // Clean ingredient name (remove measurements, etc.)
    const cleanIngredient = cleanIngredientName(ingredient);
    console.log(`Cleaned ingredient: "${cleanIngredient}"`);
    if (ingredient === 'eggs' || ingredient === 'egg') {
      if (cleanIngredient !== 'eggs' && cleanIngredient !== 'egg') {
        console.error('❌ ERROR: "eggs" or "egg" was altered!');
      } else {
        console.log('✓ "eggs" and "egg" are preserved correctly.');
      }
    }
    
    // Split into search terms
    const searchTerms = cleanIngredient.split(/\s+/).filter(term => term.length > 0);
    console.log(`Search terms: [${searchTerms.join(', ')}]`);
    
    // Find the best matching rule
    let bestMatch = null;
    let bestMatchScore = 0;
    
    // First, try exact matches (highest priority)
    for (const searchTerm of searchTerms) {
      const exactMatch = ingredientProductRules[searchTerm.toLowerCase()];
      if (exactMatch) {
        bestMatch = exactMatch;
        bestMatchScore = 999; // Very high score for exact matches
        console.log(`✓ Exact match found for "${searchTerm}"`);
        break;
      }
    }
    
    // If no exact match, try partial matches
    if (!bestMatch) {
      for (const [ingredient, rules] of Object.entries(ingredientProductRules)) {
        for (const searchTerm of searchTerms) {
          const searchLower = searchTerm.toLowerCase();
          const ingredientLower = ingredient.toLowerCase();
          
          // Check if ingredient is contained in search term or vice versa
          if (searchLower.includes(ingredientLower) || ingredientLower.includes(searchLower)) {
            const score = Math.min(searchLower.length, ingredientLower.length); // Prefer longer matches
            if (score > bestMatchScore) {
              bestMatch = rules;
              bestMatchScore = score;
              console.log(`✓ Partial match: "${searchTerm}" matches "${ingredient}" (score: ${score})`);
            }
          }
        }
      }
    }
    
    if (bestMatch) {
      console.log(`Matched rules:`, bestMatch);
      
      // Test the actual product search
      const { primary, exclude } = bestMatch;
      
      // Build search conditions
      const where = {};
      if (primary.length > 0) {
        where.description = {
          [require('sequelize').Op.or]: primary.map(term => ({
            [require('sequelize').Op.iLike]: `%${term}%`
          }))
        };
      }
      
      // Add exclusion conditions
      if (exclude.length > 0) {
        where.description = {
          ...where.description,
          [require('sequelize').Op.not]: {
            [require('sequelize').Op.or]: exclude.map(term => ({
              [require('sequelize').Op.iLike]: `%${term}%`
            }))
          }
        };
      }
      
      try {
        const products = await Food.findAll({
          where,
          limit: 5,
          order: [['description', 'ASC']]
        });
        
        console.log(`Found ${products.length} products:`);
        products.forEach(product => {
          console.log(`  - ${product.description}`);
        });
        
        if (products.length === 0) {
          console.log(`  ⚠️  No products found - may need to expand search terms`);
        }
        
      } catch (error) {
        console.error(`Error searching products:`, error.message);
      }
      
    } else {
      console.log(`❌ No matching rules found`);
    }
  }
}

// Run the test
testWhalerFishSandwichMatching()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 