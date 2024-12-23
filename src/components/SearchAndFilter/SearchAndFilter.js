import React, {useState} from 'react'
import './SearchAndFilter.css'

import Searchbar from '../Searchbar/Searchbar'
import AllergyFilter from '../AllergyFilter/AllergyFilter'
import { useNavigate } from 'react-router'

const SearchAndFilter = () => {

    const navigate = useNavigate();
    const [allergenFilters, setAllergenFilters] = useState({})
    const [curAllergen, setCurAllergen] = useState('')

    const onClickToHomepage = () => {
        navigate('/')
    }

    return (
        <div>
            <div className='navbar' onClick={onClickToHomepage}>
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
                <p>Allergy Filters</p>
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