import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addItemToCart, addToCartAnonymous } from '../../redux/cartSlice';
import './FoodCard.css'

const FoodCard = ({foodItem, id, showAddToCart = false, ingredientFlagged = false, onAddToCart}) =>{
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    
    // Check if user is authenticated
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

    const { description, brandName, image = `${process.env.PUBLIC_URL}/default_img.png` } = foodItem
    
    const handleClick = (e) => {
        // Don't navigate if clicking on the Add to Cart button
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

            if (isAuthenticated) {
                await dispatch(addItemToCart(cartItem)).unwrap();
            } else {
                dispatch(addToCartAnonymous(cartItem));
            }
            
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
        <div className="food-card" onClick={handleClick}>
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
                
                {/* Add to Cart Button - only show if enabled and not flagged */}
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