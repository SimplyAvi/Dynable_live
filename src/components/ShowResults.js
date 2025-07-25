import React, { useState, useEffect, useMemo } from 'react'
import FoodCard from './FoodCard/FoodCard'
import RecipeCard from './RecipeCard/RecipeCard'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { setProducts } from '../redux/productSlice'
import './ShowResults.css'

const ShowResults = () => {
    const products = useSelector((state) => state.products?.productsResults || [])
    const recipes = useSelector((state) => state.recipes?.recipesResults || [])
    const textbar = useSelector((state) => state.searchbar?.searchbar || '')
    const allergies = useSelector((state) => state.allergies?.allergies || {})
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
            const params = new URLSearchParams({
                name: textbar || '',
                page: newPage,
                limit: 10,
                allergens: sendAllergens.join(',')
            });
            // TEMPORARILY DISABLED FOR PURE SUPABASE TESTING
            // Use GET request for product search
            // const response = await axios.get(`http://localhost:5001/api/product/search?${params}`)
            // dispatch(setProducts(response.data))
            // setProductPage(newPage)
            
            console.log('[PURE SUPABASE TEST] ShowResults product search disabled');
        } catch (error) {
            console.error('Error fetching products:', error)
        }
    }

    const handleRecipePageChange = async (newPage) => {
        try {
            const sendAllergens = Object.keys(allergies).filter(key => allergies[key]).map(key => key.toLowerCase())
            const params = new URLSearchParams({
                name: textbar || '',
                page: newPage,
                limit: 10,
                allergens: sendAllergens.join(',')
            });
            // TEMPORARILY DISABLED FOR PURE SUPABASE TESTING
            // const response = await axios.post(`http://localhost:5001/api/recipe/?page=${newPage}&limit=10`, {
            //     search: textbar || '',
            //     excludeIngredients: sendAllergens
            // });
            // dispatch(addRecipes(response.data))
            // setRecipePage(newPage)
            
            console.log('[PURE SUPABASE TEST] ShowResults recipe search disabled');
        } catch (error) {
            console.error('Error fetching recipes:', error)
        }
    }

    const navToCatagories = () => {
        navigate('/catagories')
    }

    // Memoize recipeList and productList to avoid unnecessary recalculation
    const recipeList = useMemo(() => Array.isArray(recipes) ? recipes : [], [recipes]);
    
    // Fix for new Supabase format - products is now a direct array, not wrapped in foods property
    const productList = useMemo(() => {
        if (Array.isArray(products)) {
            // New Supabase format - products is a direct array
            return products;
        } else if (products && Array.isArray(products.foods)) {
            // Old format - products.foods array
            return products.foods;
        } else {
            return [];
        }
    }, [products]);

    const hasProducts = productList.length > 0;
    const hasRecipes = recipeList.length > 0;

    // Debug log for products and recipes
    console.log('[ShowResults] Products:', products);
    console.log('[ShowResults] ProductList:', productList);
    console.log('[ShowResults] Recipes:', recipes);
    console.log('[ShowResults] HasProducts:', hasProducts, 'HasRecipes:', hasRecipes);

    // Calculate product range for display
    const startIdx = (productPage - 1) * 10 + 1;
    const endIdx = startIdx + productList.length - 1;

    // Calculate recipe range for display
    const recipeTotalCount = recipes && recipes.totalCount ? recipes.totalCount : (Array.isArray(recipes) ? recipes.length : 0);
    const recipeTotalPages = recipes && recipes.totalPages ? recipes.totalPages : 1;
    const recipeStartIdx = (recipePage - 1) * 10 + 1;
    const recipeEndIdx = recipeStartIdx + recipeList.length - 1;

    // Fix pagination for new Supabase format
    const productTotalCount = Array.isArray(products) ? products.length : (products && products.totalCount ? products.totalCount : 0);
    const productTotalPages = products && products.totalPages ? products.totalPages : 1;

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
                    <h3>Products</h3>
                    <div className="header-controls">
                        <span className="results-count">
                            {productTotalCount ? `Showing ${startIdx}-${endIdx} of ${productTotalCount}` : ''}
                        </span>
                        <div className="pagination-controls">
                            <button 
                                onClick={() => handleProductPageChange(productPage - 1)} 
                                disabled={productPage <= 1}
                                className="pagination-button"
                            >
                                Prev
                            </button>
                            <span className="page-number">{productPage} / {productTotalPages}</span>
                            <button 
                                onClick={() => handleProductPageChange(productPage + 1)} 
                                disabled={productPage >= productTotalPages}
                                className="pagination-button"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
                    <section className="results-section">
                        <div className="horizontal-scroll-container">
                            <div className="horizontal-scroll">
                                {productList.map((foodItem) => (
                                    <div className="scroll-item" key={foodItem.id}>
                                        <FoodCard foodItem={foodItem} id={foodItem.id} showAddToCart={true} />
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
                    <h3>Recipes</h3>
                    <div className="header-controls">
                        <span className="results-count">
                            {recipeTotalCount ? `Showing ${recipeStartIdx}-${recipeEndIdx} of ${recipeTotalCount}` : ''}
                        </span>
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
                </div>
                    <section className="results-section">
                        <div className="horizontal-scroll-container">
                            <div className="horizontal-scroll">
                                {recipeList.map((recipe) => (
                                    <div className="scroll-item" key={recipe.id}>
                                        <RecipeCard recipe={recipe} id={recipe.id} allergies={allergies} />
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