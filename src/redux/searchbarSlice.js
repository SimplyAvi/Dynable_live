// yourReducer.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Your initial state here
  searchbar: ''
};

const searchbarSlice = createSlice({
  name: 'searchbar',
  initialState,
  reducers: {
    // Define your actions and corresponding state changes here
    setSearchbarValue: (state,action)=>{
        state.searchbar = action.payload
    }
  },
});

export const { setSearchbarValue } = searchbarSlice.actions;
export default searchbarSlice.reducer;
