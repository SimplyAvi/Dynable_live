const { IngredientCategorized, Ingredient } = require('../db/models');

async function addMissingPureSubstituteProducts() {
  console.log('🔧 Adding Missing Pure Substitute Products for All Major Allergens...\n');

  // List of pure products to ensure exist (canonicalTag must match substitute name, confidence: 'confident')
  const pureProducts = [
    // Milk substitutes
    { description: 'ALMOND MILK', canonicalTag: 'almond milk', allergens: ['tree nuts'], notes: 'Nut-based dairy alternative' },
    { description: 'SOY MILK', canonicalTag: 'soy milk', allergens: ['soy'], notes: 'Soy-based dairy alternative' },
    { description: 'OAT MILK', canonicalTag: 'oat milk', allergens: [], notes: 'Oat-based dairy alternative' },
    { description: 'COCONUT MILK', canonicalTag: 'coconut milk', allergens: ['tree nuts', 'coconut'], notes: 'Coconut-based dairy alternative' },
    { description: 'VEGAN CHEDDAR', canonicalTag: 'vegan cheddar', allergens: [], notes: 'Dairy-free cheese alternative' },
    { description: 'NUTRITIONAL YEAST', canonicalTag: 'nutritional yeast', allergens: [], notes: 'Cheesy flavor, vegan' },
    { description: 'COCONUT YOGURT', canonicalTag: 'coconut yogurt', allergens: ['tree nuts', 'coconut'], notes: 'Dairy-free yogurt alternative' },
    { description: 'OLIVE OIL', canonicalTag: 'olive oil', allergens: [], notes: 'Oil-based butter alternative' },
    { description: 'COCONUT OIL', canonicalTag: 'coconut oil', allergens: ['tree nuts', 'coconut'], notes: 'Coconut-based butter alternative' },

    // Egg substitutes
    { description: 'FLAX EGG', canonicalTag: 'flax egg', allergens: [], notes: 'Mix 1 tbsp ground flax + 3 tbsp water' },
    { description: 'CHIA EGG', canonicalTag: 'chia egg', allergens: [], notes: 'Mix 1 tbsp chia seeds + 3 tbsp water' },
    { description: 'BANANA', canonicalTag: 'banana', allergens: [], notes: '1/4 cup mashed banana per egg' },
    { description: 'APPLESAUCE', canonicalTag: 'applesauce', allergens: [], notes: '1/4 cup applesauce per egg' },

    // Wheat/Gluten substitutes
    { description: 'GLUTEN FREE FLOUR BLEND', canonicalTag: 'gluten-free flour blend', allergens: [], notes: 'Best 1:1 replacement for baking' },
    { description: 'ALMOND FLOUR', canonicalTag: 'almond flour', allergens: ['tree nuts', 'almonds'], notes: 'Wheat-free, nut-based, best for cookies and cakes' },
    { description: 'OAT FLOUR', canonicalTag: 'oat flour', allergens: [], notes: 'Wheat-free, gluten-free, best for pancakes and quick breads' },
    { description: 'RICE FLOUR', canonicalTag: 'rice flour', allergens: [], notes: 'Wheat-free, best for cakes, may need binder' },
    { description: 'COCONUT FLOUR', canonicalTag: 'coconut flour', allergens: ['tree nuts', 'coconut'], notes: 'Wheat-free, absorbs moisture, use less' },
    { description: 'PSYLLIUM HUSK', canonicalTag: 'psyllium husk', allergens: [], notes: 'Use as binder, not for structure' },
    { description: 'GLUTEN FREE BREAD', canonicalTag: 'gluten-free bread', allergens: [], notes: 'Wheat-free bread alternative' },
    { description: 'RICE CAKES', canonicalTag: 'rice cakes', allergens: [], notes: 'Wheat-free bread alternative' },

    // Tree nut substitutes
    { description: 'SUNFLOWER SEEDS', canonicalTag: 'sunflower seeds', allergens: [], notes: 'Nut-free alternative' },
    { description: 'PUMPKIN SEEDS', canonicalTag: 'pumpkin seeds', allergens: [], notes: 'Nut-free alternative' },

    // Peanut substitutes
    { description: 'SUNFLOWER SEED BUTTER', canonicalTag: 'sunflower seed butter', allergens: [], notes: 'Nut-free alternative' },
    { description: 'SOY NUT BUTTER', canonicalTag: 'soy nut butter', allergens: ['soy'], notes: 'Soy-based alternative' },

    // Shellfish/Fish substitutes
    { description: 'TOFU', canonicalTag: 'tofu', allergens: ['soy'], notes: 'Plant-based protein alternative' },
    { description: 'TEMPEH', canonicalTag: 'tempeh', allergens: ['soy'], notes: 'Fermented soy protein alternative' },
    { description: 'JACKFRUIT', canonicalTag: 'jackfruit', allergens: [], notes: 'Plant-based fish/shellfish alternative' },

    // Soy substitutes
    { description: 'CHICKPEAS', canonicalTag: 'chickpeas', allergens: [], notes: 'Legume-based alternative' },
    { description: 'LENTILS', canonicalTag: 'lentils', allergens: [], notes: 'Legume-based alternative' },
    { description: 'SEITAN', canonicalTag: 'seitan', allergens: ['wheat', 'gluten'], notes: 'Wheat-based protein (contains gluten)' },

    // Sesame substitutes
    { description: 'POPPY SEEDS', canonicalTag: 'poppy seeds', allergens: [], notes: 'Seed-based alternative' },

    // Cheese (pizza logic)
    { description: 'MOZZARELLA CHEESE', canonicalTag: 'mozzarella cheese', allergens: ['milk'], notes: 'Pizza cheese' },
    { description: 'VEGAN MOZZARELLA', canonicalTag: 'vegan mozzarella', allergens: [], notes: 'Dairy-free cheese alternative' },
  ];

  let added = 0;
  let skipped = 0;

  for (const prod of pureProducts) {
    const exists = await IngredientCategorized.findOne({ where: { description: prod.description } });
    if (!exists) {
      // Find canonical ingredient for canonicalTag
      const canonical = await Ingredient.findOne({ where: { name: prod.canonicalTag } });
      if (!canonical) {
        console.log(`❌ Canonical ingredient not found for: ${prod.canonicalTag}`);
        continue;
      }
      await IngredientCategorized.create({
        description: prod.description,
        brandName: 'Generic',
        canonicalTag: prod.canonicalTag,
        canonicalTagConfidence: 'confident',
        allergens: prod.allergens,
        notes: prod.notes,
      });
      console.log(`✅ Added product: ${prod.description}`);
      added++;
    } else {
      skipped++;
    }
  }
  console.log(`\nSummary: Added ${added}, Skipped ${skipped} (already exist)`);
}

addMissingPureSubstituteProducts(); 