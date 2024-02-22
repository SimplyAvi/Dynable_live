import React, {useState} from 'react'
import axios from 'axios'

import FormInput from './FormInput'
import './Searchbar.css'

const Searchbar = () => {

    const [searchVal, setSearchVal] = useState('')
    const [imgUrl, setImgUrl] = useState('')

    const handleTextChange = (input) =>{
        console.log(input.target)
        setSearchVal(input.target.value)
    }
    
    const handleSubmit = async () =>{
        console.log('submitting:', searchVal)
        try {
            const response = await axios.get(`https://api.edamam.com/api/food-database/v2/parser?app_id=3b4e6a49&app_key=8d49f61369d7dda4935235b21c07a612&ingr=${searchVal}&nutrition-type=cooking`);
            console.log(response);
            console.log(response.data.hints[0].food)
            setImgUrl(response.data.hints[0].food.image)
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
            <img src={imgUrl}/>
        </div>
    )
}

export default Searchbar