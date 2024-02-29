import React, {useState} from 'react'
import './SearchAndFilter.css'

import Searchbar from '../Searchbar/Searchbar'
import ShowResults from '../ShowResults'
import AllergyFilter from '../AllergyFilter/AllergyFilter'

const SearchAndFilter = () => {

    const [allergenFilters, setAllergenFilters] = useState({})
    const [curAllergen, setCurAllergen] = useState('')

    return (
        <div>
            <div className='navbar'>
                <p>Dynable</p>
            </div>
            <div className='searchbar'>
                <p>Searchbar</p>
                <Searchbar 
                    curAllergen={curAllergen} 
                    setCurAllergen={setCurAllergen}
                    />
            </div>
            <div className='Filters'>
                <p>Filters</p>
                <AllergyFilter 
                    allergenFilters={allergenFilters} 
                    setAllergenFilters={setAllergenFilters} 
                    setCurAllergen={setCurAllergen}
                    curAllergen={curAllergen}
                    />
            </div>
        </div>
    )
}

export default SearchAndFilter