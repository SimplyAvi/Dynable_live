import React, {useState} from 'react'
import FormInput from './FormInput'

const Searchbar = () => {

    const [searchVal, setSearchVal] = useState('')

    const textChange = (input) =>{
        console.log(input.target)
        setSearchVal(input.target.value)
    }

    return(
        <div>
            <FormInput  name='searchText' type='text' value={searchVal} label='Search Here' handleChange={textChange}/>
        </div>
    )
}

export default Searchbar