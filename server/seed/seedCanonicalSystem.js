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

async function seedCanonicalSystem() {
  try {
    await sequelize.sync({ force: false });
    // 1. Canonical Ingredients (use findOrCreate for idempotency)
    const [cheddar] = await CanonicalIngredient.findOrCreate({
      where: { name: 'cheese, cheddar' },
      defaults: {
        aliases: ['cheddar cheese', 'sharp cheddar', 'cheddar block'],
        allergens: ['milk']
      }
    });
    const [almondMilk] = await CanonicalIngredient.findOrCreate({
      where: { name: 'almond milk' },
      defaults: {
        aliases: ['almond beverage'],
        allergens: ['tree nuts']
      }
    });
    const [flourWheat] = await CanonicalIngredient.findOrCreate({
      where: { name: 'flour, wheat' },
      defaults: {
        aliases: ['bread flour', 'all-purpose flour', 'wheat flour'],
        allergens: ['wheat']
      }
    });
    // 2. Ingredient to Canonical (with variants)
    const messyMappings = [
      { names: ['cheddar cheese', 'sharp cheddar'], canonicalId: cheddar.id },
      { names: ['almond beverage'], canonicalId: almondMilk.id },
      { names: [
        'bread flour',
        'all-purpose flour',
        'wheat flour',
        'whole wheat flour',
        'stone ground whole wheat flour',
        'whole wheat',
        'stone ground wheat flour',
        'stoneground whole wheat flour',
        'stoneground wheat flour',
        'whole wheat bread flour',
        'wholemeal flour',
        'whole grain wheat flour',
        '100% whole wheat flour',
        'white whole wheat flour',
        'unbleached whole wheat flour',
        'enriched wheat flour',
        'graham flour',
        'high gluten flour',
        'high-protein wheat flour',
        'organic whole wheat flour',
        'organic stone ground whole wheat flour',
        '6 cups stone ground whole wheat flour',
        'stone ground flour',
        'stoneground flour',
        'stoneground wholemeal flour',
        'stone ground wholemeal flour',
        'stone ground whole grain flour',
        'stoneground whole grain flour'
      ], canonicalId: flourWheat.id },
    ];
    for (const mapping of messyMappings) {
      for (const name of mapping.names) {
        for (const variant of generateVariants(name)) {
          await IngredientToCanonical.findOrCreate({ where: { messyName: variant }, defaults: { CanonicalIngredientId: mapping.canonicalId } });
        }
      }
    }
    // 3. Allergen Derivatives
    await AllergenDerivative.bulkCreate([
      { allergen: 'milk', derivative: 'casein' },
      { allergen: 'milk', derivative: 'whey' },
      { allergen: 'milk', derivative: 'lactose' },
      { allergen: 'milk', derivative: 'cheese' },
      { allergen: 'tree nuts', derivative: 'almond' },
      { allergen: 'tree nuts', derivative: 'cashew' },
      { allergen: 'wheat', derivative: 'flour' },
      { allergen: 'wheat', derivative: 'bread' },
      { allergen: 'wheat', derivative: 'semolina' },
      { allergen: 'wheat', derivative: 'durum' },
      { allergen: 'wheat', derivative: 'farina' },
      { allergen: 'wheat', derivative: 'graham' },
      { allergen: 'wheat', derivative: 'breading' },
    ], { ignoreDuplicates: true });
    // 4. Substitutions (use findOrCreate for idempotency)
    await Substitution.findOrCreate({
      where: { CanonicalIngredientId: cheddar.id, substituteName: 'vegan cheddar' },
      defaults: { notes: 'Dairy-free alternative' }
    });
    await Substitution.findOrCreate({
      where: { CanonicalIngredientId: cheddar.id, substituteName: 'nutritional yeast' },
      defaults: { notes: 'Cheesy flavor, vegan' }
    });
    await Substitution.findOrCreate({
      where: { CanonicalIngredientId: almondMilk.id, substituteName: 'soy milk' },
      defaults: { notes: 'Nut-free alternative' }
    });
    await Substitution.findOrCreate({
      where: { CanonicalIngredientId: flourWheat.id, substituteName: 'gluten-free flour blend' },
      defaults: { notes: 'Best 1:1 replacement for baking' }
    });
    await Substitution.findOrCreate({
      where: { CanonicalIngredientId: flourWheat.id, substituteName: 'almond flour' },
      defaults: { notes: 'Wheat-free, nut-based, best for cookies and cakes' }
    });
    await Substitution.findOrCreate({
      where: { CanonicalIngredientId: flourWheat.id, substituteName: 'oat flour' },
      defaults: { notes: 'Wheat-free, gluten-free, best for pancakes and quick breads' }
    });
    await Substitution.findOrCreate({
      where: { CanonicalIngredientId: flourWheat.id, substituteName: 'rice flour' },
      defaults: { notes: 'Wheat-free, best for cakes, may need binder' }
    });
    await Substitution.findOrCreate({
      where: { CanonicalIngredientId: flourWheat.id, substituteName: 'coconut flour' },
      defaults: { notes: 'Wheat-free, absorbs moisture, use less' }
    });
    await Substitution.findOrCreate({
      where: { CanonicalIngredientId: flourWheat.id, substituteName: 'psyllium husk' },
      defaults: { notes: 'Use as binder, not for structure' }
    });
    console.log('Seeded canonical system tables with variants.');
  } catch (err) {
    console.error('Seeding canonical system failed:', err);
  } finally {
    await sequelize.close();
  }
}

seedCanonicalSystem(); 