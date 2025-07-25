import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addItemToCart, fetchCart, initializeAuth } from '../../redux/anonymousCartSlice';
import './ProductPage.css'
import SearchAndFilter from '../../components/SearchAndFilter/SearchAndFilter';
import { supabase } from '../../utils/supabaseClient';

const ProductPage = () =>{
    const { id } = useParams();
    const [item, setItem] = useState({})
    const [quantity, setQuantity] = useState(1)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const isAuthenticated = useSelector(state => state.auth?.isAuthenticated || false)
    const token = useSelector(state => state.auth?.token || null)
    const cartItems = useSelector(state => state.anonymousCart?.items || [])

    useEffect(()=>{
        const getProduct = async () =>{
            try{
                // Use Supabase to get product by ID
                const { data, error } = await supabase
                    .from('IngredientCategorized')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (error) {
                    console.error('Error fetching product:', error);
                    return;
                }
                
                setItem(data);
            } catch(err){
                console.log(err)
            }
        }
        //get product info via ID
        getProduct()
    },[id])

    // Fetch cart when component mounts and user is authenticated
    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchCart());
        }
    }, [dispatch, isAuthenticated]);

    const handleAddToCart = async () => {
        // Create cart item object with product details
        const cartItem = {
            id: item.id,
            name: item.description,
            brand: item.brandName,
            price: item.price || 0,
            image: `${process.env.PUBLIC_URL}/default_img.png`,
            quantity: quantity
        }

        if (!isAuthenticated) {
            // Initialize anonymous auth first, then add to cart
            console.log('[PRODUCT_PAGE] User not authenticated, initializing anonymous auth');
            await dispatch(initializeAuth());
            dispatch(addItemToCart(cartItem));
            return;
        }

        try {
            // Authenticated: update cart in database and Redux state
            await dispatch(addItemToCart(cartItem)).unwrap();
        } catch (error) {
            console.error('Failed to update cart:', error)
            alert('Failed to add item to cart. Please try again.')
        }
    }

    const {description, ingredients, brandName } = item

    return(
        <div>
            <SearchAndFilter />
            <div className='img-wrapper'>
                <img className='img' src={`${process.env.PUBLIC_URL}/default_img.png`} alt="Product"/>
            </div>
            <div>
                <h3>{brandName}</h3>
                <h4>{description}</h4>
                <div className="add-to-cart-section">
                    <div className="quantity-selector">
                        <button 
                            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                            disabled={quantity <= 1}
                        >
                            -
                        </button>
                        <span>{quantity}</span>
                        <button 
                            onClick={() => setQuantity(prev => prev + 1)}
                        >
                            +
                        </button>
                    </div>
                    <button 
                        className="add-to-cart-button"
                        onClick={handleAddToCart}
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
            <div className='ingredients'>
                <h3 className='ingredients-title'>Ingredients:</h3>
                <p> {ingredients}</p>
            </div>
            <div>
                {/* {Object.keys(nutrients).map((nutrient,key)=>{
                    return(
                        <p key={key}>{nutrient}:{nutrients[nutrient]}</p>
                    )
                })} */}
            </div>
            <div>
                suggestions section (alt food cards can go here)
            </div>
        </div>
    )
}

export default ProductPage