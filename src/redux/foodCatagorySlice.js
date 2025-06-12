// features/foodCategory/foodCategorySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const getFoodCategories = createAsyncThunk(
  'foodCategory/getFoodCategories',
    async () => {
      console.log('hello from foodcatagoryslice call before')
      const response = await axios.get('http://localhost:5001/api/foodCategories');
      console.log('hello from foodcatagoryslice call after')
    return response.data;
  }
);

const foodCategorySlice = createSlice({
  name: 'foodCategory',
  initialState: {
    categories: [],
    status: null
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFoodCategories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getFoodCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categories = action.payload;
      })
      .addCase(getFoodCategories.rejected, (state) => {
        state.status = 'failed';
      });
  }
});

export default foodCategorySlice.reducer;
