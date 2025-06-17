import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import SearchAndFilter from '../components/SearchAndFilter/SearchAndFilter'
import ShowResults from '../components/ShowResults'
import { addProducts } from '../redux/productSlice'
import { addRecipes } from '../redux/recipeSlice'
import './Homepage.css'

const Homepage = () => {
    const dispatch = useDispatch()

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load initial products
                const foodResponse = await axios.post('http://localhost:5001/api/foods?page=1&limit=10', {
                    name: '',
                    excludeIngredients: []
                });
                
                // Load initial recipes
                const recipeResponse = await axios.post('http://localhost:5001/api/recipe?page=1', {
                    search: '',
                    excludeIngredients: []
                });
                
                dispatch(addProducts(foodResponse.data))
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
            <footer className="homepage-footer">
                <span className="copyright">© 2025 Dynable. All rights reserved.</span>
            </footer>
        </div>
    )
}

export default Homepage