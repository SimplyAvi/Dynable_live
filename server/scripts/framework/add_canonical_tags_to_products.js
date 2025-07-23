const { Sequelize } = require('sequelize');
const db = require('./db/database');
const { IngredientCategorized, Ingredient } = require('./db/models');

async function addCanonicalTagsToProducts() {
    console.log('🏷️ ADDING CANONICAL TAGS TO PRODUCTS...\n');
    
    try {
        // Get products without canonical tags
        const productsWithoutTags = await db.query(`
            SELECT id, description, "canonicalTag"
            FROM "IngredientCategorized" 
            WHERE "canonicalTag" IS NULL
            LIMIT 1000
        `, { type: Sequelize.QueryTypes.SELECT });
        
        console.log(`📋 Found ${productsWithoutTags.length} products without canonical tags`);
        
        let updatedCount = 0;
        let noMatchCount = 0;
        
        for (const product of productsWithoutTags) {
            const description = product.description.toLowerCase();
            
            // Try to find a matching canonical ingredient
            const matchingCanonical = await db.query(`
                SELECT id, name
                FROM "CanonicalRecipeIngredients" 
                WHERE (
                    LOWER(:description) LIKE '%' || LOWER(name) || '%'
                    OR LOWER(name) LIKE '%' || LOWER(:description) || '%'
                )
                LIMIT 1
            `, {
                replacements: { description },
                type: Sequelize.QueryTypes.SELECT
            });
            
            if (matchingCanonical.length > 0) {
                const canonical = matchingCanonical[0];
                
                // Update the product with the canonical tag
                await db.query(`
                    UPDATE "IngredientCategorized" 
                    SET "canonicalTag" = :canonicalName
                    WHERE id = :productId
                `, {
                    replacements: { 
                        canonicalName: canonical.name,
                        productId: product.id 
                    }
                });
                
                updatedCount++;
                console.log(`   ✅ Updated: "${product.description}" -> ${canonical.name}`);
            } else {
                noMatchCount++;
                if (noMatchCount <= 10) { // Only show first 10 for brevity
                    console.log(`   ❌ No match for: "${product.description}"`);
                }
            }
        }
        
        console.log(`\n📊 SUMMARY:`);
        console.log(`   Products updated with canonical tags: ${updatedCount}`);
        console.log(`   Products without matches: ${noMatchCount}`);
        console.log(`   Success rate: ${((updatedCount/(updatedCount+noMatchCount))*100).toFixed(1)}%`);
        
        // Check the new statistics
        const newStats = await db.query(`
            SELECT 
                COUNT(*) as total_products,
                COUNT("canonicalTag") as products_with_tags,
                COUNT(*) - COUNT("canonicalTag") as products_without_tags
            FROM "IngredientCategorized"
        `, { type: Sequelize.QueryTypes.SELECT });
        
        console.log(`\n📈 NEW CANONICAL TAG STATISTICS:`);
        console.log(`   Total Products: ${newStats[0].total_products}`);
        console.log(`   Products with Canonical Tags: ${newStats[0].products_with_tags}`);
        console.log(`   Products without Canonical Tags: ${newStats[0].products_without_tags}`);
        console.log(`   Percentage with tags: ${((newStats[0].products_with_tags/newStats[0].total_products)*100).toFixed(1)}%`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

addCanonicalTagsToProducts()
    .then(() => {
        console.log('\n✅ Canonical tag addition complete!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Canonical tag addition failed:', error);
        process.exit(1);
    }); 