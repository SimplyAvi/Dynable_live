import React, { useEffect } from 'react'
import axios from 'axios'
import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router'
import { useDispatch, useSelector } from 'react-redux';
import { addProducts } from '../../redux/productSlice';
import { addRecipes } from '../../redux/recipeSlice';
import { useSearchCookieHandler } from '../../helperfunc/useCookieHandler';
import FormInput from '../FormInput'
import './Searchbar.css'

const Searchbar = ({ curAllergen }) => {

    const textbar = useSelector((state)=> state.searchbar.searchbar)
    const [searchbar, setSearchbar] = useCookies(['searchbar']);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {saveToCookies} = useSearchCookieHandler();

    useEffect(()=>{
        if (searchbar.searchbar.length>0){
            saveToCookies(searchbar.searchbar)
            getResponse(searchbar.searchbar)
        }
    },[])

    const handleTextChange = (input) =>{
        saveToCookies(input.target.value)
    }
    
    const handleSubmit = async (event) =>{
        event.preventDefault()
        getResponse()
        navigate('/')
    }

    const getResponse = async(initialInput=textbar) => {
        console.log('initialInput in getresponse:', initialInput)
        let allergenText = ``
        if (curAllergen){
            allergenText=`&health=${curAllergen}`
        }
        try {
            const foodResponse = await axios.get(`https://api.edamam.com/api/food-database/v2/parser?app_id=3b4e6a49&app_key=8d49f61369d7dda4935235b21c07a612&ingr=${initialInput}&nutrition-type=cooking${allergenText}`);
            const recipeResponse = await axios.get(`https://api.edamam.com/api/recipes/v2?type=public&q=${initialInput}&app_id=b5bdebe7&app_key=%2020298931767c31f1e76a6473d8cdd7bc&${allergenText}`)
            dispatch(addProducts(foodResponse.data))
            dispatch(addRecipes(recipeResponse.data))
        } catch (error) {
            console.error(error);
        }
    }

    return(
        <div>
            <form onSubmit={handleSubmit}>
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