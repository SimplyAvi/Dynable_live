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
import './Searchbar.css'
import { searchProductsFromSupabasePure, searchRecipesFromSupabasePure } from '../../utils/supabaseQueries'
import FormInput from '../FormInput'

const Searchbar = ({ curAllergen }) => {
    const textbar = useSelector((state) => state.searchbar?.searchbar || '');
    const allergies = useSelector((state) => state.allergies?.allergies || {});
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Local state for input
    const [inputValue, setInputValue] = useState(textbar || '');
    
    // Search function
    const getResponse = useCallback(
        async (searchInput = textbar) => {
            try {
                const sendAllergens = Object.keys(allergies).filter(key => allergies[key]).map(key => key.toLowerCase())
                console.log('Sending allergens:', sendAllergens);
                
                // ENABLED FOR SUPABASE PURE TESTING
                const foodResponse = await searchProductsFromSupabasePure({
                    name: searchInput,
                    page: 1,
                    limit: 10,
                    allergens: sendAllergens
                });
                
                const recipeResponse = await searchRecipesFromSupabasePure({
                    search: searchInput,
                    excludeIngredients: sendAllergens,
                    page: 1,
                    limit: 10
                });
                
                console.log('[SUPABASE PURE] Search results:', { 
                    products: foodResponse.length, 
                    recipes: recipeResponse.length 
                });
                
                dispatch(setProducts(foodResponse));
                dispatch(addRecipes(recipeResponse));
                
            } catch (error) {
                console.error('Search error:', error);
            }
        }, [dispatch, textbar, allergies]);

    // Auto-search when allergens change, using the Redux/global search value
    useEffect(() => {
        getResponse(textbar);
        // eslint-disable-next-line
    }, [allergies]);

    // Handle input change (local state only)
    const handleTextChange = (input) => {
        setInputValue(input.target.value);
    }
    
    // On submit, update Redux/global state and trigger search
    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log('Search form submitted:', inputValue);
        if (inputValue) {
            dispatch(setSearchbarValue(inputValue));
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