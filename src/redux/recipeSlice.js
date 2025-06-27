// yourReducer.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Your initial state here
  recipesResults: {}
};

const recipeSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    // Define your actions and corresponding state changes here
    addRecipes: (state,action)=>{
        state.recipesResults = action.payload
    },
    appendRecipes: (state, action) => {
        state.recipesResults.push(...action.payload);
    }
  },
});

export const { addRecipes, appendRecipes } = recipeSlice.actions;
export default recipeSlice.reducer;
