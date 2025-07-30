/**
 * Search Preferences Redux Slice
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Manages search preferences state following the same pattern as cart slices
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
    saveSearchPreferences, 
    getSearchPreferences, 
    mergeSearchPreferences, 
    clearSearchPreferences,
    saveSearchPreferencesBeforeAuth,
    loadSearchPreferencesAfterAuth
} from '../utils/searchPreferences';

// Async thunks for database operations

/**
 * Save search preferences to database
 */
export const saveSearchPreferencesAsync = createAsyncThunk(
    'searchPreferences/save',
    async ({ searchTerm, allergens, userId }, { rejectWithValue }) => {
        try {
            const result = await saveSearchPreferences(searchTerm, allergens, userId);
            return result;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * Load search preferences from database
 */
export const loadSearchPreferencesAsync = createAsyncThunk(
    'searchPreferences/load',
    async ({ userId }, { rejectWithValue }) => {
        try {
            const preferences = await getSearchPreferences(userId);
            return preferences;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * Merge search preferences (for login flow)
 */
export const mergeSearchPreferencesAsync = createAsyncThunk(
    'searchPreferences/merge',
    async ({ anonymousUserId, authenticatedUserId }, { rejectWithValue }) => {
        try {
            const result = await mergeSearchPreferences(anonymousUserId, authenticatedUserId);
            return result;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * Clear search preferences (for logout)
 */
export const clearSearchPreferencesAsync = createAsyncThunk(
    'searchPreferences/clear',
    async ({ userId }, { rejectWithValue }) => {
        try {
            await clearSearchPreferences(userId);
            return true;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * Save search preferences before authentication
 */
export const saveSearchPreferencesBeforeAuthAsync = createAsyncThunk(
    'searchPreferences/saveBeforeAuth',
    async ({ searchTerm, allergens, anonymousUserId }, { rejectWithValue }) => {
        try {
            const result = await saveSearchPreferencesBeforeAuth(searchTerm, allergens, anonymousUserId);
            return result;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * Load search preferences after authentication
 */
export const loadSearchPreferencesAfterAuthAsync = createAsyncThunk(
    'searchPreferences/loadAfterAuth',
    async ({ userId }, { rejectWithValue }) => {
        try {
            const result = await loadSearchPreferencesAfterAuth(userId);
            return result;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// 🛡️ FIXED: Proper allergen name mapping for consistency
const allergenNameMap = {
    'milk': 'milk',
    'eggs': 'eggs', 
    'fish': 'fish',
    'shellfish': 'shellfish',
    'treenuts': 'treenuts', // 🚨 FIXED: Match actual state structure
    'peanuts': 'peanuts',
    'wheat': 'wheat',
    'soy': 'soy',
    'sesame': 'sesame',
    'gluten': 'gluten',
    'treenut': 'treenuts', // Alternative spelling
    'tree nuts': 'treenuts', // Space-separated
    'tree-nuts': 'treenuts', // Hyphenated
    'tree_nuts': 'treenuts', // Underscore
    'treeNuts': 'treenuts' // 🚨 FIXED: Map treeNuts to treenuts
};

// Initial state
const initialState = {
    searchTerm: '',
    selectedAllergens: [],
    isLoading: false,
    error: null,
    lastSaved: null,
    hasPreferences: false
};

// Create the slice
const searchPreferencesSlice = createSlice({
    name: 'searchPreferences',
    initialState,
    reducers: {
        // Synchronous actions
        setSearchTerm: (state, action) => {
            state.searchTerm = action.payload;
            state.error = null;
        },
        
        setSelectedAllergens: (state, action) => {
            // 🛡️ FIXED: Proper allergen name mapping when setting allergens
            const mappedAllergens = action.payload.map(allergen => {
                const normalizedAllergen = allergen.toLowerCase().replace(/[\s\-_]+/g, '');
                return allergenNameMap[normalizedAllergen] || normalizedAllergen;
            });
            state.selectedAllergens = mappedAllergens;
            state.error = null;
        },
        
        toggleAllergen: (state, action) => {
            const allergen = action.payload;
            const normalizedAllergen = allergen.toLowerCase().replace(/[\s\-_]+/g, '');
            const mappedAllergen = allergenNameMap[normalizedAllergen] || normalizedAllergen;
            
            const index = state.selectedAllergens.indexOf(mappedAllergen);
            
            if (index > -1) {
                state.selectedAllergens.splice(index, 1);
            } else {
                state.selectedAllergens.push(mappedAllergen);
            }
            state.error = null;
        },
        
        clearSearchPreferencesLocal: (state) => {
            state.searchTerm = '';
            state.selectedAllergens = [];
            state.hasPreferences = false;
            state.error = null;
        },
        
        setError: (state, action) => {
            state.error = action.payload;
            state.isLoading = false;
        },
        
        clearError: (state) => {
            state.error = null;
        }
    },
    
    extraReducers: (builder) => {
        // Save search preferences
        builder
            .addCase(saveSearchPreferencesAsync.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(saveSearchPreferencesAsync.fulfilled, (state, action) => {
                state.isLoading = false;
                state.lastSaved = new Date().toISOString();
                state.hasPreferences = true;
                console.log('[SEARCH PREFERENCES] ✅ Saved to Redux:', action.payload);
            })
            .addCase(saveSearchPreferencesAsync.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                console.error('[SEARCH PREFERENCES] ❌ Save failed:', action.payload);
            });
        
        // Load search preferences
        builder
            .addCase(loadSearchPreferencesAsync.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loadSearchPreferencesAsync.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload && Object.keys(action.payload).length > 0) {
                    state.searchTerm = action.payload.search_term || '';
                    
                    // 🛡️ FIXED: Proper allergen mapping when loading from database
                    const rawAllergens = action.payload.selected_allergens || [];
                    const mappedAllergens = rawAllergens.map(allergen => {
                        const normalizedAllergen = allergen.toLowerCase().replace(/[\s\-_]+/g, '');
                        return allergenNameMap[normalizedAllergen] || normalizedAllergen;
                    });
                    
                    state.selectedAllergens = mappedAllergens;
                    state.hasPreferences = true;
                    console.log('[SEARCH PREFERENCES] ✅ Loaded to Redux:', {
                        searchTerm: state.searchTerm,
                        selectedAllergens: state.selectedAllergens,
                        originalAllergens: rawAllergens
                    });
                } else {
                    state.searchTerm = '';
                    state.selectedAllergens = [];
                    state.hasPreferences = false;
                    console.log('[SEARCH PREFERENCES] ℹ️  No preferences found');
                }
            })
            .addCase(loadSearchPreferencesAsync.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                console.error('[SEARCH PREFERENCES] ❌ Load failed:', action.payload);
            });
        
        // Merge search preferences
        builder
            .addCase(mergeSearchPreferencesAsync.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(mergeSearchPreferencesAsync.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload && Object.keys(action.payload).length > 0) {
                    state.searchTerm = action.payload.search_term || '';
                    
                    // 🛡️ FIXED: Proper allergen mapping when merging
                    const rawAllergens = action.payload.selected_allergens || [];
                    const mappedAllergens = rawAllergens.map(allergen => {
                        const normalizedAllergen = allergen.toLowerCase().replace(/[\s\-_]+/g, '');
                        return allergenNameMap[normalizedAllergen] || normalizedAllergen;
                    });
                    
                    state.selectedAllergens = mappedAllergens;
                    state.hasPreferences = true;
                    console.log('[SEARCH PREFERENCES] ✅ Merged to Redux:', {
                        searchTerm: state.searchTerm,
                        selectedAllergens: state.selectedAllergens,
                        originalAllergens: rawAllergens
                    });
                }
            })
            .addCase(mergeSearchPreferencesAsync.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                console.error('[SEARCH PREFERENCES] ❌ Merge failed:', action.payload);
            });
        
        // Clear search preferences
        builder
            .addCase(clearSearchPreferencesAsync.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(clearSearchPreferencesAsync.fulfilled, (state) => {
                state.isLoading = false;
                state.searchTerm = '';
                state.selectedAllergens = [];
                state.hasPreferences = false;
                console.log('[SEARCH PREFERENCES] ✅ Cleared from Redux');
            })
            .addCase(clearSearchPreferencesAsync.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                console.error('[SEARCH PREFERENCES] ❌ Clear failed:', action.payload);
            });
        
        // Save before auth
        builder
            .addCase(saveSearchPreferencesBeforeAuthAsync.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(saveSearchPreferencesBeforeAuthAsync.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload.success) {
                    console.log('[SEARCH PREFERENCES] ✅ Saved before auth');
                } else {
                    console.warn('[SEARCH PREFERENCES] ⚠️  Save before auth failed:', action.payload.error);
                }
            })
            .addCase(saveSearchPreferencesBeforeAuthAsync.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                console.error('[SEARCH PREFERENCES] ❌ Save before auth failed:', action.payload);
            });
        
        // Load after auth
        builder
            .addCase(loadSearchPreferencesAfterAuthAsync.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loadSearchPreferencesAfterAuthAsync.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload.success) {
                    state.searchTerm = action.payload.searchTerm || '';
                    
                    // 🛡️ FIXED: Proper allergen mapping when loading after auth
                    const rawAllergens = action.payload.allergens || [];
                    const mappedAllergens = rawAllergens.map(allergen => {
                        const normalizedAllergen = allergen.toLowerCase().replace(/[\s\-_]+/g, '');
                        return allergenNameMap[normalizedAllergen] || normalizedAllergen;
                    });
                    
                    state.selectedAllergens = mappedAllergens;
                    state.hasPreferences = action.payload.searchTerm || mappedAllergens.length > 0;
                    console.log('[SEARCH PREFERENCES] ✅ Loaded after auth:', {
                        searchTerm: state.searchTerm,
                        selectedAllergens: state.selectedAllergens,
                        originalAllergens: rawAllergens
                    });
                } else {
                    console.warn('[SEARCH PREFERENCES] ⚠️  Load after auth failed:', action.payload.error);
                }
            })
            .addCase(loadSearchPreferencesAfterAuthAsync.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                console.error('[SEARCH PREFERENCES] ❌ Load after auth failed:', action.payload);
            });
    }
});

// Export actions
export const {
    setSearchTerm,
    setSelectedAllergens,
    toggleAllergen,
    clearSearchPreferencesLocal,
    setError,
    clearError
} = searchPreferencesSlice.actions;

// Export selectors
export const selectSearchPreferences = (state) => state.searchPreferences;
export const selectSearchTerm = (state) => state.searchPreferences.searchTerm;
export const selectSelectedAllergens = (state) => state.searchPreferences.selectedAllergens;
export const selectSearchPreferencesLoading = (state) => state.searchPreferences.isLoading;
export const selectSearchPreferencesError = (state) => state.searchPreferences.error;
export const selectHasSearchPreferences = (state) => state.searchPreferences.hasPreferences;

// Export reducer
export default searchPreferencesSlice.reducer; 