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
                // Load initial products
                const foodResponse = await searchProductsFromSupabasePure({
                    name: '',
                    page: 1,
                    limit: 10,
                    allergens: []
                });
                
                // Load initial recipes
                const recipeResponse = await searchRecipesFromSupabasePure({
                    search: '',
                    excludeIngredients: [],
                    page: 1,
                    limit: 10
                });
                
                console.log('[SUPABASE PURE] Initial data loaded:', { 
                    products: foodResponse.length, 
                    recipes: recipeResponse.length 
                });
                
                dispatch(setProducts(foodResponse))
                dispatch(addRecipes(recipeResponse))
            } catch (error) {
                console.error('Error loading initial data:', error);
            }
        };

        loadInitialData();
    }, [dispatch]);

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