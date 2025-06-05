import { combineReducers } from '@reduxjs/toolkit';
import productReducer from './productSlice';
import recipeReducer from './recipeSlice'
import searchbarSlice from './searchbarSlice'
import foodCategoryReducer from './foodCatagorySlice';
import allergiesReducer from './allergiesSlice'

// Import other reducers as needed

const rootReducer = combineReducers({
  products: productReducer,
  recipes: recipeReducer,
  searchbar: searchbarSlice,
  foodCategory: foodCategoryReducer,
  allergies: allergiesReducer,
  // Add other slices/reducers here
});

export default rootReducer;
