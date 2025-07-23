const { CanonicalIngredient } = require('./server/db/models');

async function addBasicIngredients() {
    console.log('➕ Adding Missing Basic Ingredients to Canonical Database\n');

    try {
        // Define the missing basic ingredients
        const basicIngredients = [
            {
                name: 'sugar',
                aliases: ['granulated sugar', 'white sugar', 'brown sugar', 'powdered sugar', 'confectioners sugar', 'cane sugar', 'beet sugar', 'raw sugar', 'organic sugar', 'pure sugar'],
                allergens: []
            },
            {
                name: 'oil',
                aliases: ['olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'avocado oil', 'sesame oil', 'sunflower oil', 'pure oil'],
                allergens: []
            },
            {
                name: 'eggs',
                aliases: ['egg', 'large eggs', 'fresh eggs', 'organic eggs', 'farm fresh eggs', 'chicken eggs'],
                allergens: ['egg']
            }
        ];

        let addedCount = 0;
        let skippedCount = 0;

        for (const ingredient of basicIngredients) {
            // Check if ingredient already exists
            const existing = await CanonicalIngredient.findOne({
                where: { name: ingredient.name }
            });

            if (existing) {
                console.log(`⚠️  Skipping ${ingredient.name} - already exists`);
                skippedCount++;
            } else {
                // Add the ingredient
                await CanonicalIngredient.create({
                    name: ingredient.name,
                    aliases: ingredient.aliases,
                    allergens: ingredient.allergens
                });
                console.log(`✅ Added ${ingredient.name} with aliases: ${ingredient.aliases.join(', ')}`);
                addedCount++;
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`✅ Added: ${addedCount} ingredients`);
        console.log(`⚠️  Skipped: ${skippedCount} ingredients (already existed)`);

        // Verify the additions
        console.log(`\n🔍 Verifying additions...`);
        const allIngredients = await CanonicalIngredient.findAll();
        console.log(`Total canonical ingredients: ${allIngredients.length}`);

        // Show the basic ingredients
        const basicNames = ['sugar', 'oil', 'eggs', 'flour', 'salt', 'milk', 'butter', 'egg'];
        console.log(`\n📋 Basic ingredients in database:`);
        for (const basic of basicNames) {
            const matches = allIngredients.filter(ci => 
                ci.name.toLowerCase().includes(basic.toLowerCase()) ||
                (ci.aliases && ci.aliases.some(alias => alias.toLowerCase().includes(basic.toLowerCase())))
            );
            
            if (matches.length > 0) {
                console.log(`   ✅ ${basic}: ${matches.map(m => m.name).join(', ')}`);
            } else {
                console.log(`   ❌ ${basic}: Not found`);
            }
        }

        console.log('\n🎉 Basic ingredients addition complete!');
        console.log('Now run the canonical tag suggestion script again to tag products with these ingredients.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

addBasicIngredients(); 