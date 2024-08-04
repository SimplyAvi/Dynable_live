const {Food} = require('../db/models')

const allergenList = {
    milk: "Milk",
    eggs: "Eggs",
    fish: "Fish",
    shellfish: "Shellfish",
    treeNuts: "Tree Nuts",
    peanuts: "Peanuts",
    wheat: "Wheat",
    soy: "Soy",
    sesame: "Sesame",
    gluten: "Gluten",
    corn: "Corn",
    citrusFruits: "Citrus Fruits",
    strawberries: "Strawberries",
    tomatoes: "Tomatoes",
    chocolate: "Chocolate",
    mustard: "Mustard",
    celery: "Celery",
    garlic: "Garlic",
    onions: "Onions",
    pork: "Pork",
    beef: "Beef",
    chicken: "Chicken",
    apples: "Apples",
    peaches: "Peaches",
    bananas: "Bananas",
    avocados: "Avocados",
    kiwi: "Kiwi"
};

async function addAllergenTags() {
    console.time('allergens')
    try{
        const foodItems = await Food.findAll();

    for (let food of foodItems) {
        const ingredients = food.ingredients.toLowerCase(); // Assuming ingredients are in a field named 'ingredients'
        const detectedAllergens = [];

        for (let key in allergenList) {
            if (ingredients.includes(key.toLowerCase()) || ingredients.includes(allergenList[key].toLowerCase())) {
                detectedAllergens.push(allergenList[key]);
            }
        }

        food.allergens = detectedAllergens;
        await food.save({logging:false});
    }
        console.log('Allergen tags added to food items.');
    } catch (err){
        console.error(err)
    }
    console.timeEnd('allergens')
}

module.exports = addAllergenTags

