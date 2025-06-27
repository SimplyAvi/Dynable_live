const {Food} = require('../db/models')

const allergenKeywords = {
    "Milk": ['milk', 'cheese', 'yogurt', 'casein', 'whey', 'lactose', 'cream', 'butter'],
    "Eggs": ['egg', 'mayonnaise'],
    "Fish": ['fish', 'tuna', 'salmon', 'cod', 'anchovy'],
    "Shellfish": ['shellfish', 'shrimp', 'crab', 'lobster', 'clam', 'oyster', 'mussel'],
    "Tree Nuts": ['tree nut', 'almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut', 'macadamia'],
    "Peanuts": ['peanut'],
    "Wheat": ['wheat', 'flour', 'semolina', 'durum', 'farina', 'graham', 'bread', 'breadcrumb', 'breading'],
    "Soy": ['soy', 'soybean', 'tofu', 'edamame', 'miso', 'tempeh'],
    "Sesame": ['sesame'],
    "Gluten": ['gluten', 'wheat', 'barley', 'rye', 'malt', 'bread', 'breadcrumb', 'breading'],
    "Corn": ['corn', 'maize', 'grits', 'polenta'],
    "Pork": ['pork', 'bacon', 'ham', 'sausage'],
    "Beef": ['beef', 'steak', 'veal'],
    "Chicken": ['chicken']
};

const allergenExceptions = {
    "Gluten": ['gluten-free', 'gluten free'],
    "Wheat": ['wheat-free', 'wheat free', 'gluten-free', 'gluten free'],
    "Milk": ['dairy-free', 'dairy free', 'milk-free', 'milk free'],
    "Soy": ['soy-free', 'soy free'],
    "Peanuts": ['peanut-free', 'peanut free'],
    "Tree Nuts": ['nut-free', 'nut free'],
    "Eggs": ['egg-free', 'egg free']
};

async function addAllergenTags() {
    console.time('updateAllergens');
    try {
        const foodItems = await Food.findAll({
            attributes: ['id', 'ingredients', 'description', 'allergens']
        });

        console.log(`Found ${foodItems.length} food items to process.`);
        let updatedCount = 0;

        for (let food of foodItems) {
            const ingredientsText = (food.ingredients || '').toLowerCase();
            const descriptionText = (food.description || '').toLowerCase();
            const combinedText = `${ingredientsText} ${descriptionText}`;
            
            const detectedAllergens = new Set(food.allergens || []);

            for (const [allergen, keywords] of Object.entries(allergenKeywords)) {
                const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'i');
                if (keywordRegex.test(combinedText)) {
                    const exceptions = allergenExceptions[allergen];
                    if (exceptions) {
                        const exceptionRegex = new RegExp(`\\b(${exceptions.join('|')})\\b`, 'i');
                        if (exceptionRegex.test(combinedText)) {
                            continue;
                        }
                    }
                    detectedAllergens.add(allergen);
                }
            }
            
            const newAllergens = Array.from(detectedAllergens);

            if (JSON.stringify(food.allergens) !== JSON.stringify(newAllergens)) {
                food.allergens = newAllergens;
                await food.save({ logging: false });
                updatedCount++;
            }
        }

        console.log(`Allergen tagging complete. ${updatedCount} items were updated.`);
    } catch (err) {
        console.error('Error updating allergen tags:', err);
    }
    console.timeEnd('updateAllergens');
}

module.exports = addAllergenTags;

