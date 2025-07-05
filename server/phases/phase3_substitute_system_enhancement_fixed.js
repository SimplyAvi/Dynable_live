const { CanonicalIngredient, Substitution, Food, Subcategory } = require('./db/models');
const { Op, Sequelize } = require('sequelize');

const MAJOR_ALLERGENS = ['milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 'wheat', 'soybeans', 'sesame', 'gluten'];

async function phase3SubstituteSystemEnhancementFixed() {
  console.log('🔄 PHASE 3: Substitute System Enhancement (Fixed)\n');
  
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
    
    // 2. Focus on the most important basic ingredients that need substitutes
    console.log('\n2. Focusing on essential substitutes for common allergens...');
    
    const essentialSubstitutes = {
      // Milk substitutes
      'milk': ['almond milk', 'soy milk', 'oat milk', 'coconut milk'],
      'butter': ['coconut oil', 'olive oil', 'almond butter'],
      'cheese': ['nutritional yeast', 'cashew cheese', 'tofu'],
      'cream': ['coconut cream', 'cashew cream', 'almond cream'],
      
      // Egg substitutes
      'egg': ['flax egg', 'chia egg', 'banana', 'applesauce'],
      'egg white': ['aquafaba', 'flax egg', 'chia egg'],
      
      // Wheat/Gluten substitutes
      'wheat flour': ['almond flour', 'coconut flour', 'oat flour', 'rice flour'],
      'all-purpose flour': ['almond flour', 'coconut flour', 'oat flour', 'rice flour'],
      'bread': ['gluten-free bread', 'rice bread', 'almond bread'],
      
      // Nut substitutes
      'peanut butter': ['almond butter', 'sunflower seed butter', 'cashew butter'],
      'almond': ['sunflower seeds', 'pumpkin seeds', 'hemp seeds'],
      'cashew': ['sunflower seeds', 'pumpkin seeds', 'hemp seeds'],
      
      // Soy substitutes
      'soy sauce': ['coconut aminos', 'tamari', 'liquid aminos'],
      'tofu': ['tempeh', 'seitan', 'legumes']
    };
    
    let substitutesAdded = 0;
    let canonicalsCreated = 0;
    
    // 3. Create or find substitute canonicals and add substitutions
    console.log('\n3. Creating substitute relationships...');
    
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
        // Find or create the substitute canonical
        let substituteCanonical = await CanonicalIngredient.findOne({
          where: { name: substituteName }
        });
        
        if (!substituteCanonical) {
          // Create the substitute canonical
          substituteCanonical = await CanonicalIngredient.create({
            name: substituteName,
            allergens: [],
            frequency: 0
          });
          canonicalsCreated++;
          console.log(`    Created canonical: ${substituteName}`);
        }
        
        // Check if substitution already exists
        const existingSubstitution = await Substitution.findOne({
          where: {
            CanonicalIngredientId: originalCanonical.id,
            SubstituteCanonicalIngredientId: substituteCanonical.id
          }
        });
        
        if (!existingSubstitution) {
          // Create the substitution
          await Substitution.create({
            CanonicalIngredientId: originalCanonical.id,
            SubstituteCanonicalIngredientId: substituteCanonical.id,
            confidence: 'suggested',
            reason: `Essential substitute for common allergen`
          });
          substitutesAdded++;
          console.log(`    Added substitute: ${originalIngredient} → ${substituteName}`);
        } else {
          console.log(`    Already exists: ${originalIngredient} → ${substituteName}`);
        }
      }
    }
    
    console.log(`\nCreated ${canonicalsCreated} new canonical ingredients`);
    console.log(`Added ${substitutesAdded} substitute relationships`);
    
    // 4. Add essential substitute products
    console.log('\n4. Adding essential substitute products...');
    
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
      'nutritional yeast': 'Nutritional Yeast Flakes',
      'flax egg': 'Ground Flax Seeds',
      'chia egg': 'Chia Seeds',
      'aquafaba': 'Chickpea Liquid',
      'coconut aminos': 'Coconut Aminos Sauce'
    };
    
    let productsAdded = 0;
    
    for (const [canonicalName, productName] of Object.entries(essentialProducts)) {
      const canonical = await CanonicalIngredient.findOne({
        where: { name: canonicalName }
      });
      
      if (canonical) {
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
    }
    
    console.log(`\nAdded ${productsAdded} substitute products`);
    
    // 5. Test the substitute system
    console.log('\n5. Testing substitute system...');
    
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
            const substituteCanonical = await CanonicalIngredient.findByPk(substitution.SubstituteCanonicalIngredientId);
            console.log(`  - ${substituteCanonical.name}`);
          }
        } else {
          console.log(`  No substitutes found`);
        }
      }
    }
    
    // 6. Final audit
    console.log('\n6. Final substitute system audit...');
    
    const finalTotalCanonicals = await CanonicalIngredient.count();
    const finalCanonicalsWithSubstitutes = await CanonicalIngredient.count({
      include: [{ model: Substitution, as: 'Substitutions' }],
      where: { '$Substitutions.id$': { [Op.ne]: null } }
    });
    
    console.log(`Final substitute coverage:`);
    console.log(`  - Total canonical ingredients: ${finalTotalCanonicals}`);
    console.log(`  - With substitutes: ${finalCanonicalsWithSubstitutes}`);
    console.log(`  - Coverage rate: ${((finalCanonicalsWithSubstitutes / finalTotalCanonicals) * 100).toFixed(1)}%`);
    
    // 7. Test allergen filtering with substitutes
    console.log('\n7. Testing allergen filtering with substitutes...');
    
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
          const substituteCanonical = await CanonicalIngredient.findByPk(substitution.SubstituteCanonicalIngredientId);
          console.log(`    - ${substituteCanonical.name}`);
        }
      } else {
        console.log(`    No substitutes available`);
      }
    }
    
    console.log('\n✅ Phase 3 Substitute System Enhancement complete!');
    console.log('\n🎯 Key improvements:');
    console.log(`- Created ${canonicalsCreated} new canonical ingredients`);
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
phase3SubstituteSystemEnhancementFixed().then(() => {
  console.log('\n🏁 Phase 3 complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Phase 3 failed:', error);
  process.exit(1);
}); 