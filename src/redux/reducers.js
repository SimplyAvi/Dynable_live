import { combineReducers } from '@reduxjs/toolkit';
import productReducer from './productSlice';
import recipeReducer from './recipeSlice'
// Import other reducers as needed

const rootReducer = combineReducers({
  products: productReducer,
  recipes: recipeReducer,
  // Add other slices/reducers here
});

export default rootReducer;
