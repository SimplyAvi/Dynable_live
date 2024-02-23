import React, {useState} from 'react'
import Searchbar from '../components/Searchbar/Searchbar'
import ShowResults from '../components/ShowResults'
import AllergyFilter from '../components/AllergyFilter/AllergyFilter'

const Homepage = () => {

    const [searchResults, setSearchResults] = useState({})
    const [allergenFilters, setAllergenFilters] = useState({})

    return (
        <div>
            <div className='navbar'>
                <p>Dynable</p>
            </div>
            <div className='searchbar'>
                <p>Searchbar</p>
                <Searchbar setSearchResults={setSearchResults}/>
            </div>
            <div className='Filters'>
                <p>Filters</p>
                <AllergyFilter allergenFilters={allergenFilters} setAllergenFilters={setAllergenFilters}/>
            </div>
            <div className='search-results'>
                <p>Search Results</p>
                <ShowResults searchResults={searchResults}/>
            </div>
        </div>
    )
}

export default Homepage