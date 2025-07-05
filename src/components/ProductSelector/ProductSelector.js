import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addItemToCart, addToCartAnonymous } from '../../redux/cartSlice';
import FoodCard from '../FoodCard/FoodCard';
import './ProductSelector.css';

const ProductSelector = ({ products, selectedProductId, onProductSelect, ingredientName, ingredientFlagged }) => {
    const dispatch = useDispatch();
    const [addingToCart, setAddingToCart] = useState({});
    
    // Check if user is authenticated
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

    if (!products || products.length === 0) {
        return (
            <div className="product-selector">
                <div className="product-selector-header">
                    <span className="product-selector-title">Products for {ingredientName}</span>
                </div>
                <div className="no-products-message">
                    No products found for this ingredient.
                </div>
            </div>
        );
    }

    // Check if these are substitute products (have substituteName property)
    const isSubstituteProducts = products.length > 0 && products[0].substituteName;

    const handleAddToCart = async (product) => {
        setAddingToCart(prev => ({ ...prev, [product.id]: true }));
        
        try {
            const cartItem = {
                id: product.id,
                name: product.description,
                brandName: product.brandName,
                price: product.price || 0,
                quantity: 1,
                image: product.image || '/default_img.png'
            };

            if (isAuthenticated) {
                await dispatch(addItemToCart(cartItem)).unwrap();
            } else {
                dispatch(addToCartAnonymous(cartItem));
            }
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } finally {
            setAddingToCart(prev => ({ ...prev, [product.id]: false }));
        }
    };

    return (
        <div className="product-selector">
            <div className="product-selector-header">
                <span className="product-selector-title">
                    {isSubstituteProducts ? `Substitute Products for ${ingredientName}` : `Products for ${ingredientName}`}
                </span>
                <span className="product-count">{products.length} products</span>
            </div>
            <div className="product-selector-scroll-container">
                <div className="product-selector-scroll">
                    {products.map((product) => {
                        const isAddingToCart = addingToCart[product.id];
                        const isSelected = selectedProductId === product.id;
                        
                        return (
                            <div 
                                key={product.id} 
                                className={`product-selector-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => onProductSelect(product.id)}
                            >
                                <FoodCard 
                                    foodItem={product} 
                                    id={product.id}
                                    showAddToCart={true}
                                    ingredientFlagged={ingredientFlagged}
                                    onAddToCart={() => handleAddToCart(product)}
                                />
                                {isSubstituteProducts && product.substituteName && (
                                    <div className="substitute-info">
                                        <span className="substitute-name">{product.substituteName}</span>
                                        {product.substituteNotes && (
                                            <span className="substitute-notes"> - {product.substituteNotes}</span>
                                        )}
                                    </div>
                                )}
                                {isSelected && (
                                    <div className="selected-indicator">✓ Selected</div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {selectedProductId && (
                    <div className="clear-selection">
                        <button 
                            onClick={() => onProductSelect(selectedProductId)}
                            className="clear-selection-btn"
                        >
                            Clear Selection
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductSelector; 