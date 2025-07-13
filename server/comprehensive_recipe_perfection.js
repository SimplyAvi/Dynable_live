const { Sequelize, DataTypes } = require('sequelize');
const config = require('./db/config.json');
const path = require('path');

// Database connection
const sequelize = new Sequelize(config.development);

// Import models
const Recipe = require('./db/models/Recipe/Recipe');
const Ingredient = require('./db/models/Recipe/Ingredient');
const Food = require('./db/models/Food');
const IngredientToCanonical = require('./db/models/IngredientToCanonical');
const CanonicalIngredient = require('./db/models/CanonicalIngredient');
const FoodAttribute = require('./db/models/FoodAttribute');
const FoodAttributeType = require('./db/models/FoodAttributeType');

class RecipePerfectionSystem {
    constructor() {
        this.stats = {
            totalIngredients: 0,
            mappedIngredients: 0,
            unmappedIngredients: 0,
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
        const totalIngredients = await Ingredient.count();
        
        // Get mapped ingredients
        const mappedIngredients = await Ingredient.count({
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
                    model: CanonicalIngredient,
                    required: true,
                    include: [{
                        model: Food,
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
            totalIngredients,
            mappedIngredients,
            unmappedIngredients: totalIngredients - mappedIngredients,
            realProducts,
            newMappings: 0,
            improvedMappings: 0
        };
        
        console.log(`📈 Current Coverage:`);
        console.log(`   Total Ingredients: ${totalIngredients.toLocaleString()}`);
        console.log(`   Mapped Ingredients: ${mappedIngredients.toLocaleString()} (${((mappedIngredients/totalIngredients)*100).toFixed(1)}%)`);
        console.log(`   Real Products: ${realProducts.toLocaleString()} (${((realProducts/totalIngredients)*100).toFixed(1)}%)`);
        console.log(`   Unmapped: ${(totalIngredients - mappedIngredients).toLocaleString()}`);
        
        return this.stats;
    }

    async findFrequentUnmappedIngredients(limit = 50) {
        console.log(`\n🔍 FINDING FREQUENT UNMAPPED INGREDIENTS (top ${limit})...`);
        
        const unmappedIngredients = await Ingredient.findAll({
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
        
        console.log(`📋 Top ${unmappedIngredients.length} unmapped ingredients:`);
        unmappedIngredients.forEach((ingredient, index) => {
            console.log(`   ${index + 1}. ${ingredient.cleanedName} (${ingredient.dataValues.frequency} recipes)`);
        });
        
        return unmappedIngredients;
    }

    async addMissingCanonicalIngredients(unmappedIngredients) {
        console.log('\n🔧 ADDING MISSING CANONICAL INGREDIENTS...');
        
        const newCanonicals = [];
        
        for (const ingredient of unmappedIngredients) {
            const cleanedName = ingredient.cleanedName;
            
            // Skip if already exists
            const existing = await CanonicalIngredient.findOne({
                where: { name: cleanedName }
            });
            
            if (existing) continue;
            
            // Create new canonical ingredient
            const newCanonical = await CanonicalIngredient.create({
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

    async mapUnmappedIngredients(unmappedIngredients) {
        console.log('\n🔗 MAPPING UNMAPPED INGREDIENTS...');
        
        let mappedCount = 0;
        
        for (const ingredient of unmappedIngredients) {
            const cleanedName = ingredient.cleanedName;
            
            // Find canonical ingredient
            const canonical = await CanonicalIngredient.findOne({
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
                    CanonicalIngredientId: canonical.id,
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
        const canonicalsWithoutProducts = await CanonicalIngredient.findAll({
            include: [{
                model: Food,
                required: false,
                where: {
                    canonicalTag: {
                        [Sequelize.Op.ne]: null
                    }
                }
            }],
            where: {
                '$Foods.id$': null
            }
        });
        
        console.log(`📋 Found ${canonicalsWithoutProducts.length} canonical ingredients without real products`);
        
        let improvedCount = 0;
        
        for (const canonical of canonicalsWithoutProducts) {
            const canonicalTag = canonical.canonicalTag;
            
            // Find matching products
            const matchingProducts = await Food.findAll({
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
            const products = await Food.findAll({
                include: [{
                    model: FoodAttribute,
                    required: true,
                    include: [{
                        model: FoodAttributeType,
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
        const glutenProducts = await Food.findAll({
            include: [{
                model: FoodAttribute,
                required: true,
                include: [{
                    model: FoodAttributeType,
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
                        model: CanonicalIngredient,
                        include: [{
                            model: Food
                        }]
                    }]
                }]
            }],
            limit: 3
        });
        
        console.log('\n🧪 TEST RECIPES:');
        for (const recipe of testRecipes) {
            console.log(`\n📖 Recipe: ${recipe.title}`);
            console.log(`   Ingredients: ${recipe.Ingredients.length}`);
            
            let mappedCount = 0;
            let productCount = 0;
            
            for (const ingredient of recipe.Ingredients) {
                if (ingredient.IngredientToCanonical) {
                    mappedCount++;
                    const canonical = ingredient.IngredientToCanonical.CanonicalIngredient;
                    if (canonical.Foods && canonical.Foods.length > 0) {
                        productCount++;
                    }
                }
            }
            
            console.log(`   Mapped: ${mappedCount}/${recipe.Ingredients.length} (${((mappedCount/recipe.Ingredients.length)*100).toFixed(1)}%)`);
            console.log(`   With Products: ${productCount}/${recipe.Ingredients.length} (${((productCount/recipe.Ingredients.length)*100).toFixed(1)}%)`);
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
        const unmappedIngredients = await this.findFrequentUnmappedIngredients(30);
        
        // Step 3: Add missing canonical ingredients
        await this.addMissingCanonicalIngredients(unmappedIngredients);
        
        // Step 4: Map unmapped ingredients
        await this.mapUnmappedIngredients(unmappedIngredients);
        
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
        console.log(`   Coverage: ${((finalStats.mappedIngredients/finalStats.totalIngredients)*100).toFixed(1)}%`);
        console.log(`   Real Products: ${((finalStats.realProducts/finalStats.totalIngredients)*100).toFixed(1)}%`);
        
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