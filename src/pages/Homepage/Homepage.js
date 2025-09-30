import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import SearchAndFilter from '../../components/SearchAndFilter/SearchAndFilter'
import ShowResults from '../../components/ShowResults/ShowResults'
import { setProducts } from '../../redux/productSlice'
import { addRecipes } from '../../redux/recipeSlice'
import './Homepage.css'
import { useNavigate } from 'react-router-dom';
import { 
  searchProductsUnified,
  searchRecipesFromSupabasePure,
  resilientSupabaseQuery 
} from '../../utils/supabaseQueries'
import { setPaginationInfo } from '../../redux/searchPreferencesSlice'

const Homepage = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    
    // Get state from Redux with memoized selectors
    const selectedAllergens = useSelector(state => state.searchPreferences?.selectedAllergens || [], (left, right) => 
        JSON.stringify(left) === JSON.stringify(right)
    )
    const searchTerm = useSelector(state => state.search?.searchTerm || '')
    const isAuthenticated = useSelector(state => state.auth?.isAuthenticated || false)
    const anonymousSession = useSelector(state => state.auth?.anonymousSession || null)
    
    const queryControllerRef = useRef(null)

    useEffect(() => {
        // Skip if there's an active search
        if (searchTerm && searchTerm.trim() !== '') {
            return;
        }
        
        // Always load data for homepage - let the session management handle authentication
        console.log('[HOMEPAGE] Loading homepage data');
        
        // Small delay to let session initialization complete
        const timeoutId = setTimeout(() => {
            // Cancel any previous queries
            if (queryControllerRef.current) {
                queryControllerRef.current.abort();
            }

            // Create new abort controller for this query
            queryControllerRef.current = new AbortController();

            const loadData = async () => {
                try {
                    // Load products
                    const foodResponse = await resilientSupabaseQuery(
                        () => searchProductsUnified({
                            page: 1,
                            limit: 20,
                            searchTerm: '',
                            allergens: selectedAllergens,
                            userType: isAuthenticated ? 'authenticated' : 'anonymous',
                            includeCount: true
                        }),
                        {
                            operationName: 'unified_product_search',
                            timeout: 30000,
                            maxRetries: 3,
                            abortController: queryControllerRef.current
                        }
                    );
                    
                    // Load recipes
                    const recipeResponse = await resilientSupabaseQuery(
                        () => searchRecipesFromSupabasePure({
                            search: '',
                            excludeIngredients: [],
                            page: 1,
                            limit: 10,
                            includeCount: true
                        }),
                        {
                            operationName: 'recipes_load',
                            timeout: 15000,
                            maxRetries: 2,
                            abortController: queryControllerRef.current
                        }
                    );
                    
                    console.log('[HOMEPAGE] ✅ Data loaded successfully');
                    
                    // Set pagination info for products
                    if (foodResponse) {
                        const totalItems = foodResponse.totalCount || foodResponse.products?.length || 0;
                        const totalPages = foodResponse.totalPages || Math.max(1, Math.ceil(totalItems / 20));
                        const currentPage = foodResponse.page || 1;
                        
                        dispatch(setPaginationInfo({
                            totalItems: totalItems,
                            totalPages: totalPages,
                            currentPage: currentPage
                        }));
                        
                        console.log('[HOMEPAGE] 📊 Pagination set:', { totalItems, totalPages, currentPage });
                    }
                    
                    dispatch(setProducts(foodResponse))
                    dispatch(addRecipes(recipeResponse))
                    
                } catch (error) {
                    if (error.name === 'AbortError') {
                        return;
                    }
                    console.error('[HOMEPAGE] Error loading data:', error);
                }
            };

            loadData();
        }, 500); // 500ms delay

        return () => {
            clearTimeout(timeoutId);
            if (queryControllerRef.current) {
                queryControllerRef.current.abort();
            }
        };
    }, [selectedAllergens, searchTerm, isAuthenticated, dispatch, anonymousSession]);

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