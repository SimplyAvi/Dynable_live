import { combineReducers } from '@reduxjs/toolkit';
import productReducer from './productSlice';
import recipeReducer from './recipeSlice'
import searchbarSlice from './searchbarSlice'
// Import other reducers as needed

const rootReducer = combineReducers({
  products: productReducer,
  recipes: recipeReducer,
  searchbar: searchbarSlice,
  // Add other slices/reducers here
});

export default rootReducer;
