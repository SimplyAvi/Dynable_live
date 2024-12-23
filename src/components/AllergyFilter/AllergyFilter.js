import React, {useEffect} from 'react'
import {useCookies} from 'react-cookie'

import allergensList from '../../allergensList'
import './AllergyFilter.css'

const AllergyFilter = ({allergenFilters, setAllergenFilters, setCurAllergen, curAllergen}) =>{

    const [filters, setFilters] = useCookies(['allergens'])
    
    useEffect(()=>{
        setFilters('allergens',{})
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
        <div className='horizontal-scroll-container'> 
         
            <div className="horizontal-scroll">
           
            
            {Object.keys(allergenFilters).map((filter, key)=>{
                return (
                <div className="scroll-item" key={key}>
                    <button class="avi3" className={allergenFilters[filter]? 'filter-false': 'filter-true'} value={filter} onClick={handleClick}>{filter}</button>
                </div>
                )
            })}
             </div>
        </div>
    )
}

export default AllergyFilter