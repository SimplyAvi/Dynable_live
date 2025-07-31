const Ingredient = require('../db/models/Ingredient');
const { database } = require('../db/database');

async function addMissingSubstituteRecipeIngredients() {
    console.log('🔧 Adding Missing Substitute RecipeIngredients...\n');

    const missingRecipeIngredients = [
        {
            name: 'rice flour',
            aliases: ['white rice flour', 'brown rice flour', 'sweet rice flour', 'glutinous rice flour'],
            allergens: []
        },
        {
            name: 'almond flour',
            aliases: ['blanched almond flour'],
            allergens: ['tree nuts', 'almonds']
        },
        {
            name: 'coconut flour',
            aliases: [],
            allergens: ['tree nuts', 'coconut']
        },
        {
            name: 'oat flour',
            aliases: ['rolled oat flour'],
            allergens: []
        },
        {
            name: 'gluten-free flour blend',
            aliases: ['gluten free flour blend', 'gf flour blend', 'gluten-free flour', 'gluten free flour'],
            allergens: []
        },
        {
            name: 'soy milk',
            aliases: ['soy beverage'],
            allergens: ['soy']
        },
        {
            name: 'oat milk',
            aliases: ['oat beverage'],
            allergens: []
        },
        {
            name: 'coconut milk',
            aliases: ['coconut beverage'],
            allergens: ['tree nuts', 'coconut']
        },
        {
            name: 'tempeh',
            aliases: ['soy tempeh'],
            allergens: ['soy']
        },
        {
            name: 'sunflower seeds',
            aliases: ['sunflower seed'],
            allergens: []
        },
        {
            name: 'pumpkin seeds',
            aliases: ['pumpkin seed', 'pepitas'],
            allergens: []
        },
        {
            name: 'sunflower seed butter',
            aliases: ['sunflower butter'],
            allergens: []
        },
        {
            name: 'soy nut butter',
            aliases: ['soynut butter'],
            allergens: ['soy']
        },
        {
            name: 'chickpeas',
            aliases: ['garbanzo beans'],
            allergens: []
        },
        {
            name: 'lentils',
            aliases: ['red lentils', 'green lentils', 'brown lentils'],
            allergens: []
        },
        {
            name: 'poppy seeds',
            aliases: ['blue poppy seeds'],
            allergens: []
        },
        {
            name: 'flax egg',
            aliases: ['ground flax seed', 'flaxseed'],
            allergens: []
        },
        {
            name: 'chia egg',
            aliases: ['chia seeds'],
            allergens: []
        },
        {
            name: 'banana',
            aliases: ['bananas'],
            allergens: []
        },
        {
            name: 'applesauce',
            aliases: ['apple sauce'],
            allergens: []
        },
        {
            name: 'psyllium husk',
            aliases: ['psyllium'],
            allergens: []
        }
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const ingredient of missingRecipeIngredients) {
        try {
            // Check if ingredient already exists
            const existing = await Ingredient.findOne({
                where: { name: ingredient.name }
            });

            if (existing) {
                console.log(`⏭️  Skipped "${ingredient.name}" - already exists`);
                skippedCount++;
                continue;
            }

            // Create new canonical ingredient
            await Ingredient.create({
                name: ingredient.name,
                aliases: ingredient.aliases,
                allergens: ingredient.allergens
            });

            console.log(`✅ Added "${ingredient.name}" with ${ingredient.aliases.length} aliases`);
            addedCount++;
        } catch (error) {
            console.log(`❌ Error adding "${ingredient.name}":`, error.message);
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Added: ${addedCount} ingredients`);
    console.log(`⏭️  Skipped: ${skippedCount} ingredients (already exist)`);
    console.log(`🎉 Missing substitute ingredients added successfully!`);
}

// Run the script
addMissingSubstituteRecipeIngredients()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }); 