import { configureStore } from '@reduxjs/toolkit'
import productReducer from './productSlice';
import recipeReducer from './recipeSlice';
import searchbarSlice from './searchbarSlice';
import foodCategoryReducer from './foodCatagorySlice';
import allergiesReducer from './allergiesSlice';
import authReducer from './authSlice';
import anonymousCartReducer from './anonymousCartSlice';

console.log('[STORE] Creating Redux store...');

// Remove redux-persist since we're using Supabase for persistence
const store = configureStore({
  reducer: {
    products: productReducer,
    recipes: recipeReducer,
    searchbar: searchbarSlice,
    foodCategory: foodCategoryReducer,
    allergies: allergiesReducer,
    auth: authReducer,
    anonymousCart: anonymousCartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

console.log('[STORE] Redux store created successfully');
console.log('[STORE] Initial state:', store.getState());

export default store;