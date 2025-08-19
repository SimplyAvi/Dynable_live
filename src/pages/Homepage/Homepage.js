import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import SearchAndFilter from '../../components/SearchAndFilter/SearchAndFilter'
import ShowResults from '../../components/ShowResults/ShowResults'
import { setProducts } from '../../redux/productSlice'
import { addRecipes } from '../../redux/recipeSlice'
import './Homepage.css'
import { useNavigate } from 'react-router-dom';
import { 
  searchProductsUnified, // 🎯 NEW: Unified filtering function
  searchProductsSimpleForAnonymous, // 🎯 NEW: Simple filtering for anonymous users
  searchRecipesFromSupabasePure,
  resilientSupabaseQuery 
} from '../../utils/supabaseQueries'

const Homepage = () => {
    const dispatch = useDispatch()
    // 🛡️ FIXED: Use the correct allergen state source - searchPreferences.selectedAllergens
    // This ensures synchronization with AllergyFilter component
    const selectedAllergens = useSelector((state) => state.searchPreferences?.selectedAllergens || [])
    const allergies = useSelector((state) => state.allergies?.allergies || {})
    const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated || false)
    const anonymousSession = useSelector((state) => state.anonymousCart?.session)
    const navigate = useNavigate();

    // 🎯 NEW: Query cancellation and transition state management
    const queryControllerRef = useRef(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const previousAuthStateRef = useRef(isAuthenticated);

    // 🎯 NEW: Detect auth transitions
    useEffect(() => {
        const authStateChanged = previousAuthStateRef.current !== isAuthenticated;
        if (authStateChanged) {
            console.log('[HOMEPAGE] Auth state transition detected:', {
                from: previousAuthStateRef.current,
                to: isAuthenticated
            });
            
            // Set transition flag to prevent competing queries
            setIsTransitioning(true);
            
            // Cancel any ongoing queries
            if (queryControllerRef.current) {
                console.log('[HOMEPAGE] Cancelling ongoing queries during auth transition');
                queryControllerRef.current.abort();
            }
            
            // Clear transition flag after a longer delay to ensure anonymous session is ready
            setTimeout(() => {
                setIsTransitioning(false);
                console.log('[HOMEPAGE] Auth transition completed, queries can resume');
            }, 5000); // 5 second delay to ensure anonymous session is fully established
            
            previousAuthStateRef.current = isAuthenticated;
        }
    }, [isAuthenticated]);

    // 🎯 UNIFIED: Single useEffect with unified filtering logic and query cancellation
    useEffect(() => {
        console.log('[HOMEPAGE] 🔍 useEffect triggered with dependencies:', {
            selectedAllergens: selectedAllergens.length,
            isAuthenticated,
            isTransitioning,
            hasAnonymousSession: !!anonymousSession
        });
        
        // 🎯 NEW: Skip queries during auth transitions
        if (isTransitioning) {
            console.log('[HOMEPAGE] Skipping query - auth transition in progress');
            return;
        }

        // 🎯 NEW: Skip queries if anonymous user but no session is ready
        console.log('[HOMEPAGE] 🔍 Query trigger check:', {
            isAuthenticated,
            hasAnonymousSession: !!anonymousSession,
            anonymousSessionType: typeof anonymousSession,
            isTransitioning,
            selectedAllergens: selectedAllergens,
            allergensCount: selectedAllergens.length
        });
        
        if (!isAuthenticated && !anonymousSession) {
            console.log('[HOMEPAGE] Skipping query - anonymous user but no session ready yet');
            return;
        }

        // 🎯 NEW: Cancel any previous queries
        if (queryControllerRef.current) {
            console.log('[HOMEPAGE] Cancelling previous query');
            queryControllerRef.current.abort();
        }

        // Create new abort controller for this query
        queryControllerRef.current = new AbortController();

        const loadData = async () => {
            try {
                console.log('[HOMEPAGE] 🚀 Loading data with unified filtering:', {
                    selectedAllergens: selectedAllergens,
                    allergensCount: selectedAllergens.length,
                    isAuthenticated,
                    hasAllergens: selectedAllergens.length > 0,
                    isTransitioning,
                    userType: isAuthenticated ? 'authenticated' : 'anonymous'
                });
                
                // 🎯 UNIFIED: Single filtering function for ALL users
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
                        timeout: 30000, // 🎯 INCREASED: Longer timeout for post-logout queries
                        maxRetries: 3, // 🎯 INCREASED: More retries for post-logout queries
                        abortController: queryControllerRef.current // 🎯 NEW: Pass abort controller
                    }
                );
                
                // Load recipes (never filtered by allergens)
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
                        timeout: 10000,
                        maxRetries: 2,
                        abortController: queryControllerRef.current // 🎯 NEW: Pass abort controller
                    }
                );
                
                console.log('[HOMEPAGE] ✅ Unified data loaded successfully:', { 
                    userType: isAuthenticated ? 'authenticated' : 'anonymous',
                    products: foodResponse.products ? foodResponse.products.length : foodResponse.length,
                    recipes: recipeResponse.recipes ? recipeResponse.recipes.length : recipeResponse.length,
                    allergens: selectedAllergens,
                    hasAllergens: selectedAllergens.length > 0
                });
                
                dispatch(setProducts(foodResponse))
                dispatch(addRecipes(recipeResponse))
            } catch (error) {
                // 🎯 NEW: Don't log errors for cancelled queries
                if (error.name === 'AbortError') {
                    console.log('[HOMEPAGE] Query cancelled (auth transition)');
                    return;
                }
                
                // 🎯 NEW: Handle timeout errors gracefully
                if (error.message && error.message.includes('timeout')) {
                    console.warn('[HOMEPAGE] ⚠️ Query timeout - will retry on next auth transition completion');
                    return;
                }
                
                console.error('[HOMEPAGE] ❌ Error loading unified data:', error);
                // Don't throw - let the app continue with current state
            }
        };

        // 🎯 UNIFIED: Single data loading function prevents competing queries
        loadData();

        // 🎯 NEW: Cleanup function to cancel queries when component unmounts or dependencies change
        return () => {
            if (queryControllerRef.current) {
                console.log('[HOMEPAGE] Cleaning up - cancelling ongoing queries');
                queryControllerRef.current.abort();
            }
        };
    }, [selectedAllergens, isAuthenticated, dispatch, isTransitioning, anonymousSession]); // 🎯 FIXED: Added anonymousSession dependency back to trigger queries when session is ready

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