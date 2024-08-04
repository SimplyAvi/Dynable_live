const { Subcategory, Ingredient, Food } = require('../db/models');
const detailedCategories = require('./Data/DetailedCategories')

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
  console.time('assignSubcategoriesIngredients'); // Start the timer
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
    console.timeEnd('assignSubcategoriesIngredients');
    console.log(`${counter} Subcategories assigned to ingredients.`);
  } catch(error){
    console.error(error)
  }
  try{
    console.time('assignSubcategoriesProducts');
    let counter = 0
    const products = await Food.findAll();
    for (const product of products){
      const subcategoryID = await categorizeIngredient(product.description);
      if (subcategoryID) {
        product.SubcategoryID = subcategoryID;
        await product.save({ logging: false });
        counter++
      }
    }
    console.timeEnd('assignSubcategoriesProducts');
    console.log(`${counter} Subcategories assigned to products(Foods).`);
  } catch(error){
    console.error(error)
  }
}

module.exports = assignSubcategories