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
        console.log('useEffect1')
        if (textbar && textbar.length > 0) {
            debouncedGetResponse.current(textbar)
        }
    }, [])

    useEffect(() => {
        console.log('useEffect2')
        debouncedGetResponse.current(textbar);
    }, [allergies])

    const handleTextChange = (input) => {
        saveToCookies(input.target.value)
    }
    
    const handleSubmit = async (event) => {
        console.log('submitting')
        event.preventDefault()
        debouncedGetResponse.current(textbar);
        navigate('/')
    }

    const getResponse = async(initialInput=textbar) => {
        console.log('initialInput in getresponse:', initialInput)
        let allergenText = ``
        if (curAllergen) {
            allergenText=`&health=${allergenList[curAllergen]}`
        }
        try {
            let foodResponse
            const sendAllergens = filteredAllergens()
            foodResponse = await axios.post(`http://localhost:5001/api/foods?page=1`, {
                name: initialInput, 
                excludeIngredients: sendAllergens
            })
            console.log('foodresponse:', foodResponse)
            const recipeResponse = await axios.post('http://localhost:5001/api/recipe?page=1', {
                search: initialInput,
                excludeIngredients: sendAllergens
            })
            console.log('Recipe response:', recipeResponse)
            dispatch(addProducts(foodResponse.data))
            dispatch(addRecipes(recipeResponse.data))
        } catch (error) {
            console.error(error);
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
                <button className='custom-button' type='button' onClick={handleSubmit}>SUBMIT</button>
            </form>
        </div>
    )
}

export default Searchbar