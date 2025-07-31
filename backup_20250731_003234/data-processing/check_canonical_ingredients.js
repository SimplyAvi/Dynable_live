const { CanonicalIngredient } = require('./server/db/models');

async function checkCanonicalIngredients() {
    console.log('🔍 Checking Canonical Ingredients Database\n');

    try {
        // Get all canonical ingredients
        const canonicalIngredients = await CanonicalIngredient.findAll();
        
        console.log(`📊 Total canonical ingredients: ${canonicalIngredients.length}\n`);
        
        // Check for basic ingredients
        const basicIngredients = ['sugar', 'flour', 'salt', 'milk', 'butter', 'oil', 'egg', 'eggs'];
        
        console.log('🔍 Checking for basic ingredients:');
        for (const basic of basicIngredients) {
            const matches = canonicalIngredients.filter(ci => 
                ci.name.toLowerCase().includes(basic.toLowerCase()) ||
                (ci.aliases && ci.aliases.some(alias => alias.toLowerCase().includes(basic.toLowerCase())))
            );
            
            console.log(`   ${basic}: ${matches.length} matches`);
            if (matches.length > 0) {
                matches.forEach(match => {
                    console.log(`     - ${match.name} (aliases: ${match.aliases?.join(', ') || 'none'})`);
                });
            }
        }
        
        // Show some sample canonical ingredients
        console.log('\n📋 Sample canonical ingredients:');
        canonicalIngredients.slice(0, 20).forEach(ci => {
            console.log(`   - ${ci.name} (aliases: ${ci.aliases?.join(', ') || 'none'})`);
        });
        
        // Check if we need to add basic ingredients
        console.log('\n🔍 Missing basic ingredients:');
        const missing = basicIngredients.filter(basic => 
            !canonicalIngredients.some(ci => 
                ci.name.toLowerCase().includes(basic.toLowerCase()) ||
                (ci.aliases && ci.aliases.some(alias => alias.toLowerCase().includes(basic.toLowerCase())))
            )
        );
        
        if (missing.length > 0) {
            console.log(`   Missing: ${missing.join(', ')}`);
            console.log('   These need to be added to the canonical ingredients database');
        } else {
            console.log('   All basic ingredients are present');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkCanonicalIngredients(); 