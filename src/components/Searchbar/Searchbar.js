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

import React, { useEffect, useRef, useCallback, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux';
import { setProducts, clearProducts } from '../../redux/productSlice';
import { addRecipes } from '../../redux/recipeSlice';
import { useSearchCookieHandler } from '../../helperfunc/useCookieHandler';
import FormInput from '../FormInput'
import './Searchbar.css'
import {debounce} from 'lodash'
import { batch } from 'react-redux';

const Searchbar = ({ curAllergen }) => {
    const textbar = useSelector((state) => state.searchbar.searchbar);
    const allergies = useSelector((state) => state.allergies.allergies);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { saveToCookies, initializeSearchFromCookies } = useSearchCookieHandler();
    
    // Local state for input
    const [inputValue, setInputValue] = useState(textbar || '');
    
    const filteredAllergens = useCallback(() => {
        let allergensArr = []
        Object.keys(allergies).forEach((key)=>{
            const lowerKey = key.toLowerCase()
            if (allergies[key]) allergensArr.push(lowerKey)
        })
        console.log('Sending allergens:', allergensArr)
        return allergensArr
    }, [allergies]);

    // Search function
    const getResponse = useCallback(async (searchInput = textbar) => {
        try {
            dispatch(clearProducts());
            const sendAllergens = filteredAllergens();
            const params = new URLSearchParams({
                name: searchInput || '',
                page: 1,
                limit: 10,
                allergens: sendAllergens.join(',')
            });

            // Use GET request for product search
            const foodResponse = await axios.get(`http://localhost:5001/api/product/search?${params}`);
            console.log('Food response:', foodResponse.data)
            
            // Use POST request for recipes to handle excludeIngredients in body
            const recipeResponse = await axios.post('http://localhost:5001/api/recipe/?page=1', {
                search: searchInput || '',
                excludeIngredients: sendAllergens
            });
            console.log('Recipe response:', recipeResponse.data)
            
            batch(() => {
                dispatch(setProducts(foodResponse.data));
                dispatch(addRecipes(recipeResponse.data));
            });
        } catch (error) {
            console.error('Search error:', error);
        }
    }, [dispatch, textbar, filteredAllergens]);

    useEffect(() => {
        initializeSearchFromCookies()
    }, [initializeSearchFromCookies])

    // Auto-search when allergens change, using the Redux/global search value
    useEffect(() => {
        getResponse(textbar);
        // eslint-disable-next-line
    }, [allergies]);

    // Handle input change (local state only)
    const handleTextChange = (input) => {
        setInputValue(input.target.value);
        saveToCookies(input.target.value);
    }
    
    // On submit, update Redux/global state and trigger search
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (inputValue) {
            // Here you would update Redux/global state for searchbar
            // If you have an action like setSearchbar, dispatch it here
            // For now, just call getResponse with inputValue
            await getResponse(inputValue);
            // Optionally update Redux searchbar value if needed
            // dispatch(setSearchbar(inputValue));
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