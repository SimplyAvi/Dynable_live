import { configureStore } from '@reduxjs/toolkit'
import productReducer from './productSlice';
import recipeReducer from './recipeSlice';
import searchbarSlice from './searchbarSlice';
import foodCategoryReducer from './foodCategorySlice';
import allergiesReducer from './allergiesSlice';
import authReducer from './authSlice';
import anonymousCartReducer from './anonymousCartSlice';
import searchPreferencesReducer from './searchPreferencesSlice';



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
    searchPreferences: searchPreferencesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});



// 🎯 DEBUG: Make store globally accessible for debugging
if (typeof window !== 'undefined') {
    window.store = store;
    
}

export default store;