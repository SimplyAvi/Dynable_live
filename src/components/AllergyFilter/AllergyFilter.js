import React, {useEffect} from 'react'
import {useCookies} from 'react-cookie'

import allergensList from '../../allergensList'
import './AllergyFilter.css'

const AllergyFilter = ({allergenFilters, setAllergenFilters, setCurAllergen, curAllergen}) =>{

    const [filters, setFilters] = useCookies(['allergens'])
    
<<<<<<< HEAD
    useEffect(() => {
        if (!filters.allergens) {
            let filterMap = {}
            Object.values(allergensList).map(filter=>{
                filterMap[filter] = false
            })
            setAllergenFilters(filterMap)
            setFilters('allergens', filterMap)
        }
=======
    useEffect(()=>{
        // setFilters('allergens',{})
>>>>>>> 42e197134674d02a791f27b56df247d26820b62c
        if(Object.keys(filters.allergens).length>0){
            setAllergenFilters(filters.allergens)
            Object.keys(filters.allergens).map(filter=>{
                if(filters.allergens[filter]){
                    console.log('filter:', filter)
                    setCurAllergen(filter)
                }
            })
        } else {
            let filterMap = {}
            Object.values(allergensList).map(filter=>{
                filterMap[filter] = false
            })
            setAllergenFilters(filterMap)
            setFilters('allergens', filterMap)
        }
    },[])
    
    const handleClick=(event) =>{
        const curVal = event.target.value
        const flippedCurVal = !allergenFilters[curVal]
        flippedCurVal?setCurAllergen(curVal): setCurAllergen('')
        console.log('flipped val:', curVal, flippedCurVal)
        setAllergenFilters({...allergenFilters, [curVal]:flippedCurVal})
        setFilters('allergens', {...allergenFilters, [curVal]:flippedCurVal})
    }

    return(
        <div>
            AllergyFilter
            {Object.keys(allergenFilters).map((filter, key)=>{
                return (
                <div key={key}>
                    <button className={allergenFilters[filter]? 'filter-false': 'filter-true'} value={filter} onClick={handleClick}>{filter}</button>
                </div>
                )
            })}
        </div>
    )
}

export default AllergyFilter