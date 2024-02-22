import React, {useState} from 'react'
import FoodCard from './FoodCard'

const ShowResults = ({searchResults}) =>{

    console.log(searchResults)
    if (Object.values(searchResults).length>0){

        return(
            <div>
            Showing results for : {searchResults.text}
            {searchResults.hints.map((foodItem, key) =>{
                return <FoodCard key={key} foodItem={foodItem}/>
            })}
            </div>
        )
    }
}

export default ShowResults