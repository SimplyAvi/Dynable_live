import { createSlice } from '@reduxjs/toolkit'
import allergenList from '../allergensList'

const initialState = {
    allergies: {
        ...allergenList
    }
}

const allergiesSlice = createSlice({
    name: 'allergies',
    initialState,
    reducers: {
        setAllergies: (state, action) => {
            state.allergies = action.payload
        },
    },
})

export const { setAllergies } = allergiesSlice.actions
export default allergiesSlice.reducer