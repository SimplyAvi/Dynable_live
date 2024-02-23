import React, {useState} from 'react'
import FoodCard from './FoodCard/FoodCard'

const ShowResults = ({foodResults, recipeResults}) =>{

    console.log('recipe data:', recipeResults)

    if (Object.values(foodResults).length>0){
        return(
            <div>
            Showing results for : {foodResults.text}
            {foodResults.hints.map((foodItem, key) =>{
                return <FoodCard key={key} foodItem={foodItem}/>
            })}
            </div>
        )
    }
}

export default ShowResults