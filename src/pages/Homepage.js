import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import SearchAndFilter from '../components/SearchAndFilter/SearchAndFilter'
import ShowResults from '../components/ShowResults'
import { setProducts } from '../redux/productSlice'
import { addRecipes } from '../redux/recipeSlice'
import './Homepage.css'
import { useNavigate } from 'react-router-dom';
import { searchProductsFromSupabasePure, searchRecipesFromSupabasePure } from '../utils/supabaseQueries'

const Homepage = () => {
    const dispatch = useDispatch()
    const allergies = useSelector((state) => state.allergies?.allergies || [])
    const navigate = useNavigate();

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // ENABLED FOR SUPABASE PURE TESTING
                // Load initial products with count
                const foodResponse = await searchProductsFromSupabasePure({
                    name: '',
                    page: 1,
                    limit: 10,
                    allergens: [],
                    includeCount: true
                });
                
                // Load initial recipes with count
                const recipeResponse = await searchRecipesFromSupabasePure({
                    search: '',
                    excludeIngredients: [],
                    page: 1,
                    limit: 10,
                    includeCount: true
                });
                
                console.log('[SUPABASE PURE] Initial data loaded:', { 
                    products: foodResponse.products ? foodResponse.products.length : foodResponse.length,
                    recipes: recipeResponse.recipes ? recipeResponse.recipes.length : recipeResponse.length,
                    productTotalCount: foodResponse.totalCount,
                    recipeTotalCount: recipeResponse.totalCount
                });
                
                dispatch(setProducts(foodResponse))
                dispatch(addRecipes(recipeResponse))
            } catch (error) {
                console.error('Error loading initial data:', error);
            }
        };

        loadInitialData();
    }, [dispatch]);

    // 🚨 FIXED: Trigger search when allergies change (for allergen restoration)
    useEffect(() => {
        const loadFilteredData = async () => {
            try {
                // Get selected allergens - keep camelCase format
                const selectedAllergens = Object.keys(allergies).filter(key => allergies[key]);
                
                if (selectedAllergens.length > 0) {
                    console.log('[HOMEPAGE] Allergies changed, loading filtered data:', selectedAllergens);
                    
                    // Load filtered products
                    const foodResponse = await searchProductsFromSupabasePure({
                        name: '',
                        page: 1,
                        limit: 10,
                        allergens: selectedAllergens,
                        includeCount: true
                    });
                    
                    // Load recipes (never filtered by allergens)
                    const recipeResponse = await searchRecipesFromSupabasePure({
                        search: '',
                        excludeIngredients: [],
                        page: 1,
                        limit: 10,
                        includeCount: true
                    });
                    
                    console.log('[HOMEPAGE] Filtered data loaded:', { 
                        products: foodResponse.products ? foodResponse.products.length : foodResponse.length,
                        recipes: recipeResponse.recipes ? recipeResponse.recipes.length : recipeResponse.length,
                        allergens: selectedAllergens
                    });
                    
                    dispatch(setProducts(foodResponse))
                    dispatch(addRecipes(recipeResponse))
                }
            } catch (error) {
                console.error('Error loading filtered data:', error);
            }
        };

        // Only trigger if we have allergies (not on initial load)
        const hasAllergies = Object.values(allergies).some(value => value === true);
        if (hasAllergies) {
            loadFilteredData();
        }
    }, [allergies, dispatch]);

    return (
        <div className="homepage">
            <div className="content-wrapper">
                <SearchAndFilter />
                <ShowResults />
            </div>
            <hr style={{ margin: '64px 0 32px 0', border: 'none', borderTop: '4px solid #3a7bd5', width: '85%', marginLeft: 'auto', marginRight: 'auto', boxShadow: '0 2px 8px rgba(58,123,213,0.15)' }} />
            <div className="homepage-bottom-section">
                <div className="homepage-footer-nav-container">
                    <button id="footer-btn-about" className="homepage-footer-nav-button" onClick={() => navigate('/about')}>
                        <span id="footer-icon-about" className="homepage-footer-nav-icon">🏢</span>
                        <span id="footer-text-about" className="homepage-footer-nav-text">About Us</span>
                    </button>
                    <button id="footer-btn-team" className="homepage-footer-nav-button" onClick={() => navigate('/about/team')}>
                        <span id="footer-icon-team" className="homepage-footer-nav-icon">👥</span>
                        <span id="footer-text-team" className="homepage-footer-nav-text">Meet the Team</span>
                    </button>
                    <button id="footer-btn-experience" className="homepage-footer-nav-button" onClick={() => navigate('/about/experience')}>
                        <span id="footer-icon-experience" className="homepage-footer-nav-icon">🎯</span>
                        <span id="footer-text-experience" className="homepage-footer-nav-text">Your Experience</span>
                    </button>
                    <button id="footer-btn-feedback" className="homepage-footer-nav-button" onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSei-0i45voDypmG7QO4X4FCaqKvX40gRg2j2heSUMz8IHtZyw/viewform', '_blank')}>
                        <span id="footer-icon-feedback" className="homepage-footer-nav-icon">💬</span>
                        <span id="footer-text-feedback" className="homepage-footer-nav-text">Give Feedback</span>
                    </button>
                </div>
            </div>
            <footer className="homepage-footer">
                <span className="copyright">© 2025 Dynable. All rights reserved.</span>
            </footer>
        </div>
    )
}

export default Homepage