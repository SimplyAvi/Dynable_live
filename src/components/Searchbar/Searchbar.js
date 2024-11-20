import React, { useEffect, useRef } from 'react'
import axios from 'axios'
import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router'
import { useDispatch, useSelector } from 'react-redux';
import { addProducts } from '../../redux/productSlice';
import { addRecipes } from '../../redux/recipeSlice';
import { useSearchCookieHandler } from '../../helperfunc/useCookieHandler';
import allergenList from '../../allergensList';
import FormInput from '../FormInput'
import './Searchbar.css'
import {debounce} from 'lodash'

const Searchbar = ({ curAllergen }) => {

    const textbar = useSelector((state)=> state.searchbar.searchbar)
    const [searchbar, setSearchbar] = useCookies(['searchbar']);
    const [filters] = useCookies(['allergens'])
    const {allergens} = filters
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {saveToCookies} = useSearchCookieHandler();
    const debouncedGetResponse = useRef();

    useEffect(() => {
        debouncedGetResponse.current = debounce(getResponse, 3000); // Set debounce delay here
    }, []);

    useEffect(()=>{
        console.log('useEffect1')
        if (!searchbar.searchbar) {
            setSearchbar('searchbar', '' )
        }
        if (searchbar.searchbar && searchbar.searchbar.length>0){
            saveToCookies(searchbar.searchbar)
            debouncedGetResponse.current(searchbar.searchbar)
        }
    },[])

    useEffect(()=>{
        console.log('useEffect2')
        debouncedGetResponse.current(searchbar.searchbar);
    },[allergens])

    const handleTextChange = (input) =>{
        saveToCookies(input.target.value)
    }
    
    const handleSubmit = async (event) =>{
        console.log('submitting')
        event.preventDefault()
        debouncedGetResponse.current(textbar);
        navigate('/')
    }

    const getResponse = async(initialInput=textbar) => {
        console.log('initialInput in getresponse:', initialInput)
        let allergenText = ``
        if (curAllergen){
            allergenText=`&health=${allergenList[curAllergen]}`
        }
        try {
            let foodResponse
            const sendAllergens = filteredAllergens()
            // foodResponse = await axios.get(`http://localhost:5001/api/foods?name=${encodeURIComponent(initialInput)}&page=1`)
            foodResponse = await axios.post(`http://localhost:5001/api/foods?page=1`, {
                name: initialInput, 
                excludeIngredients: sendAllergens
            })
            console.log('foodresponse:', foodResponse)
            // const foodResponse = await axios.get(`https://api.edamam.com/api/food-database/v2/parser?app_id=3b4e6a49&app_key=8d49f61369d7dda4935235b21c07a612&ingr=${initialInput}&nutrition-type=cooking${allergenText}`);
            // const recipeResponse = await axios.get(`https://api.edamam.com/api/recipes/v2?type=public&q=${initialInput}&app_id=b5bdebe7&app_key=%2020298931767c31f1e76a6473d8cdd7bc`)
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
        Object.keys(allergens).map((key)=>{
            const lowerKey = key.toLowerCase()
            if (allergens[key]) allergensArr.push(lowerKey)
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