const { CanonicalIngredient, Substitution, Food, Subcategory } = require('./db/models');
const { Op, Sequelize } = require('sequelize');

async function phase3SimpleSubstituteEnhancement() {
  console.log('🔄 PHASE 3: Simple Substitute System Enhancement\n');
  
  try {
    // 1. Audit current substitute coverage
    console.log('1. Auditing current substitute coverage...');
    
    const totalCanonicals = await CanonicalIngredient.count();
    const canonicalsWithSubstitutes = await CanonicalIngredient.count({
      include: [{ model: Substitution, as: 'Substitutions' }],
      where: { '$Substitutions.id$': { [Op.ne]: null } }
    });
    
    console.log(`Substitute coverage:`);
    console.log(`  - Total canonical ingredients: ${totalCanonicals}`);
    console.log(`  - With substitutes: ${canonicalsWithSubstitutes}`);
    console.log(`  - Coverage rate: ${((canonicalsWithSubstitutes / totalCanonicals) * 100).toFixed(1)}%`);
    
    // 2. Add essential substitutes for common allergens
    console.log('\n2. Adding essential substitutes for common allergens...');
    
    const essentialSubstitutes = {
      'milk': ['almond milk', 'soy milk', 'oat milk', 'coconut milk'],
      'butter': ['coconut oil', 'olive oil', 'almond butter'],
      'egg': ['flax egg', 'chia egg', 'banana', 'applesauce'],
      'wheat flour': ['almond flour', 'coconut flour', 'oat flour', 'rice flour'],
      'all-purpose flour': ['almond flour', 'coconut flour', 'oat flour', 'rice flour'],
      'peanut butter': ['almond butter', 'sunflower seed butter', 'cashew butter'],
      'soy sauce': ['coconut aminos', 'tamari', 'liquid aminos']
    };
    
    let substitutesAdded = 0;
    
    for (const [originalIngredient, substitutes] of Object.entries(essentialSubstitutes)) {
      // Find the original canonical ingredient
      const originalCanonical = await CanonicalIngredient.findOne({
        where: { name: originalIngredient }
      });
      
      if (!originalCanonical) {
        console.log(`  ⚠️  Original ingredient not found: ${originalIngredient}`);
        continue;
      }
      
      console.log(`\n  Processing: ${originalIngredient}`);
      
      for (const substituteName of substitutes) {
        // Check if substitution already exists
        const existingSubstitution = await Substitution.findOne({
          where: {
            CanonicalIngredientId: originalCanonical.id,
            substituteName: substituteName
          }
        });
        
        if (!existingSubstitution) {
          // Create the substitution
          await Substitution.create({
            CanonicalIngredientId: originalCanonical.id,
            substituteName: substituteName,
            notes: `Essential substitute for common allergen`
          });
          substitutesAdded++;
          console.log(`    Added substitute: ${originalIngredient} → ${substituteName}`);
        } else {
          console.log(`    Already exists: ${originalIngredient} → ${substituteName}`);
        }
      }
    }
    
    console.log(`\nAdded ${substitutesAdded} substitute relationships`);
    
    // 3. Add essential substitute products
    console.log('\n3. Adding essential substitute products...');
    
    const essentialProducts = {
      'almond milk': 'Unsweetened Almond Milk',
      'soy milk': 'Unsweetened Soy Milk',
      'oat milk': 'Unsweetened Oat Milk',
      'coconut milk': 'Unsweetened Coconut Milk',
      'almond flour': 'Blanched Almond Flour',
      'coconut flour': 'Organic Coconut Flour',
      'oat flour': 'Whole Grain Oat Flour',
      'rice flour': 'White Rice Flour',
      'almond butter': 'Natural Almond Butter',
      'sunflower seed butter': 'Natural Sunflower Seed Butter',
      'coconut oil': 'Virgin Coconut Oil',
      'flax egg': 'Ground Flax Seeds',
      'chia egg': 'Chia Seeds',
      'coconut aminos': 'Coconut Aminos Sauce'
    };
    
    let productsAdded = 0;
    
    for (const [canonicalName, productName] of Object.entries(essentialProducts)) {
      // Find or create the canonical ingredient
      let canonical = await CanonicalIngredient.findOne({
        where: { name: canonicalName }
      });
      
      if (!canonical) {
        canonical = await CanonicalIngredient.create({
          name: canonicalName,
          allergens: [],
          frequency: 0
        });
        console.log(`  Created canonical: ${canonicalName}`);
      }
      
      const existingProduct = await Food.findOne({
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
          await Food.create({
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
    
    console.log(`\nAdded ${productsAdded} substitute products`);
    
    // 4. Test the substitute system
    console.log('\n4. Testing substitute system...');
    
    const testCases = [
      { original: 'milk', allergen: 'milk' },
      { original: 'egg', allergen: 'eggs' },
      { original: 'wheat flour', allergen: 'wheat' },
      { original: 'peanut butter', allergen: 'peanuts' }
    ];
    
    for (const testCase of testCases) {
      const canonical = await CanonicalIngredient.findOne({
        where: { name: testCase.original },
        include: [{ model: Substitution, as: 'Substitutions' }]
      });
      
      if (canonical) {
        console.log(`\n${testCase.original} (${testCase.allergen} allergy) substitutes:`);
        if (canonical.Substitutions.length > 0) {
          for (const substitution of canonical.Substitutions) {
            console.log(`  - ${substitution.substituteName}`);
          }
        } else {
          console.log(`  No substitutes found`);
        }
      }
    }
    
    // 5. Final audit
    console.log('\n5. Final substitute system audit...');
    
    const finalTotalCanonicals = await CanonicalIngredient.count();
    const finalCanonicalsWithSubstitutes = await CanonicalIngredient.count({
      include: [{ model: Substitution, as: 'Substitutions' }],
      where: { '$Substitutions.id$': { [Op.ne]: null } }
    });
    
    console.log(`Final substitute coverage:`);
    console.log(`  - Total canonical ingredients: ${finalTotalCanonicals}`);
    console.log(`  - With substitutes: ${finalCanonicalsWithSubstitutes}`);
    console.log(`  - Coverage rate: ${((finalCanonicalsWithSubstitutes / finalTotalCanonicals) * 100).toFixed(1)}%`);
    
    // 6. Test allergen filtering with substitutes
    console.log('\n6. Testing allergen filtering with substitutes...');
    
    const testAllergen = 'milk';
    const milkCanonicals = await CanonicalIngredient.findAll({
      where: Sequelize.literal(`"allergens"::text LIKE '%${testAllergen}%'`),
      include: [{ model: Substitution, as: 'Substitutions' }],
      limit: 5
    });
    
    console.log(`Testing ${testAllergen} allergy filtering (sample):`);
    for (const canonical of milkCanonicals) {
      console.log(`\n  ${canonical.name}:`);
      if (canonical.Substitutions.length > 0) {
        for (const substitution of canonical.Substitutions) {
          console.log(`    - ${substitution.substituteName}`);
        }
      } else {
        console.log(`    No substitutes available`);
      }
    }
    
    console.log('\n✅ Phase 3 Simple Substitute System Enhancement complete!');
    console.log('\n🎯 Key improvements:');
    console.log(`- Added ${substitutesAdded} substitute relationships`);
    console.log(`- Added ${productsAdded} substitute products`);
    console.log(`- Enhanced allergen filtering capabilities`);
    console.log(`- Better user experience for allergy-aware cooking`);
    console.log(`- Focused on essential substitutes for common allergens`);
    
  } catch (error) {
    console.error('❌ Error in Phase 3:', error);
  }
}

// Run Phase 3
phase3SimpleSubstituteEnhancement().then(() => {
  console.log('\n🏁 Phase 3 complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Phase 3 failed:', error);
  process.exit(1);
}); 