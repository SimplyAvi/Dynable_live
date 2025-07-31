const { Sequelize, DataTypes } = require('sequelize');
const config = require('./db/config.json');
const path = require('path');

// Database connection
const sequelize = new Sequelize(config.development);

// Import models
const Recipe = require('./db/models/Recipe/Recipe');
const Ingredient = require('./db/models/Recipe/RecipeIngredient');
const IngredientCategorized = require('./db/models/IngredientCategorized');
const IngredientToCanonical = require('./db/models/IngredientToCanonical');
const IngredientCategorizedAttribute = require('./db/models/IngredientCategorizedAttribute');
const IngredientCategorizedAttributeType = require('./db/models/IngredientCategorizedAttributeType');

class RecipePerfectionSystem {
    constructor() {
        this.stats = {
            totalRecipeIngredients: 0,
            mappedRecipeIngredients: 0,
            unmappedRecipeIngredients: 0,
            realProducts: 0,
            newMappings: 0,
            improvedMappings: 0
        };
    }

    async initialize() {
        console.log('🚀 RECIPE PERFECTION SYSTEM INITIALIZING...');
        
        try {
            await sequelize.authenticate();
            console.log('✅ Database connected successfully');
            
            // Sync models
            await sequelize.sync();
            console.log('✅ Database synchronized');
            
            return true;
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            return false;
        }
    }

    async getCurrentStats() {
        console.log('\n📊 ANALYZING CURRENT STATE...');
        
        // Get total ingredients
        const totalRecipeIngredients = await Ingredient.count();
        
        // Get mapped ingredients
        const mappedRecipeIngredients = await Ingredient.count({
            include: [{
                model: IngredientToCanonical,
                required: true
            }]
        });
        
        // Get ingredients with real products
        const realProducts = await Ingredient.count({
            include: [{
                model: IngredientToCanonical,
                required: true,
                include: [{
                    model: Ingredient,
                    required: true,
                    include: [{
                        model: IngredientCategorized,
                        required: true,
                        where: {
                            canonicalTag: {
                                [Sequelize.Op.ne]: null
                            }
                        }
                    }]
                }]
            }]
        });
        
        this.stats = {
            totalRecipeIngredients,
            mappedRecipeIngredients,
            unmappedRecipeIngredients: totalRecipeIngredients - mappedRecipeIngredients,
            realProducts,
            newMappings: 0,
            improvedMappings: 0
        };
        
        console.log(`📈 Current Coverage:`);
        console.log(`   Total RecipeIngredients: ${totalRecipeIngredients.toLocaleString()}`);
        console.log(`   Mapped RecipeIngredients: ${mappedRecipeIngredients.toLocaleString()} (${((mappedRecipeIngredients/totalRecipeIngredients)*100).toFixed(1)}%)`);
        console.log(`   Real Products: ${realProducts.toLocaleString()} (${((realProducts/totalRecipeIngredients)*100).toFixed(1)}%)`);
        console.log(`   Unmapped: ${(totalRecipeIngredients - mappedRecipeIngredients).toLocaleString()}`);
        
        return this.stats;
    }

    async findFrequentUnmappedRecipeIngredients(limit = 50) {
        console.log(`\n🔍 FINDING FREQUENT UNMAPPED INGREDIENTS (top ${limit})...`);
        
        const unmappedRecipeIngredients = await Ingredient.findAll({
            include: [{
                model: IngredientToCanonical,
                required: false
            }],
            where: {
                '$IngredientToCanonical.id$': null
            },
            attributes: [
                'cleanedName',
                [Sequelize.fn('COUNT', Sequelize.col('Ingredient.id')), 'frequency']
            ],
            group: ['cleanedName'],
            order: [[Sequelize.fn('COUNT', Sequelize.col('Ingredient.id')), 'DESC']],
            limit
        });
        
        console.log(`📋 Top ${unmappedRecipeIngredients.length} unmapped ingredients:`);
        unmappedRecipeIngredients.forEach((ingredient, index) => {
            console.log(`   ${index + 1}. ${ingredient.cleanedName} (${ingredient.dataValues.frequency} recipes)`);
        });
        
        return unmappedRecipeIngredients;
    }

