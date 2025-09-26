/**
 * Search Preferences Redux Slice
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Manages search preferences state following the same pattern as cart slices
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../utils/supabaseClient';
import { mapArrayToDatabaseFormat, mapArrayToFrontendFormat } from '../utils/allergenMappings';
import { 
    saveSearchPreferences, 
    getSearchPreferences, 
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
    'searchPreferences/mergeSearchPreferencesAsync',
    async ({ anonymousUserId, authenticatedUserId }, { getState, dispatch }) => {
        console.log('🔄 [MERGE] mergeSearchPreferencesAsync started');
        console.log('🔄 [MERGE] Anonymous user ID:', anonymousUserId);
        console.log('🔄 [MERGE] Authenticated user ID:', authenticatedUserId);
        
        try {
            // Log current state before merge
            const currentState = getState().searchPreferences;
            console.log('🔍 [MERGE] Current allergen state before merge:', currentState);
            
            // Import the merge function
            const { mergeSearchPreferences } = await import('../utils/searchPreferences');
            
            // Perform merge logic
            console.log('🔄 [MERGE] Calling mergeSearchPreferences function...');
            const result = await mergeSearchPreferences(anonymousUserId, authenticatedUserId);
            console.log('✅ [MERGE] mergeSearchPreferences function completed:', result);
            
            // Log state after merge
            const stateAfterMerge = getState().searchPreferences;
            console.log('🔍 [MERGE] Allergen state after merge:', stateAfterMerge);
            
            return result;
        } catch (error) {
            console.error('❌ [MERGE] mergeSearchPreferencesAsync failed:', error);
            console.error('❌ [MERGE] Error details:', error.message);
            console.error('❌ [MERGE] Error stack:', error.stack);
            throw error;
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

// 🎯 REMOVED: Redundant allergenNameMap (now using single source of truth)
// const allergenNameMap = { ... } - REMOVED

// Initial state
const initialState = {
    searchTerm: '',
    selectedAllergens: [],
    isLoading: false,
    error: null,
    lastSaved: null,
    hasPreferences: false,
    // 🚀 NEW: Pagination state for consistent product ordering
    pagination: {
        currentPage: 1,
        itemsPerPage: 20,
        totalItems: 0,
        totalPages: 0,
        isAlphabetical: true // Always use alphabetical ordering for consistency
    }
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
            console.log(`[SEARCH PREFERENCES] 📥 setSelectedAllergens called with payload:`, action.payload);
            // 🎯 UPDATED: Use single source of truth for allergen mapping
            const mappedAllergens = mapArrayToDatabaseFormat(action.payload);
            console.log(`[SEARCH PREFERENCES] 🔄 Mapped allergens:`, mappedAllergens);
            state.selectedAllergens = mappedAllergens;
            state.error = null;
            console.log(`[SEARCH PREFERENCES] ✅ Updated state.selectedAllergens:`, state.selectedAllergens);
        },
        
        toggleAllergen: (state, action) => {
            const allergen = action.payload;
            const mappedAllergen = mapArrayToDatabaseFormat([allergen])[0];
            
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
        },
        
        // 🚀 NEW: Pagination actions
        setCurrentPage: (state, action) => {
            state.pagination.currentPage = action.payload;
            console.log('[SEARCH PREFERENCES] 📄 Current page set to:', action.payload);
        },
        
        setPaginationInfo: (state, action) => {
            const { totalItems, totalPages, currentPage } = action.payload;
            state.pagination.totalItems = totalItems;
            state.pagination.totalPages = totalPages;
            if (currentPage !== undefined) {
                state.pagination.currentPage = currentPage;
            }
            console.log('[SEARCH PREFERENCES] 📊 Pagination info updated:', state.pagination);
        },
        
        setItemsPerPage: (state, action) => {
            state.pagination.itemsPerPage = action.payload;
            state.pagination.currentPage = 1; // Reset to first page when changing items per page
            console.log('[SEARCH PREFERENCES] 📏 Items per page set to:', action.payload);
        },
        
        resetPagination: (state) => {
            state.pagination.currentPage = 1;
            state.pagination.totalItems = 0;
            state.pagination.totalPages = 0;
            console.log('[SEARCH PREFERENCES] 🔄 Pagination reset to page 1');
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
                state.error = null;
                
                // 🎯 UPDATED: Use single source of truth for allergen mapping when loading from database
                const rawAllergens = action.payload.selectedallergens || [];
                const mappedAllergens = mapArrayToDatabaseFormat(rawAllergens);
                state.selectedAllergens = mappedAllergens;
                
                state.searchTerm = action.payload.search_term || '';
                state.hasPreferences = true;
                console.log('[SEARCH PREFERENCES] ✅ Loaded from database:', {
                    selectedAllergens: state.selectedAllergens,
                    searchTerm: state.searchTerm
                });
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
                state.error = null;
                
                // 🎯 UPDATED: Use single source of truth for allergen mapping when merging
                const rawAllergens = action.payload.selectedallergens || [];
                const mappedAllergens = mapArrayToDatabaseFormat(rawAllergens);
                state.selectedAllergens = mappedAllergens;
                
                state.searchTerm = action.payload.search_term || '';
                state.hasPreferences = true;
                console.log('[SEARCH PREFERENCES] ✅ Merged preferences:', {
                    selectedAllergens: state.selectedAllergens,
                    searchTerm: state.searchTerm
                });
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
                state.error = null;
                
                // 🎯 UPDATED: Use single source of truth for allergen mapping when loading after auth
                const rawAllergens = action.payload.selectedallergens || [];
                const mappedAllergens = mapArrayToDatabaseFormat(rawAllergens);
                state.selectedAllergens = mappedAllergens;
                
                state.searchTerm = action.payload.search_term || '';
                state.hasPreferences = true;
                console.log('[SEARCH PREFERENCES] ✅ Loaded after auth:', {
                    selectedAllergens: state.selectedAllergens,
                    searchTerm: state.searchTerm
                });
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
    clearError,
    // 🚀 NEW: Pagination actions
    setCurrentPage,
    setPaginationInfo,
    setItemsPerPage,
    resetPagination
} = searchPreferencesSlice.actions;

// Export selectors
export const selectSearchPreferences = (state) => state.searchPreferences;
export const selectSearchTerm = (state) => state.searchPreferences.searchTerm;
export const selectSelectedAllergens = (state) => state.searchPreferences.selectedAllergens;
export const selectSearchPreferencesLoading = (state) => state.searchPreferences.isLoading;
export const selectSearchPreferencesError = (state) => state.searchPreferences.error;
export const selectHasSearchPreferences = (state) => state.searchPreferences.hasPreferences;
// 🚀 NEW: Pagination selectors
export const selectPagination = (state) => state.searchPreferences.pagination;
export const selectCurrentPage = (state) => state.searchPreferences.pagination.currentPage;
export const selectItemsPerPage = (state) => state.searchPreferences.pagination.itemsPerPage;
export const selectTotalItems = (state) => state.searchPreferences.pagination.totalItems;
export const selectTotalPages = (state) => state.searchPreferences.pagination.totalPages;

// Export reducer
export default searchPreferencesSlice.reducer; 