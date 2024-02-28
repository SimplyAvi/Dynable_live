// yourReducer.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Your initial state here
  productsResults: []
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Define your actions and corresponding state changes here
    addProducts: (state,action)=>{
        state.productsResults.push(action.payload)
    }
  },
});

export const { addProducts } = productsSlice.actions;
export default productsSlice.reducer;