    async addMissingCanonicalRecipeIngredients(unmappedRecipeIngredients) {
        console.log('\n🔧 ADDING MISSING CANONICAL INGREDIENTS...');
        
        const newCanonicals = [];
        
        for (const ingredient of unmappedRecipeIngredients) {
            const cleanedName = ingredient.cleanedName;
            
            // Skip if already exists
            const existing = await Ingredient.findOne({
                where: { name: cleanedName }
            });
            
            if (existing) continue;
            
            // Create new canonical ingredient
            const newCanonical = await Ingredient.create({
                name: cleanedName,
                canonicalTag: cleanedName.toLowerCase().replace(/\s+/g, '_'),
                canonicalTagConfidence: 0.8
            });
            
            newCanonicals.push(newCanonical);
            console.log(`   ✅ Created canonical: ${cleanedName}`);
        }
        
        console.log(`📝 Created ${newCanonicals.length} new canonical ingredients`);
        return newCanonicals;
    }

    async mapUnmappedRecipeIngredients(unmappedRecipeIngredients) {
        console.log('\n🔗 MAPPING UNMAPPED INGREDIENTS...');
        
        let mappedCount = 0;
        
        for (const ingredient of unmappedRecipeIngredients) {
            const cleanedName = ingredient.cleanedName;
            
            // Find canonical ingredient
            const canonical = await Ingredient.findOne({
                where: { name: cleanedName }
            });
            
            if (!canonical) {
                console.log(`   ⚠️  No canonical found for: ${cleanedName}`);
                continue;
            }
            
            // Find all ingredients with this cleaned name
            const ingredients = await Ingredient.findAll({
                where: { cleanedName },
                include: [{
                    model: IngredientToCanonical,
                    required: false
                }]
            });
            
            // Create mappings for unmapped ingredients
            for (const ing of ingredients) {
                if (ing.IngredientToCanonical) continue; // Already mapped
                
                await IngredientToCanonical.create({
                    IngredientId: ing.id,
                    IngredientId: canonical.id,
                    confidence: 0.9
                });
                
                mappedCount++;
            }
            
            console.log(`   ✅ Mapped ${ingredients.length} instances of: ${cleanedName}`);
        }
        
        console.log(`📊 Total new mappings: ${mappedCount}`);
        this.stats.newMappings += mappedCount;
        
        return mappedCount;
    }

    async improveRealProductMapping() {
        console.log('\n🏪 IMPROVING REAL PRODUCT MAPPING...');
        
        // Find canonical ingredients without real products
        const canonicalsWithoutProducts = await Ingredient.findAll({
            include: [{
                model: IngredientCategorized,
                required: false,
                where: {
                    canonicalTag: {
                        [Sequelize.Op.ne]: null
                    }
                }
            }],
            where: {
                '$IngredientCategorizeds.id$': null
            }
        });
        
        console.log(`📋 Found ${canonicalsWithoutProducts.length} canonical ingredients without real products`);
        
        let improvedCount = 0;
        
        for (const canonical of canonicalsWithoutProducts) {
            const canonicalTag = canonical.canonicalTag;
            
            // Find matching products
            const matchingProducts = await IngredientCategorized.findAll({
                where: {
                    [Sequelize.Op.or]: [
                        { canonicalTag: canonicalTag },
                        { canonicalTag: { [Sequelize.Op.like]: `%${canonicalTag}%` } },
                        { description: { [Sequelize.Op.like]: `%${canonical.name}%` } }
                    ]
                },
                limit: 5
            });
            
            if (matchingProducts.length > 0) {
                // Update canonical tag for best match
                const bestMatch = matchingProducts[0];
                await canonical.update({
                    canonicalTag: bestMatch.canonicalTag,
                    canonicalTagConfidence: 0.7
                });
                
                improvedCount++;
                console.log(`   ✅ Improved mapping for: ${canonical.name} -> ${bestMatch.canonicalTag}`);
            }
        }
        
        console.log(`📊 Improved ${improvedCount} product mappings`);
        this.stats.improvedMappings += improvedCount;
        
        return improvedCount;
    }

