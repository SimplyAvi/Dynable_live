/**
 * Search and Filter Component
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * Combined search and allergy filter functionality:
 * - Search bar for product/recipe search
 * - Allergy filter selection
 * - State management for filters
 * - Navigation handling
 * 
 * Components:
 * - Searchbar: Text search input
 * - AllergyFilter: Allergy selection interface
 */

import React, {useState} from 'react'
import './SearchAndFilter.css'

import Searchbar from '../Searchbar/Searchbar'
import AllergyFilter from '../AllergyFilter/AllergyFilter'
import { useNavigate } from 'react-router-dom'
import Homepage from '../../pages/Homepage'

const SearchAndFilter = () => {

    const navigate = useNavigate();
    const [allergenFilters, setAllergenFilters] = useState({})
    const [curAllergen, setCurAllergen] = useState('')

    const onClickToHomepage = () => {
        navigate('/')
    }

    return (
        <div>
          
            <div className='search-and-filter'>
                
                <Searchbar 
                    curAllergen={curAllergen} 
                    setCurAllergen={setCurAllergen}
                    />
            </div>
            <div className='filter-section"'>
                <h3 className="filter-header">Scroll to select allergies to avoid →</h3>

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