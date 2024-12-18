import React, {useState} from 'react'
import ShowResults from '../components/ShowResults'
import SearchAndFilter from '../components/SearchAndFilter/SearchAndFilter'
import './Homepage.css'

const Homepage = () => {

    const handleClick= () =>{
        window.open('https://docs.google.com/forms/d/e/1FAIpQLSc3H_Siw2Og_W8EgYSQPB_iPUCV1-cpH4tFOsFsLNK4c5Zttg/viewform?usp=dialog','_blank',"noopener,noreferrer")
    }

    return (
        <div>
            <button className='feedback_button' onClick={handleClick}>Give us feedback</button>
            <SearchAndFilter />
            <div className='search-results'>
                <p>Search Results</p>
                <ShowResults />
            </div>
        </div>
    )
}

export default Homepage