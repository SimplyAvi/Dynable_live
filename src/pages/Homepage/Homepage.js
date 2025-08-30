import React, { useEffect, useRef, useState, Component } from 'react'
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

// 🎯 PHASE 1: Error Boundary for safety
class HomepageErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[HOMEPAGE] Error Boundary caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#666'
                }}>
                    <h3>Something went wrong with the homepage.</h3>
                    <p>Please refresh the page to try again.</p>
                    <button 
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#3a7bd5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

const Homepage = () => {
    const dispatch = useDispatch()
    const selectedAllergens = useSelector((state) => state.searchPreferences?.selectedAllergens || [])
    const allergies = useSelector((state) => state.allergies?.allergies || {})
    const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated || false)
    const anonymousSession = useSelector((state) => state.anonymousCart?.session)
    const searchTerm = useSelector((state) => state.searchPreferences?.searchTerm || '') // 🛡️ ADDED: Get current search term
    const navigate = useNavigate();

    const queryControllerRef = useRef(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const previousAuthStateRef = useRef(isAuthenticated);
    const isQueryingRef = useRef(false); // 🎯 FIX: Prevent multiple simultaneous queries

    useEffect(() => {
        const authStateChanged = previousAuthStateRef.current !== isAuthenticated;
        if (authStateChanged) {
            const transitionStartTime = performance.now();
            const isLogout = previousAuthStateRef.current === true && isAuthenticated === false;
            
            console.log('[HOMEPAGE] 🔄 Auth state changed, starting transition:', {
                from: previousAuthStateRef.current,
                to: isAuthenticated,
                isLogout: isLogout,
                transitionTime: isLogout ? 'IMMEDIATE' : '2000ms',
                timestamp: new Date().toISOString()
            });
            
            setIsTransitioning(true);
            if (queryControllerRef.current) {
                console.log('[HOMEPAGE] 🚫 Aborting previous queries');
                queryControllerRef.current.abort();
            }
            
            // 🎯 LOGOUT FIX: Immediate transition for logout, delayed for login
            const transitionDelay = isLogout ? 0 : 2000;
            
            setTimeout(() => {
                const transitionEndTime = performance.now();
                const actualTransitionTime = transitionEndTime - transitionStartTime;
                console.log('[HOMEPAGE] ✅ Transition completed, resuming queries:', {
                    actualTransitionTime: `${actualTransitionTime.toFixed(2)}ms`,
                    expectedTransitionTime: isLogout ? 'IMMEDIATE' : '2000ms',
                    isLogout: isLogout,
                    performance: actualTransitionTime <= (isLogout ? 100 : 2100) ? '✅ GOOD' : '⚠️ SLOW'
                });
                setIsTransitioning(false);
            }, transitionDelay);
            
            previousAuthStateRef.current = isAuthenticated;
        }
    }, [isAuthenticated]);

    useEffect(() => {
        console.log('[HOMEPAGE] 🔍 useEffect triggered with dependencies:', {
            selectedAllergens: selectedAllergens.length,
            searchTerm: searchTerm, // 🛡️ ADDED: Log search term
            isAuthenticated,
            isTransitioning,
            hasAnonymousSession: !!anonymousSession
        });
        
        // 🛡️ FIXED: Only skip if there's an active search with actual content
        if (searchTerm && searchTerm.trim() !== '') {
            console.log('[HOMEPAGE] Skipping query - active search in progress, letting SearchAndFilter handle it');
            return;
        }
        
        // 🎯 NEW: Skip queries during auth transitions
        if (isTransitioning) {
            console.log('[HOMEPAGE] Skipping query - auth transition in progress');
            return;
        }

        // 🎯 NEW: Skip queries if anonymous user but no session is ready (except after logout)
        console.log('[HOMEPAGE] 🔍 Query trigger check:', {
            isAuthenticated,
            hasAnonymousSession: !!anonymousSession,
            anonymousSessionType: typeof anonymousSession,
            isTransitioning,
            selectedAllergens: selectedAllergens,
            allergensCount: selectedAllergens.length,
            searchTerm: searchTerm // 🛡️ ADDED: Log search term
        });
        
        // 🎯 LOGOUT FIX: Don't skip query if we just logged out (isTransitioning just completed)
        const justLoggedOut = !isAuthenticated && !anonymousSession && !isTransitioning;
        if (justLoggedOut) {
            console.log('[HOMEPAGE] 🚀 Post-logout: Loading fresh data immediately');
        } else if (!isAuthenticated && !anonymousSession) {
            console.log('[HOMEPAGE] Skipping query - anonymous user but no session ready yet');
            return;
        }

        // 🎯 FIX: Prevent multiple simultaneous queries
        if (isQueryingRef.current) {
            console.log('[HOMEPAGE] Skipping query - another query is already in progress');
            return;
        }

        // 🎯 NEW: Cancel any previous queries
        if (queryControllerRef.current) {
            console.log('[HOMEPAGE] Cancelling previous query');
            queryControllerRef.current.abort();
        }

        // Create new abort controller for this query
        queryControllerRef.current = new AbortController();
        isQueryingRef.current = true; // 🎯 FIX: Mark as querying

        const loadData = async () => {
            try {
                console.log('[HOMEPAGE] 🚀 Loading data with unified filtering:', {
                    selectedAllergens: selectedAllergens,
                    allergensCount: selectedAllergens.length,
                    searchTerm: searchTerm, // 🛡️ ADDED: Log search term
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
                        searchTerm: '', // 🛡️ FIXED: Only load homepage content (no search)
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
                    hasAllergens: selectedAllergens.length > 0,
                    searchTerm: searchTerm // 🛡️ ADDED: Log search term
                });
                
                dispatch(setProducts(foodResponse))
                dispatch(addRecipes(recipeResponse))
                
            } catch (error) {
                // 🎯 NEW: Don't log errors for cancelled queries
                if (error.name === 'AbortError') {
                    console.log('[HOMEPAGE] Query cancelled (auth transition)');
                    return;
                }
                if (error.message && error.message.includes('timeout')) {
                    console.warn('[HOMEPAGE] ⚠️ Query timeout - will retry on next auth transition completion');
                    return;
                }
                console.error('[HOMEPAGE] ❌ Error loading unified data:', error);
            } finally {
                // 🎯 FIX: Reset querying flag when query completes
                isQueryingRef.current = false;
            }
        };

        loadData();

        return () => {
            if (queryControllerRef.current) {
                console.log('[HOMEPAGE] Cleaning up - cancelling ongoing queries');
                queryControllerRef.current.abort();
            }
            // 🎯 FIX: Reset querying flag when useEffect cleanup runs
            isQueryingRef.current = false;
        };
    }, [selectedAllergens, searchTerm, isAuthenticated, dispatch, isTransitioning, anonymousSession]); // 🛡️ ADDED: searchTerm to dependencies

    return (
        <div className="homepage">
            {/* 🎯 PHASE 1: Loading state during auth transitions */}
            {isTransitioning && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    flexDirection: 'column'
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #3a7bd5',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <div style={{
                        marginTop: '20px',
                        fontSize: '16px',
                        color: '#666',
                        fontWeight: '500'
                    }}>
                        Updating your session...
                    </div>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}
            
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

// 🎯 PHASE 1: Wrap with Error Boundary for safety
const HomepageWithErrorBoundary = () => (
    <HomepageErrorBoundary>
        <Homepage />
    </HomepageErrorBoundary>
);

export default HomepageWithErrorBoundary