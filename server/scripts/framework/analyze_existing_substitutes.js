const { IngredientCategorized } = require('./db/models');
const { Op } = require('sequelize');

async function analyzeExistingSubstitutes() {
  try {
    console.log('🔍 ANALYZING EXISTING PRODUCTS FOR SUBSTITUTES\n');

    // Define substitute search patterns
    const substitutePatterns = {
      'flour_substitutes': [
        'almond flour', 'coconut flour', 'oat flour', 'rice flour', 'gluten-free flour',
        'almond meal', 'coconut meal', 'oat meal', 'rice meal', 'gluten free flour',
        'almond powder', 'coconut powder', 'oat powder', 'rice powder'
      ],
      'milk_substitutes': [
        'almond milk', 'coconut milk', 'oat milk', 'soy milk', 'rice milk',
        'almond beverage', 'coconut beverage', 'oat beverage', 'soy beverage',
        'almond drink', 'coconut drink', 'oat drink', 'soy drink'
      ],
      'egg_substitutes': [
        'applesauce', 'banana', 'chia egg', 'flax egg', 'silken tofu',
        'apple sauce', 'banana puree', 'chia seed', 'flax seed', 'tofu',
        'egg replacer', 'egg substitute', 'vegan egg'
      ],
      'cheese_substitutes': [
        'nutritional yeast', 'vegan cheese', 'dairy-free cheese',
        'nutritional yeast flakes', 'vegan cheddar', 'dairy free cheese',
        'plant-based cheese', 'non-dairy cheese'
      ]
    };

    for (const [category, patterns] of Object.entries(substitutePatterns)) {
      console.log(`\n📋 ${category.toUpperCase().replace('_', ' ')}:`);
      
      for (const pattern of patterns) {
        const products = await IngredientCategorized.findAll({
          where: {
            description: {
              [Op.iLike]: `%${pattern}%`
            },
            canonicalTagConfidence: 'confident'
          },
          attributes: ['id', 'description', 'canonicalTag', 'shortDescription'],
          limit: 5
        });

        if (products.length > 0) {
          console.log(`\n✅ Found ${products.length} products matching "${pattern}":`);
          products.forEach(product => {
            console.log(`   - ${product.shortDescription || product.description.substring(0, 80)}...`);
            console.log(`     Current canonical tag: "${product.canonicalTag}"`);
          });
        } else {
          console.log(`❌ No products found for "${pattern}"`);
        }
      }
    }

    // Check for products with substitute-related keywords in description
    console.log('\n🔍 BROAD SUBSTITUTE KEYWORD SEARCH:');
    const substituteKeywords = [
      'substitute', 'replacement', 'alternative', 'vegan', 'dairy-free', 'gluten-free',
      'plant-based', 'non-dairy', 'egg-free', 'wheat-free', 'nut-free'
    ];

    for (const keyword of substituteKeywords) {
      const products = await IngredientCategorized.findAll({
        where: {
          description: {
            [Op.iLike]: `%${keyword}%`
          },
          canonicalTagConfidence: 'confident'
        },
        attributes: ['id', 'description', 'canonicalTag', 'shortDescription'],
        limit: 3
      });

      if (products.length > 0) {
        console.log(`\n✅ Found ${products.length} products with "${keyword}":`);
        products.forEach(product => {
          console.log(`   - ${product.shortDescription || product.description.substring(0, 80)}...`);
          console.log(`     Canonical tag: "${product.canonicalTag}"`);
        });
      }
    }

    // Check for products that might be substitutes based on their current canonical tags
    console.log('\n🎯 POTENTIAL SUBSTITUTES BY CURRENT CANONICAL TAGS:');
    const potentialSubstituteTags = [
      'almonds', 'coconut', 'oats', 'rice', 'soy', 'tofu', 'yeast', 'seeds'
    ];

    for (const tag of potentialSubstituteTags) {
      const products = await IngredientCategorized.findAll({
        where: {
          canonicalTag: tag,
          canonicalTagConfidence: 'confident'
        },
        attributes: ['id', 'description', 'canonicalTag', 'shortDescription'],
        limit: 3
      });

      if (products.length > 0) {
        console.log(`\n✅ Found ${products.length} products with canonical tag "${tag}":`);
        products.forEach(product => {
          console.log(`   - ${product.shortDescription || product.description.substring(0, 80)}...`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

analyzeExistingSubstitutes(); 