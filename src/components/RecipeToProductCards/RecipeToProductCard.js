import React, { useEffect, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { addItemToCart, addToCartAnonymous } from '../../redux/cartSlice'
import axios from 'axios'
import './RecipeToProductCards.css'

const RecipeToProductCard = ({ recipe, allergies }) => {
    const dispatch = useDispatch();
    const [ingredients, setIngredients] = useState(recipe.ingredients || []);
    const [activeIngredient, setActiveIngredient] = useState(null);
    const [autoShowSubstitutes, setAutoShowSubstitutes] = useState(new Set());
    const userAllergens = Object.keys(allergies).filter(key => allergies[key]).map(a => a.toLowerCase());
    const [productOptions, setProductOptions] = useState({});
    const [selectedProducts, setSelectedProducts] = useState({});
    const [addingToCart, setAddingToCart] = useState({});

    // Check if user is authenticated
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

    const handleSubstitute = (ingredientId, newName) => {
        setIngredients(ings =>
            ings.map(ing =>
                ing.id === ingredientId ? { ...ing, displayName: newName } : ing
            )
        );
        setActiveIngredient(null);
        // Remove from auto-show set since substitute was chosen
        setAutoShowSubstitutes(prev => {
            const newSet = new Set(prev);
            newSet.delete(ingredientId);
            return newSet;
        });
        
        // Fetch products for the new substitute immediately
        const updatedIngredients = ingredients.map(ing =>
            ing.id === ingredientId ? { ...ing, displayName: newName } : ing
        );
        fetchProducts(updatedIngredients);
    };

    // Fetch products for each ingredient or substitute
    const fetchProducts = useCallback(async (ings) => {
        const userAllergensArr = Object.keys(allergies).filter(key => allergies[key]);
        const newOptions = {};
        for (const ing of ings) {
            const name = ing.displayName || ing.name;
            if (!name) {
                newOptions[ing.id] = [];
                continue;
            }
            try {
                // Check if this ingredient has a substitute selected (displayName differs from original name)
                const hasSubstitute = ing.displayName && ing.displayName !== ing.name;
                const substituteName = hasSubstitute ? ing.displayName : null;
                
                const res = await axios.post('http://localhost:5001/api/product/by-ingredient', {
                    ingredientName: ing.name, // Always use original ingredient name
                    allergens: userAllergensArr,
                    substituteName: substituteName // Pass substitute name if user selected one
                });
                newOptions[ing.id] = res.data;
            } catch (e) {
                newOptions[ing.id] = [];
            }
        }
        setProductOptions(newOptions);
    }, [allergies]);

    useEffect(() => {
        if (ingredients.length > 0) fetchProducts(ingredients);
    }, [ingredients, fetchProducts]);

    // Auto-show substitute dropdown when allergen is toggled and ingredient is flagged
    useEffect(() => {
        const newAutoShow = new Set();
        ingredients.forEach(ingredient => {
            if (ingredient.flagged && ingredient.substitutions && ingredient.substitutions.length > 0) {
                newAutoShow.add(ingredient.id);
            }
        });
        setAutoShowSubstitutes(newAutoShow);
    }, [allergies, ingredients]);

    const handleProductSelect = (ingredientId, productId) => {
        setSelectedProducts(prev => ({ ...prev, [ingredientId]: productId }));
    };

    const handleAddToCart = async (ingredientId, productId) => {
        if (!productId) return;
        
        setAddingToCart(prev => ({ ...prev, [ingredientId]: true }));
        
        try {
            const product = productOptions[ingredientId]?.find(p => p.id === parseInt(productId));
            if (!product) return;

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
            setAddingToCart(prev => ({ ...prev, [ingredientId]: false }));
        }
    };

    // Helper to group ingredients by section if needed
    function groupIngredientsBySection(ingredients) {
        const groups = [];
        let currentSection = null;
        ingredients.forEach(ing => {
            // If the ingredient name ends with ':' treat as section header
            if (ing.name && ing.name.trim().endsWith(':')) {
                currentSection = { header: ing.name.trim(), items: [] };
                groups.push(currentSection);
            } else {
                if (!currentSection) {
                    currentSection = { header: null, items: [] };
                    groups.push(currentSection);
                }
                currentSection.items.push(ing);
            }
        });
        return groups;
    }

    return (
        <div className="recipe-to-product-card">
            <h2>{recipe.title}</h2>
            {groupIngredientsBySection(ingredients).map((group, idx) => (
                <div key={idx} style={{marginBottom: '1em'}}>
                    {group.header && <div className="section-header" style={{fontWeight: 'bold', margin: '0.5em 0 0.2em 0'}}>{group.header}</div>}
                    <ul className="ingredient-list">
                    {group.items.map(ingredient => {
                        const flaggedAllergen = ingredient.flagged && ingredient.allergen;
                        const shouldShowSubstitutes = activeIngredient === ingredient.id || autoShowSubstitutes.has(ingredient.id);
                        const selectedProduct = selectedProducts[ingredient.id];
                        const isAddingToCart = addingToCart[ingredient.id];
                        
                        return (
                        <li key={ingredient.id} className={ingredient.flagged ? 'flagged' : ''} style={{marginBottom: '1.5em', position: 'relative', listStyleType: 'disc'}}>
                            <div style={{display: 'flex', alignItems: 'center'}}>
                                <span
                                    onClick={() => ingredient.flagged && setActiveIngredient(ingredient.id)}
                                    style={{ cursor: ingredient.flagged ? 'pointer' : 'default', color: ingredient.flagged ? '#c0392b' : 'inherit', fontWeight: ingredient.flagged ? 'bold' : 'normal', marginRight: 4 }}
                                >
                                    {ingredient.quantity ? `${ingredient.quantity} ` : ''}{ingredient.displayName || ingredient.canonical || ingredient.name}
                                    {flaggedAllergen && <span className="warning-icon" title={`Contains: ${flaggedAllergen}`}>⚠️</span>}
                                </span>
                            </div>
                            {flaggedAllergen && (
                                <div className="allergen-note">Contains: {flaggedAllergen}</div>
                            )}
                            {shouldShowSubstitutes && ingredient.substitutions && ingredient.substitutions.length > 0 && (
                                <select
                                    value={ingredient.displayName || ''}
                                    onChange={e => handleSubstitute(ingredient.id, e.target.value)}
                                    style={{ marginLeft: '1em' }}
                                >
                                    <option value="">Choose a substitute</option>
                                    {ingredient.substitutions
                                        .filter(sub => !userAllergens.some(all => (typeof sub === 'string' ? sub : sub.substituteName).toLowerCase().includes(all)))
                                        .map((sub, idx) => (
                                            <option key={idx} value={typeof sub === 'string' ? sub : sub.substituteName}>
                                                {typeof sub === 'string' ? sub : `${sub.substituteName}${sub.notes ? ' (' + sub.notes + ')' : ''}`}
                                            </option>
                                        ))}
                                </select>
                            )}
                            <div className="product-dropdown-wrapper" style={{marginLeft: '1.5em', marginTop: '0.2em'}}>
                                <select
                                    value={selectedProduct || ''}
                                    onChange={e => handleProductSelect(ingredient.id, e.target.value)}
                                    className="product-dropdown"
                                >
                                    <option value="">Select a product</option>
                                    {(productOptions[ingredient.id] || []).map(product => (
                                        <option key={product.id} value={product.id}>
                                            {product.brandName ? `${product.brandName} - ` : ''}{product.description?.slice(0,60)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* Add to Cart Button - only show if product is selected and ingredient is not flagged */}
                            {selectedProduct && !ingredient.flagged && (
                                <div className="add-to-cart-wrapper" style={{marginLeft: '1.5em', marginTop: '0.3em'}}>
                                    <button
                                        onClick={() => handleAddToCart(ingredient.id, selectedProduct)}
                                        disabled={isAddingToCart}
                                        className="add-to-cart-btn"
                                        style={{
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '4px',
                                            cursor: isAddingToCart ? 'not-allowed' : 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            opacity: isAddingToCart ? 0.6 : 1,
                                            minWidth: '80px'
                                        }}
                                    >
                                        {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                                    </button>
                                </div>
                            )}
                            {/* Disabled Add to Cart Button when ingredient is flagged */}
                            {selectedProduct && ingredient.flagged && (
                                <div className="add-to-cart-wrapper" style={{marginLeft: '1.5em', marginTop: '0.3em'}}>
                                    <button
                                        disabled={true}
                                        className="add-to-cart-btn-disabled"
                                        style={{
                                            backgroundColor: '#ccc',
                                            color: '#666',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '4px',
                                            cursor: 'not-allowed',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            minWidth: '80px'
                                        }}
                                        title="Please choose a substitute first"
                                    >
                                        Choose Substitute
                                    </button>
                                </div>
                            )}
                        </li>
                    )})}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default RecipeToProductCard