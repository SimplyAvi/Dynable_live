import { combineReducers } from '@reduxjs/toolkit';
import productReducer from './productSlice';
import recipeReducer from './recipeSlice'
import searchbarSlice from './searchbarSlice'
import foodCategoryReducer from './foodCatagorySlice';

// Import other reducers as needed

const rootReducer = combineReducers({
  products: productReducer,
  recipes: recipeReducer,
  searchbar: searchbarSlice,
  foodCategory: foodCategoryReducer
  // Add other slices/reducers here
});

export default rootReducer;
