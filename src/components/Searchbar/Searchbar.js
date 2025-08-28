/**
 * Searchbar Component
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * Search functionality:
 * - Text input for product/recipe search
 * - Debounced search to prevent excessive API calls
 * - Integration with allergy filters
 * - Search form submission handling
 * 
 * Features:
 * - Real-time search suggestions
 * - Responsive design
 * - Error handling
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setProducts } from '../../redux/productSlice'
import { addRecipes } from '../../redux/recipeSlice'
import { setSearchbarValue } from '../../redux/searchbarSlice'
import { setSearchTerm, saveSearchPreferencesAsync } from '../../redux/searchPreferencesSlice'
import './Searchbar.css'
import { searchProductsUnified, searchRecipesFromSupabasePure } from '../../utils/supabaseQueries' // 🛡️ UPDATED: Use unified search
import { supabase } from '../../utils/supabaseClient'
import { getAnonymousUserId } from '../../utils/supabaseClient'
import FormInput from '../FormInput/FormInput'

const Searchbar = ({ curAllergen }) => { // curAllergen prop is now unused but kept for original signature
    const textbar = useSelector((state) => state.searchbar?.searchbar || '');
    const allergies = useSelector((state) => state.allergies?.allergies || {});
    const searchTerm = useSelector((state) => state.searchPreferences?.searchTerm || '');
    const selectedAllergens = useSelector((state) => state.searchPreferences?.selectedAllergens || []); // 🛡️ ADDED: Use unified allergen state
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const [inputValue, setInputValue] = useState(textbar || searchTerm || '');
    const prevReduxStateRef = useRef(textbar || searchTerm || '');
    
    // 🛡️ FIXED: Sync input value with Redux state changes (without infinite loop)
    useEffect(() => {
        const currentSearchTerm = textbar || searchTerm || '';
        const prevReduxState = prevReduxStateRef.current;
        
        console.log('[SEARCHBAR] Redux state changed:', { 
            textbar, 
            searchTerm, 
            currentSearchTerm, 
            prevReduxState,
            inputValue,
            timestamp: new Date().toISOString()
        });
        
        // Only sync if Redux state actually changed (not due to user typing)
        if (currentSearchTerm !== prevReduxState) {
            console.log('[SEARCHBAR] Redux state changed from external source, syncing input value:', currentSearchTerm);
            setInputValue(currentSearchTerm);
            prevReduxStateRef.current = currentSearchTerm;
            
            // 🎯 PHASE 1 FIX: Additional logging for search term persistence
            if (currentSearchTerm && currentSearchTerm.trim() !== '') {
                console.log('[SEARCHBAR] ✅ Search term persisted in UI:', currentSearchTerm);
            }
        }
    }, [textbar, searchTerm]); // 🛡️ REMOVED: inputValue from dependencies to prevent infinite loop
    
    useEffect(() => {
        const saveSearchTerm = async () => {
            console.log('[SEARCHBAR] 🔍 Auto-save check:', {
                inputValue: inputValue,
                trimmedValue: inputValue.trim(),
                hasValue: !!inputValue.trim(),
                timestamp: new Date().toISOString()
            });
            
            if (inputValue.trim()) {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    const anonymousId = await getAnonymousUserId();
                    const userId = user ? user.id : anonymousId;
                    
                    console.log('[SEARCHBAR] 💾 Saving search preferences:', {
                        searchTerm: inputValue,
                        userId: userId,
                        isAnonymous: !user,
                        anonymousId: anonymousId
                    });
                    
                    if (userId) {
                        const sendAllergens = Object.keys(allergies).filter(key => allergies[key]).map(key => key.toLowerCase());
                        await dispatch(saveSearchPreferencesAsync({
                            searchTerm: inputValue,
                            allergens: sendAllergens,
                            userId: userId
                        })).unwrap();
                        console.log('[SEARCHBAR] ✅ Auto-saved search term:', inputValue);
                        if (!user && anonymousId) {
                            console.log('[SEARCHBAR] 💾 Storing anonymous user ID for merge:', anonymousId);
                            localStorage.setItem('anonymousUserIdForMerge', anonymousId);
                        }
                    }
                } catch (error) {
                    console.warn('[SEARCHBAR] ⚠️  Failed to auto-save search term:', error);
                }
            } else {
                console.log('[SEARCHBAR] ⏭️ Skipping auto-save - no search term to save');
            }
        };
        const timeoutId = setTimeout(saveSearchTerm, 1000);
        return () => clearTimeout(timeoutId);
    }, [inputValue, allergies, dispatch]);

    // 🛡️ UPDATED: Use unified search function
    const getResponse = useCallback(
        async (searchInput = textbar) => {
            try {
                // 🛡️ UPDATED: Use selectedAllergens from searchPreferences instead of allergies object
                const sendAllergens = selectedAllergens || Object.keys(allergies).filter(key => allergies[key]).map(key => key.toLowerCase());
                console.log('[SEARCHBAR] Allergies object:', allergies);
                console.log('[SEARCHBAR] Selected allergens:', selectedAllergens);
                console.log('[SEARCHBAR] Sending allergens:', sendAllergens);
                
                // 🛡️ UPDATED: Use unified search function
                const foodResponse = await searchProductsUnified({
                    searchTerm: searchInput,
                    page: 1,
                    limit: 10,
                    allergens: sendAllergens,
                    userType: 'anonymous', // Will be determined by the function
                    includeCount: true
                });
                
                const recipeResponse = await searchRecipesFromSupabasePure({
                    search: searchInput,
                    excludeIngredients: [], // 🎯 RECIPES SHOULD NEVER BE FILTERED BY ALLERGENS
                    page: 1,
                    limit: 10,
                    includeCount: true
                });
                
                console.log('[SEARCHBAR] Unified search results:', { 
                    products: foodResponse.products ? foodResponse.products.length : foodResponse.length,
                    recipes: recipeResponse.recipes ? recipeResponse.recipes.length : recipeResponse.length,
                    productTotalCount: foodResponse.totalCount,
                    recipeTotalCount: recipeResponse.totalCount
                });
                
                dispatch(setProducts(foodResponse));
                dispatch(addRecipes(recipeResponse));
                
            } catch (error) {
                console.error('Search error:', error);
            }
        }, [dispatch, textbar, selectedAllergens, allergies]); // 🛡️ UPDATED: Use selectedAllergens

    // Auto-search when search term changes (from preferences)
    useEffect(() => {
        const currentSearchTerm = textbar || searchTerm || '';
        if (currentSearchTerm && currentSearchTerm !== inputValue) {
            console.log('[SEARCHBAR] Search term changed from preferences, triggering search:', currentSearchTerm);
            getResponse(currentSearchTerm);
        }
    }, [textbar, searchTerm, getResponse]);

    const handleTextChange = (input) => {
        console.log('[SEARCHBAR] Input change detected:', input.target.value);
        setInputValue(input.target.value);
    }
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log('Search form submitted:', inputValue);
        if (inputValue) {
            dispatch(setSearchbarValue(inputValue));
            dispatch(setSearchTerm(inputValue));
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const anonymousId = await getAnonymousUserId();
                let userId = user ? user.id : anonymousId;
                if (!userId) {
                    const { initializeAuth } = await import('../../redux/anonymousCartSlice');
                    const authResult = await dispatch(initializeAuth()).unwrap();
                    if (authResult.success && authResult.session) {
                        userId = authResult.session.user.id;
                    }
                }
                if (userId) {
                    const sendAllergens = Object.keys(allergies).filter(key => allergies[key]).map(key => key.toLowerCase());
                    await dispatch(saveSearchPreferencesAsync({
                        searchTerm: inputValue,
                        allergens: sendAllergens,
                        userId: userId
                    })).unwrap();
                    if (!user && userId) {
                        localStorage.setItem('anonymousUserIdForMerge', userId);
                    }
                }
            } catch (error) {
                console.warn('[SEARCHBAR] ⚠️  Failed to save search preferences:', error);
            }
            await getResponse(inputValue);
            navigate('/')
        }
    }

    return(
        <div>
            <form onSubmit={handleSubmit} className='search-form'>
                <FormInput  
                    name='searchText' 
                    type='text' 
                    value={inputValue} 
                    label='Search Here' 
                    placeholder ='search here'
                    handleChange={handleTextChange}/>
                <button className='custom-button' type='submit'>SUBMIT</button>
            </form>
        </div>
    )
}
export default Searchbar