// yourReducer.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Your initial state here
  productsResults: {}
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.productsResults = action.payload;
    },
    appendProducts: (state, action) => {
      if (state.productsResults && state.productsResults.foods) {
        state.productsResults.foods.push(...action.payload.foods);
        state.productsResults.currentPage = action.payload.currentPage;
      } else {
        state.productsResults = action.payload;
      }
    },
    clearProducts: (state) => {
      state.productsResults = {};
    }
  },
});

export const { setProducts, appendProducts, clearProducts } = productSlice.actions;
export default productSlice.reducer;
