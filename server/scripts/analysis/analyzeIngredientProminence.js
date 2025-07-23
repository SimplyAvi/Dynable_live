// analyzeIngredientProminence.js

function parseRecipeIngredients(ingredientString) {
    if (!ingredientString) return [];
    let cleaned = ingredientString
        .toLowerCase()
        .replace(/[{}()]/g, '')
        .trim();
    return cleaned.split(',').map(ing => ing.trim()).filter(ing => ing.length > 0);
}

function analyzeIngredientProminence(product, searchedIngredient) {
    const description = product.description?.toLowerCase() || '';
    const ingredients = parseRecipeIngredients(product.ingredients);
    const subcategory = product.SubcategoryName?.toLowerCase() || '';

    // 1. EXCLUSIONS FIRST - Filter out false matches
    const exclusions = {
        'egg': ['eggplant', 'eggnog', 'nutmeg', 'veggie', 'veggies'],
        'sugar': ['sugar snap', 'sugar free', 'sugarfree', 'sugar-free'],
        'milk': ['milkweed', 'buttermilk', 'coconut milk', 'almond milk']
    };
    const searchExclusions = exclusions[searchedIngredient] || [];
    const hasExclusion = searchExclusions.some(exclusion =>
        description.includes(exclusion)
    );
    if (hasExclusion) {
        return {
            classification: 'excluded',
            reason: 'false_match_excluded'
        };
    }

    // 2. PROCESSED FOOD DETECTION - Comprehensive
    const processedKeywords = [
        // Beverages
        'drink', 'beverage', 'soda', 'cola', 'juice', 'tea', 'coffee', 'nog', 'smoothie',
        // Prepared foods
        'sandwich', 'burrito', 'wrap', 'pizza', 'soup', 'salad', 'sauce', 'dressing',
        // Baked goods
        'bread', 'roll', 'pasta', 'noodles', 'cookie', 'cake', 'muffin', 'donut',
        // Snacks & candy
        'gum', 'candy', 'chocolate', 'bar', 'chips', 'crackers', 'mix', 'preserves', 'jam',
        // Dairy products
        'ice cream', 'gelato', 'yogurt', 'cheese',
        // Prepared dishes
        'stir fry', 'casserole', 'lasagna', 'ravioli', 'parmigiana', 'fettuccine',
        // Additional patterns
        'blend', 'medley', 'fries', 'crisps', 'snack'
    ];
    const isProcessedIngredientCategorized = processedKeywords.some(keyword =>
        description.includes(keyword) || subcategory.includes(keyword)
    );

    // 3. PURE INGREDIENT CHECK - Restrictive regex patterns
    const purePatterns = {
        'egg': [
            /^(100%\s+)?(liquid\s+)?egg(s?\s+whites?)?$/, // 100% liquid egg whites, eggs
            /^(cage\s+free\s+)?(organic\s+)?eggs?$/, // organic eggs
            /^(fresh\s+)?(large\s+|medium\s+|small\s+)?eggs?$/
        ],
        'sugar': [
            /^(pure\s+)?(cane\s+|brown\s+|white\s+)?sugar$/, // pure cane sugar, brown sugar
            /^(organic\s+)?(coconut\s+|palm\s+)?sugar$/
        ],
        'milk': [
            /^(whole\s+|skim\s+|fat\s+free\s+|2%\s+|1%\s+)?milk$/, // whole milk, skim milk
            /^(organic\s+)?(reduced\s+fat\s+)?milk$/
        ]
    };
    const patterns = purePatterns[searchedIngredient] || [];
    const isPureByName = patterns.some(pattern => pattern.test(description));

    // 4. INGREDIENT PROMINENCE
    let prominence = 'unknown';
    let position = -1;
    if (ingredients.length > 0) {
        // Use word boundaries to avoid partial matches
        const regex = new RegExp(`\\b${searchedIngredient}\\b`, 'i');
        position = ingredients.findIndex(ing => regex.test(ing));
        if (position === 0) prominence = 'primary';
        else if (position > 0 && position <= 2) prominence = 'secondary';
        else if (position > 2) prominence = 'minor';
    }

    // 5. FINAL CLASSIFICATION LOGIC (priority order)
    if (isPureByName && prominence === 'primary' && !isProcessedIngredientCategorized) {
        return { classification: 'pure_ingredient', reason: 'verified_pure' };
    } else if (isPureByName && !isProcessedIngredientCategorized) {
        return { classification: 'pure_ingredient', reason: 'name_verified_pure' };
    } else if (isProcessedIngredientCategorized) {
        return { classification: 'processed_food', reason: 'processed_detected' };
    } else if (prominence === 'primary') {
        return { classification: 'primary_ingredient', reason: 'first_ingredient' };
    } else if (prominence === 'secondary') {
        return { classification: 'secondary_ingredient', reason: 'early_ingredient' };
    } else if (prominence === 'minor') {
        return { classification: 'contains_ingredient', reason: 'minor_ingredient' };
    } else {
        return { classification: 'uncertain', reason: 'insufficient_data' };
    }
}

// Utility for deduplication by description (case-insensitive, trimmed)
function deduplicateProducts(products) {
    const seen = new Set();
    return products.filter(p => {
        const desc = (p.description || '').toLowerCase().trim();
        if (seen.has(desc)) return false;
        seen.add(desc);
        return true;
    });
}

module.exports = { analyzeIngredientProminence, parseRecipeIngredients, deduplicateProducts }; 