import React, {useState} from 'react'
import FoodCard from './FoodCard/FoodCard'
import RecipeCard from './RecipeCard/RecipeCard'

const ShowResults = ({foodResults, recipeResults}) =>{

    console.log('recipe data:', recipeResults)
    const [renderItems, setRenderItems] = useState('food')

    const onSelection = (event) =>{
        console.log(event.target.value)
        setRenderItems(event.target.value)
    }

    if (Object.values(foodResults).length>0){
        return(
            <div>
            Showing results for : {foodResults.text}
            <div>
                <button value='food' onClick={onSelection} >Food</button>
                <button value='recipe' onClick={onSelection}>Recipe</button>
            </div>
            {renderItems==='recipe'?
                recipeResults.hits.map((recipe,key)=>{
                    return <RecipeCard key={key} recipe={recipe} />
                }):null
            }
            {renderItems==='food'?
                foodResults.hints.map((foodItem, key) =>{
                    return <FoodCard key={key} foodItem={foodItem}/>
                }):null
            }
            </div>
        )
    }
}

export default ShowResults