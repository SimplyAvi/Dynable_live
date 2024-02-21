import React, {useState} from 'react'
import FormInput from './FormInput'

import './Searchbar.css'

const Searchbar = () => {

    const [searchVal, setSearchVal] = useState('')

    const handleTextChange = (input) =>{
        console.log(input.target)
        setSearchVal(input.target.value)
    }
    
    const handleSubmit = () =>{
        console.log('submit')
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