const db = require('../../db/database.js');
const IngredientToCanonical = require('../../db/models/IngredientToCanonical.js');
const IngredientCategorized = require('../../db/models/IngredientCategorized.js');
const { Op } = require('sequelize');
const fs = require('fs');
const { isCleanIngredientName } = require('./validate_clean_ingredient_name');

// Common unmapped ingredients that need mappings
const MISSING_INGREDIENTS = [
  // Basic ingredients
  'sugar',
  'salt',
  'garlic powder',
  'minced onion',
  'vegetable juice',
  'lean sirloin steak',
  'shortening',
  'unsalted butter',
  'blueberries',
  'blueberry jam',
  'golden raisins',
  'dill pickle juice',
  'cabbage',
  
  // More specific ingredients
  'all-purpose flour',
  'kosher salt',
  'white sugar',
  'granulated sugar',
  'brown sugar',
  'confectioners sugar',
  'powdered sugar',
  'vanilla extract',
  'olive oil',
  'canola oil',
  'vegetable oil',
  'water',
  'eggs',
  'egg',
  'milk',
  'butter',
  'cheese',
  'bread',
  'rice',
  'pasta',
  'tomato sauce',
  'pizza sauce',
  'marinara sauce',
  'soy sauce',
  'vinegar',
  'lemon juice',
  'lime juice',
  'orange juice',
  'apple juice',
  'chicken broth',
  'beef broth',
  'vegetable broth',
  'onion',
  'garlic',
  'carrot',
  'celery',
  'potato',
  'tomato',
  'lettuce',
  'spinach',
  'kale',
  'mushroom',
  'bell pepper',
  'jalapeno',
  'cucumber',
  'zucchini',
  'squash',
  'corn',
  'peas',
  'green beans',
  'broccoli',
  'cauliflower',
  'asparagus',
  'artichoke',
  'avocado',
  'banana',
  'apple',
  'orange',
  'lemon',
  'lime',
  'grape',
  'strawberry',
  'raspberry',
  'blackberry',
  'peach',
  'pear',
  'plum',
  'cherry',
  'pineapple',
  'mango',
  'papaya',
  'kiwi',
  'coconut',
  'almond',
  'walnut',
  'pecan',
  'cashew',
  'peanut',
  'sunflower seed',
  'pumpkin seed',
  'sesame seed',
  'flax seed',
  'chia seed',
  'quinoa',
  'oatmeal',
  'oats',
  'barley',
  'lentil',
  'bean',
  'chickpea',
  'black bean',
  'kidney bean',
  'pinto bean',
  'navy bean',
  'lima bean',
  'split pea',
  'black eyed pea',
  'chicken',
  'beef',
  'pork',
  'lamb',
  'turkey',
  'duck',
  'fish',
  'salmon',
  'tuna',
  'cod',
  'tilapia',
  'shrimp',
  'crab',
  'lobster',
  'clam',
  'mussel',
  'oyster',
  'scallop',
  'bacon',
  'ham',
  'sausage',
  'pepperoni',
  'salami',
  'prosciutto',
  'pastrami',
  'corned beef',
  'roast beef',
  'ground beef',
  'ground turkey',
  'ground chicken',
  'ground pork',
  'chicken breast',
  'chicken thigh',
  'chicken wing',
  'beef steak',
  'pork chop',
  'lamb chop',
  'fish fillet',
  'shrimp',
  'scallop'
];

