import React, {useState} from 'react'
import ShowResults from '../components/ShowResults'
import SearchAndFilter from '../components/SearchAndFilter/SearchAndFilter'

const Homepage = () => {

    return (
        <div>
            <SearchAndFilter />
            <div className='search-results'>
                <p>Search Results</p>
                <ShowResults />
            </div>
        </div>
    )
}

export default Homepage