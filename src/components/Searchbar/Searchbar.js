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

import React, { useEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux';
import { addProducts } from '../../redux/productSlice';
import { addRecipes } from '../../redux/recipeSlice';
import { useSearchCookieHandler } from '../../helperfunc/useCookieHandler';
import allergenList from '../../allergensList';
import FormInput from '../FormInput'
import './Searchbar.css'
import {debounce} from 'lodash'

const Searchbar = ({ curAllergen }) => {
    const textbar = useSelector((state) => state.searchbar.searchbar);
    const allergies = useSelector((state) => state.allergies.allergies);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { saveToCookies, initializeSearchFromCookies } = useSearchCookieHandler();
    const debouncedGetResponse = useRef();

    useEffect(() => {
        initializeSearchFromCookies()
    }, [])

    useEffect(() => {
        debouncedGetResponse.current = debounce(getResponse, 3000); // Set debounce delay here
    }, []);

    useEffect(() => {
        if (textbar && textbar.length > 0) {
            debouncedGetResponse.current(textbar)
        }
    }, [textbar]) // Add textbar as dependency

    useEffect(() => {
        if (textbar) {
            debouncedGetResponse.current(textbar);
        }
    }, [allergies])

    const handleTextChange = (input) => {
        saveToCookies(input.target.value)
    }
    
    const handleSubmit = async (event) => {
        event.preventDefault()
        if (textbar) {
            await getResponse(textbar);
            navigate('/')
        }
    }

    const getResponse = async(initialInput=textbar) => {
        if (!initialInput) return;
        
        console.log('Searching for:', initialInput)
        try {
            const sendAllergens = filteredAllergens()
            const params = new URLSearchParams({
                name: initialInput,
                page: 1,
                limit: 10
            });

            // Use POST request for foods to handle excludeIngredients in body
            const foodResponse = await axios.post(`http://localhost:5001/api/foods?${params}`, {
                name: initialInput,
                excludeIngredients: sendAllergens
            });
            console.log('Food response:', foodResponse.data)
            
            // Use POST request for recipes to handle excludeIngredients in body
            const recipeResponse = await axios.post('http://localhost:5001/api/recipe?page=1', {
                search: initialInput,
                excludeIngredients: sendAllergens
            });
            console.log('Recipe response:', recipeResponse.data)
            
            dispatch(addProducts(foodResponse.data))
            dispatch(addRecipes(recipeResponse.data))
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    const filteredAllergens = () => {
        let allergensArr = []
        Object.keys(allergies).map((key)=>{
            const lowerKey = key.toLowerCase()
            if (allergies[key]) allergensArr.push(lowerKey)
        })
        return allergensArr
    }

    return(
        <div>
            <form onSubmit={handleSubmit} className='search-form'>
                <FormInput  
                    name='searchText' 
                    type='text' 
                    value={textbar} 
                    label='Search Here' 
                    placeholder ='search here'
                    handleChange={handleTextChange}/>
                <button className='custom-button' type='submit'>SUBMIT</button>
            </form>
        </div>
    )
}

export default Searchbar