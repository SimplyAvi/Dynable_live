import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProductSelector from '../../components/ProductSelector/ProductSelector';
import AllergyFilter from '../../components/AllergyFilter/AllergyFilter';
import { supabase } from '../../utils/supabaseClient';
import './RecipePage.css';

const RecipePage = () => {
    const { id } = useParams();
    
    // Get allergens from Redux - SIMPLIFIED
    const userAllergens = useSelector(state => state.searchPreferences.selectedAllergens || []);
    
    // Remove complex memoization that was causing issues
    // const userAllergens = useMemo(() => selectedAllergens, [selectedAllergens]);
    
    // Add ref to prevent multiple simultaneous calls
    const isProcessingRef = useRef(false);
    
    // Add render counter for debugging
    const renderCount = useRef(0);
    renderCount.current += 1;
    
    console.log(`[RECIPE PAGE] 🔄 Render #${renderCount.current} - id: ${id}, userAllergens:`, userAllergens);
    
    const [item, setItem] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [productOptions, setProductOptions] = useState({});
    const [selectedProducts, setSelectedProducts] = useState({});
    const [processingStats, setProcessingStats] = useState(null);
    const [expandedIngredients, setExpandedIngredients] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Main data loading function using Edge Function
    const loadRecipeData = useCallback(async () => {
        // Prevent multiple simultaneous calls
        if (isProcessingRef.current) {
            console.log('[RECIPE PAGE] 🚫 Already processing, skipping duplicate call');
                return;
            }
            
        isProcessingRef.current = true;
        setLoading(true);
        setError(null);
        
        try {
            console.log(`[RECIPE PAGE] 🚀 Calling Edge Function for recipe ${id} with allergens:`, userAllergens);
            console.log(`[RECIPE PAGE] 🔍 Debug - selectedAllergens:`, userAllergens);
            console.log(`[RECIPE PAGE] 🔍 Debug - userAllergens:`, userAllergens);
            
            // Call the Edge Function
            const requestBody = {
                recipeId: parseInt(id),
                userAllergens: userAllergens
            };
            
            console.log(`[RECIPE PAGE] 📤 Sending request to Edge Function:`, {
                url: `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/recipe-processor`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
                },
                body: requestBody
            });
            
            const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/recipe-processor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                // Get the error response body for debugging
                let errorBody = '';
                try {
                    errorBody = await response.text();
                    console.error('[RECIPE PAGE] ❌ Edge Function error response body:', errorBody);
                } catch (e) {
                    console.error('[RECIPE PAGE] ❌ Could not read error response body:', e);
                }
                
                throw new Error(`Edge Function failed: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Unknown error from Edge Function');
            }

            const recipeData = result.data;
            console.log(`[RECIPE PAGE] ✅ Edge Function processed recipe in ${recipeData.processingTime.toFixed(2)}ms with ${recipeData.totalProducts} total products`);

            // Set recipe data
            setItem({
                id: recipeData.id,
                title: recipeData.title,
                directions: recipeData.directions,
                source: recipeData.source,
                tags: recipeData.tags,
                url: recipeData.url
            });

            // Process ingredients from Edge Function response
            const processedIngredients = recipeData.ingredients.map(ing => ({
                            id: ing.id,
                name: ing.name,
                quantity: ing.quantity,
                hasAllergens: ing.hasAllergens
            }));

            // Create product options from Edge Function response
            const newProductOptions = {};
            recipeData.ingredients.forEach(ing => {
                newProductOptions[ing.id] = {
                        id: ing.id,
                    products: ing.products,
                    displayName: ing.canonical,
                    substitutes: ing.substitutes,
                    hasAllergens: ing.hasAllergens,
                    allergenNotes: ing.allergenNotes
                };
            });

            setIngredients(processedIngredients);
            setProductOptions(newProductOptions);
            setProcessingStats({
                processingTime: recipeData.processingTime,
                totalProducts: recipeData.totalProducts,
                totalIngredients: recipeData.ingredients.length
            });

            console.log(`[RECIPE PAGE] ✅ Successfully loaded recipe with ${recipeData.ingredients.length} ingredients`);

        } catch (error) {
            console.error('[RECIPE PAGE] ❌ Error loading recipe data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
            isProcessingRef.current = false;
        }
    }, [id]); // Removed userAllergens dependency to prevent infinite loops

    // FIXED: Only run when id changes, not on every render
    useEffect(() => {
        console.log(`[RECIPE PAGE] 🔄 useEffect triggered - id: ${id}, userAllergens:`, userAllergens);
        if (id) {
            loadRecipeData();
        }
    }, [id]); // Removed loadRecipeData to prevent infinite loop

    // Handle ingredient expansion
    const handleToggleExpand = useCallback((ingredientId) => {
        setExpandedIngredients(prev => ({
            ...prev,
            [ingredientId]: !prev[ingredientId]
        }));
    }, []);

    // Handle product selection
    const handleProductSelect = useCallback((ingredientId, productId) => {
        setSelectedProducts(prev => ({
            ...prev,
            [ingredientId]: productId
        }));
    }, []);

    // Handle substitute selection
    const handleSubstitute = useCallback((ingredientId, substituteName) => {
        // For now, just log - substitute functionality can be enhanced later
        console.log(`[RECIPE PAGE] Substitute selected for ingredient ${ingredientId}:`, substituteName);
    }, []);

    // Group ingredients by section
    const groupIngredientsBySection = useCallback((ingredients) => {
        return [{
            title: 'Ingredients',
            ingredients: ingredients
        }];
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="text-lg mb-2">Processing recipe...</div>
                    <div className="text-sm text-gray-600">This may take a few seconds for complex recipes</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="text-lg text-red-600 mb-2">Error loading recipe</div>
                    <div className="text-sm text-gray-600 mb-4">{error}</div>
                    <button 
                        onClick={loadRecipeData}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg text-red-600">Recipe not found</div>
            </div>
        );
    }

                                return (
        <div className="recipe-page-container" style={{ paddingTop: '80px', marginTop: '0' }}>
            <div className="container mx-auto px-4 py-4">
                {/* Recipe Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-4 text-gray-900">{item.title}</h1>
                    {item.source && (
                        <p className="text-gray-600 mb-2">Source: {item.source}</p>
                    )}
                    {item.url && (
                        <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                        >
                            View Original Recipe
                        </a>
                    )}
                    
                    {/* Processing Stats */}
                    {processingStats && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-sm text-green-800">
                                <span className="font-semibold">Processing completed in {processingStats.processingTime.toFixed(2)}ms</span>
                                <br />
                                Found {processingStats.totalProducts} products across {processingStats.totalIngredients} ingredients
                            </div>
                        </div>
                    )}
                </div>

                {/* 🚀 ADDED: Allergy Filter for Recipe Page */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">
                        🛡️ Filter ingredients by your allergies
                    </h3>
                    <AllergyFilter />
                </div>

                {/* Recipe Content */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                    {/* Directions Section - Moved to LEFT side */}
                    <div className="order-2 xl:order-1">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Directions</h2>
                        <div className="space-y-4">
                            {item.directions && item.directions.map((direction, index) => (
                                <div key={index} className="flex">
                                    <span className="font-semibold mr-3 text-gray-600 min-w-[2rem]">{index + 1}.</span>
                                    <p className="text-gray-800 leading-relaxed">{direction}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ingredients Section - Moved to RIGHT side */}
                    <div className="order-1 xl:order-2">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Ingredients</h2>
                        {groupIngredientsBySection(ingredients).map((section, sectionIndex) => (
                            <div key={sectionIndex} className="mb-6">
                                {/* Remove duplicate "Ingredients" heading - only show section title if it's different */}
                                {section.title !== 'Ingredients' && (
                                    <h3 className="text-lg font-medium mb-3">{section.title}</h3>
                                )}
                                <div className="space-y-4">
                                    {section.ingredients.map((ingredient) => (
                                        <div key={ingredient.id} className="ingredient-item mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                            {/* Ingredient Header */}
                                            <div className="ingredient-header mb-3">
                                                {/* 🚨 ADDED: Allergen Warning for Ingredient */}
                                                {ingredient.hasAllergens && (
                                                    <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                                                        <span className="text-red-600 mr-1">⚠️</span>
                                                        <span className="text-red-800 font-medium">
                                                            This ingredient contains allergens: {productOptions[ingredient.id]?.allergenNotes && productOptions[ingredient.id].allergenNotes.length > 0 
                                                                ? productOptions[ingredient.id].allergenNotes.join(', ')
                                                                : 'Unknown allergens'
                                                            }
                                        </span>
                                    </div>
                                                )}
                                                
                                                <h4 className="text-lg font-medium text-gray-800">
                                                    {ingredient.quantity} {ingredient.name}
                                                </h4>
                                                {productOptions[ingredient.id]?.hasAllergens && (
                                                    <div className="text-sm text-red-600 mt-1 flex items-center">
                                                        <span className="mr-1">⚠️</span>
                                                        {productOptions[ingredient.id]?.allergenNotes && productOptions[ingredient.id].allergenNotes.length > 0 
                                                            ? productOptions[ingredient.id].allergenNotes.join(', ')
                                                            : 'Contains allergens'
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Product Selector */}
                                                <ProductSelector
                                                products={productOptions[ingredient.id]?.products || []}
                                                    selectedProductId={selectedProducts[ingredient.id]}
                                                    onProductSelect={(productId) => handleProductSelect(ingredient.id, productId)}
                                                ingredientName={productOptions[ingredient.id]?.displayName || ingredient.name}
                                                ingredientFlagged={productOptions[ingredient.id]?.hasAllergens || false}
                                                expanded={expandedIngredients[ingredient.id] || false}
                                                onToggleExpand={() => handleToggleExpand(ingredient.id)}
                                                hideAllergenAnalysis={true}
                                            />
                                            
                                            {/* 🚀 ADDED: Substitution Options Display */}
                                            {ingredient.substitutes && ingredient.substitutes.length > 0 && (
                                                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                                                    <div className="text-blue-800 font-medium mb-1">
                                                        🔄 Substitution options available:
                                                    </div>
                                                    <div className="space-y-1">
                                                        {ingredient.substitutes.slice(0, 3).map((substitute, subIndex) => (
                                                            <div key={subIndex} className="text-blue-700">
                                                                • {substitute.substituteName}
                                                                {substitute.notes && (
                                                                    <span className="text-blue-600 ml-1">({substitute.notes})</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {ingredient.substitutes.length > 3 && (
                                                            <div className="text-blue-600 text-xs">
                                                                +{ingredient.substitutes.length - 3} more options
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                        </div>
                    ))}
                    </div>
                </div>

                {/* Tags Section */}
                {item.tags && item.tags.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-3">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag, index) => (
                                <span 
                                    key={index}
                                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecipePage;