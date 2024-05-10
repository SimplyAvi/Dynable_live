import React, {useState} from 'react'
import FoodCard from './FoodCard/FoodCard'
import RecipeCard from './RecipeCard/RecipeCard'
import { useSelector } from 'react-redux'

const ShowResults = () =>{

    const [renderItems, setRenderItems] = useState('products')

    const products = useSelector((state)=>state.products.productsResults)
    const recipes = useSelector((state)=>state.recipes.recipesResults)

    const onSelection = (event) =>{
        console.log(event.target.value)
        setRenderItems(event.target.value)
    }

    if (Object.values(products).length>0){
        console.log('foods:',products.foods[0])
        console.log('recipes', recipes)
        return(
            <div>
            Showing results for : {products.text}
            <div>
                <button value='products' onClick={onSelection}>Products</button>
                <button value='recipe' onClick={onSelection}>Recipe</button>
            </div>
            {renderItems==='recipe'?
                recipes.map((recipe,key)=>{
                    return <RecipeCard key={key} recipe={recipe} id={recipe.id}/>
                }):null
            }
            {renderItems==='products'?
                products.foods.map((foodItem, key) =>{
                    return <FoodCard key={key} foodItem={foodItem} id={foodItem.id}/>
                }):null
            }
            </div>
        )
    }
}

export default ShowResults