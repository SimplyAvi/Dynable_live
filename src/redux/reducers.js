import { combineReducers } from '@reduxjs/toolkit';
import productReducer from './productSlice';
import recipeReducer from './recipeSlice'
import searchbarSlice from './searchbarSlice'
import foodCategoryReducer from './foodCatagorySlice';
import allergiesReducer from './allergiesSlice'
import authReducer from './authSlice';
// Removed cartReducer since we're using anonymousCartSlice now

// Import other reducers as needed

const rootReducer = combineReducers({
  products: productReducer,
  recipes: recipeReducer,
  searchbar: searchbarSlice,
  foodCategory: foodCategoryReducer,
  allergies: allergiesReducer,
  auth: authReducer,
  // Removed cart: cartReducer since we're using anonymousCart now
  // Add other slices/reducers here
});

export default rootReducer;
