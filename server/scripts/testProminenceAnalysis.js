// testProminenceAnalysis.js
const { analyzeIngredientProminence } = require('./analyzeIngredientProminence');

// Sample products from user data
const testProducts = [
  {
    description: '100% LIQUID EGG WHITES',
    ingredients: '100% EGG WHITES',
    SubcategoryName: 'egg',
    canonicalTag: 'egg',
    id: 75493
  },
  {
    description: 'HOLIDAY FAVORITES JELLY BEANS, EGG NOG; CANDY CANE; PUMPKIN PIE; CRANBERRY SAUCE; HOT CHOCOLATE',
    ingredients: "SUGAR, CORN SYRUP, MODIFIED FOOD STARCH, CONTAINS 2% OR LESS OF THE FOLLOWING: CRANBERRY PUREE, NUTMEG, CHOCOLATE (SUGAR, CHOCOLATE LIQUOR, COCOA BUTTER, SOY LECITHIN (AN EMULSIFIER), VANILLIN), COCOA POWDER, NATURAL AND ARTIFICIAL FLAVORS, COLOR ADDED, RED 40 LAKE, YELLOW 5, YELLOW 5 LAKE, BLUE 1 & 2 LAKE, RED 40, TURMERIC (COLOR), CONFECTIONER'S GLAZE, BEESWAX, CARNAUBA WAX, TAPIOCA DEXTRIN, SALT",
    SubcategoryName: 'egg',
    canonicalTag: 'egg',
    id: 23851
  },
  {
    description: 'SAUSAGE EGG & CHEESE BISCUIT SANDWICHES, SAUSAGE EGG & CHEESE',
    ingredients: "BISCUIT: UNBLEACHED ENRICHED WHEAT FLOUR (WHEAT FLOUR, MALTED BARLEY FLOUR, NIACIN, REDUCED IRON, THIAMINE MONONITRATE, RIBOFLAVIN, FOLIC ACID), WATER, PALM OIL, CONTAINS 2% OR LESS OF THE FOLLOWING: LEAVENING (SODIUM BICARBONATE, SODIUM ACID PYROPHOSPHATE, SODIUM ALUMINUM PHOSPHATE), SUGAR, CORN SUGAR, WHEY, BUTTERMILK, SOYBEAN OIL, SODIUM CASEINATE, DATEM, NATURAL AND ARTIFICIAL FLAVOR, GUAR GUM, SORBIC ACID. PORK SAUSAGE PATTY: PORK, WATER, CONTAINS 2% OR LESS OF: SALT, SUGAR, SODIUM PHOSPHATE, SPICE, DEXTROSE, FLAVORING, BHA, PROPYL GALLATE, CITRIC ACID, CARAMEL COLOR. EGG PATTY: WHOLE EGGS, WATER, DRY WHOLE MILK, SOYBEAN OIL, SALT, XANTHAN GUM, CITRIC ACID. PASTEURIZED PROCESS AMERICAN CHEESE: CULTURED MILK AND SKIM MILK, CREAM, SODIUM CITRATE, SALT, PAPRIKA AND ANNATTO (COLOR), SODIUM PHOSPHATE, ACETIC ACID, ENZYMES, SORBIC ACID (PRESERVATIVE), SOY LECITHIN (ANTI-STICKING AGENT).",
    SubcategoryName: 'egg',
    canonicalTag: 'egg',
    id: 33721
  },
  {
    description: 'FAT FREE MILK',
    ingredients: 'FAT FREE MILK, VITAMIN A PALMITATE, VITAMIN D3.',
    SubcategoryName: 'milk',
    canonicalTag: 'milk',
    id: 55166
  },
  {
    description: 'MILK & COOKIES WHEY PROTEIN BAKED BARS, MILK & COOKIES',
    ingredients: "PROTEIN BLEND (WHEY PROTEIN ISOLATE, WHEY PROTEIN CONCENTRATE), VEGETABLE OILS (PALM KERNEL, PALM), MALTITOL, SOY PROTEIN ISOLATE, GLYCERIN, GELATIN [BOVINE], SORBITOL, SUGAR, COCOA (PROCESSED WITH ALKALI), WATER. CONTAINS 2% OR LESS OF THE FOLLOWING: GLUCOSE SYRUP, TAPIOCA STARCH, NATURAL FLAVOR, SUNFLOWER OIL, SUCRALOSE, SUNFLOWER LECITHIN, SOYBEAN OIL, SALT, BAKING SODA, TITANIUM DIOXIDE, VANILLA POWDER, MALTODEXTRIN, SODIUM CASEINATE, PROPYLENE GLYCOL MONO ESTERS, POTASSIUM SORBATE, MONO & DIGLYCERIDES, SOY LECITHIN, WHEY ACETYLATED MONOGLYCERIDES, BETA CAROTENE, VITAMIN A PALMITATE, SILICON DIOXIDE, NATURAL TOCOPHEROLS, PEANUT AND ALMOND.",
    SubcategoryName: 'milk',
    canonicalTag: 'milk',
    id: 67931
  }
];

const testCases = [
  { ingredient: 'egg', ids: [75493, 23851, 33721] },
  { ingredient: 'milk', ids: [55166, 67931] }
];

console.log('=== Ingredient Prominence Analysis Test ===\n');

testCases.forEach(test => {
  console.log(`\n=== Testing ${test.ingredient.toUpperCase()} Products ===`);
  testProducts.filter(p => test.ids.includes(p.id)).forEach(product => {
    const analysis = analyzeIngredientProminence(product, test.ingredient);
    console.log(`\n📦 ${product.description.substring(0, 60)}...`);
    console.log(`   Classification: ${analysis.classification}`);
    console.log(`   Reason: ${analysis.reason}`);
    console.log(`   Ingredient Position: ${analysis.ingredientPosition}/${analysis.totalRecipeIngredients}`);
    console.log(`   Processed IngredientCategorized: ${analysis.isProcessedIngredientCategorized}`);
    console.log(`   Pure by Name: ${analysis.isPureByName}`);
    // Show first 3 ingredients
    if (product.ingredients) {
      const firstThree = product.ingredients.split(',').slice(0, 3).map(i => i.trim());
      console.log(`   First 3 ingredients: ${firstThree.join(', ')}`);
    }
  });
}); 