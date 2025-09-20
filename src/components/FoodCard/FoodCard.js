import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addItemToCart } from '../../redux/anonymousCartSlice';
import ProductSafetyStatus from '../ProductSafetyStatus/ProductSafetyStatus';
import './FoodCard.css'

const FoodCard = ({foodItem, id, showAddToCart = false, ingredientFlagged = false, onAddToCart, hideAllergenAnalysis = false}) =>{
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const lastClickTime = useRef(0);
    
    // Check if user is authenticated
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    
    // Get user's selected allergens
    const allergies = useSelector((state) => state.allergies.allergies);
    const userAllergens = Object.keys(allergies).filter(key => allergies[key]);

    const { description, brandName, image = `${process.env.PUBLIC_URL}/default_img.png` } = foodItem
    
    const handleClick = (e) => {
        // Don't navigate if clicking on the Add to Cart button (original logic)
        if (e.target.closest('.add-to-cart-btn')) {
            return;
        }
        navigate(`/product/${id}`)
    }

    const handleAddToCart = async (e) => {
        e.stopPropagation(); // Prevent navigation
        
        if (ingredientFlagged) return; // Don't add if ingredient is flagged
        
        // Prevent double-clicks with debouncing
        const now = Date.now();
        if (now - lastClickTime.current < 1000) { // 1 second debounce
            console.log('[FOODCARD] Add to cart debounced - too soon since last click');
            return;
        }
        lastClickTime.current = now;
        
        // Prevent if already adding
        if (isAddingToCart) {
            console.log('[FOODCARD] Add to cart already in progress, ignoring click');
            return;
        }
        
        console.log('[FOODCARD] 🚨 Add to cart clicked for item:', foodItem.id);
        console.log('[FOODCARD] Current isAddingToCart state:', isAddingToCart);
        
        setIsAddingToCart(true);
        
        try {
            const cartItem = {
                id: foodItem.id,
                name: foodItem.description,
                brandName: foodItem.brandName,
                price: foodItem.price || 0,
                quantity: 1,
                image: foodItem.image || '/default_img.png'
            };

            console.log('[FOODCARD] About to dispatch addItemToCart with item:', cartItem);

            // Use the same Redux action for both authenticated and anonymous users
            // The addItemToCart thunk handles both cases through anonymousAuth.js
            const result = await dispatch(addItemToCart(cartItem)).unwrap();
            
            console.log('[FOODCARD] ✅ Add to cart successful, result:', result);
            
            // Call the optional callback if provided
            if (onAddToCart) {
                onAddToCart(foodItem.id);
            }
        } catch (error) {
            console.error('[FOODCARD] ❌ Failed to add to cart:', error);
        } finally {
            setIsAddingToCart(false);
            console.log('[FOODCARD] Add to cart completed, isAddingToCart set to false');
        }
    };

    return (
        <div className="food-card" onClick={handleClick} style={{ position: 'relative' }}>
            {/* Debug overlay - remove after issue is resolved */}
            {/* <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 200, 255, 0.08)',
                pointerEvents: 'none',
                zIndex: 10
            }} /> */}
            <div className="food-image">
                <img 
                    src={image} 
                    alt={`${process.env.PUBLIC_URL}/default_img.png`} 
                />
            </div>
            <div className="food-info">
                <div className="food-title">
                    <h3>{description}</h3>
                    <p className="brand-name">{brandName}</p>
                </div>
                
                {/* 🛡️ Product safety status - disabled on recipe pages */}
                {!hideAllergenAnalysis && (
                    <ProductSafetyStatus 
                        product={foodItem} 
                        userAllergens={userAllergens}
                    />
                )}
                
                {/* Existing product details */}
                {foodItem.canonicalTag && (
                    <div className="canonical-tag">
                        <span>{foodItem.canonicalTag}</span>
                    </div>
                )}
                
                {showAddToCart && (
                    <button 
                        className={`add-to-cart-btn ${isAddingToCart ? 'adding' : ''}`}
                        onClick={handleAddToCart}
                        disabled={isAddingToCart || ingredientFlagged}
                    >
                        {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default FoodCard;