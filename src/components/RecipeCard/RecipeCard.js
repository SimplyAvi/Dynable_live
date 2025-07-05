import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import './RecipeCard.css'
import axios from 'axios';

const RecipeCard = ({recipe, id, allergies}) =>{

    const navigate = useNavigate();
    const [ingredients, setIngredients] = useState(recipe.ingredients || []);
    const [activeIngredient, setActiveIngredient] = useState(null);
    const userAllergens = Object.keys(allergies).filter(key => allergies[key]).map(a => a.toLowerCase());
    const [productOptions, setProductOptions] = useState({});
    const [selectedProducts, setSelectedProducts] = useState({});

    const {title, image=`${process.env.PUBLIC_URL}/default_img.png`, ingredients: recipeIngredients = []}= recipe
    
    let shortenedTitle = title
    if (title.length>50) shortenedTitle = title.slice(0,40) + '...'

    const handleClick  = () => {
        navigate(`/recipe/${id}`)
    }

    const handleSubstitute = (ingredientId, newName) => {
        setIngredients(ings =>
            ings.map(ing =>
                ing.id === ingredientId ? { ...ing, displayName: newName } : ing
            )
        );
        setActiveIngredient(null);
        
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

    const handleProductSelect = (ingredientId, productId) => {
        setSelectedProducts(prev => ({ ...prev, [ingredientId]: productId }));
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

    // Only show a short preview of ingredients (no dropdowns, no allergen notes, no section headers)
    const previewIngredients = ingredients
        .filter(ing => ing.name && !ing.name.trim().endsWith(':'))
        .slice(0, 3)
        .map(ing => (ing.quantity ? `${ing.quantity} ` : '') + (ing.displayName || ing.canonical || ing.name))
        .join(', ');

    return (
        <div className="recipe-card" onClick={handleClick}>
            <div className="recipe-image">
                <img 
                    src={image} 
                    alt={`${process.env.PUBLIC_URL}/default_img.png`} 
                />
            </div>
            <div>
                <div className="recipe-title">
                    {shortenedTitle.length > 20 
                        ? shortenedTitle.substring(0, 20) + '...' 
                        : shortenedTitle
                    }
                </div>
                <div className="ingredients-preview">
                    <span style={{fontWeight: 'bold'}}>Ingredients:</span> {previewIngredients}
                    {ingredients.length > 3 && <span> ...</span>}
                </div>
            </div>
        </div>
    )
}

export default React.memo(RecipeCard);