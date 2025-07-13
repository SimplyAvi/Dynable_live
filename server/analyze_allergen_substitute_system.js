const { AllergenDerivative, Substitution, CanonicalIngredient, Food } = require('./db/models');
const sequelize = require('./db/database');

async function analyzeAllergenSubstituteSystem() {
  try {
    console.log('🔍 ANALYZING ALLERGEN & SUBSTITUTE SYSTEM\n');
    
    // 1. Allergen system analysis
    console.log('📊 ALLERGEN SYSTEM:');
    const allergenCount = await AllergenDerivative.count();
    console.log(`   Total allergen derivatives: ${allergenCount}`);
    
    const uniqueAllergens = await AllergenDerivative.findAll({
      attributes: ['allergen'],
      group: ['allergen'],
      order: [['allergen', 'ASC']]
    });
    
    console.log(`   Unique allergens: ${uniqueAllergens.length}`);
    uniqueAllergens.forEach(a => console.log(`     - ${a.allergen}`));
    
    // Sample allergen derivatives
    const sampleAllergens = await AllergenDerivative.findAll({
      limit: 10,
      order: [['allergen', 'ASC']]
    });
    
    console.log('\n📋 Sample allergen derivatives:');
    sampleAllergens.forEach(a => {
      console.log(`   ${a.allergen} → ${a.derivative}`);
    });
    
    // 2. Substitute system analysis
    console.log('\n📊 SUBSTITUTE SYSTEM:');
    const substitutionCount = await Substitution.count();
    console.log(`   Total substitutions: ${substitutionCount}`);
    
    const sampleSubstitutions = await Substitution.findAll({
      include: [{ model: CanonicalIngredient, as: 'CanonicalIngredient' }],
      limit: 10
    });
    
    console.log('\n📋 Sample substitutions:');
    sampleSubstitutions.forEach(s => {
      const canonicalName = s.CanonicalIngredient?.name || 'Unknown';
      console.log(`   ${canonicalName} → ${s.substituteName} (${s.notes || 'no notes'})`);
    });
    
    // 3. Canonical ingredient allergen analysis
    console.log('\n📊 CANONICAL INGREDIENT ALLERGENS:');
    const canonicalsWithAllergens = await CanonicalIngredient.findAll({
      where: {
        allergens: { [sequelize.Sequelize.Op.ne]: null }
      },
      limit: 10
    });
    
    console.log(`   Canonicals with allergen tags: ${canonicalsWithAllergens.length}`);
    canonicalsWithAllergens.forEach(c => {
      console.log(`   ${c.name}: [${c.allergens.join(', ')}]`);
    });
    
    // 4. Food product allergen analysis
    console.log('\n📊 FOOD PRODUCT ALLERGENS:');
    const productsWithAllergens = await Food.count({
      where: {
        allergens: { [sequelize.Sequelize.Op.ne]: null }
      }
    });
    
    const totalProducts = await Food.count();
    console.log(`   Products with allergen tags: ${productsWithAllergens} (${(productsWithAllergens/totalProducts*100).toFixed(1)}%)`);
    
    // 5. Workflow analysis
    console.log('\n🔄 ALLERGEN & SUBSTITUTE WORKFLOW:');
    console.log('');
    console.log('📋 CURRENT WORKFLOW:');
    console.log('   1. User selects allergens in frontend');
    console.log('   2. Recipe ingredients checked against allergen derivatives');
    console.log('   3. Flagged ingredients show warning icons');
    console.log('   4. Substitute options presented for flagged ingredients');
    console.log('   5. User can select substitutes to avoid allergens');
    console.log('   6. Product filtering excludes allergen-containing products');
    console.log('');
    
    // 6. System strengths and gaps
    console.log('✅ SYSTEM STRENGTHS:');
    console.log('   ✅ AllergenDerivative table for complex allergen relationships');
    console.log('   ✅ Substitution table for ingredient alternatives');
    console.log('   ✅ Frontend allergen selection and filtering');
    console.log('   ✅ Recipe ingredient flagging for allergens');
    console.log('   ✅ Product-level allergen tags');
    console.log('');
    
    console.log('⚠️  POTENTIAL GAPS:');
    console.log('   ⚠️  Limited allergen derivatives in database');
    console.log('   ⚠️  Limited substitution options');
    console.log('   ⚠️  Mayonnaise example: eggs → mayonnaise, but no egg-free mayo substitutes');
    console.log('   ⚠️  Processed ingredients may need special allergen handling');
    console.log('   ⚠️  Cross-contamination not explicitly handled');
    console.log('');
    
    // 7. Recommendations
    console.log('💡 RECOMMENDATIONS:');
    console.log('   1. Expand AllergenDerivative table with more relationships');
    console.log('   2. Add more substitution options for common allergens');
    console.log('   3. Improve processed ingredient allergen tracking');
    console.log('   4. Add cross-contamination warnings');
    console.log('   5. Consider allergen confidence levels');
    console.log('');
    
    console.log('🤔 PRIORITY DECISION:');
    console.log('   Option A: Focus on pure/processed ingredient mapping first');
    console.log('   Option B: Tackle allergen system comprehensively now');
    console.log('   Option C: Do both in parallel');
    console.log('');
    console.log('   My recommendation: Option A (focus on ingredient mapping first)');
    console.log('   Reason: Better ingredient coverage will improve allergen system effectiveness');
    
    console.log('\n✅ ANALYSIS COMPLETE!');
    
  } catch (error) {
    console.error('❌ Error analyzing allergen system:', error);
  } finally {
    await sequelize.close();
  }
}

analyzeAllergenSubstituteSystem(); 