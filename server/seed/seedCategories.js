const { Category, Subcategory } = require('../db/models');
const detailedCategories = require('./Data/DetailedCategories');


async function seedCategories() {
    try{
        for (const [category, subcategories] of Object.entries(detailedCategories)) {
            const [categoryRecord] = await Category.findOrCreate({ where: { CategoryName: category },logging:false });
            for (const subcategory of subcategories) {
                await Subcategory.findOrCreate({
                    where: { SubcategoryName: subcategory, CategoryID: categoryRecord.CategoryID },
                    loggin: false
                });
            }
        }
        console.log('Categories and subcategories seeded successfully.');
    } catch(error){
        console.log('error seeding categories:', error)
    }
}

module.exports = seedCategories