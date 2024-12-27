import React, {useState} from 'react'
import FoodCard from './FoodCard/FoodCard'
import RecipeCard from './RecipeCard/RecipeCard'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import './ShowResults.css'

const ShowResults = () =>{
    const products = useSelector((state)=>state.products.productsResults)
    const recipes = useSelector((state)=>state.recipes.recipesResults)
    const navigate = useNavigate();

    const navToCatagories = () => {
        console.log('Hello from nav button')
        navigate('/catagories')
    }

    if (Object.values(products).length>0){
        return (
            <div className="results-container">
                <div className="header">
                    <div className="hello-world-from-monferd" onClick={navToCatagories}></div>
                    <div className="search-text">{products.text}</div>
                </div>
                
                <section className="results-section">
                    <h3>Products</h3>
                    <div className="horizontal-scroll-container">
                        <div className="horizontal-scroll">
                            {products.foods && products.foods.map((foodItem, key) => (
                                <div className="scroll-item" key={key}>
                                    <FoodCard foodItem={foodItem} id={foodItem.id}/>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="results-section">
                    <h3>Recipes</h3>
                    <div className="horizontal-scroll-container">
                        <div className="horizontal-scroll">
                            {recipes && recipes.map((recipe, key) => (
                                <div className="scroll-item" key={key}>
                                    <RecipeCard recipe={recipe} id={recipe.id}/>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        )
    }
    return null
}

export default ShowResults