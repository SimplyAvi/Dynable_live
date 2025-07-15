import React, {useEffect, useState, useCallback} from 'react'
import { useParams } from 'react-router-dom';
import axios from 'axios'
import './RecipePage.css'
import SearchAndFilter from '../../components/SearchAndFilter/SearchAndFilter';
import ProductSelector from '../../components/ProductSelector/ProductSelector';
import { useSelector } from 'react-redux';

const RecipePage = () =>{
    const { id } = useParams();
    const [item, setItem] = useState({})
    const allergies = useSelector((state) => state.allergies.allergies);
    const [ingredients, setIngredients] = useState([]);
    const [activeIngredient, setActiveIngredient] = useState(null);
    const userAllergens = Object.keys(allergies).filter(key => allergies[key]).map(a => a.toLowerCase());
    const [productOptions, setProductOptions] = useState({});
    const [selectedProducts, setSelectedProducts] = useState({});
    const [expandedIngredients, setExpandedIngredients] = useState({});

    useEffect(()=>{
        getProduct()
    },[id, allergies])

    const getProduct = async () =>{
        try{
            const userAllergensArr = Object.keys(allergies).filter(key => allergies[key]);
            const params = new URLSearchParams({ id });
            params.append('userAllergens', userAllergensArr.join(','));
            const recipeResponse = await axios.get(`http://localhost:5001/api/recipe/?${params.toString()}`)
            setItem(recipeResponse.data)
            setIngredients(recipeResponse.data.ingredients || [])
        } catch(err){
            console.log(err)
        }
    }

    // Helper to clean ingredient names for substitute-products endpoint
    function cleanIngredientNameFrontend(raw) {
        if (!raw) return '';
        let cleaned = raw.toLowerCase();
        cleaned = cleaned.replace(/\([^)]*\)/g, ''); // remove parentheticals
        cleaned = cleaned.replace(/optional|such as.*?\(.*?\)/g, ''); // remove optional text
        cleaned = cleaned.replace(/(^|\s)(\d+[\/\d]*\s*)/g, ' '); // remove numbers/fractions at start or after space
        cleaned = cleaned.replace(/(?<=\s|^)(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lb|grams?|kilograms?|kg|liters?|l|milliliters?|ml|package|can|container|envelope|slice|loaf|pinch|dash|quart|qt|pint|pt|gallon|gal|stick|clove|head|bunch|sprig|piece|sheet|bag|bottle|jar|box|packet|drop|ear|stalk|strip|cube|block|bar)(?=\s|$)/g, '');
        cleaned = cleaned.replace(/\b(sliced|chopped|fresh|dried|mild|to taste|and|drained|rinsed|peeled|seeded|halved|quartered|shredded|grated|zested|minced|mashed|crushed|diced|cubed|julienned|optional|with juice|with syrup|with liquid|in juice|in syrup|in liquid|powdered|sweetened|unsweetened|raw|cooked|baked|roasted|steamed|boiled|fried|blanched|toasted|softened|melted|room temperature|cold|warm|hot|refrigerated|frozen|thawed|defrosted|prepared|beaten|whipped|stiff|soft|firm|fine|coarse|crumbled|broken|pieces|chunks|strips|sticks|spears|tips|ends|whole|large|small|medium|extra large|extra small|thin|thick|lean|fatty|boneless|skinless|bone-in|with skin|without skin|with bone|without bone|center cut|end cut|trimmed|untrimmed|pitted|unpitted|seedless|with seeds|without seeds|cored|uncored|stemmed|destemmed|deveined|unveined|cleaned|uncleaned|split|unsplit|shelled|unshelled|hulled|unhulled|deveined|unveined|deveined|unveined|deveined|unveined)\b/g, '');
        cleaned = cleaned.replace(/\b(leaves?|slices?|pieces?|chunks?|strips?|sticks?|spears?|tips?|ends?)\b/g, '');
        cleaned = cleaned.replace(/\b(yellow|white|black|red|green|orange|purple|brown|golden|pink|blue|rainbow)\b/g, '');
        cleaned = cleaned.replace(/,\s*$/, ''); // remove trailing commas
        cleaned = cleaned.replace(/^\s*,\s*/, ''); // remove leading commas
        cleaned = cleaned.replace(/\s{2,}/g, ' '); // collapse spaces
        cleaned = cleaned.trim();
        return cleaned;
    }

    // Helper to map cleaned ingredient names to canonical names for substitute-products endpoint
    function mapToCanonicalName(cleaned) {
        const flourNames = [
            'all-purpose flour',
            'bread flour',
            'wheat flour',
            'whole wheat flour',
            'white flour',
            'unbleached flour',
            'bleached flour',
            'self-rising flour',
            'pastry flour',
            'cake flour',
            'flour'
        ];
        if (flourNames.includes(cleaned)) return 'flour, wheat';
        return cleaned;
    }

    // Fetch products for each ingredient or substitute
    const fetchProducts = useCallback(async (ings) => {
        const userAllergensArr = Object.keys(allergies).filter(key => allergies[key]);
        const newOptions = {};
        
        // Filter out empty ingredients and section headers
        const actualIngredients = ings.filter(ing => {
            const name = ing.displayName || ing.name;
            return name && name.trim() !== '' && !name.trim().endsWith(':');
        });
        
        for (const ing of actualIngredients) {
            const name = ing.displayName || ing.canonical || ing.name;
            if (!name) {
                newOptions[ing.id] = { products: [], displayName: '' };
                continue;
            }
            try {
                console.log('Fetching products for:', name);
                
                // Check if this ingredient has a substitute selected (displayName differs from original name)
                const hasSubstitute = ing.displayName && ing.displayName !== ing.name;
                const substituteName = hasSubstitute ? ing.displayName : null;
                
                // If ingredient is flagged due to allergens and no substitute is selected, 
                // automatically fetch all available substitutes
                if (ing.flagged && !substituteName && ing.substitutions && ing.substitutions.length > 0) {
                    console.log('Ingredient flagged, fetching all substitute products for:', name);
                    
                    // Clean the ingredient name for the endpoint
                    const cleanedName = cleanIngredientNameFrontend(ing.name);
                    const canonicalName = mapToCanonicalName(cleanedName);
                    try {
                        const substituteResponse = await axios.get(`http://localhost:5001/api/recipe/substitute-products?canonicalIngredient=${encodeURIComponent(canonicalName)}`);
                        const allSubstituteProducts = [];
                        
                        substituteResponse.data.substitutes.forEach(substitute => {
                            if (substitute.products && substitute.products.length > 0) {
                                const productsWithSubstituteInfo = substitute.products.map(product => ({
                                    ...product,
                                    substituteName: substitute.substituteName,
                                    substituteNotes: substitute.notes
                                }));
                                allSubstituteProducts.push(...productsWithSubstituteInfo);
                            }
                        });
                        
                        console.log(`Found ${allSubstituteProducts.length} total substitute products for ${name}`);
                        // Use the canonical ingredient name for display
                        newOptions[ing.id] = { products: allSubstituteProducts, displayName: ing.canonical || ing.name };
                        continue; // Skip the regular product fetch
                    } catch (substituteError) {
                        console.error('Error fetching substitute products:', substituteError);
                        // Fall back to regular product fetch
                    }
                }
                
                // Regular product fetch (either no allergens, substitute selected, or fallback)
                const res = await axios.post('http://localhost:5001/api/product/by-ingredient', {
                    ingredientName: ing.name, // Always use original ingredient name
                    allergens: userAllergensArr,
                    substituteName: substituteName // Pass substitute name if user selected one
                });
                // Use new response structure
                const { products = [], mappingStatus, coverageStats, brandPriority, canonicalIngredient } = res.data;
                newOptions[ing.id] = {
                  products,
                  displayName: ing.canonical || ing.name,
                  mappingStatus,
                  coverageStats,
                  brandPriority,
                  canonicalIngredient
                };
            } catch (e) {
                console.error('Error fetching products for', name, ':', e);
                newOptions[ing.id] = { products: [], displayName: ing.canonical || ing.name };
            }
        }
        console.log('Final product options:', newOptions);
        setProductOptions(newOptions);
    }, [allergies]);

    useEffect(() => {
        if (ingredients.length > 0) fetchProducts(ingredients);
    }, [ingredients, fetchProducts]);

    const handleProductSelect = (ingredientId, productId) => {
        setSelectedProducts(prev => {
            // If clicking the same product, deselect it
            if (prev[ingredientId] === productId) {
                const newState = { ...prev };
                delete newState[ingredientId];
                return newState;
            }
            // Otherwise, select the new product
            return { ...prev, [ingredientId]: productId };
        });
    };

    // Handle substitute selection
    const handleSubstitute = (ingredientId, newName) => {
        setIngredients(ings =>
            ings.map(ing =>
                ing.id === ingredientId ? { 
                    ...ing, 
                    displayName: newName,
                    flagged: false, // Remove the red flag when substitute is selected
                    // Keep substitutions available for future changes
                } : ing
            )
        );
        setActiveIngredient(null);
        
        // Fetch products for the new substitute immediately
        const updatedIngredients = ingredients.map(ing =>
            ing.id === ingredientId ? { ...ing, displayName: newName } : ing
        );
        fetchProducts(updatedIngredients);
    };

    const {directions, source, title } = item

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

    // Add a toggle function for expand/collapse
    const toggleExpand = (ingredientId) => {
        setExpandedIngredients(prev => ({
            ...prev,
            [ingredientId]: !prev[ingredientId]
        }));
    };

    if (!directions) return (<div></div>)
    else {
        return(
            <div className="recipe-page">
                <SearchAndFilter />
                <div className='img-wrapper'>
                    <img className='img' src={`${process.env.PUBLIC_URL}/default_img.png`}/>
                </div>
                <div>
                    <h1>{title}</h1>
                    <h3>Source: {source}</h3>
                    Directions:
                    {directions.map((text,key)=>{
                         <h4 key={key}>Step {key+1}: {text}</h4>
                    })}
                </div>
                <div>
                    <p>Ingredients:</p>
                    {groupIngredientsBySection(ingredients).map((group, idx) => (
                        <div key={idx} style={{marginBottom: '1em'}}>
                            {group.header && <div className="section-header" style={{fontWeight: 'bold', margin: '0.5em 0 0.2em 0'}}>{group.header}</div>}
                            <ul className="ingredient-list">
                            {group.items.filter(ingredient => !(ingredient.name && ingredient.name.trim().endsWith(':'))).map(ingredient => {
                                const flaggedAllergen = ingredient.flagged && ingredient.allergen;
                                return (
                                <li key={ingredient.id} className={ingredient.flagged ? 'flagged' : ''} style={{marginBottom: '1.5em', position: 'relative', listStyleType: 'disc'}}>
                                    <div style={{display: 'flex', alignItems: 'center'}}>
                                        <span
                                            onClick={() => (ingredient.flagged || ingredient.substitutions?.length > 0) && setActiveIngredient(ingredient.id)}
                                            style={{ 
                                                cursor: (ingredient.flagged || ingredient.substitutions?.length > 0) ? 'pointer' : 'default', 
                                                color: ingredient.flagged ? '#c0392b' : 'inherit', 
                                                fontWeight: ingredient.flagged ? 'bold' : 'normal', 
                                                marginRight: 4 
                                            }}
                                        >
                                            {ingredient.quantity ? `${ingredient.quantity} ` : ''}{ingredient.displayName || ingredient.canonical || ingredient.name}
                                            {flaggedAllergen && <span className="warning-icon" title={`Contains: ${flaggedAllergen}`}>⚠️</span>}
                                        </span>
                                    </div>
                                    {flaggedAllergen && (
                                        <div className="allergen-note">Contains: {flaggedAllergen}</div>
                                    )}
                                    {activeIngredient === ingredient.id && ingredient.substitutions && ingredient.substitutions.length > 0 && (
                                        <select
                                            value={ingredient.displayName || ''}
                                            onChange={e => handleSubstitute(ingredient.id, e.target.value)}
                                            style={{ marginLeft: '1em' }}
                                        >
                                            <option value="">Choose a substitute</option>
                                            {ingredient.substitutions
                                                .filter(sub => !userAllergens.some(all => (typeof sub === 'string' ? (sub.substituteName || sub) : sub.substituteName).toLowerCase().includes(all)))
                                                .map((sub, idx) => (
                                                    <option key={idx} value={typeof sub === 'string' ? sub : sub.substituteName}>
                                                        {typeof sub === 'string'
                                                            ? sub
                                                            : `${sub.substituteName}${sub.notes ? ' (' + sub.notes + ')' : ''}`}
                                                    </option>
                                                ))}
                                        </select>
                                    )}
                                    {/* Expand/Collapse Products Available header */}
                                    {(() => {
                                        const name = ingredient.displayName || ingredient.name;
                                        const isHeader = name?.trim().endsWith(':');
                                        const isEmpty = !name || name.trim() === '';
                                        if (!isEmpty && !isHeader) {
                                            return (
                                                <ProductSelector
                                                    products={(productOptions[ingredient.id] && productOptions[ingredient.id].products) || []}
                                                    selectedProductId={selectedProducts[ingredient.id]}
                                                    onProductSelect={(productId) => handleProductSelect(ingredient.id, productId)}
                                                    ingredientName={(productOptions[ingredient.id] && productOptions[ingredient.id].displayName) || (ingredient.displayName || ingredient.canonical || ingredient.name)}
                                                    ingredientFlagged={ingredient.flagged}
                                                    expanded={!!expandedIngredients[ingredient.id]}
                                                    onToggleExpand={() => toggleExpand(ingredient.id)}
                                                />
                                            );
                                        }
                                        return null;
                                    })()}
                                </li>
                            )})}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
    )
}
}

export default RecipePage