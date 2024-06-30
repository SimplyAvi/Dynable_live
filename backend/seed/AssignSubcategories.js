const { Subcategory, Ingredient } = require('../db/models');
const detailedCategories = require('../seed/Data/DetailedCategories')

async function categorizeIngredient(name) {
  for (const [category, subcategories] of Object.entries(detailedCategories)) {
    for (const subcategory of subcategories) {
      if (name.toLowerCase().includes(subcategory)) {
        const subcategoryRecord = await Subcategory.findOne({ where: { SubcategoryName: subcategory }, logging:false });
        return subcategoryRecord ? subcategoryRecord.SubcategoryID : null;
      }
    }
  }
  return null;
}

async function assignSubcategories() {
  try{
    let counter = 0
    const ingredients = await Ingredient.findAll();
    for (const ingredient of ingredients) {
      const subcategoryID = await categorizeIngredient(ingredient.name);
      if (subcategoryID) {
        ingredient.SubcategoryID = subcategoryID;
        await ingredient.save({ logging: false });
        counter++
      }
    }
    console.log(`${counter} Subcategories assigned to ingredients.`);
  } catch(error){
    console.error(error)
  }
}

module.exports = assignSubcategories