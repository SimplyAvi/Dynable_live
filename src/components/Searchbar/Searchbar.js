import React, {useState} from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux';
import { addProducts } from '../../redux/productSlice';
import { addRecipes } from '../../redux/recipeSlice';
import FormInput from '../FormInput'
import './Searchbar.css'

const Searchbar = ({ curAllergen, setCurAllergen}) => {

    const [searchVal, setSearchVal] = useState('')

    const dispatch = useDispatch();

    const handleTextChange = (input) =>{
        setSearchVal(input.target.value)
    }
    
    const handleSubmit = async (event) =>{
        event.preventDefault()
        console.log('submitting:', searchVal)
        let allergenText = ``
        if (curAllergen){
            allergenText=`&health=${curAllergen}`
        }
        try {
            const foodResponse = await axios.get(`https://api.edamam.com/api/food-database/v2/parser?app_id=3b4e6a49&app_key=8d49f61369d7dda4935235b21c07a612&ingr=${searchVal}&nutrition-type=cooking${allergenText}`);
            const recipeResponse = await axios.get(`https://api.edamam.com/api/recipes/v2?type=public&q=${searchVal}&app_id=b5bdebe7&app_key=%2020298931767c31f1e76a6473d8cdd7bc&${allergenText}`)
            // setFoodResults(foodResponse.data)
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
                    value={searchVal} 
                    label='Search Here' 
                    placeholder ='search here'
                    handleChange={handleTextChange}/>
                <button className='custom-button' type='button' onClick={handleSubmit}>SUBMIT</button>
            </form>
        </div>
    )
}

export default Searchbar