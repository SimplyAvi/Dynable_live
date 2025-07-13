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
    console.log('[Allergies] Starting fetchAllergens thunk');
    dispatch(setLoading(true))
    try {
        const allergens = await fetchAllergensFromDatabase()
        console.log('[Allergies] Successfully fetched allergens from database:', {
            count: Object.keys(allergens).length,
            allergens: Object.keys(allergens)
        });
        dispatch(setAllergies(allergens))
        dispatch(setError(null))
        console.log('[Allergies] Allergens set in Redux state');
    } catch (error) {
        console.error('[Allergies] Failed to fetch allergens:', error)
        dispatch(setError('Failed to load allergens'))
        // Don't set allergies on error - let component use fallback
        console.log('[Allergies] Using fallback allergens due to error');
    } finally {
        dispatch(setLoading(false))
        console.log('[Allergies] fetchAllergens thunk completed');
    }
}

export const { setAllergies, toggleAllergy, setLoading, setError } = allergiesSlice.actions
export default allergiesSlice.reducer