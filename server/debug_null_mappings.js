const { Sequelize } = require('sequelize');
const db = require('./db/database');
const { Food, CanonicalIngredient } = require('./db/models');

async function debugNullMappings() {
    console.log('🔍 DEBUGGING NULL MAPPINGS...\n');
    
    try {
        // Check what canonical ingredients we have
        const canonicals = await db.query(`
            SELECT id, name, aliases
            FROM "CanonicalIngredients" 
            ORDER BY id
            LIMIT 10
        `, { type: Sequelize.QueryTypes.SELECT });
        
        console.log('📋 SAMPLE CANONICAL INGREDIENTS:');
        canonicals.forEach(c => {
            console.log(`   ID: ${c.id}, Name: "${c.name}", Aliases: ${JSON.stringify(c.aliases)}`);
        });
        
        // Check what Food products we have
        const foods = await db.query(`
            SELECT id, description, "canonicalTag"
            FROM "Food" 
            WHERE "canonicalTag" IS NOT NULL
            ORDER BY id
            LIMIT 10
        `, { type: Sequelize.QueryTypes.SELECT });
        
        console.log('\n📋 SAMPLE FOOD PRODUCTS WITH CANONICAL TAGS:');
        foods.forEach(f => {
            console.log(`   ID: ${f.id}, Description: "${f.description}", CanonicalTag: "${f.canonicalTag}"`);
        });
        
        // Check products without canonical tags
        const foodsWithoutTags = await db.query(`
            SELECT id, description, "canonicalTag"
            FROM "Food" 
            WHERE "canonicalTag" IS NULL
            ORDER BY id
            LIMIT 10
        `, { type: Sequelize.QueryTypes.SELECT });
        
        console.log('\n📋 SAMPLE FOOD PRODUCTS WITHOUT CANONICAL TAGS:');
        foodsWithoutTags.forEach(f => {
            console.log(`   ID: ${f.id}, Description: "${f.description}", CanonicalTag: ${f.canonicalTag}`);
        });
        
        // Test the matching logic
        console.log('\n🧪 TESTING MATCHING LOGIC:');
        
        const testCanonical = 'salt';
        console.log(`   Testing canonical: "${testCanonical}"`);
        
        const matchingProducts = await Food.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { canonicalTag: testCanonical },
                    { canonicalTag: { [Sequelize.Op.like]: `%${testCanonical}%` } },
                    { description: { [Sequelize.Op.like]: `%${testCanonical}%` } }
                ]
            },
            limit: 5
        });
        
        console.log(`   Found ${matchingProducts.length} matching products:`);
        matchingProducts.forEach(product => {
            console.log(`     - Description: "${product.description}"`);
            console.log(`     - CanonicalTag: "${product.canonicalTag || 'NULL'}"`);
        });
        
        // Check what happens when we try to access canonicalTag
        if (matchingProducts.length > 0) {
            const bestMatch = matchingProducts[0];
            console.log(`\n   Best match canonicalTag: "${bestMatch.canonicalTag || 'NULL'}"`);
            console.log(`   This is why you see "-> null" in the output!`);
        }
        
        // Check the actual data distribution
        const tagStats = await db.query(`
            SELECT 
                COUNT(*) as total_products,
                COUNT("canonicalTag") as products_with_tags,
                COUNT(*) - COUNT("canonicalTag") as products_without_tags
            FROM "Food"
        `, { type: Sequelize.QueryTypes.SELECT });
        
        console.log('\n📊 CANONICAL TAG STATISTICS:');
        console.log(`   Total Products: ${tagStats[0].total_products}`);
        console.log(`   Products with Canonical Tags: ${tagStats[0].products_with_tags}`);
        console.log(`   Products without Canonical Tags: ${tagStats[0].products_without_tags}`);
        console.log(`   Percentage with tags: ${((tagStats[0].products_with_tags/tagStats[0].total_products)*100).toFixed(1)}%`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debugNullMappings()
    .then(() => {
        console.log('\n✅ Debug complete!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Debug failed:', error);
        process.exit(1);
    }); 