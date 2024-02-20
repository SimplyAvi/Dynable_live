import React from 'react'
import Searchbar from '../components/Searchbar'

const Homepage = () => {

    return (
        <div>
            <div className='navbar'>
                <p>Dynable</p>
                <p>login/logout</p>
            </div>
            <div className='searchbar'>
                <p>Searchbar</p>
            </div>
            <div className='Filters'>
                <p>Filters</p>
            </div>
            <div className='search-results'>
                <p>Search Results</p>
                <Searchbar/>
            </div>
        </div>
    )
}

export default Homepage