// Blocklist for products we don't want to map
const BLOCKLIST = [
  'cereal', 'cookie', 'bar', 'crackers', 'cake', 'muffin', 'bread', 'tortilla', 'noodle', 'biscuit', 'waffle', 'pancake', 'brownie', 'mix', 'snack', 'chips', 'wrap', 'pie', 'pastry', 'crust', 'batter', 'dough', 'crisp', 'crumble', 'bun', 'roll', 'croissant', 'scone', 'brioche', 'bagel', 'pretzel', 'pizza', 'sandwich', 'breakfast', 'dessert', 'medley', 'power', 'crunch', 'brittle', 'crispbread', 'kit', 'bowl', 'blend', 'seasoned', 'flavored', 'flavour', 'with', 'and ', 'seltzer', 'sparkling', 'flavored water', 'energy drink', 'soda', 'pop', 'cola', 'lemonade', 'juice drink', 'beverage', 'drink', 'cocktail', 'smoothie', 'shake', 'milkshake', 'frappe', 'latte', 'cappuccino', 'espresso', 'coffee', 'tea', 'hot chocolate', 'cocoa', 'chocolate milk', 'almond milk', 'soy milk', 'oat milk', 'rice milk', 'coconut milk', 'hemp milk', 'cashew milk', 'macadamia milk', 'hazelnut milk', 'flax milk', 'pea milk', 'quinoa milk', 'spelt milk', 'kamut milk', 'emmer milk', 'einkorn milk', 'farro milk', 'freekeh milk', 'bulgur milk', 'couscous milk', 'polenta milk', 'grits milk', 'cornmeal milk', 'semolina milk', 'durum milk', 'spelt milk', 'kamut milk', 'emmer milk', 'einkorn milk', 'farro milk', 'freekeh milk', 'bulgur milk', 'couscous milk', 'polenta milk', 'grits milk', 'cornmeal milk', 'semolina milk', 'durum milk'
];

async function addMissingMappings() {
  await db.authenticate();
  
  let totalAdded = 0;
  let log = [];
  
  for (const ingredient of MISSING_INGREDIENTS) {
    try {
      // Only allow clean ingredient names
      if (!isCleanIngredientName(ingredient)) {
        log.push(`Skipped: ${ingredient} (not a clean ingredient name)`);
        continue;
      }
      // Check if mapping already exists
      const existingMapping = await IngredientToCanonical.findOne({
        where: { messyName: ingredient }
      });
      
      if (existingMapping) {
        log.push(`Skipped: ${ingredient} (already mapped)`);
        continue;
      }
      
      // Find pure/real products for this ingredient
      const products = await IngredientCategorized.findAll({
        where: {
          [Op.or]: [
            { description: { [Op.iLike]: `%${ingredient}%` } },
            { shortDescription: { [Op.iLike]: `%${ingredient}%` } }
          ]
        },
        limit: 20 // Get more candidates to filter
      });
      
      // Filter out products with blocklisted terms
      const filteredProducts = products.filter(product => {
        const productDesc = (product.description || '').toLowerCase();
        const productShortDesc = (product.shortDescription || '').toLowerCase();
        return !BLOCKLIST.some(blockedTerm => 
          productDesc.includes(blockedTerm.toLowerCase()) ||
          productShortDesc.includes(blockedTerm.toLowerCase())
        );
      });
      
      if (filteredProducts.length > 0) {
        // Create mapping to the first (best) match
        const bestProduct = filteredProducts[0];
        await IngredientToCanonical.create({
          messyName: ingredient,
          canonicalName: bestProduct.description || bestProduct.shortDescription,
          confidence: 0.8 // High confidence for direct matches
        });
        
        log.push(`Added: ${ingredient} -> ${bestProduct.description || bestProduct.shortDescription}`);
        totalAdded++;
      } else {
        log.push(`No products found for: ${ingredient}`);
      }
      
    } catch (error) {
      log.push(`Error processing ${ingredient}: ${error.message}`);
    }
  }
  
  // Write log to file
  const logPath = 'server/scripts/data-processing/add_missing_mappings.log';
  const path = require('path');
  const dir = path.dirname(logPath);
  require('fs').mkdirSync(dir, { recursive: true });
  require('fs').writeFileSync(logPath, log.join('\n'));
  
  console.log(`\n=== Summary ===`);
  console.log(`Total mappings added: ${totalAdded}`);
  console.log(`Log written to: server/scripts/data-processing/add_missing_mappings.log`);
  
  await db.close();
}

addMissingMappings().catch(console.error); 