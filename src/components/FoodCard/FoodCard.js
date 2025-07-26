import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addItemToCart } from '../../redux/anonymousCartSlice';
import './FoodCard.css'

const FoodCard = ({foodItem, id, showAddToCart = false, ingredientFlagged = false, onAddToCart}) =>{
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    
    // Check if user is authenticated
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

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

            // Use the same Redux action for both authenticated and anonymous users
            // The addItemToCart thunk handles both cases through anonymousAuth.js
            await dispatch(addItemToCart(cartItem)).unwrap();
            
            // Call the optional callback if provided
            if (onAddToCart) {
                onAddToCart(foodItem.id);
            }
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } finally {
            setIsAddingToCart(false);
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
                    {description.length > 20 
                        ? description.substring(0, 20) + '...' 
                        : description
                    }
                </div>
                {/* Add to Cart Button - show for homepage products as well */}
                {showAddToCart && (
                    <div className="food-card-cart-section">
                        {!ingredientFlagged ? (
                            <button
                                onClick={handleAddToCart}
                                disabled={isAddingToCart}
                                className="food-card-add-to-cart-btn"
                                title="Add to Cart"
                            >
                                {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                            </button>
                        ) : (
                            <div 
                                className="food-card-add-to-cart-disabled"
                                title="Please choose a substitute first"
                            >
                                Choose Substitute
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default React.memo(FoodCard);