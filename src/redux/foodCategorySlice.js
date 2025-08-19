// features/foodCategory/foodCategorySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const getFoodCategories = createAsyncThunk(
  'foodCategory/getFoodCategories',
    async () => {
      
      // TEMPORARILY DISABLED FOR PURE SUPABASE TESTING
      // const response = await axios.get('http://process.env.API_URL || 'localhost:5001'/api/foodCategories');
      
      // return response.data;
      
      
      return []; // Return empty array for now
  }
);

export const fetchFoodCategories = () => async (dispatch) => {
    try {
        // TEMPORARILY DISABLED FOR PURE SUPABASE TESTING
        // const response = await axios.get('http://process.env.API_URL || 'localhost:5001'/api/foodCategories');
        // dispatch(setFoodCategories(response.data));
        
        
    } catch (error) {
        console.error('Error fetching food categories:', error);
    }
};

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
