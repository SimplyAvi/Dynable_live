const sequelize = require('../db/database');
const CanonicalIngredient = require('../db/models/CanonicalIngredient');
const IngredientToCanonical = require('../db/models/IngredientToCanonical');
const AllergenDerivative = require('../db/models/AllergenDerivative');
const Substitution = require('../db/models/Substitution');

function generateVariants(name) {
  const base = name.trim();
  return [
    base,
    base.toLowerCase(),
    base.toUpperCase(),
    base.charAt(0).toUpperCase() + base.slice(1).toLowerCase(),
    base.replace(/\s+/g, ' '),
    base.replace(/\s+/g, '').toLowerCase(),
  ];
}

async function seedComprehensiveAllergenSystem() {
  try {
    await sequelize.sync({ force: false });
    
    // 1. Create Canonical Ingredients for all major allergen categories
    const canonicalIngredients = await Promise.all([
      // Dairy/Milk
      CanonicalIngredient.findOrCreate({
        where: { name: 'milk, cow' },
        defaults: {
          aliases: ['milk', 'cow milk', 'whole milk', 'skim milk', '2% milk'],
          allergens: ['milk']
        }
      }),
      CanonicalIngredient.findOrCreate({
        where: { name: 'cheese, cheddar' },
        defaults: {
          aliases: ['cheddar cheese', 'sharp cheddar', 'cheddar block'],
          allergens: ['milk']
        }
      }),
      CanonicalIngredient.findOrCreate({
        where: { name: 'yogurt' },
        defaults: {
          aliases: ['greek yogurt', 'plain yogurt'],
          allergens: ['milk']
        }
      }),
      CanonicalIngredient.findOrCreate({
        where: { name: 'butter' },
        defaults: {
          aliases: ['salted butter', 'unsalted butter'],
          allergens: ['milk']
        }
      }),

      // Eggs
      CanonicalIngredient.findOrCreate({
        where: { name: 'egg, chicken' },
        defaults: {
          aliases: ['egg', 'chicken egg', 'large egg'],
          allergens: ['eggs']
        }
      }),

      // Wheat/Gluten
      CanonicalIngredient.findOrCreate({
        where: { name: 'flour, wheat' },
        defaults: {
          aliases: ['bread flour', 'all-purpose flour', 'wheat flour'],
          allergens: ['wheat', 'gluten']
        }
      }),
      CanonicalIngredient.findOrCreate({
        where: { name: 'bread' },
        defaults: {
          aliases: ['white bread', 'whole wheat bread', 'sandwich bread'],
          allergens: ['wheat', 'gluten']
        }
      }),

      // Tree Nuts
      CanonicalIngredient.findOrCreate({
        where: { name: 'almond' },
        defaults: {
          aliases: ['almonds', 'almond nuts'],
          allergens: ['tree nuts', 'almonds']
        }
      }),
      CanonicalIngredient.findOrCreate({
        where: { name: 'cashew' },
        defaults: {
          aliases: ['cashews', 'cashew nuts'],
          allergens: ['tree nuts', 'cashews']
        }
      }),
      CanonicalIngredient.findOrCreate({
        where: { name: 'walnut' },
        defaults: {
          aliases: ['walnuts', 'walnut nuts'],
          allergens: ['tree nuts', 'walnuts']
        }
      }),

      // Peanuts
      CanonicalIngredient.findOrCreate({
        where: { name: 'peanut' },
        defaults: {
          aliases: ['peanuts', 'peanut butter'],
          allergens: ['peanuts']
        }
      }),

      // Shellfish
      CanonicalIngredient.findOrCreate({
        where: { name: 'shrimp' },
        defaults: {
          aliases: ['shrimp', 'prawns'],
          allergens: ['shellfish', 'shrimp']
        }
      }),
      CanonicalIngredient.findOrCreate({
        where: { name: 'crab' },
        defaults: {
          aliases: ['crab meat', 'crab'],
          allergens: ['shellfish', 'crab']
        }
      }),
      CanonicalIngredient.findOrCreate({
        where: { name: 'lobster' },
        defaults: {
          aliases: ['lobster meat', 'lobster'],
          allergens: ['shellfish', 'lobster']
        }
      }),

      // Fish
      CanonicalIngredient.findOrCreate({
        where: { name: 'salmon' },
        defaults: {
          aliases: ['salmon fillet', 'salmon'],
          allergens: ['fish', 'salmon']
        }
      }),
      CanonicalIngredient.findOrCreate({
        where: { name: 'tuna' },
        defaults: {
          aliases: ['tuna fish', 'tuna'],
          allergens: ['fish', 'tuna']
        }
      }),

      // Soy
      CanonicalIngredient.findOrCreate({
        where: { name: 'soybean' },
        defaults: {
          aliases: ['soy', 'soybeans'],
          allergens: ['soy']
        }
      }),
      CanonicalIngredient.findOrCreate({
        where: { name: 'tofu' },
        defaults: {
          aliases: ['tofu', 'bean curd'],
          allergens: ['soy']
        }
      }),

      // Sesame
      CanonicalIngredient.findOrCreate({
        where: { name: 'sesame' },
        defaults: {
          aliases: ['sesame seeds', 'sesame'],
          allergens: ['sesame']
        }
      }),
    ]);

    const [
      milk, cheddar, yogurt, butter,
      egg,
      flourWheat, bread,
      almond, cashew, walnut,
      peanut,
      shrimp, crab, lobster,
      salmon, tuna,
      soybean, tofu,
      sesame
    ] = canonicalIngredients.map(([ingredient]) => ingredient);

    // 2. Create ingredient mappings
    const mappings = [
      // Dairy
      { names: ['milk', 'cow milk', 'whole milk', 'skim milk', '2% milk'], canonicalId: milk.id },
      { names: ['cheddar cheese', 'sharp cheddar', 'cheddar block'], canonicalId: cheddar.id },
      { names: ['yogurt', 'greek yogurt', 'plain yogurt'], canonicalId: yogurt.id },
      { names: ['butter', 'salted butter', 'unsalted butter'], canonicalId: butter.id },
      
      // Eggs
      { names: ['egg', 'chicken egg', 'large egg', 'eggs'], canonicalId: egg.id },
      
      // Wheat/Gluten
      { names: ['bread flour', 'all-purpose flour', 'wheat flour', 'whole wheat flour'], canonicalId: flourWheat.id },
      { names: ['bread', 'white bread', 'whole wheat bread', 'sandwich bread'], canonicalId: bread.id },
      
      // Tree Nuts
      { names: ['almond', 'almonds', 'almond nuts'], canonicalId: almond.id },
      { names: ['cashew', 'cashews', 'cashew nuts'], canonicalId: cashew.id },
      { names: ['walnut', 'walnuts', 'walnut nuts'], canonicalId: walnut.id },
      
      // Peanuts
      { names: ['peanut', 'peanuts', 'peanut butter'], canonicalId: peanut.id },
      
      // Shellfish
      { names: ['shrimp', 'prawns'], canonicalId: shrimp.id },
      { names: ['crab', 'crab meat'], canonicalId: crab.id },
      { names: ['lobster', 'lobster meat'], canonicalId: lobster.id },
      
      // Fish
      { names: ['salmon', 'salmon fillet'], canonicalId: salmon.id },
      { names: ['tuna', 'tuna fish'], canonicalId: tuna.id },
      
      // Soy
      { names: ['soy', 'soybean', 'soybeans'], canonicalId: soybean.id },
      { names: ['tofu', 'bean curd'], canonicalId: tofu.id },
      
      // Sesame
      { names: ['sesame', 'sesame seeds'], canonicalId: sesame.id },
    ];

    // Create mappings with variants
    for (const mapping of mappings) {
      for (const name of mapping.names) {
        for (const variant of generateVariants(name)) {
          await IngredientToCanonical.findOrCreate({ 
            where: { messyName: variant }, 
            defaults: { CanonicalIngredientId: mapping.canonicalId } 
          });
        }
      }
    }

    // 3. Comprehensive Allergen Derivatives (relationships)
    await AllergenDerivative.bulkCreate([
      // Dairy/Milk relationships
      { allergen: 'milk', derivative: 'casein' },
      { allergen: 'milk', derivative: 'whey' },
      { allergen: 'milk', derivative: 'lactose' },
      { allergen: 'milk', derivative: 'cheese' },
      { allergen: 'milk', derivative: 'yogurt' },
      { allergen: 'milk', derivative: 'butter' },
      { allergen: 'milk', derivative: 'cream' },
      { allergen: 'lactose', derivative: 'milk' },
      
      // Gluten/Wheat relationships
      { allergen: 'gluten', derivative: 'wheat' },
      { allergen: 'gluten', derivative: 'barley' },
      { allergen: 'gluten', derivative: 'rye' },
      { allergen: 'gluten', derivative: 'malt' },
      { allergen: 'wheat', derivative: 'flour' },
      { allergen: 'wheat', derivative: 'bread' },
      { allergen: 'wheat', derivative: 'semolina' },
      { allergen: 'wheat', derivative: 'durum' },
      { allergen: 'wheat', derivative: 'farina' },
      { allergen: 'wheat', derivative: 'graham' },
      { allergen: 'wheat', derivative: 'breading' },
      
      // Tree Nuts relationships
      { allergen: 'tree nuts', derivative: 'almond' },
      { allergen: 'tree nuts', derivative: 'cashew' },
      { allergen: 'tree nuts', derivative: 'walnut' },
      { allergen: 'tree nuts', derivative: 'pecan' },
      { allergen: 'tree nuts', derivative: 'pistachio' },
      { allergen: 'tree nuts', derivative: 'hazelnut' },
      { allergen: 'tree nuts', derivative: 'macadamia' },
      { allergen: 'almonds', derivative: 'tree nuts' },
      { allergen: 'cashews', derivative: 'tree nuts' },
      { allergen: 'walnuts', derivative: 'tree nuts' },
      
      // Shellfish relationships
      { allergen: 'shellfish', derivative: 'shrimp' },
      { allergen: 'shellfish', derivative: 'crab' },
      { allergen: 'shellfish', derivative: 'lobster' },
      { allergen: 'shellfish', derivative: 'clam' },
      { allergen: 'shellfish', derivative: 'oyster' },
      { allergen: 'shellfish', derivative: 'mussel' },
      { allergen: 'shrimp', derivative: 'shellfish' },
      { allergen: 'crab', derivative: 'shellfish' },
      { allergen: 'lobster', derivative: 'shellfish' },
      
      // Fish relationships
      { allergen: 'fish', derivative: 'tuna' },
      { allergen: 'fish', derivative: 'salmon' },
      { allergen: 'fish', derivative: 'cod' },
      { allergen: 'fish', derivative: 'anchovy' },
      { allergen: 'tuna', derivative: 'fish' },
      { allergen: 'salmon', derivative: 'fish' },
      
      // Soy relationships
      { allergen: 'soy', derivative: 'soybean' },
      { allergen: 'soy', derivative: 'tofu' },
      { allergen: 'soy', derivative: 'edamame' },
      { allergen: 'soy', derivative: 'miso' },
      { allergen: 'soy', derivative: 'tempeh' },
      
      // Eggs relationships
      { allergen: 'eggs', derivative: 'egg' },
      { allergen: 'eggs', derivative: 'mayonnaise' },
      
      // Peanuts (legume, not tree nut)
      { allergen: 'peanuts', derivative: 'peanut' },
      
      // Sesame
      { allergen: 'sesame', derivative: 'sesame seeds' },
    ], { ignoreDuplicates: true });

    // 4. Comprehensive Substitutions
    const substitutions = [
      // Dairy substitutions
      { canonicalId: milk.id, substituteName: 'almond milk', notes: 'Nut-based dairy alternative' },
      { canonicalId: milk.id, substituteName: 'soy milk', notes: 'Soy-based dairy alternative' },
      { canonicalId: milk.id, substituteName: 'oat milk', notes: 'Oat-based dairy alternative' },
      { canonicalId: milk.id, substituteName: 'coconut milk', notes: 'Coconut-based dairy alternative' },
      { canonicalId: cheddar.id, substituteName: 'vegan cheddar', notes: 'Dairy-free cheese alternative' },
      { canonicalId: cheddar.id, substituteName: 'nutritional yeast', notes: 'Cheesy flavor, vegan' },
      { canonicalId: butter.id, substituteName: 'olive oil', notes: 'Oil-based butter alternative' },
      { canonicalId: butter.id, substituteName: 'coconut oil', notes: 'Coconut-based butter alternative' },
      { canonicalId: yogurt.id, substituteName: 'coconut yogurt', notes: 'Dairy-free yogurt alternative' },
      
      // Egg substitutions
      { canonicalId: egg.id, substituteName: 'flax egg', notes: 'Mix 1 tbsp ground flax + 3 tbsp water' },
      { canonicalId: egg.id, substituteName: 'chia egg', notes: 'Mix 1 tbsp chia seeds + 3 tbsp water' },
      { canonicalId: egg.id, substituteName: 'banana', notes: '1/4 cup mashed banana per egg' },
      { canonicalId: egg.id, substituteName: 'applesauce', notes: '1/4 cup applesauce per egg' },
      
      // Wheat/Gluten substitutions
      { canonicalId: flourWheat.id, substituteName: 'gluten-free flour blend', notes: 'Best 1:1 replacement for baking' },
      { canonicalId: flourWheat.id, substituteName: 'almond flour', notes: 'Wheat-free, nut-based, best for cookies and cakes' },
      { canonicalId: flourWheat.id, substituteName: 'oat flour', notes: 'Wheat-free, gluten-free, best for pancakes and quick breads' },
      { canonicalId: flourWheat.id, substituteName: 'rice flour', notes: 'Wheat-free, best for cakes, may need binder' },
      { canonicalId: flourWheat.id, substituteName: 'coconut flour', notes: 'Wheat-free, absorbs moisture, use less' },
      { canonicalId: bread.id, substituteName: 'gluten-free bread', notes: 'Wheat-free bread alternative' },
      { canonicalId: bread.id, substituteName: 'rice cakes', notes: 'Wheat-free bread alternative' },
      
      // Tree Nut substitutions
      { canonicalId: almond.id, substituteName: 'sunflower seeds', notes: 'Nut-free alternative' },
      { canonicalId: almond.id, substituteName: 'pumpkin seeds', notes: 'Nut-free alternative' },
      { canonicalId: cashew.id, substituteName: 'sunflower seeds', notes: 'Nut-free alternative' },
      { canonicalId: walnut.id, substituteName: 'sunflower seeds', notes: 'Nut-free alternative' },
      
      // Peanut substitutions
      { canonicalId: peanut.id, substituteName: 'sunflower seed butter', notes: 'Nut-free alternative' },
      { canonicalId: peanut.id, substituteName: 'soy nut butter', notes: 'Soy-based alternative' },
      
      // Shellfish substitutions
      { canonicalId: shrimp.id, substituteName: 'tofu', notes: 'Plant-based protein alternative' },
      { canonicalId: shrimp.id, substituteName: 'tempeh', notes: 'Fermented soy protein alternative' },
      { canonicalId: crab.id, substituteName: 'tofu', notes: 'Plant-based protein alternative' },
      { canonicalId: lobster.id, substituteName: 'tofu', notes: 'Plant-based protein alternative' },
      
      // Fish substitutions
      { canonicalId: salmon.id, substituteName: 'tofu', notes: 'Plant-based protein alternative' },
      { canonicalId: salmon.id, substituteName: 'tempeh', notes: 'Fermented soy protein alternative' },
      { canonicalId: tuna.id, substituteName: 'tofu', notes: 'Plant-based protein alternative' },
      
      // Soy substitutions
      { canonicalId: soybean.id, substituteName: 'chickpeas', notes: 'Legume-based alternative' },
      { canonicalId: soybean.id, substituteName: 'lentils', notes: 'Legume-based alternative' },
      { canonicalId: tofu.id, substituteName: 'tempeh', notes: 'Fermented soy alternative' },
      { canonicalId: tofu.id, substituteName: 'seitan', notes: 'Wheat-based protein (contains gluten)' },
      
      // Sesame substitutions
      { canonicalId: sesame.id, substituteName: 'poppy seeds', notes: 'Seed-based alternative' },
      { canonicalId: sesame.id, substituteName: 'sunflower seeds', notes: 'Seed-based alternative' },
    ];

    for (const sub of substitutions) {
      await Substitution.findOrCreate({
        where: { 
          CanonicalIngredientId: sub.canonicalId, 
          substituteName: sub.substituteName 
        },
        defaults: { notes: sub.notes }
      });
    }

    console.log('Comprehensive allergen system seeded successfully!');
  } catch (err) {
    console.error('Seeding comprehensive allergen system failed:', err);
  } finally {
    await sequelize.close();
  }
}

seedComprehensiveAllergenSystem(); 