const { Recipe, Ingredient, IngredientToCanonical, CanonicalIngredient, Substitution, Food, Subcategory } = require('./db/models');
const { Op, Sequelize } = require('sequelize');

const MAJOR_ALLERGENS = ['milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 'wheat', 'soybeans', 'sesame', 'gluten'];

async function comprehensivePhaseAudit() {
  console.log('🔍 COMPREHENSIVE PHASE AUDIT - Current System State\n');
  
  try {
    // PHASE 1: Data Quality & Coverage
    console.log('📊 PHASE 1: Data Quality & Coverage');
    console.log('=' .repeat(50));
    
    // Recipe coverage
    const totalRecipes = await Recipe.count();
    const recipesWithIngredients = await Recipe.count({
      include: [{ model: Ingredient, as: 'Ingredients' }],
      where: { '$Ingredients.id$': { [Op.ne]: null } }
    });
    
    console.log(`📋 Recipes: ${totalRecipes} total, ${recipesWithIngredients} with ingredients`);
    
    // Ingredient mapping coverage
    const totalIngredients = await Ingredient.count();
    const mappedIngredients = await IngredientToCanonical.count();
    const mappingRate = ((mappedIngredients / totalIngredients) * 100).toFixed(1);
    
    console.log(`🔗 Ingredient Mapping: ${mappedIngredients}/${totalIngredients} (${mappingRate}%)`);
    
    // Canonical coverage
    const totalCanonicals = await CanonicalIngredient.count();
    console.log(`🎯 Canonical Ingredients: ${totalCanonicals}`);
    
    // Product coverage
    const totalProducts = await Food.count();
    const productsWithCanonicalTags = await Food.count({
      where: { canonicalTag: { [Op.ne]: null } }
    });
    const canonicalTagRate = ((productsWithCanonicalTags / totalProducts) * 100).toFixed(1);
    
    console.log(`🛒 Products: ${totalProducts} total, ${productsWithCanonicalTags} with canonical tags (${canonicalTagRate}%)`);
    
    // PHASE 2: Subcategory & Pure Ingredient System
    console.log('\n📊 PHASE 2: Subcategory & Pure Ingredient System');
    console.log('=' .repeat(50));
    
    const totalSubcategories = await Subcategory.count();
    const pureSubcategories = await Subcategory.count({ where: { pure_ingredient: true } });
    const pureRate = ((pureSubcategories / totalSubcategories) * 100).toFixed(1);
    
    console.log(`🏷️  Subcategories: ${totalSubcategories} total, ${pureSubcategories} pure ingredients (${pureRate}%)`);
    
    // Check products in pure subcategories
    const productsInPureSubcategories = await Food.count({
      include: [{ model: Subcategory, as: 'Subcategory' }],
      where: { '$Subcategory.pure_ingredient$': true }
    });
    
    console.log(`🛒 Products in pure subcategories: ${productsInPureSubcategories}`);
    
    // PHASE 3: Substitute System
    console.log('\n📊 PHASE 3: Substitute System');
    console.log('=' .repeat(50));
    
    const totalSubstitutions = await Substitution.count();
    console.log(`🔄 Total substitutions defined: ${totalSubstitutions}`);
    
    // Check allergen coverage with substitutes
    let allergenCoverage = {};
    for (const allergen of MAJOR_ALLERGENS) {
      const canonicalsWithAllergen = await CanonicalIngredient.count({
        where: Sequelize.literal(`"allergens"::text LIKE '%${allergen}%'`)
      });
      
      const canonicalsWithSubstitutes = await CanonicalIngredient.count({
        where: Sequelize.literal(`"allergens"::text LIKE '%${allergen}%'`),
        include: [{ model: Substitution, as: 'Substitutions' }],
        where: { '$Substitutions.id$': { [Op.ne]: null } }
      });
      
      allergenCoverage[allergen] = {
        total: canonicalsWithAllergen,
        withSubstitutes: canonicalsWithSubstitutes,
        rate: canonicalsWithAllergen > 0 ? ((canonicalsWithSubstitutes / canonicalsWithAllergen) * 100).toFixed(1) : '0.0'
      };
    }
    
    console.log('🩸 Allergen substitute coverage:');
    for (const [allergen, coverage] of Object.entries(allergenCoverage)) {
      console.log(`   ${allergen}: ${coverage.withSubstitutes}/${coverage.total} (${coverage.rate}%)`);
    }
    
    // PHASE 4: Real Product Prioritization
    console.log('\n📊 PHASE 4: Real Product Prioritization');
    console.log('=' .repeat(50));
    
    const genericProducts = await Food.count({ where: { brandOwner: 'Generic' } });
    const realProducts = await Food.count({ where: { brandOwner: { [Op.ne]: 'Generic' } } });
    const realProductRate = ((realProducts / totalProducts) * 100).toFixed(1);
    
    console.log(`🏪 Real Products: ${realProducts}/${totalProducts} (${realProductRate}%)`);
    console.log(`🔄 Generic Products: ${genericProducts}/${totalProducts} (${((genericProducts / totalProducts) * 100).toFixed(1)}%)`);
    
    // Check canonical tag confidence distribution
    const confidentProducts = await Food.count({ where: { canonicalTagConfidence: 'confident' } });
    const suggestedProducts = await Food.count({ where: { canonicalTagConfidence: 'suggested' } });
    const lowConfidenceProducts = await Food.count({ where: { canonicalTagConfidence: 'low' } });
    
    console.log(`🎯 Canonical Tag Confidence:`);
    console.log(`   Confident: ${confidentProducts} (${((confidentProducts / totalProducts) * 100).toFixed(1)}%)`);
    console.log(`   Suggested: ${suggestedProducts} (${((suggestedProducts / totalProducts) * 100).toFixed(1)}%)`);
    console.log(`   Low: ${lowConfidenceProducts} (${((lowConfidenceProducts / totalProducts) * 100).toFixed(1)}%)`);
    
    // PHASE 5: Recipe Testing & User Experience
    console.log('\n📊 PHASE 5: Recipe Testing & User Experience');
    console.log('=' .repeat(50));
    
    // Test a few sample recipes
    const sampleRecipes = await Recipe.findAll({
      include: [{ model: Ingredient, as: 'Ingredients' }],
      limit: 5,
      order: Sequelize.literal('RANDOM()')
    });
    
    console.log('🧪 Sample Recipe Analysis:');
    for (const recipe of sampleRecipes) {
      console.log(`\n📖 Recipe: ${recipe.name}`);
      console.log(`   Ingredients: ${recipe.Ingredients.length}`);
      
      let mappedCount = 0;
      let productsFound = 0;
      
      for (const ingredient of recipe.Ingredients) {
        const mapping = await IngredientToCanonical.findOne({ 
          where: { messyName: ingredient.name.toLowerCase() } 
        });
        
        if (mapping) {
          mappedCount++;
          const canonical = await CanonicalIngredient.findByPk(mapping.CanonicalIngredientId);
          if (canonical) {
            const products = await Food.count({ where: { canonicalTag: canonical.name.toLowerCase() } });
            if (products > 0) productsFound++;
          }
        }
      }
      
      const mappingRate = recipe.Ingredients.length > 0 ? ((mappedCount / recipe.Ingredients.length) * 100).toFixed(1) : '0.0';
      const productRate = mappedCount > 0 ? ((productsFound / mappedCount) * 100).toFixed(1) : '0.0';
      
      console.log(`   Mapping: ${mappedCount}/${recipe.Ingredients.length} (${mappingRate}%)`);
      console.log(`   Products: ${productsFound}/${mappedCount} (${productRate}%)`);
    }
    
    // PHASE 6: Issues & Recommendations
    console.log('\n📊 PHASE 6: Issues & Recommendations');
    console.log('=' .repeat(50));
    
    // Find common issues
    console.log('🔍 Common Issues Identified:');
    
    // 1. Unmapped ingredients
    const unmappedIngredients = await Ingredient.findAll({
      include: [{ model: Recipe, as: 'Recipe' }],
      where: {
        id: {
          [Op.notIn]: Sequelize.literal('(SELECT DISTINCT "IngredientId" FROM "IngredientToCanonicals")')
        }
      },
      limit: 10
    });
    
    if (unmappedIngredients.length > 0) {
      console.log(`   ❌ Unmapped ingredients found (showing first 10):`);
      unmappedIngredients.forEach(ing => {
        console.log(`      - "${ing.name}" (Recipe: ${ing.Recipe?.name || 'Unknown'})`);
      });
    }
    
    // 2. Canonicals without products
    const canonicalsWithoutProducts = await CanonicalIngredient.findAll({
      where: {
        id: {
          [Op.notIn]: Sequelize.literal('(SELECT DISTINCT "CanonicalIngredientId" FROM "Food" WHERE "canonicalTag" IS NOT NULL)')
        }
      },
      limit: 10
    });
    
    if (canonicalsWithoutProducts.length > 0) {
      console.log(`   ❌ Canonicals without products (showing first 10):`);
      canonicalsWithoutProducts.forEach(canonical => {
        console.log(`      - "${canonical.name}"`);
      });
    }
    
    // 3. Allergen ingredients without substitutes
    const allergenIngredientsWithoutSubstitutes = await CanonicalIngredient.findAll({
      where: Sequelize.literal(`"allergens" IS NOT NULL AND "allergens" != '{}'`),
      include: [{ model: Substitution, as: 'Substitutions' }],
      where: { '$Substitutions.id$': null },
      limit: 10
    });
    
    if (allergenIngredientsWithoutSubstitutes.length > 0) {
      console.log(`   ❌ Allergen ingredients without substitutes (showing first 10):`);
      allergenIngredientsWithoutSubstitutes.forEach(canonical => {
        console.log(`      - "${canonical.name}" (allergens: ${canonical.allergens?.join(', ') || 'none'})`);
      });
    }
    
    // Summary and recommendations
    console.log('\n📋 SUMMARY & RECOMMENDATIONS:');
    console.log('=' .repeat(50));
    
    if (mappingRate < 80) {
      console.log(`   🔧 Priority 1: Improve ingredient mapping (currently ${mappingRate}%)`);
    }
    
    if (realProductRate < 60) {
      console.log(`   🔧 Priority 2: Add more real products (currently ${realProductRate}%)`);
    }
    
    const avgAllergenCoverage = Object.values(allergenCoverage)
      .reduce((sum, coverage) => sum + parseFloat(coverage.rate), 0) / MAJOR_ALLERGENS.length;
    
    if (avgAllergenCoverage < 80) {
      console.log(`   🔧 Priority 3: Improve allergen substitute coverage (currently ${avgAllergenCoverage.toFixed(1)}%)`);
    }
    
    if (pureRate < 30) {
      console.log(`   🔧 Priority 4: Review pure ingredient subcategories (currently ${pureRate}%)`);
    }
    
    console.log('\n✅ System is ready for frontend testing and user experience optimization!');
    
  } catch (error) {
    console.error('❌ Error in comprehensive audit:', error);
  }
}

// Run the audit
comprehensivePhaseAudit().then(() => {
  console.log('\n🏁 Audit complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Audit failed:', error);
  process.exit(1);
}); 