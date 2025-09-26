import React, { useState, useEffect, useMemo } from 'react'
import FoodCard from '../FoodCard/FoodCard'
import RecipeCard from '../RecipeCard/RecipeCard'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setProducts } from '../../redux/productSlice'
import { addRecipes } from '../../redux/recipeSlice'
import { searchProductsFromSupabasePure, searchRecipesFromSupabasePure } from '../../utils/supabaseQueries'
// 🚀 NEW: Import pagination actions and selectors
import { 
    setCurrentPage, 
    setPaginationInfo,
    selectCurrentPage,
    selectItemsPerPage,
    selectTotalItems,
    selectTotalPages
} from '../../redux/searchPreferencesSlice'
import './ShowResults.css'

const ShowResults = () => {
    const products = useSelector((state) => state.products?.productsResults || [])
    const recipes = useSelector((state) => state.recipes?.recipesResults || [])
    const textbar = useSelector((state) => state.searchbar?.searchbar || '')
    const allergies = useSelector((state) => state.allergies?.allergies || {})
    // 🚀 NEW: Get pagination state from Redux
    const currentPage = useSelector(selectCurrentPage)
    const itemsPerPage = useSelector(selectItemsPerPage)
    const totalItems = useSelector(selectTotalItems)
    const totalPages = useSelector(selectTotalPages)
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const [recipePage, setRecipePage] = useState(1) // Keep recipe pagination local
    const [productLoading, setProductLoading] = useState(false)
    const [recipeLoading, setRecipeLoading] = useState(false)
    const [productError, setProductError] = useState(null)
    const [recipeError, setRecipeError] = useState(null)
    // 🚀 FIXED: Removed productPage local state - use only Redux state for products
    // Recipes still use local state since they don't conflict

    useEffect(() => {
        setRecipePage(1) // Reset recipe pagination when search/filters change
    }, [textbar, allergies])

    const handleProductPageChange = async (newPage) => {
        try {
            setProductLoading(true)
            setProductError(null)
            
            // 🚀 NEW: Update Redux pagination state
            dispatch(setCurrentPage(newPage))
            
            const sendAllergens = Object.keys(allergies).filter(key => allergies[key]).map(key => key.toLowerCase())
            
            console.log('[ShowResults] 🔄 Pagination request:', {
                searchTerm: textbar,
                page: newPage,
                allergens: sendAllergens,
                itemsPerPage: itemsPerPage
            });
            
            // Use Supabase query with count support
            const response = await searchProductsFromSupabasePure({
                name: textbar || '',
                page: newPage,
                limit: itemsPerPage, // 🚀 NEW: Use items per page from Redux
                allergens: sendAllergens,
                includeCount: true
            })
            
            console.log('[ShowResults] 📊 Pagination response:', {
                hasProducts: !!response.products,
                productCount: response.products?.length || 0,
                totalCount: response.totalCount,
                totalPages: response.totalPages,
                page: response.page
            });
            
            // 🚀 FIXED: Handle response format and ensure pagination state is valid
            if (response.products) {
                // New format with count
                dispatch(setProducts({
                    products: response.products,
                    totalCount: response.totalCount,
                    page: response.page,
                    totalPages: response.totalPages
                }))
                
                // 🚀 FIXED: Ensure pagination info is valid (prevent "1 / 0")
                const validTotalPages = Math.max(1, response.totalPages || 1);
                const validTotalCount = Math.max(0, response.totalCount || 0);
                
                dispatch(setPaginationInfo({
                    totalItems: validTotalCount,
                    totalPages: validTotalPages,
                    currentPage: newPage
                }))
                
                console.log(`[ShowResults] ✅ Products page ${newPage} loaded successfully: ${response.products.length} products, ${validTotalCount} total, ${validTotalPages} pages`);
            } else {
                // Fallback to direct array
                dispatch(setProducts(response))
                
                // 🚀 FIXED: Set default pagination for fallback
                dispatch(setPaginationInfo({
                    totalItems: response.length || 0,
                    totalPages: Math.max(1, Math.ceil((response.length || 0) / itemsPerPage)),
                    currentPage: newPage
                }))
            }
            
        } catch (error) {
            console.error('[ShowResults] Error fetching products:', error)
            setProductError('Failed to load products')
            
            // 🚀 FIXED: Don't update pagination state on error to prevent corruption
            console.log('[ShowResults] ⚠️ Error occurred, keeping current pagination state');
        } finally {
            setProductLoading(false)
        }
    }

    const handleRecipePageChange = async (newPage) => {
        try {
            setRecipeLoading(true)
            setRecipeError(null)
            
            // 🎯 RECIPES SHOULD NEVER BE FILTERED BY ALLERGENS
            // Recipes should always show all recipes regardless of allergen toggles
            // Only products should be filtered by allergens
            
            // Use Supabase query with count support
            const response = await searchRecipesFromSupabasePure({
                search: textbar || '',
                page: newPage,
                limit: 10,
                excludeIngredients: [], // Never exclude recipes based on allergens
                includeCount: true
            })
            
            // Handle the response format
            if (response.recipes) {
                // New format with count
                dispatch(addRecipes({
                    recipes: response.recipes,
                    totalCount: response.totalCount,
                    page: response.page,
                    totalPages: response.totalPages
                }))
            } else {
                // Fallback to direct array
                dispatch(addRecipes(response))
            }
            
            setRecipePage(newPage)
            console.log(`[ShowResults] Recipes page ${newPage} loaded successfully`)
            
        } catch (error) {
            console.error('[ShowResults] Error fetching recipes:', error)
            setRecipeError('Failed to load recipes')
        } finally {
            setRecipeLoading(false)
        }
    }

    const navToCatagories = () => {
        navigate('/catagories')
    }

    // Memoize recipeList and productList to avoid unnecessary recalculation
    const recipeList = useMemo(() => {
        if (Array.isArray(recipes)) {
            // Direct array format
            return recipes;
        } else if (recipes && Array.isArray(recipes.recipes)) {
            // New format with count - recipes.recipes array
            return recipes.recipes;
        } else {
            return [];
        }
    }, [recipes]);
    
    // Fix for new Supabase format - products can be array or object with products array
    const productList = useMemo(() => {
        if (Array.isArray(products)) {
            // Direct array format
            return products;
        } else if (products && Array.isArray(products.products)) {
            // New format with count - products.products array
            return products.products;
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
    console.log('[ShowResults] Redux state structure:', {
        productsType: typeof products,
        productsIsArray: Array.isArray(products),
        productsKeys: products && typeof products === 'object' ? Object.keys(products) : 'N/A',
        hasProductsProperty: products && products.products ? 'YES' : 'NO'
    });

    // 🚀 NEW: Calculate product range using Redux pagination state
    const startIdx = (currentPage - 1) * itemsPerPage + 1;
    const endIdx = Math.min(startIdx + productList.length - 1, totalItems);

    // Calculate recipe range for display
    const recipeTotalCount = recipes && recipes.totalCount ? recipes.totalCount : (Array.isArray(recipes) ? recipes.length : 0);
    const recipeTotalPages = recipes && recipes.totalPages ? recipes.totalPages : 1;
    const recipeStartIdx = (recipePage - 1) * 10 + 1;
    const recipeEndIdx = recipeStartIdx + recipeList.length - 1;

    // Fix pagination for new Supabase format with count support
    const productTotalCount = Array.isArray(products) ? products.length : (products && products.totalCount ? products.totalCount : 0);
    const productTotalPages = products && products.totalPages ? products.totalPages : 1;
    
    // Debug logging for pagination values
    console.log('[ShowResults] Pagination Debug:', {
        productsType: typeof products,
        productsIsArray: Array.isArray(products),
        productsTotalCount: products?.totalCount,
        calculatedProductTotalCount: productTotalCount,
        calculatedProductTotalPages: productTotalPages,
        recipeTotalCount: recipeTotalCount,
        recipeTotalPages: recipeTotalPages
    });

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
                            {totalItems ? `Showing ${startIdx}-${endIdx} of ${totalItems.toLocaleString()}` : ''}
                        </span>
                        <div className="pagination-controls">
                            <button 
                                onClick={() => handleProductPageChange(currentPage - 1)} 
                                disabled={currentPage <= 1}
                                className="pagination-button"
                            >
                                Prev
                            </button>
                            <span className="page-number">{currentPage} / {totalPages.toLocaleString()}</span>
                            <button 
                                onClick={() => handleProductPageChange(currentPage + 1)} 
                                disabled={currentPage >= totalPages}
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
                            {recipeTotalCount ? `Showing ${recipeStartIdx}-${recipeEndIdx} of ${recipeTotalCount.toLocaleString()}` : ''}
                        </span>
                        <div className="pagination-controls">
                            <button 
                                onClick={() => handleRecipePageChange(recipePage - 1)} 
                                disabled={recipePage <= 1}
                                className="pagination-button"
                            >
                                Prev
                            </button>
                            <span className="page-number">{recipePage} / {recipeTotalPages.toLocaleString()}</span>
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