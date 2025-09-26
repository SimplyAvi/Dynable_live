/**
 * Search and Filter Component
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * Combined search and allergy filter functionality:
 * - Search bar for product/recipe search
 * - Allergy filter selection
 * - State management for filters
 * - Navigation handling
 * 
 * Components:
 * - Searchbar: Text search input
 * - AllergyFilter: Allergy selection interface
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import './SearchAndFilter.css'

import Searchbar from '../Searchbar/Searchbar'
import AllergyFilter from '../AllergyFilter/AllergyFilter'
import { 
    setSearchTerm, 
    saveSearchPreferencesAsync,
    setCurrentPage,
    setPaginationInfo,
    resetPagination,
    selectCurrentPage,
    selectItemsPerPage
} from '../../redux/searchPreferencesSlice'
import { setProducts } from '../../redux/productSlice'
import { addRecipes } from '../../redux/recipeSlice'
import { searchProductsUnified, searchRecipesFromSupabasePure } from '../../utils/supabaseQueries'
import { getAnonymousUserId, supabase } from '../../utils/supabaseClient'

const SearchAndFilter = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // 🎯 UNIFIED STATE: Single source of truth for search + filters
    const searchTerm = useSelector((state) => state.searchPreferences?.searchTerm || '');
    const selectedAllergens = useSelector((state) => state.searchPreferences?.selectedAllergens || []);
    const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated || false);
    const currentUser = useSelector((state) => state.auth?.user || null);
    // 🚀 NEW: Get pagination state from Redux
    const currentPage = useSelector(selectCurrentPage);
    const itemsPerPage = useSelector(selectItemsPerPage);
    
    // Local state for immediate UI updates
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    // 🎯 UNIFIED SEARCH FUNCTION: Handles all search + filter combinations
    const performUnifiedSearch = async (searchInput = localSearchTerm, allergens = selectedAllergens) => {
        console.log('[SEARCH_AND_FILTER] 🚀 Performing unified search:', {
            searchTerm: searchInput,
            allergens: allergens,
            allergensCount: allergens.length,
            hasSearch: !!searchInput.trim(),
            hasFilters: allergens.length > 0,
            currentPage: currentPage,
            itemsPerPage: itemsPerPage
        });

        setIsSearching(true);
        setSearchError(null);

        // 🚀 FIXED: Only reset pagination for new searches, not for filter changes
        // This prevents pagination corruption when toggling allergens
        dispatch(resetPagination());

        try {
            // 🎯 SEARCH + FILTER COMBINATION LOGIC:
            // 1. If search + allergens → search within allergen-safe products
            // 2. If search only → show all matching products
            // 3. If allergens only → show all allergen-safe products
            // 4. If neither → show homepage content

            let productResponse;
            let recipeResponse;

            if (searchInput.trim()) {
                // 🎯 SEARCH WITH FILTERS: Search within allergen-safe products
                console.log('[SEARCH_AND_FILTER] 🔍 Searching with filters:', {
                    searchTerm: searchInput,
                    allergens: allergens
                });

                productResponse = await searchProductsUnified({
                    searchTerm: searchInput,
                    allergens: allergens,
                    page: 1, // 🚀 NEW: Always start from page 1 for new searches
                    limit: itemsPerPage, // 🚀 NEW: Use items per page from Redux
                    userType: isAuthenticated ? 'authenticated' : 'anonymous',
                    includeCount: true
                });

                // 🎯 RECIPES: Never filtered by allergens, only by search term
                recipeResponse = await searchRecipesFromSupabasePure({
                    search: searchInput,
                    excludeIngredients: [], // Recipes should never be filtered by allergens
                    page: 1,
                    limit: 10,
                    includeCount: true
                });

            } else if (allergens.length > 0) {
                // 🎯 FILTERS ONLY: Show all allergen-safe products
                console.log('[SEARCH_AND_FILTER] 🛡️ Filtering only (no search):', {
                    allergens: allergens
                });

                productResponse = await searchProductsUnified({
                    searchTerm: '',
                    allergens: allergens,
                    page: 1, // 🚀 NEW: Always start from page 1 for new searches
                    limit: itemsPerPage, // 🚀 NEW: Use items per page from Redux
                    userType: isAuthenticated ? 'authenticated' : 'anonymous',
                    includeCount: true
                });

                // 🎯 RECIPES: Show all recipes when no search term
                recipeResponse = await searchRecipesFromSupabasePure({
                    search: '',
                    excludeIngredients: [],
                    page: 1,
                    limit: 10,
                    includeCount: true
                });

            } else {
                // 🎯 NO SEARCH, NO FILTERS: Show homepage content
                console.log('[SEARCH_AND_FILTER] 🏠 Homepage content (no search, no filters)');

                productResponse = await searchProductsUnified({
                    searchTerm: '',
                    allergens: [],
                    page: 1, // 🚀 NEW: Always start from page 1 for new searches
                    limit: itemsPerPage, // 🚀 NEW: Use items per page from Redux
                    userType: isAuthenticated ? 'authenticated' : 'anonymous',
                    includeCount: true
                });

                recipeResponse = await searchRecipesFromSupabasePure({
                    search: '',
                    excludeIngredients: [],
                    page: 1,
                    limit: 10,
                    includeCount: true
                });
            }

            // 🎯 UPDATE REDUX STATE
            dispatch(setProducts(productResponse));
            dispatch(addRecipes(recipeResponse));

            // 🚀 FIXED: Update pagination info in Redux with validation
            if (productResponse.pageInfo) {
                const validTotalPages = Math.max(1, productResponse.pageInfo.totalPages || 1);
                const validTotalItems = Math.max(0, productResponse.pageInfo.totalItems || 0);
                
                dispatch(setPaginationInfo({
                    totalItems: validTotalItems,
                    totalPages: validTotalPages,
                    currentPage: 1 // Always page 1 for new searches
                }));
                
                console.log('[SEARCH_AND_FILTER] 📊 Pagination updated:', {
                    totalItems: validTotalItems,
                    totalPages: validTotalPages,
                    currentPage: 1
                });
            } else {
                // 🚀 FIXED: Set default pagination if no pageInfo
                dispatch(setPaginationInfo({
                    totalItems: productResponse.products ? productResponse.products.length : productResponse.length || 0,
                    totalPages: 1,
                    currentPage: 1
                }));
            }

            console.log('[SEARCH_AND_FILTER] ✅ Search completed:', {
                products: productResponse.products ? productResponse.products.length : productResponse.length,
                recipes: recipeResponse.recipes ? recipeResponse.recipes.length : recipeResponse.length,
                searchTerm: searchInput,
                allergens: allergens,
                pagination: productResponse.pageInfo ? productResponse.pageInfo : 'No pagination info'
            });

        } catch (error) {
            console.error('[SEARCH_AND_FILTER] ❌ Search error:', error);
            setSearchError('Search failed. Please try again.');
            
            // 🚀 FIXED: Don't reset pagination state on error to prevent corruption
            console.log('[SEARCH_AND_FILTER] ⚠️ Search error occurred, keeping current pagination state');
        } finally {
            setIsSearching(false);
        }
    }; // 🚀 FIXED: Removed useCallback to prevent circular dependency

    // 🎯 SYNC LOCAL STATE WITH REDUX
    useEffect(() => {
        console.log('[SEARCH_AND_FILTER] 🔄 Syncing local state with Redux:', {
            searchTerm: searchTerm,
            localSearchTerm: localSearchTerm
        });
        setLocalSearchTerm(searchTerm);
    }, [searchTerm]);

    // 🎯 AUTO-SEARCH WHEN FILTERS CHANGE
    useEffect(() => {
        console.log('[SEARCH_AND_FILTER] 🔄 Filters changed, triggering search:', {
            searchTerm: localSearchTerm,
            allergens: selectedAllergens
        });
        
        // 🎯 PHASE 1 FIX: Don't clear search term if it's being set from external source
        if (!localSearchTerm || localSearchTerm.trim() === '') {
            console.log('[SEARCH_AND_FILTER] Empty local search term - checking if Redux has search term');
            
            // Check if Redux has a search term that we should preserve
            if (searchTerm && searchTerm.trim() !== '') {
                console.log('[SEARCH_AND_FILTER] Redux has search term, preserving it:', searchTerm);
                setLocalSearchTerm(searchTerm);
                return;
            }
            
            console.log('[SEARCH_AND_FILTER] No search term in Redux either - triggering homepage state');
            // Only clear if both local and Redux are empty
            dispatch(setSearchTerm(''));
            // Don't perform search - let Homepage handle it
            return;
        }
        
        // 🛡️ FIXED: Only perform search if there's a search term
        if (localSearchTerm && localSearchTerm.trim() !== '') {
            performUnifiedSearch(localSearchTerm, selectedAllergens);
        }
    }, [selectedAllergens, localSearchTerm, searchTerm, dispatch]); // 🚀 FIXED: Removed performUnifiedSearch from dependencies to break circular dependency

    // 🎯 HANDLE SEARCH SUBMISSION
    const handleSearchSubmit = async (searchInput) => {
        console.log('[SEARCH_AND_FILTER] 📝 Search submitted:', searchInput);
        
        // Update Redux state
        dispatch(setSearchTerm(searchInput));
        setLocalSearchTerm(searchInput);

        // Save search preferences
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const anonymousId = await getAnonymousUserId();
            const userId = user ? user.id : anonymousId;

            if (userId) {
                await dispatch(saveSearchPreferencesAsync({
                    searchTerm: searchInput,
                    allergens: selectedAllergens,
                    userId: userId
                })).unwrap();
                console.log('[SEARCH_AND_FILTER] ✅ Search preferences saved');
            }
        } catch (error) {
            console.warn('[SEARCH_AND_FILTER] ⚠️ Failed to save search preferences:', error);
        }

        // Perform search
        await performUnifiedSearch(searchInput, selectedAllergens);
        navigate('/');
    };

    return (
        <div>
            <div className='search-and-filter'>
                <Searchbar 
                    searchTerm={localSearchTerm}
                    onSearchSubmit={handleSearchSubmit}
                    isSearching={isSearching}
                    error={searchError}
                />
            </div>
            <div className='filter-section'>
                <h3 className="filter-header">Scroll to select allergies to avoid →</h3>

                <AllergyFilter 
                    isSearching={isSearching}
                />
            </div>
        </div>
    )
}

export default SearchAndFilter