import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import SearchAndFilter from '../components/SearchAndFilter/SearchAndFilter'
import ShowResults from '../components/ShowResults'
import { setProducts } from '../redux/productSlice'
import { addRecipes } from '../redux/recipeSlice'
import { buildApiUrl, products, recipes } from '../config/api'
import './Homepage.css'
import { useNavigate } from 'react-router-dom';

const Homepage = () => {
    const dispatch = useDispatch()
    const allergies = useSelector((state) => state.allergies.allergies)
    const navigate = useNavigate();

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load initial products
                const params = new URLSearchParams({
                    name: '',
                    page: 1,
                    limit: 10,
                    allergens: [].join(',')
                });
                const foodResponse = await axios.get(`${buildApiUrl(products)}/search?${params}`);
                
                // Load initial recipes
                const recipeResponse = await axios.post(buildApiUrl(recipes), {
                    search: '',
                    excludeIngredients: []
                });
                
                dispatch(setProducts(foodResponse.data))
                dispatch(addRecipes(recipeResponse.data))
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
                <div className="homepage-nav-buttons">
                    <button className="homepage-nav-btn" onClick={() => navigate('/about')}>
                        <span className="homepage-nav-icon">🏢</span>
                        About Us
                    </button>
                    <button className="homepage-nav-btn" onClick={() => navigate('/about/team')}>
                        <span className="homepage-nav-icon">👥</span>
                        Meet the Team
                    </button>
                    <button className="homepage-nav-btn" onClick={() => navigate('/about/experience')}>
                        <span className="homepage-nav-icon">🎯</span>
                        Your Experience
                    </button>
                </div>
                <div className="homepage-feedback-section">
                    <button
                        className="homepage-feedback-btn"
                        onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSei-0i45voDypmG7QO4X4FCaqKvX40gRg2j2heSUMz8IHtZyw/viewform', '_blank', 'noopener noreferrer')}
                    >
                        <span role="img" aria-label="feedback" style={{ marginRight: 6, fontSize: '1.1em' }}>💬</span>
                        Give Feedback
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