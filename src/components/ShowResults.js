import React, { useState, useEffect } from 'react'
import FoodCard from './FoodCard/FoodCard'
import RecipeCard from './RecipeCard/RecipeCard'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { setProducts } from '../redux/productSlice'
import './ShowResults.css'

const ShowResults = () => {
    const products = useSelector((state) => state.products.productsResults)
    const recipes = useSelector((state) => state.recipes.recipesResults)
    const textbar = useSelector((state) => state.searchbar.searchbar)
    const allergies = useSelector((state) => state.allergies.allergies)
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const [productPage, setProductPage] = useState(1)
    const [recipePage, setRecipePage] = useState(1)

    useEffect(() => {
        setProductPage(1)
        setRecipePage(1)
    }, [textbar, allergies])

    const handleProductPageChange = async (newPage) => {
        try {
            const sendAllergens = Object.keys(allergies).filter(key => allergies[key]).map(key => key.toLowerCase())
            const response = await axios.post(`http://localhost:5001/api/foods?name=${textbar}&page=${newPage}&limit=10`, {
                excludeIngredients: sendAllergens
            })
            dispatch(setProducts(response.data))
            setProductPage(newPage)
        } catch (error) {
            console.error('Error fetching products:', error)
        }
    }

    const handleRecipePageChange = async (newPage) => {
        try {
            const sendAllergens = Object.keys(allergies).filter(key => allergies[key]).map(key => key.toLowerCase())
            const response = await axios.post(`http://localhost:5001/api/recipe/?page=${newPage}&limit=10`, {
                search: textbar,
                excludeIngredients: sendAllergens
            })
            dispatch({ type: 'recipes/addRecipes', payload: response.data })
            setRecipePage(newPage)
        } catch (error) {
            console.error('Error fetching recipes:', error)
        }
    }

    const navToCatagories = () => {
        navigate('/catagories')
    }

    const recipeList = Array.isArray(recipes) ? recipes : [];
    const productList = products && Array.isArray(products.foods) ? products.foods : [];

    const hasProducts = productList.length > 0;
    const hasRecipes = recipeList.length > 0;

    // Debug log for recipes
    console.log('recipes:', recipes);

    // Calculate product range for display
    const startIdx = (productPage - 1) * 10 + 1;
    const endIdx = startIdx + productList.length - 1;

    // Calculate recipe range for display
    const recipeTotalCount = recipes && recipes.totalCount ? recipes.totalCount : (Array.isArray(recipes) ? recipes.length : 0);
    const recipeTotalPages = recipes && recipes.totalPages ? recipes.totalPages : 1;
    const recipeStartIdx = (recipePage - 1) * 10 + 1;
    const recipeEndIdx = recipeStartIdx + recipeList.length - 1;

    if (!hasProducts && !hasRecipes) {
        return (
            <div className="results-container no-results-message">
                <h3>No products or recipes found for your search/filter.</h3>
            </div>
        );
    }

    return (
        <div className="results-container">
            {hasProducts && (
                <div className="section-wrapper">
                    <div className="section-header">
                        <span className="results-count">
                            {products.totalCount ? `Showing ${startIdx}-${endIdx} of ${products.totalCount}` : ''}
                        </span>
                        <h3>Products</h3>
                        <div className="pagination-controls">
                            <button 
                                onClick={() => handleProductPageChange(productPage - 1)} 
                                disabled={productPage <= 1}
                                className="pagination-button"
                            >
                                Prev
                            </button>
                            <span className="page-number">{productPage} / {products.totalPages || 1}</span>
                            <button 
                                onClick={() => handleProductPageChange(productPage + 1)} 
                                disabled={productPage >= (products.totalPages || 1)}
                                className="pagination-button"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                    <section className="results-section">
                        <div className="horizontal-scroll-container">
                            <div className="horizontal-scroll">
                                {productList.map((foodItem, key) => (
                                    <div className="scroll-item" key={key}>
                                        <FoodCard foodItem={foodItem} id={foodItem.id} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            )}
            {hasRecipes && (
                <div className="section-wrapper" style={{ marginTop: '2rem' }}>
                    <div className="section-header">
                        <span className="results-count">
                            {recipeTotalCount ? `Showing ${recipeStartIdx}-${recipeEndIdx} of ${recipeTotalCount}` : ''}
                        </span>
                        <h3>Recipes</h3>
                        <div className="pagination-controls">
                            <button 
                                onClick={() => handleRecipePageChange(recipePage - 1)} 
                                disabled={recipePage <= 1}
                                className="pagination-button"
                            >
                                Prev
                            </button>
                            <span className="page-number">{recipePage} / {recipeTotalPages}</span>
                            <button 
                                onClick={() => handleRecipePageChange(recipePage + 1)} 
                                disabled={recipePage >= recipeTotalPages}
                                className="pagination-button"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                    <section className="results-section">
                        <div className="horizontal-scroll-container">
                            <div className="horizontal-scroll">
                                {recipeList.map((recipe, key) => (
                                    <div className="scroll-item" key={key}>
                                        <RecipeCard recipe={recipe} id={recipe.id} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

export default ShowResults