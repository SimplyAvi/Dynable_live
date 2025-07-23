const sequelize = require('../db/database');
const IngredientMatchingRule = require('../db/models/IngredientMatchingRule');
const SubstituteMapping = require('../db/models/SubstituteMapping');

async function seedIngredientMatchingRules() {
  try {
    await sequelize.sync({ force: false });
    
    // Seed IngredientMatchingRule table
    const matchingRules = [
      {
        ingredientName: 'salt',
        primaryKeywords: ['salt'],
        exclusionKeywords: ['sauce', 'seasoning', 'mix', 'blend', 'powder', 'spice', 'chip', 'cracked', 'flavored', 'barbecue'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: true
      },
      {
        ingredientName: 'sugar',
        primaryKeywords: ['sugar'],
        exclusionKeywords: ['candy', 'chocolate', 'cookie', 'cake', 'dessert', 'sweet', 'syrup', 'protein', 'cereal', 'crunch'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: true
      },
      {
        ingredientName: 'yeast',
        primaryKeywords: ['yeast'],
        exclusionKeywords: ['bread', 'dough', 'mix', 'blend'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: true
      },
      {
        ingredientName: 'baking soda',
        primaryKeywords: ['baking soda', 'sodium bicarbonate'],
        exclusionKeywords: ['powder', 'mix', 'blend'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: true
      },
      {
        ingredientName: 'baking powder',
        primaryKeywords: ['baking powder'],
        exclusionKeywords: ['soda', 'mix', 'blend'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: true
      },
      {
        ingredientName: 'vinegar',
        primaryKeywords: ['vinegar'],
        exclusionKeywords: ['sauce', 'dressing', 'marinade', 'pickle'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: true
      },
      {
        ingredientName: 'honey',
        primaryKeywords: ['honey'],
        exclusionKeywords: ['syrup', 'sauce', 'dressing', 'candy'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: true
      },
      {
        ingredientName: 'olive oil',
        primaryKeywords: ['olive oil'],
        exclusionKeywords: ['dressing', 'marinade', 'sauce', 'anchovy', 'anchovies', 'tomato', 'vegetable', 'bean', 'sardine', 'mackerel', 'tuna', 'salmon', 'herring', 'eggplant', 'pepper', 'artichoke', 'garlic', 'onion', 'olive', 'capers', 'pasta', 'sauce', 'spread', 'dip', 'dressing', 'marinade', 'mix', 'blend', 'relish', 'salsa', 'chili', 'soup', 'stew', 'rice', 'lentil', 'pea', 'corn', 'carrot', 'potato', 'zucchini', 'squash', 'broccoli', 'cauliflower', 'spinach', 'kale', 'greens', 'seaweed', 'clam', 'crab', 'lobster', 'shrimp', 'octopus', 'squid', 'calamari', 'muscle', 'scallop', 'oyster', 'caviar', 'roe', 'meat', 'chicken', 'beef', 'pork', 'duck', 'turkey', 'lamb', 'goat', 'veal', 'bacon', 'ham', 'sausage', 'hot dog', 'frank', 'brat', 'bratwurst', 'salami', 'pepperoni', 'prosciutto', 'pastrami', 'corned beef', 'tongue', 'liver', 'gizzard', 'heart', 'kidney', 'tripe', 'sweetbread', 'testicle', 'snout', 'jowl', 'hock', 'trotter', 'knuckle', 'tip', 'bone', 'skin', 'fat', 'marrow', 'crackling', 'rind', 'peel', 'zest', 'pith', 'core', 'pit', 'seed', 'stone', 'pod', 'bean', 'pea', 'lentil', 'chickpea', 'split', 'grain', 'rice', 'barley', 'oat', 'corn', 'maize', 'millet', 'sorghum', 'teff', 'quinoa', 'buckwheat', 'amaranth', 'spelt', 'kamut', 'triticale', 'farro', 'freekeh', 'bulgur', 'couscous', 'semolina', 'durum', 'graham', 'bread', 'breadcrumb', 'breading', 'cracker', 'biscuit', 'cookie', 'cake', 'pastry', 'pie', 'tart', 'pasta', 'noodle', 'macaroni', 'spaghetti', 'fettuccine', 'linguine', 'penne', 'rigatoni', 'ziti', 'rotini', 'fusilli', 'farfalle', 'orzo', 'gnocchi', 'ravioli', 'tortellini', 'manicotti', 'cannelloni', 'lasagna', 'vermicelli', 'capellini', 'spaghettini', 'bucatini', 'tagliatelle', 'pappardelle', 'cavatappi', 'cavatelli', 'orecchiette', 'strozzapreti', 'tortelloni', 'tortellacci'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: true
      },
      {
        ingredientName: 'vegetable oil',
        primaryKeywords: ['vegetable oil', 'canola oil', 'corn oil'],
        exclusionKeywords: ['dressing', 'marinade', 'sauce'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: true
      },
      {
        ingredientName: 'black pepper',
        primaryKeywords: ['black pepper', 'pepper'],
        exclusionKeywords: ['sauce', 'seasoning', 'mix', 'blend'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: true
      },
      {
        ingredientName: 'garlic',
        primaryKeywords: ['garlic'],
        exclusionKeywords: ['sauce', 'seasoning', 'mix', 'blend', 'powder'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: true
      },
      {
        ingredientName: 'onion',
        primaryKeywords: ['onion'],
        exclusionKeywords: ['sauce', 'seasoning', 'mix', 'blend', 'powder'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: true
      },
      {
        ingredientName: 'all-purpose flour',
        primaryKeywords: ['all-purpose flour', 'all purpose flour'],
        exclusionKeywords: ['bread', 'cake', 'pastry', 'self-rising'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: false
      },
      {
        ingredientName: 'bread flour',
        primaryKeywords: ['bread flour'],
        exclusionKeywords: ['all-purpose', 'cake', 'pastry', 'self-rising'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: false
      },
      {
        ingredientName: 'cake flour',
        primaryKeywords: ['cake flour'],
        exclusionKeywords: ['bread', 'all-purpose', 'pastry', 'self-rising'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: false
      },
      {
        ingredientName: 'whole milk',
        primaryKeywords: ['whole milk'],
        exclusionKeywords: ['skim', '2%', '1%', 'chocolate', 'strawberry'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: false
      },
      {
        ingredientName: 'skim milk',
        primaryKeywords: ['skim milk'],
        exclusionKeywords: ['whole', '2%', '1%', 'chocolate', 'strawberry'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: false
      },
      {
        ingredientName: 'large egg',
        primaryKeywords: ['large egg', 'eggs'],
        exclusionKeywords: ['white', 'yolk', 'powder', 'substitute'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: false
      },
      {
        ingredientName: 'unsalted butter',
        primaryKeywords: ['unsalted butter'],
        exclusionKeywords: ['salted', 'margarine', 'spread'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: false
      },
      {
        ingredientName: 'salted butter',
        primaryKeywords: ['salted butter'],
        exclusionKeywords: ['unsalted', 'margarine', 'spread'],
        exactMatch: true,
        strictPhrase: true,
        isBasicIngredient: false
      }
    ];
    
    // Seed SubstituteMapping table
    const substituteMappings = [
      {
        substituteType: 'gluten-free',
        searchTerms: ['gluten-free flour', 'gluten free flour', 'gluten-free bread', 'gluten free bread'],
        description: 'Gluten-free alternatives for wheat-based ingredients'
      },
      {
        substituteType: 'almond',
        searchTerms: ['almond milk', 'almond flour', 'almond butter'],
        description: 'Almond-based alternatives'
      },
      {
        substituteType: 'soy',
        searchTerms: ['soy milk', 'tofu', 'soybean'],
        description: 'Soy-based alternatives'
      },
      {
        substituteType: 'oat',
        searchTerms: ['oat milk', 'oat flour'],
        description: 'Oat-based alternatives'
      },
      {
        substituteType: 'coconut',
        searchTerms: ['coconut milk', 'coconut oil', 'coconut flour'],
        description: 'Coconut-based alternatives'
      },
      {
        substituteType: 'flax',
        searchTerms: ['flax seed', 'flaxseed', 'ground flax'],
        description: 'Flax-based alternatives'
      },
      {
        substituteType: 'chia',
        searchTerms: ['chia seed', 'chia seeds'],
        description: 'Chia-based alternatives'
      },
      {
        substituteType: 'sunflower',
        searchTerms: ['sunflower seed', 'sunflower seeds', 'sunflower butter'],
        description: 'Sunflower-based alternatives'
      },
      {
        substituteType: 'rice',
        searchTerms: ['rice flour', 'rice milk'],
        description: 'Rice-based alternatives'
      },
      {
        substituteType: 'vegan',
        searchTerms: ['vegan cheese', 'vegan butter', 'vegan yogurt'],
        description: 'Vegan alternatives'
      }
    ];
    
    // Insert matching rules
    for (const rule of matchingRules) {
      await IngredientMatchingRule.findOrCreate({
        where: { ingredientName: rule.ingredientName },
        defaults: rule
      });
    }
    
    // Insert substitute mappings
    for (const mapping of substituteMappings) {
      await SubstituteMapping.findOrCreate({
        where: { substituteType: mapping.substituteType },
        defaults: mapping
      });
    }
    
    console.log(`✅ Seeded ${matchingRules.length} ingredient matching rules`);
    console.log(`✅ Seeded ${substituteMappings.length} substitute mappings`);
    
  } catch (error) {
    console.error('❌ Error seeding ingredient matching rules:', error);
  } finally {
    await sequelize.close();
  }
}

seedIngredientMatchingRules(); 