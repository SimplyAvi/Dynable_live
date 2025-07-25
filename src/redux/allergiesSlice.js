import { createSlice } from '@reduxjs/toolkit'
import { fetchAllergensFromDatabase, fetchAllergensFromDatabasePure } from '../allergensList'

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

/**
 * PURE SUPABASE TESTING THUNK - No fallback logic
 * Use this for testing the Supabase-first approach
 * This will throw an error if Supabase fails
 * No fallback to hardcoded allergens
 */
export const fetchAllergensPure = () => async (dispatch) => {
    console.log('[Allergies PURE] Starting fetchAllergensPure thunk (no fallback)...');
    dispatch(setLoading(true))
    dispatch(setError(null))
    
    try {
        const allergens = await fetchAllergensFromDatabasePure()
        console.log('[Allergies PURE] Successfully fetched allergens from Supabase:', {
            count: Object.keys(allergens).length,
            allergens: Object.keys(allergens)
        });
        dispatch(setAllergies(allergens))
        console.log('[Allergies PURE] Allergens set in Redux state');
    } catch (error) {
        console.error('[Allergies PURE] Failed to fetch allergens from Supabase:', error)
        dispatch(setError(`Supabase query failed: ${error.message}`))
        // Don't set any allergens - let the error show
        console.log('[Allergies PURE] No fallback - error will be displayed to user');
    } finally {
        dispatch(setLoading(false))
        console.log('[Allergies PURE] fetchAllergensPure thunk completed');
    }
}

// Thunk to fetch allergens from database (with fallback)
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