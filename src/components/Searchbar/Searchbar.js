import React, {useState} from 'react'
import axios from 'axios'

import FormInput from '../FormInput'
import './Searchbar.css'

const Searchbar = ({setFoodResults, curAllergen, setCurAllergen}) => {

    const [searchVal, setSearchVal] = useState('')

    const handleTextChange = (input) =>{
        setSearchVal(input.target.value)
    }
    
    const handleSubmit = async (event) =>{
        event.preventDefault()
        console.log('submitting:', searchVal)
        let allergenText = ``
        if (curAllergen){
            allergenText=`health=${curAllergen}`
        }
        console.log(`https://api.edamam.com/api/food-database/v2/parser?app_id=3b4e6a49&app_key=8d49f61369d7dda4935235b21c07a612&ingr=${searchVal}&nutrition-type=cooking${allergenText}`)
        try {
            const response = await axios.get(`https://api.edamam.com/api/food-database/v2/parser?app_id=3b4e6a49&app_key=8d49f61369d7dda4935235b21c07a612&ingr=${searchVal}&nutrition-type=cooking${allergenText}`);
            setFoodResults(response.data)
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