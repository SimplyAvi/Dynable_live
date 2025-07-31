// 🏷️ ALLERGEN VALIDATION UTILITIES
// Dynable App - Frontend Data Quality Enforcement

/**
 * Valid allergen names (must match database categories)
 */
export const validAllergens = [
    // Major allergens (FDA top 9)
    'milk', 'eggs', 'fish', 'shellfish', 'treeNuts', 'peanuts', 
    'wheat', 'soy', 'sesame', 'gluten',
    
    // Sensitivities
    'garlic', 'tomatoes', 'onions', 'corn', 'mustard', 'celery', 
    'chocolate', 'strawberries', 'peaches',
    
    // Intolerances
    'lactose',
    
    // Free-from categories
    'glutenFree', 'dairyFree', 'eggFree', 'soyFree', 'nutFree', 'fishFree',
    
    // Common multi-word allergens (camelCase)
    'bellPepper', 'blackPepper', 'hotSauce', 'coconutOil', 'palmOil', 
    'sunflowerOil', 'vegetableOil', 'oliveOil', 'avocadoOil', 'kiwiFruit',
    'dragonFruit', 'passionFruit', 'sweetPotatoes', 'yellowSquash', 
    'butternutSquash', 'greenBeans', 'blackBeans', 'pintoBeans', 
    'kidneyBeans', 'navyBeans', 'blackEyedPeas', 'splitPeas', 'brownRice',
    'whiteRice', 'wildRice', 'greekYogurt', 'sourCream', 'heavyCream',
    'halfAndHalf', 'wholeMilk', 'skimMilk', 'almondMilk', 'soyMilk',
    'oatMilk', 'coconutMilk', 'riceMilk', 'energyDrinks', 'sportsDrinks',
    'artificialColors', 'foodDyes', 'citricAcid', 'vanillaExtract'
];

/**
 * Allergen validation rules
 */
export const allergenValidationRules = {
    // Rule 1: No spaces allowed
    noSpaces: (allergen) => !allergen.includes(' '),
    
    // Rule 2: No underscores allowed
    noUnderscores: (allergen) => !allergen.includes('_'),
    
    // Rule 3: Must be camelCase format
    isCamelCase: (allergen) => {
        // Must start with lowercase, can contain uppercase, no spaces/underscores
        return /^[a-z][a-zA-Z0-9]*$/.test(allergen);
    },
    
    // Rule 4: Must be valid allergen
    isValidAllergen: (allergen) => validAllergens.includes(allergen),
    
    // Rule 5: No empty strings
    notEmpty: (allergen) => allergen && allergen.trim() !== '',
    
    // Rule 6: No special characters (except hyphens for compound words)
    noSpecialChars: (allergen) => /^[a-z\s-]+$/.test(allergen)
};

/**
 * Convert to camelCase format
 */
