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

import React, { useState, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setProducts } from '../../redux/productSlice'
import { addRecipes } from '../../redux/recipeSlice'
import { setSearchbarValue } from '../../redux/searchbarSlice'
import { setSearchTerm, saveSearchPreferencesAsync } from '../../redux/searchPreferencesSlice'
import './Searchbar.css'
import { searchProductsFromSupabasePure, searchRecipesFromSupabasePure } from '../../utils/supabaseQueries'
import { supabase } from '../../utils/supabaseClient'
import { getAnonymousUserId } from '../../utils/supabaseClient'
import FormInput from '../FormInput'

const Searchbar = ({ curAllergen }) => {
    const textbar = useSelector((state) => state.searchbar?.searchbar || '');
    const allergies = useSelector((state) => state.allergies?.allergies || {});
    const searchTerm = useSelector((state) => state.searchPreferences?.searchTerm || '');
    const selectedAllergens = useSelector((state) => state.searchPreferences?.selectedAllergens || []);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Local state for input
    const [inputValue, setInputValue] = useState(textbar || searchTerm || '');
    
    // Sync input value with Redux search term (only on initial load or when Redux changes externally)
    useEffect(() => {
        const currentSearchTerm = textbar || searchTerm || '';
        // Only sync if the input is empty (initial load) or if Redux changed from external source
        if (currentSearchTerm && inputValue === '') {
            console.log('[SEARCHBAR] Syncing input value with Redux search term:', currentSearchTerm);
            setInputValue(currentSearchTerm);
        }
    }, [textbar, searchTerm]); // Don't include inputValue in dependencies
    
    // Auto-save search term when input changes (debounced)
    useEffect(() => {
        const saveSearchTerm = async () => {
            if (inputValue.trim()) {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    const anonymousId = await getAnonymousUserId();
                    const userId = user ? user.id : anonymousId;
                    
                    if (userId) {
                        const sendAllergens = Object.keys(allergies).filter(key => allergies[key]).map(key => key.toLowerCase());
                        await dispatch(saveSearchPreferencesAsync({
                            searchTerm: inputValue,
                            allergens: sendAllergens,
                            userId: userId
                        })).unwrap();
                        console.log('[SEARCHBAR] ✅ Auto-saved search term:', inputValue);
                        
                        // Store anonymous user ID for merge if this is an anonymous user
                        if (!user && anonymousId) {
                            console.log('[SEARCHBAR] 💾 Storing anonymous user ID for merge:', anonymousId);
                            localStorage.setItem('anonymousUserIdForMerge', anonymousId);
                        }
                    }
                } catch (error) {
                    console.warn('[SEARCHBAR] ⚠️  Failed to auto-save search term:', error);
                }
            }
        };
        
        // Debounce the save to avoid too many API calls
        const timeoutId = setTimeout(saveSearchTerm, 1000);
        return () => clearTimeout(timeoutId);
    }, [inputValue, allergies, dispatch]);

    // Search function
    const getResponse = useCallback(
        async (searchInput = textbar) => {
            try {
                const sendAllergens = Object.keys(allergies).filter(key => allergies[key]).map(key => key.toLowerCase())
                console.log('[SEARCHBAR] Allergies object:', allergies);
                console.log('[SEARCHBAR] Selected allergens:', Object.keys(allergies).filter(key => allergies[key]));
                console.log('[SEARCHBAR] Sending allergens:', sendAllergens);
                
                // ENABLED FOR SUPABASE PURE TESTING
                const foodResponse = await searchProductsFromSupabasePure({
                    name: searchInput,
                    page: 1,
                    limit: 10,
                    allergens: sendAllergens,
                    includeCount: true
                });
                
                const recipeResponse = await searchRecipesFromSupabasePure({
                    search: searchInput,
                    excludeIngredients: [], // 🎯 RECIPES SHOULD NEVER BE FILTERED BY ALLERGENS
                    page: 1,
                    limit: 10,
                    includeCount: true
                });
                
                console.log('[SUPABASE PURE] Search results:', { 
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
        }, [dispatch, textbar, allergies]);

    // Auto-search when allergens change, using the Redux/global search value
    useEffect(() => {
        console.log('[SEARCHBAR] Allergies changed, triggering search:', allergies);
        getResponse(textbar);
        // eslint-disable-next-line
    }, [allergies]);
    
    // Auto-search when search term changes (from preferences)
    useEffect(() => {
        const currentSearchTerm = textbar || searchTerm || '';
        if (currentSearchTerm && currentSearchTerm !== inputValue) {
            console.log('[SEARCHBAR] Search term changed from preferences, triggering search:', currentSearchTerm);
            getResponse(currentSearchTerm);
        }
    }, [textbar, searchTerm, getResponse]);

    // Handle input change (local state only)
    const handleTextChange = (input) => {
        console.log('[SEARCHBAR] Input change detected:', input.target.value);
        setInputValue(input.target.value);
    }
    
    // On submit, update Redux/global state and trigger search
    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log('Search form submitted:', inputValue);
        if (inputValue) {
            dispatch(setSearchbarValue(inputValue));
            dispatch(setSearchTerm(inputValue));
            
            // Save search preferences to database
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const anonymousId = await getAnonymousUserId();
                let userId = user ? user.id : anonymousId;
                
                // If no user ID available, try to create anonymous session
                if (!userId) {
                    console.log('[SEARCHBAR] No user ID available, attempting to create anonymous session...');
                    try {
                        // Import initializeAuth dynamically to avoid circular imports
                        const { initializeAuth } = await import('../../redux/anonymousCartSlice');
                        const authResult = await dispatch(initializeAuth()).unwrap();
                        
                        if (authResult.success && authResult.session) {
                            userId = authResult.session.user.id;
                            console.log('[SEARCHBAR] ✅ Anonymous session created, user ID:', userId);
                        } else {
                            console.warn('[SEARCHBAR] ⚠️ Failed to create anonymous session:', authResult.error);
                        }
                    } catch (authError) {
                        console.warn('[SEARCHBAR] ⚠️ Error creating anonymous session:', authError);
                    }
                }
                
                if (userId) {
                    const sendAllergens = Object.keys(allergies).filter(key => allergies[key]).map(key => key.toLowerCase());
                    await dispatch(saveSearchPreferencesAsync({
                        searchTerm: inputValue,
                        allergens: sendAllergens,
                        userId: userId
                    })).unwrap();
                    console.log('[SEARCHBAR] ✅ Search preferences saved for user:', userId);
                    
                    // Store anonymous user ID for merge if this is an anonymous user
                    if (!user && userId) {
                        console.log('[SEARCHBAR] 💾 Storing anonymous user ID for merge:', userId);
                        localStorage.setItem('anonymousUserIdForMerge', userId);
                    }
                } else {
                    console.warn('[SEARCHBAR] ⚠️ No user ID available for saving preferences');
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