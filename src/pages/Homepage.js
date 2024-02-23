import React, {useState} from 'react'
import Searchbar from '../components/Searchbar/Searchbar'
import ShowResults from '../components/ShowResults'
import AllergyFilter from '../components/AllergyFilter/AllergyFilter'

const Homepage = () => {

    const [foodResults, setFoodResults] = useState({})
    const [recipeResults, setRecipeResults] = useState({})
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
                    setFoodResults={setFoodResults} 
                    setRecipeResults={setRecipeResults}
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
                    />
            </div>
            <div className='search-results'>
                <p>Search Results</p>
                <ShowResults foodResults={foodResults} recipeResults={recipeResults}/>
            </div>
        </div>
    )
}

export default Homepage