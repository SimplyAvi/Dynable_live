import { createSlice } from '@reduxjs/toolkit'
import { fetchAllergensFromDatabase } from '../allergensList'

const initialState = {
    allergies: {},
    loading: false,
    error: null
}

const allergiesSlice = createSlice({
    name: 'allergies',
    initialState,
    reducers: {
        setAllergies: (state, action) => {
            state.allergies = action.payload
        },
        toggleAllergy: (state, action) => {
            const allergen = action.payload
            // Ensure the allergen exists in the state before toggling
            if (allergen in state.allergies) {
                state.allergies[allergen] = !state.allergies[allergen]
            } else {
                console.warn(`[Allergies] Attempted to toggle unknown allergen: ${allergen}`)
            }
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        }
    }
})

// Thunk to fetch allergens from database
export const fetchAllergens = () => async (dispatch) => {
    dispatch(setLoading(true))
    try {
        const allergens = await fetchAllergensFromDatabase()
        console.log('[Allergies] Setting allergens in Redux:', Object.keys(allergens))
        dispatch(setAllergies(allergens))
        dispatch(setError(null))
    } catch (error) {
        console.error('Failed to fetch allergens:', error)
        dispatch(setError('Failed to load allergens'))
        // Don't set allergies on error - let component use fallback
    } finally {
        dispatch(setLoading(false))
    }
}

export const { setAllergies, toggleAllergy, setLoading, setError } = allergiesSlice.actions
export default allergiesSlice.reducer