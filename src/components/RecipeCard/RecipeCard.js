import React, {useEffect, useState, useCallback} from 'react'
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getProductsByIngredientFromSupabase } from '../../utils/supabaseQueries';
import './RecipeCard.css';

const RecipeCard = ({recipe, id, allergies}) =>{
    const navigate = useNavigate();
    const [productOptions, setProductOptions] = useState({});
    const [selectedProducts, setSelectedProducts] = useState({});
    const [ingredients, setIngredients] = useState([]);
    const userAllergens = Object.keys(allergies).filter(key => allergies[key]);

    const {title, directions, source, url} = recipe;
    const shortenedTitle = title || 'Untitled Recipe';
    const image = `${process.env.PUBLIC_URL}/default_img.png`;

    const handleClick  = (e) => {
        console.log('RecipeCard clicked:', e.target);
        navigate(`/recipe/${id}`);
    }

    const handleSubstitute = (ingredientId, newName) => {
        setIngredients(ings =>
            ings.map(ing =>
                ing.id === ingredientId ? { ...ing, displayName: newName } : ing
            )
        );
    };

    // Fetch products for each ingredient
    const fetchProducts = useCallback(async (ings) => {
        const userAllergensArr = Object.keys(allergies).filter(key => allergies[key]);
        const newOptions = {};
        
        for (const ing of ings) {
            if (!ing.name) {
                newOptions[ing.id] = [];
                continue;
            }
            try {
                // Check if this ingredient has a substitute selected (displayName differs from original name)
                const hasSubstitute = ing.displayName && ing.displayName !== ing.name;
                const substituteName = hasSubstitute ? ing.displayName : null;
                
                const res = await getProductsByIngredientFromSupabase(ing.name, userAllergensArr, substituteName);
                // Use new response structure
                const { products = [], mappingStatus, coverageStats, brandPriority, canonicalIngredient } = res;
                newOptions[ing.id] = {
                  products,
                  mappingStatus,
                  coverageStats,
                  brandPriority,
                  canonicalIngredient
                };
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
        <div className="recipe-card" onClick={handleClick} style={{ position: 'relative' }}>
            {/* Debug overlay - remove after issue is resolved */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 200, 255, 0.08)',
                pointerEvents: 'none',
                zIndex: 10
            }} />
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