    async verifyAllergenFiltering() {
        console.log('\n🔍 VERIFYING ALLERGEN FILTERING...');
        
        // Test key allergens
        const allergens = ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish', 'wheat'];
        
        for (const allergen of allergens) {
            const products = await IngredientCategorized.findAll({
                include: [{
                    model: IngredientCategorizedAttribute,
                    required: true,
                    include: [{
                        model: IngredientCategorizedAttributeType,
                        required: true,
                        where: {
                            name: {
                                [Sequelize.Op.like]: `%${allergen}%`
                            }
                        }
                    }]
                }],
                limit: 5
            });
            
            console.log(`   ${allergen.toUpperCase()}: ${products.length} products found`);
        }
        
        // Test gluten specifically
        const glutenProducts = await IngredientCategorized.findAll({
            include: [{
                model: IngredientCategorizedAttribute,
                required: true,
                include: [{
                    model: IngredientCategorizedAttributeType,
                    required: true,
                    where: {
                        name: {
                            [Sequelize.Op.like]: '%gluten%'
                        }
                    }
                }]
            }],
            limit: 10
        });
        
        console.log(`\n🌾 GLUTEN PRODUCTS SAMPLE:`);
        glutenProducts.forEach(product => {
            console.log(`   - ${product.description} (${product.canonicalTag || 'no tag'})`);
        });
        
        return allergens.length;
    }

    async runComprehensiveAudit() {
        console.log('\n📋 RUNNING COMPREHENSIVE AUDIT...');
        
        // Get final stats
        const finalStats = await this.getCurrentStats();
        
        // Test a few recipes
        const testRecipes = await Recipe.findAll({
            include: [{
                model: Ingredient,
                include: [{
                    model: IngredientToCanonical,
                    include: [{
                        model: Ingredient,
                        include: [{
                            model: IngredientCategorized
                        }]
                    }]
                }]
            }],
            limit: 3
        });
        
        console.log('\n🧪 TEST RECIPES:');
        for (const recipe of testRecipes) {
            console.log(`\n📖 Recipe: ${recipe.title}`);
            console.log(`   RecipeIngredients: ${recipe.RecipeIngredients.length}`);
            
            let mappedCount = 0;
            let productCount = 0;
            
            for (const ingredient of recipe.RecipeIngredients) {
                if (ingredient.IngredientToCanonical) {
                    mappedCount++;
                    const canonical = ingredient.IngredientToCanonical.Ingredient;
                    if (canonical.IngredientCategorizeds && canonical.IngredientCategorizeds.length > 0) {
                        productCount++;
                    }
                }
            }
            
            console.log(`   Mapped: ${mappedCount}/${recipe.RecipeIngredients.length} (${((mappedCount/recipe.RecipeIngredients.length)*100).toFixed(1)}%)`);
            console.log(`   With Products: ${productCount}/${recipe.RecipeIngredients.length} (${((productCount/recipe.RecipeIngredients.length)*100).toFixed(1)}%)`);
        }
        
        return finalStats;
    }

    async execute() {
        console.log('🎯 RECIPE PERFECTION SYSTEM STARTING...\n');
        
        if (!await this.initialize()) {
            return false;
        }
        
        // Step 1: Analyze current state
        await this.getCurrentStats();
        
        // Step 2: Find frequent unmapped ingredients
        const unmappedRecipeIngredients = await this.findFrequentUnmappedRecipeIngredients(30);
        
        // Step 3: Add missing canonical ingredients
        await this.addMissingCanonicalRecipeIngredients(unmappedRecipeIngredients);
        
        // Step 4: Map unmapped ingredients
        await this.mapUnmappedRecipeIngredients(unmappedRecipeIngredients);
        
        // Step 5: Improve real product mapping
        await this.improveRealProductMapping();
        
        // Step 6: Verify allergen filtering
        await this.verifyAllergenFiltering();
        
        // Step 7: Final audit
        const finalStats = await this.runComprehensiveAudit();
        
        console.log('\n🎉 RECIPE PERFECTION COMPLETE!');
        console.log(`📊 Final Results:`);
        console.log(`   New Mappings: ${this.stats.newMappings}`);
        console.log(`   Improved Mappings: ${this.stats.improvedMappings}`);
        console.log(`   Coverage: ${((finalStats.mappedRecipeIngredients/finalStats.totalRecipeIngredients)*100).toFixed(1)}%`);
        console.log(`   Real Products: ${((finalStats.realProducts/finalStats.totalRecipeIngredients)*100).toFixed(1)}%`);
        
        return true;
    }
}

// Run the system
if (require.main === module) {
    const system = new RecipePerfectionSystem();
    system.execute()
        .then(success => {
            if (success) {
                console.log('\n✅ Recipe perfection completed successfully!');
            } else {
                console.log('\n❌ Recipe perfection failed!');
            }
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = RecipePerfectionSystem; 