export const toCamelCase = (str) => {
    if (!str || typeof str !== 'string') return '';
    
    return str
        .toLowerCase()
        .trim()
        // Replace multiple spaces/underscores/hyphens with single space
        .replace(/[\s_-]+/g, ' ')
        // Split by space and camelCase
        .split(' ')
        .map((word, index) => {
            if (index === 0) {
                return word; // First word stays lowercase
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join('');
};

/**
 * Convert to standardized allergen format (camelCase)
 */
export const standardizeAllergenName = (allergen) => {
    if (!allergen || typeof allergen !== 'string') {
        return null;
    }
    
    // Clean input: lowercase, remove extra spaces
    const cleaned = allergen.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Universal camelCase conversion for ALL multi-word allergens
    // This ensures ANY multi-word allergen becomes camelCase
    const result = toCamelCase(cleaned);
    
    // Apply specific mappings for common variations
    const mappings = {
        // Tree nuts variations
        'tree nuts': 'treeNuts',
        'tree_nuts': 'treeNuts', 
        'tree-nuts': 'treeNuts',
        'treenuts': 'treeNuts',
        'nuts': 'treeNuts',
        
        // Free-from variations
        'gluten free': 'glutenFree',
        'gluten_free': 'glutenFree',
        'gluten-free': 'glutenFree', 
        'glutenfree': 'glutenFree',
        'dairy free': 'dairyFree',
        'dairy_free': 'dairyFree',
        'dairy-free': 'dairyFree',
        'dairyfree': 'dairyFree',
        'egg free': 'eggFree',
        'egg_free': 'eggFree', 
        'egg-free': 'eggFree',
        'eggfree': 'eggFree',
        'soy free': 'soyFree',
        'soy_free': 'soyFree',
        'soy-free': 'soyFree',
        'soyfree': 'soyFree',
        'nut free': 'nutFree',
        'nut_free': 'nutFree',
        'nut-free': 'nutFree', 
        'nutfree': 'nutFree',
        'fish free': 'fishFree',
        'fish_free': 'fishFree',
        'fish-free': 'fishFree',
        'fishfree': 'fishFree',
        
        // Common multi-word allergens
        'bell pepper': 'bellPepper',
        'black pepper': 'blackPepper',
        'hot sauce': 'hotSauce',
        'coconut oil': 'coconutOil',
        'palm oil': 'palmOil',
        'sunflower oil': 'sunflowerOil',
        'vegetable oil': 'vegetableOil',
        'olive oil': 'oliveOil',
        'avocado oil': 'avocadoOil',
        'kiwi fruit': 'kiwiFruit',
        'dragon fruit': 'dragonFruit',
        'passion fruit': 'passionFruit',
        'sweet potatoes': 'sweetPotatoes',
        'yellow squash': 'yellowSquash',
        'butternut squash': 'butternutSquash',
        'green beans': 'greenBeans',
        'black beans': 'blackBeans',
        'pinto beans': 'pintoBeans',
        'kidney beans': 'kidneyBeans',
        'navy beans': 'navyBeans',
        'black eyed peas': 'blackEyedPeas',
        'split peas': 'splitPeas',
        'brown rice': 'brownRice',
        'white rice': 'whiteRice',
        'wild rice': 'wildRice',
        'greek yogurt': 'greekYogurt',
        'sour cream': 'sourCream',
        'heavy cream': 'heavyCream',
        'half and half': 'halfAndHalf',
        'whole milk': 'wholeMilk',
        'skim milk': 'skimMilk',
        'almond milk': 'almondMilk',
        'soy milk': 'soyMilk',
        'oat milk': 'oatMilk',
        'coconut milk': 'coconutMilk',
        'rice milk': 'riceMilk',
        'energy drinks': 'energyDrinks',
        'sports drinks': 'sportsDrinks',
        'artificial colors': 'artificialColors',
        'food dyes': 'foodDyes',
        'citric acid': 'citricAcid',
        'vanilla extract': 'vanillaExtract'
    };
    
    return mappings[cleaned] || result;
};

/**
 * Validate allergen array
 */
export const validateAllergenArray = (allergens) => {
    const errors = [];
    const warnings = [];
    
    if (!Array.isArray(allergens)) {
        errors.push('Allergens must be an array');
        return { isValid: false, errors, warnings, cleanedAllergens: [] };
    }
    
    // Check for duplicates
    const uniqueAllergens = [...new Set(allergens)];
    if (uniqueAllergens.length !== allergens.length) {
        errors.push('Duplicate allergens found in array');
    }
    
    // Validate each allergen
    uniqueAllergens.forEach((allergen, index) => {
        if (!allergenValidationRules.notEmpty(allergen)) {
            errors.push(`Allergen ${index + 1}: Cannot be empty`);
            return;
        }
        
        if (!allergenValidationRules.noSpaces(allergen)) {
            errors.push(`Allergen ${index + 1}: No spaces allowed. Use "treenuts" not "tree nuts"`);
        }
        
        if (!allergenValidationRules.noUnderscores(allergen)) {
            errors.push(`Allergen ${index + 1}: No underscores allowed. Use "treenuts" not "tree_nuts"`);
        }
        
        if (!allergenValidationRules.isCamelCase(allergen)) {
            errors.push(`Allergen ${index + 1}: Must be camelCase. Use "${toCamelCase(allergen)}" not "${allergen}"`);
        }
        
        if (!allergenValidationRules.isValidAllergen(allergen)) {
            errors.push(`Allergen ${index + 1}: "${allergen}" is not a recognized allergen`);
        }
        
        if (!allergenValidationRules.noSpecialChars(allergen)) {
            errors.push(`Allergen ${index + 1}: Contains invalid characters. Use only letters`);
        }
    });
    
    // Check for potential contradictions (warnings)
    if (uniqueAllergens.includes('gluten') && uniqueAllergens.includes('wheat')) {
        warnings.push('Both "gluten" and "wheat" detected - consider using only "gluten"');
    }
    
    // Generate cleaned allergens
    const cleanedAllergens = uniqueAllergens
        .map(allergen => standardizeAllergenName(allergen))
        .filter(allergen => allergen && allergenValidationRules.isValidAllergen(allergen));
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        cleanedAllergens
    };
};

/**
 * Clean allergen input for real-time validation
 */
export const cleanAllergenInput = (input) => {
    if (!input || typeof input !== 'string') {
        return '';
    }
    
    // Remove extra spaces and convert to lowercase
    let cleaned = input.trim().toLowerCase();
    
    // Remove common invalid characters
    cleaned = cleaned.replace(/[^\w\s-]/g, '');
    
    // Standardize the name
    const standardized = standardizeAllergenName(cleaned);
    
    return standardized || cleaned;
};

/**
 * Auto-suggest corrections for invalid allergens
 */
export const suggestAllergenCorrections = (invalidAllergen) => {
    const suggestions = [];
    
    if (!invalidAllergen) {
        return suggestions;
    }
    
    const lowerInvalid = invalidAllergen.toLowerCase();
    
    // Common misspellings and variations
    const corrections = {
        'tree nuts': 'treenuts',
        'tree_nuts': 'treenuts',
        'tree-nuts': 'treenuts',
        'treenut': 'treenuts',
        'nuts': 'treenuts',
        'gluten free': 'gluten',
        'gluten_free': 'gluten',
        'gluten-free': 'gluten',
        'dairy free': 'milk',
        'dairy_free': 'milk',
        'dairy-free': 'milk',
        'egg free': 'eggs',
        'egg_free': 'eggs',
        'egg-free': 'eggs',
        'soy free': 'soy',
        'soy_free': 'soy',
        'soy-free': 'soy',
        'fish free': 'fish',
        'fish_free': 'fish',
        'fish-free': 'fish',
        'nut free': 'treenuts',
        'nut_free': 'treenuts',
        'nut-free': 'treenuts',
        'peanut free': 'peanuts',
        'peanut_free': 'peanuts',
        'peanut-free': 'peanuts',
        'wheat free': 'wheat',
        'wheat_free': 'wheat',
        'wheat-free': 'wheat',
        'sesame free': 'sesame',
        'sesame_free': 'sesame',
        'sesame-free': 'sesame',
        'shellfish free': 'shellfish',
        'shellfish_free': 'shellfish',
        'shellfish-free': 'shellfish'
    };
    
    // Check for exact matches
    if (corrections[lowerInvalid]) {
        suggestions.push(corrections[lowerInvalid]);
    }
    
    // Check for partial matches
    validAllergens.forEach(valid => {
        if (valid.includes(lowerInvalid) || lowerInvalid.includes(valid)) {
            suggestions.push(valid);
        }
    });
    
    // Remove duplicates and return
    return [...new Set(suggestions)];
};

/**
 * Check for free-from contradictions
 */
export const checkFreeFromContradictions = (allergens, description) => {
    const contradictions = [];
    
    if (!description || !allergens || !Array.isArray(allergens)) {
        return contradictions;
    }
    
    const descLower = description.toLowerCase();
    
    // Define free-from patterns and their contradictions
    const freeFromPatterns = [
        {
            pattern: /gluten\s*free/i,
            contradictions: ['gluten', 'wheat'],
            message: 'Product claims to be gluten-free but contains gluten/wheat'
        },
        {
            pattern: /dairy\s*free/i,
            contradictions: ['milk', 'lactose'],
            message: 'Product claims to be dairy-free but contains milk/lactose'
        },
        {
            pattern: /nut\s*free/i,
            contradictions: ['treenuts', 'peanuts'],
            message: 'Product claims to be nut-free but contains nuts'
        },
        {
            pattern: /egg\s*free/i,
            contradictions: ['eggs'],
            message: 'Product claims to be egg-free but contains eggs'
        },
        {
            pattern: /soy\s*free/i,
            contradictions: ['soy'],
            message: 'Product claims to be soy-free but contains soy'
        },
        {
            pattern: /fish\s*free/i,
            contradictions: ['fish', 'shellfish'],
            message: 'Product claims to be fish-free but contains fish/shellfish'
        }
    ];
    
    freeFromPatterns.forEach(({ pattern, contradictions, message }) => {
        if (pattern.test(descLower)) {
            const foundContradictions = contradictions.filter(contradiction => 
                allergens.includes(contradiction)
            );
            
            if (foundContradictions.length > 0) {
                contradictions.push({
                    type: 'free_from_contradiction',
                    message,
                    allergens: foundContradictions,
                    description: description
                });
            }
        }
    });
    
    return contradictions;
};

/**
 * Get allergen category and severity
 */
export const getAllergenInfo = (allergen) => {
    const allergenInfo = {
        // Major allergens (FDA top 9) - Critical
        'milk': { category: 'major', severity: 5, description: 'Dairy products and derivatives' },
        'eggs': { category: 'major', severity: 5, description: 'Chicken eggs and egg products' },
        'fish': { category: 'major', severity: 5, description: 'Finfish and fish products' },
        'shellfish': { category: 'major', severity: 5, description: 'Crustaceans and mollusks' },
        'treeNuts': { category: 'major', severity: 5, description: 'Tree nuts (almonds, walnuts, etc.)' },
        'peanuts': { category: 'major', severity: 5, description: 'Peanuts and peanut products' },
        'wheat': { category: 'major', severity: 5, description: 'Wheat and wheat products' },
        'soy': { category: 'major', severity: 5, description: 'Soybean and soy products' },
        'sesame': { category: 'major', severity: 5, description: 'Sesame seeds and sesame products' },
        
        // Sensitivities - Medium
        'garlic': { category: 'sensitivity', severity: 3, description: 'Garlic sensitivity' },
        'tomatoes': { category: 'sensitivity', severity: 3, description: 'Tomato sensitivity' },
        'onions': { category: 'sensitivity', severity: 3, description: 'Onion sensitivity' },
        'corn': { category: 'sensitivity', severity: 3, description: 'Corn sensitivity' },
        'mustard': { category: 'sensitivity', severity: 3, description: 'Mustard sensitivity' },
        'celery': { category: 'sensitivity', severity: 3, description: 'Celery sensitivity' },
        'chocolate': { category: 'sensitivity', severity: 3, description: 'Chocolate sensitivity' },
        'strawberries': { category: 'sensitivity', severity: 3, description: 'Strawberry sensitivity' },
        'peaches': { category: 'sensitivity', severity: 3, description: 'Peach sensitivity' },
        
        // Intolerances - High
        'gluten': { category: 'intolerance', severity: 4, description: 'Gluten intolerance/celiac' },
        'lactose': { category: 'intolerance', severity: 4, description: 'Lactose intolerance' }
    };
    
    return allergenInfo[allergen] || null;
};

/**
 * Get severity label
 */
export const getSeverityLabel = (severity) => {
    switch (severity) {
        case 5: return 'Critical';
        case 4: return 'High';
        case 3: return 'Medium';
        case 2: return 'Low';
        default: return 'Unknown';
    }
};

/**
 * Validate allergen input in real-time
 */
export const validateAllergenInput = (input) => {
    const result = {
        isValid: false,
        error: null,
        suggestion: null,
        cleaned: ''
    };
    
    if (!input || typeof input !== 'string') {
        result.error = 'Allergen name is required';
        return result;
    }
    
    const cleaned = cleanAllergenInput(input);
    result.cleaned = cleaned;
    
    // Check validation rules
    if (!allergenValidationRules.notEmpty(cleaned)) {
        result.error = 'Allergen name cannot be empty';
        return result;
    }
    
    if (!allergenValidationRules.noSpaces(cleaned)) {
        result.error = 'No spaces allowed. Use "treeNuts" not "tree nuts"';
        result.suggestion = 'treeNuts';
        return result;
    }
    
    if (!allergenValidationRules.noUnderscores(cleaned)) {
        result.error = 'No underscores allowed. Use "treeNuts" not "tree_nuts"';
        result.suggestion = 'treeNuts';
        return result;
    }
    
    if (!allergenValidationRules.isCamelCase(cleaned)) {
        result.error = 'Must be camelCase';
        result.suggestion = toCamelCase(cleaned);
        return result;
    }
    
    if (!allergenValidationRules.isValidAllergen(cleaned)) {
        result.error = 'Not a recognized allergen';
        result.suggestion = suggestAllergenCorrections(cleaned)[0] || null;
        return result;
    }
    
    result.isValid = true;
    return result;
}; 