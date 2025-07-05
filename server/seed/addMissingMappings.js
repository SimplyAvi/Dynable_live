const { IngredientToCanonical, CanonicalIngredient } = require('../db/models');
const sequelize = require('../db/database');

async function addMissingMappings() {
    console.log('🔗 Adding Missing Ingredient Mappings\n');

    try {
        await sequelize.sync({ force: false });

        // Get canonical ingredients
        const yeast = await CanonicalIngredient.findOne({ where: { name: 'yeast' } });
        const water = await CanonicalIngredient.findOne({ where: { name: 'water' } });
        const mozzarella = await CanonicalIngredient.findOne({ where: { name: 'mozzarella cheese' } });
        const cookingSpray = await CanonicalIngredient.findOne({ where: { name: 'cooking spray' } });

        // Define missing mappings
        const missingMappings = [
            // Yeast mappings
            { messyName: 'envelopes fleischmann\'s® rapidrise yeast', canonicalId: yeast?.id },
            { messyName: 'rapidrise yeast', canonicalId: yeast?.id },
            { messyName: 'fleischmann\'s yeast', canonicalId: yeast?.id },
            { messyName: 'active dry yeast', canonicalId: yeast?.id },
            { messyName: 'instant yeast', canonicalId: yeast?.id },
            { messyName: 'bread yeast', canonicalId: yeast?.id },
            { messyName: 'baking yeast', canonicalId: yeast?.id },
            
            // Water mappings
            { messyName: 'very warm water', canonicalId: water?.id },
            { messyName: 'warm water', canonicalId: water?.id },
            { messyName: 'hot water', canonicalId: water?.id },
            { messyName: 'boiling water', canonicalId: water?.id },
            { messyName: 'cold water', canonicalId: water?.id },
            
            // Mozzarella mappings
            { messyName: 'shredded mozzarella cheese', canonicalId: mozzarella?.id },
            { messyName: 'mozzarella cheese', canonicalId: mozzarella?.id },
            { messyName: 'fresh mozzarella', canonicalId: mozzarella?.id },
            { messyName: 'mozzarella', canonicalId: mozzarella?.id },
            
            // Cooking spray mappings
            { messyName: 'pure® cooking spray', canonicalId: cookingSpray?.id },
            { messyName: 'cooking spray', canonicalId: cookingSpray?.id },
            { messyName: 'non-stick cooking spray', canonicalId: cookingSpray?.id },
            { messyName: 'vegetable cooking spray', canonicalId: cookingSpray?.id },
            { messyName: 'canola cooking spray', canonicalId: cookingSpray?.id }
        ];

        let addedCount = 0;
        let skippedCount = 0;

        for (const mapping of missingMappings) {
            if (!mapping.canonicalId) {
                console.log(`⚠️  Skipping "${mapping.messyName}" - canonical ingredient not found`);
                skippedCount++;
                continue;
            }

            // Check if mapping already exists
            const existing = await IngredientToCanonical.findOne({
                where: { messyName: mapping.messyName }
            });

            if (existing) {
                console.log(`⚠️  Skipping "${mapping.messyName}" - already exists`);
                skippedCount++;
            } else {
                // Add the mapping
                await IngredientToCanonical.create({
                    messyName: mapping.messyName,
                    CanonicalIngredientId: mapping.canonicalId
                });
                console.log(`✅ Added mapping: "${mapping.messyName}"`);
                addedCount++;
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`✅ Added: ${addedCount} mappings`);
        console.log(`⚠️  Skipped: ${skippedCount} mappings`);

        // Verify the additions
        console.log(`\n🔍 Verifying additions...`);
        const testIngredients = [
            'envelopes fleischmann\'s® rapidrise yeast',
            'very warm water',
            'shredded mozzarella cheese',
            'pure® cooking spray'
        ];

        for (const testIngredient of testIngredients) {
            const mapping = await IngredientToCanonical.findOne({
                where: { messyName: testIngredient },
                include: [CanonicalIngredient]
            });
            
            if (mapping) {
                console.log(`   ✅ "${testIngredient}" → "${mapping.CanonicalIngredient.name}"`);
            } else {
                console.log(`   ❌ "${testIngredient}" → No mapping found`);
            }
        }

        console.log('\n🎉 Missing mappings addition complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
    }
}

addMissingMappings(); 