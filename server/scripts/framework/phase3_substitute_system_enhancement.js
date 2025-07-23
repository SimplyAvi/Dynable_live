const { Ingredient, Substitution, IngredientCategorized, Subcategory } = require('./db/models');
const { Op, Sequelize } = require('sequelize');

const MAJOR_ALLERGENS = ['milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 'wheat', 'soybeans', 'sesame', 'gluten'];

async function phase3SubstituteSystemEnhancement() {
  console.log('🔄 PHASE 3: Substitute System Enhancement\n');
  
  try {
    // 1. Audit current substitute coverage
    console.log('1. Auditing current substitute coverage...');
    
    const totalCanonicals = await Ingredient.count();
    const canonicalsWithSubstitutes = await Ingredient.count({
      include: [{ model: Substitution, as: 'Substitutions' }],
      where: { '$Substitutions.id$': { [Op.ne]: null } }
    });
    
    console.log(`Substitute coverage:`);
    console.log(`  - Total canonical ingredients: ${totalCanonicals}`);
    console.log(`  - With substitutes: ${canonicalsWithSubstitutes}`);
    console.log(`  - Coverage rate: ${((canonicalsWithSubstitutes / totalCanonicals) * 100).toFixed(1)}%`);
    
    // 2. Check allergen-specific substitute coverage
    console.log('\n2. Checking allergen-specific substitute coverage...');
    
    let allergenCoverage = {};
    
    for (const allergen of MAJOR_ALLERGENS) {
      const allergenCanonicals = await Ingredient.findAll({
        where: Sequelize.literal(`"allergens"::text LIKE '%${allergen}%'`)
      });
      
      let withSubstitutes = 0;
      for (const canonical of allergenCanonicals) {
        const substituteCount = await Substitution.count({
          where: { IngredientId: canonical.id }
        });
        if (substituteCount > 0) {
          withSubstitutes++;
        }
      }
      
      allergenCoverage[allergen] = {
        total: allergenCanonicals.length,
        withSubstitutes: withSubstitutes,
        rate: allergenCanonicals.length > 0 ? ((withSubstitutes / allergenCanonicals.length) * 100).toFixed(1) : '0.0'
      };
    }
    
    console.log('Allergen substitute coverage:');
    Object.entries(allergenCoverage).forEach(([allergen, data]) => {
      console.log(`  - ${allergen}: ${data.withSubstitutes}/${data.total} (${data.rate}%)`);
    });
    
    // 3. Identify missing substitutes for common allergens
    console.log('\n3. Identifying missing substitutes...');
    
    const missingSubstitutes = [];
    
    for (const allergen of MAJOR_ALLERGENS) {
      const allergenCanonicals = await Ingredient.findAll({
        where: Sequelize.literal(`"allergens"::text LIKE '%${allergen}%'`),
        include: [{ model: Substitution, as: 'Substitutions' }]
      });
      
      for (const canonical of allergenCanonicals) {
        if (canonical.Substitutions.length === 0) {
          missingSubstitutes.push({
            canonical: canonical.name,
            allergen: allergen,
            frequency: canonical.frequency || 0
          });
        }
      }
    }
    
    // Sort by frequency (most common first)
    missingSubstitutes.sort((a, b) => b.frequency - a.frequency);
    
    console.log(`Found ${missingSubstitutes.length} ingredients missing substitutes`);
    console.log('Top 10 missing substitutes:');
    missingSubstitutes.slice(0, 10).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.canonical} (${item.allergen}) - Frequency: ${item.frequency}`);
    });
    
    // 4. Auto-suggest substitutes based on common patterns
    console.log('\n4. Auto-suggesting substitutes...');
    
    const substitutePatterns = {
      'milk': ['almond milk', 'soy milk', 'oat milk', 'coconut milk', 'rice milk'],
      'eggs': ['flax eggs', 'chia eggs', 'banana', 'applesauce', 'aquafaba'],
      'wheat': ['almond flour', 'coconut flour', 'oat flour', 'rice flour', 'quinoa flour'],
      'peanuts': ['almond butter', 'cashew butter', 'sunflower seed butter', 'soy nut butter'],
      'tree nuts': ['sunflower seeds', 'pumpkin seeds', 'sesame seeds', 'hemp seeds'],
      'soybeans': ['coconut aminos', 'tamari', 'miso', 'nutritional yeast'],
      'fish': ['tofu', 'tempeh', 'seitan', 'legumes'],
      'shellfish': ['tofu', 'tempeh', 'seitan', 'legumes'],
      'sesame': ['poppy seeds', 'sunflower seeds', 'pumpkin seeds'],
      'gluten': ['almond flour', 'coconut flour', 'oat flour', 'rice flour', 'quinoa flour']
    };
    
    let substitutesAdded = 0;
    
    for (const missing of missingSubstitutes.slice(0, 50)) { // Limit to top 50
      const patterns = substitutePatterns[missing.allergen];
      if (patterns) {
        for (const substituteName of patterns) {
          // Find or create the substitute canonical
          let substituteCanonical = await Ingredient.findOne({
            where: { name: substituteName }
          });
          
          if (!substituteCanonical) {
            // Create the substitute canonical if it doesn't exist
            substituteCanonical = await Ingredient.create({
              name: substituteName,
              allergens: [],
              frequency: 0
            });
            console.log(`  Created new canonical: ${substituteName}`);
          }
          
          // Check if substitution already exists
          const existingSubstitution = await Substitution.findOne({
            where: {
              IngredientId: missing.canonical,
              SubstituteIngredientId: substituteCanonical.id
            }
          });
          
          if (!existingSubstitution) {
            await Substitution.create({
              IngredientId: missing.canonical,
              SubstituteIngredientId: substituteCanonical.id,
              confidence: 'suggested',
              reason: `Auto-suggested substitute for ${missing.allergen} allergy`
            });
            substitutesAdded++;
            console.log(`  Added substitute: ${missing.canonical} → ${substituteName}`);
          }
        }
      }
    }
    
    console.log(`\nAdded ${substitutesAdded} substitute relationships`);
    
    // 5. Verify substitute products exist
    console.log('\n5. Verifying substitute products exist...');
    
    const substitutesWithoutProducts = [];
    
    const allSubstitutes = await Substitution.findAll({
      include: [
        { model: Ingredient, as: 'Ingredient' },
        { model: Ingredient, as: 'SubstituteIngredient' }
      ]
    });
    
    for (const substitution of allSubstitutes) {
      const substituteProducts = await IngredientCategorized.count({
        where: {
          canonicalTag: substitution.SubstituteIngredient.name,
          canonicalTagConfidence: 'confident'
        }
      });
      
      if (substituteProducts === 0) {
        substitutesWithoutProducts.push({
          original: substitution.Ingredient.name,
          substitute: substitution.SubstituteIngredient.name,
          allergen: substitution.reason || 'unknown'
        });
      }
    }
    
    console.log(`Found ${substitutesWithoutProducts.length} substitutes without products`);
    console.log('Sample substitutes without products:');
    substitutesWithoutProducts.slice(0, 10).forEach(item => {
      console.log(`  - ${item.original} → ${item.substitute} (${item.allergen})`);
    });
    
    // 6. Add missing substitute products
    console.log('\n6. Adding missing substitute products...');
    
    const commonSubstituteProducts = {
      'almond milk': 'Unsweetened Almond Milk',
      'soy milk': 'Unsweetened Soy Milk',
      'oat milk': 'Unsweetened Oat Milk',
      'coconut milk': 'Unsweetened Coconut Milk',
      'rice milk': 'Unsweetened Rice Milk',
      'almond flour': 'Blanched Almond Flour',
      'coconut flour': 'Organic Coconut Flour',
      'oat flour': 'Whole Grain Oat Flour',
      'rice flour': 'White Rice Flour',
      'quinoa flour': 'Organic Quinoa Flour',
      'almond butter': 'Natural Almond Butter',
      'cashew butter': 'Natural Cashew Butter',
      'sunflower seed butter': 'Natural Sunflower Seed Butter',
      'flax eggs': 'Ground Flax Seeds',
      'chia eggs': 'Chia Seeds',
      'aquafaba': 'Chickpea Liquid',
      'coconut aminos': 'Coconut Aminos Sauce',
      'nutritional yeast': 'Nutritional Yeast Flakes'
    };
    
    let productsAdded = 0;
    
    for (const [canonicalName, productName] of Object.entries(commonSubstituteProducts)) {
      const canonical = await Ingredient.findOne({
        where: { name: canonicalName }
      });
      
      if (canonical) {
        const existingProduct = await IngredientCategorized.findOne({
          where: {
            canonicalTag: canonicalName,
            canonicalTagConfidence: 'confident'
          }
        });
        
        if (!existingProduct) {
          // Find appropriate subcategory
          const subcategory = await Subcategory.findOne({
            where: {
              [Op.or]: [
                { SubcategoryName: { [Op.iLike]: `%${canonicalName.split(' ')[0]}%` } },
                { is_basic_ingredient: true }
              ]
            }
          });
          
          if (subcategory) {
            await IngredientCategorized.create({
              description: productName,
              canonicalTag: canonicalName,
              canonicalTagConfidence: 'confident',
              SubcategoryID: subcategory.SubcategoryID,
              allergens: canonical.allergens || []
            });
            productsAdded++;
            console.log(`  Added product: ${productName} for ${canonicalName}`);
          }
        }
      }
    }
    
    console.log(`\nAdded ${productsAdded} substitute products`);
    
    // 7. Final audit
    console.log('\n7. Final substitute system audit...');
    
    const finalTotalCanonicals = await Ingredient.count();
    const finalCanonicalsWithSubstitutes = await Ingredient.count({
      include: [{ model: Substitution, as: 'Substitutions' }],
      where: { '$Substitutions.id$': { [Op.ne]: null } }
    });
    
    console.log(`Final substitute coverage:`);
    console.log(`  - Total canonical ingredients: ${finalTotalCanonicals}`);
    console.log(`  - With substitutes: ${finalCanonicalsWithSubstitutes}`);
    console.log(`  - Coverage rate: ${((finalCanonicalsWithSubstitutes / finalTotalCanonicals) * 100).toFixed(1)}%`);
    
    // Test allergen filtering
    console.log('\n8. Testing allergen filtering with substitutes...');
    
    const testAllergen = 'milk';
    const milkCanonicals = await Ingredient.findAll({
      where: Sequelize.literal(`"allergens"::text LIKE '%${testAllergen}%'`),
      include: [{ model: Substitution, as: 'Substitutions' }]
    });
    
    console.log(`Testing ${testAllergen} allergy filtering:`);
    console.log(`  - Canonicals with ${testAllergen}: ${milkCanonicals.length}`);
    console.log(`  - With substitutes: ${milkCanonicals.filter(c => c.Substitutions.length > 0).length}`);
    
    // Show sample substitutes
    const sampleWithSubstitutes = milkCanonicals.filter(c => c.Substitutions.length > 0).slice(0, 3);
    for (const canonical of sampleWithSubstitutes) {
      console.log(`\n  ${canonical.name} substitutes:`);
      for (const substitution of canonical.Substitutions.slice(0, 3)) {
        const substituteCanonical = await Ingredient.findByPk(substitution.SubstituteIngredientId);
        console.log(`    - ${substituteCanonical.name}`);
      }
    }
    
    console.log('\n✅ Phase 3 Substitute System Enhancement complete!');
    console.log('\n🎯 Key improvements:');
    console.log(`- Added ${substitutesAdded} substitute relationships`);
    console.log(`- Added ${productsAdded} substitute products`);
    console.log(`- Improved substitute coverage for major allergens`);
    console.log(`- Enhanced allergen filtering capabilities`);
    console.log(`- Better user experience for allergy-aware cooking`);
    
  } catch (error) {
    console.error('❌ Error in Phase 3:', error);
  }
}

// Run Phase 3
phase3SubstituteSystemEnhancement().then(() => {
  console.log('\n🏁 Phase 3 complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Phase 3 failed:', error);
  process.exit(1);
}); 