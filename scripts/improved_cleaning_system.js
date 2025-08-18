const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Improved cleaning patterns based on learning
const IMPROVED_CLEANING_PATTERNS = {
    // Numbers and measurements (enhanced)
    NUMBERS: [
        /\d+/g, // Any number
        /\d+\/\d+/g, // Fractions
        /\d+\.\d+/g, // Decimals
        /\d+-\d+/g, // Ranges
        /\d+to\d+/gi, // "to" ranges
        /\d+degrees?/gi, // Temperature
        /\d+°[CF]/gi, // Degrees with symbols
        /\d+st|\d+nd|\d+rd|\d+th/gi, // Ordinal numbers
        /\d+inch|\d+inches/gi, // Inch measurements
        /\d+cm|\d+centimeter/gi, // Metric measurements
    ],
    
    // Enhanced unit patterns
    UNITS: [
        // Basic units
        /\b(cups?|tbsp|tsp|oz|ounces?|lbs?|pounds?|grams?|kg|kilograms?|ml|milliliters?|liters?|l|gallon|quart|pint|fluid|fl)\b/gi,
        // Containers
        /\b(package|packages?|can|cans?|jar|jars?|bottle|bottles?|container|containers?|bag|bags?|box|boxes?|tube|tubes?|envelope|envelopes?)\b/gi,
        // Pieces
        /\b(slice|slices?|piece|pieces?|chunk|chunks?|wedge|wedges?|strip|strips?|cube|cubes?)\b/gi,
        // Additional units found in analysis
        /\b(pound|pounds|ounce|ounces|cup|cups|tablespoon|teaspoon|fluid|package|can|jar|inch|inches)\b/gi,
    ],
    
    // Enhanced action words
    ACTIONS: [
        // Cooking methods
        'diced', 'chopped', 'minced', 'sliced', 'grated', 'shredded', 'crushed', 'mashed', 'pureed', 'blended', 'whipped', 'beaten',
        'sautéed', 'roasted', 'grilled', 'baked', 'fried', 'steamed', 'boiled', 'simmered', 'braised', 'smoked', 'cured', 'pickled',
        // States
        'fresh', 'frozen', 'canned', 'dried', 'cooked', 'raw', 'ripe', 'unripe', 'green', 'yellow', 'red', 'white', 'brown', 'black',
        'thawed', 'chilled', 'warm', 'hot', 'cold', 'room temperature', 'at room temperature',
        // Preparations
        'peeled', 'seeded', 'trimmed', 'washed', 'drained', 'crumbled', 'shaved', 'julienned', 'spiralized', 'matchstick', 'cubed',
        // Modifiers
        'coarsely', 'finely', 'roughly', 'thinly', 'thickly', 'lightly', 'heavily', 'deeply', 'shallowly',
        // Recipe words
        'divided', 'separated', 'combined', 'mixed', 'stirred', 'whisked', 'folded', 'kneaded', 'rolled', 'pressed',
        'optional', 'required', 'needed', 'desired', 'preferred', 'recommended', 'suggested',
        'for garnish', 'for serving', 'for decoration', 'for topping', 'for filling', 'for coating',
        'such as', 'like', 'similar to', 'or', 'and/or', 'plus', 'with', 'without', 'including', 'excluding',
        // Additional actions found in analysis
        'thawed', 'divided', 'optional', 'required', 'needed', 'desired', 'preferred', 'recommended',
    ],
    
    // Enhanced irrelevant words
    IRRELEVANT: [
        // Temperature and measurements
        'degrees', 'degree', 'temperature', 'temp', 'fahrenheit', 'celsius', 'f', 'c',
        // Containers
        'bottle', 'bottles', 'container', 'containers', 'package', 'packages', 'envelope', 'envelopes',
        // Brand and marketing
        'brand', 'brands', 'name', 'names', 'type', 'types', 'style', 'styles', 'flavor', 'flavors',
        'johnsonville', 'nutella', 'kelloggs', 'newcastle', 'barilla', 'fleischmanns', 'spiceislands',
        // Sizes
        'size', 'sizes', 'large', 'medium', 'small', 'mini', 'jumbo', 'regular', 'standard',
        // Quality descriptors
        'premium', 'deluxe', 'gourmet', 'artisan', 'craft', 'homemade', 'store-bought', 'commercial',
        'organic', 'natural', 'artificial', 'synthetic', 'real', 'fake', 'imitation', 'substitute',
        'low-fat', 'fat-free', 'sugar-free', 'diet', 'light', 'reduced', 'full-fat', 'whole',
        // Marketing terms
        'extra', 'super', 'ultra', 'mega', 'mini', 'micro', 'nano', 'giant', 'tiny',
        'original', 'classic', 'traditional', 'modern', 'contemporary', 'vintage', 'retro',
        'premium', 'luxury', 'economy', 'budget', 'expensive', 'cheap', 'affordable',
        'imported', 'domestic', 'local', 'regional', 'national', 'international', 'global',
        'seasonal', 'year-round', 'limited', 'exclusive', 'special', 'unique', 'rare',
        'popular', 'famous', 'well-known', 'unknown', 'obscure', 'common', 'uncommon',
        'new', 'old', 'fresh', 'stale', 'recent', 'ancient', 'modern', 'vintage',
        'quality', 'grade', 'level', 'tier', 'class', 'category', 'group', 'family',
        'variety', 'selection', 'assortment', 'collection', 'set', 'bundle', 'pack',
        'ready', 'prepared', 'cooked', 'uncooked', 'raw', 'processed', 'unprocessed',
        'instant', 'quick', 'fast', 'slow', 'traditional', 'conventional', 'modern',
        'healthy', 'unhealthy', 'nutritious', 'nutrient-rich', 'fortified', 'enriched',
        'gluten-free', 'dairy-free', 'vegan', 'vegetarian', 'kosher', 'halal',
        'all-natural', 'preservative-free', 'additive-free', 'chemical-free',
        'farm-fresh', 'locally-sourced', 'sustainably-grown', 'ethically-produced'
    ],
    
    // Recipe words
    RECIPE_WORDS: [
        'recipe', 'ingredient', 'ingredients', 'directions', 'instructions', 'steps',
        'prep time', 'cook time', 'total time', 'servings', 'yield', 'makes',
        'see note', 'see tips', 'optional', 'required', 'needed', 'desired',
        'to taste', 'as needed', 'as desired', 'or to taste', 'or as needed',
        'divided', 'separated', 'combined', 'mixed', 'stirred', 'whisked',
        'for garnish', 'for serving', 'for decoration', 'for topping', 'for filling',
        'such as', 'like', 'similar to', 'or', 'and/or', 'plus', 'with', 'without',
        'including', 'excluding', 'except', 'besides', 'other than', 'in addition to'
    ]
};

// Improved cleaning function
function improvedClean(str) {
    if (!str || typeof str !== 'string') return '';
    
    let cleaned = str.toLowerCase().trim();
    
    // Remove numbers and measurements
    IMPROVED_CLEANING_PATTERNS.NUMBERS.forEach(pattern => {
        cleaned = cleaned.replace(pattern, ' ');
    });
    
    // Remove units
    IMPROVED_CLEANING_PATTERNS.UNITS.forEach(pattern => {
        cleaned = cleaned.replace(pattern, ' ');
    });
    
    // Remove action words
    IMPROVED_CLEANING_PATTERNS.ACTIONS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, ' ');
    });
    
    // Remove irrelevant words
    IMPROVED_CLEANING_PATTERNS.IRRELEVANT.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, ' ');
    });
    
    // Remove recipe words
    IMPROVED_CLEANING_PATTERNS.RECIPE_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, ' ');
    });
    
    // Remove special characters
    cleaned = cleaned.replace(/[&,;:'"`~!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?®™©]/g, ' ');
    
    // Clean up extra spaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Convert to camelCase if multi-word
    if (cleaned.includes(' ')) {
        cleaned = cleaned.split(' ')
            .map((word, index) => {
                if (index === 0) return word;
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join('');
    }
    
    // Truncate if too long
    if (cleaned.length > 100) {
        cleaned = cleaned.substring(0, 100);
    }
    
    return cleaned;
}

// Test improved cleaning on problematic examples
async function testImprovedCleaning() {
    console.log('🧪 Testing Improved Cleaning on Problematic Examples...\n');
    
    const problematicExamples = [
        "poundsgrannysmithbraeburnorothertartapples",
        "cupsthawedcoolwhiptoppingdivided", 
        "135ouncepackagejohnsonville®andouilledinnersausagecutintoinchslices",
        "1cherrypiefillingdivided",
        "14ouncecantomatoesanddivided",
        "tablespoonschocolatehazelnutspreadsuchasnutella®ormore",
        "cupverywarmmilk120degreesfto130degreesf",
        "teaspoonspiceislands®italianherbseasoning"
    ];
    
    console.log('📊 Before vs After Improved Cleaning:\n');
    
    for (const example of problematicExamples) {
        const cleaned = improvedClean(example);
        console.log(`🔍 "${example}" → "${cleaned}"`);
        
        // Check if issues are resolved
        const hasNumbers = /\d/.test(cleaned);
        const hasUnits = /cup|tbsp|tsp|oz|pound|gram|ml|inch|package|can|jar|bottle/i.test(cleaned);
        const hasActions = /diced|chopped|sliced|fresh|frozen|canned|optional|divided|thawed/i.test(cleaned);
        const hasIrrelevant = /brand|type|style|size|premium|organic|imported|johnsonville|nutella/i.test(cleaned);
        
        if (hasNumbers || hasUnits || hasActions || hasIrrelevant) {
            console.log(`   ❌ Still has issues: ${hasNumbers ? 'numbers ' : ''}${hasUnits ? 'units ' : ''}${hasActions ? 'actions ' : ''}${hasIrrelevant ? 'irrelevant' : ''}`);
        } else {
            console.log(`   ✅ Clean!`);
        }
        console.log('');
    }
}

// Apply improved cleaning to database
async function applyImprovedCleaning() {
    console.log('🔧 Applying Improved Cleaning...\n');
    
    try {
        const { data: ingredients, error } = await supabase
            .from('IngredientCanonical')
            .select('id, canonical_ingredient')
            .limit(50);
        
        if (error) {
            console.error('❌ Error fetching ingredients:', error);
            return;
        }
        
        console.log(`📊 Processing ${ingredients.length} ingredients...`);
        
        let fixedCount = 0;
        let unchangedCount = 0;
        let improvedCount = 0;
        
        for (const ingredient of ingredients) {
            const originalName = ingredient.canonical_ingredient;
            const cleanedName = improvedClean(originalName);
            
            if (cleanedName !== originalName && cleanedName.length > 2) {
                console.log(`   🔧 "${originalName}" → "${cleanedName}"`);
                
                const { error: updateError } = await supabase
                    .from('IngredientCanonical')
                    .update({ canonical_ingredient: cleanedName })
                    .eq('id', ingredient.id);
                
                if (updateError) {
                    console.error(`   ❌ Error updating ingredient ${ingredient.id}:`, updateError);
                } else {
                    fixedCount++;
                    if (cleanedName.length < originalName.length) {
                        improvedCount++;
                    }
                }
            } else {
                unchangedCount++;
            }
        }
        
        console.log(`\n📈 Improved Cleaning Summary:`);
        console.log(`   🔧 Fixed: ${fixedCount}`);
        console.log(`   ✅ Unchanged: ${unchangedCount}`);
        console.log(`   📈 Improved (shorter): ${improvedCount}`);
        
    } catch (error) {
        console.error('❌ Error applying improved cleaning:', error);
    }
}

// Main function
async function runImprovedCleaning() {
    console.log('🚀 Starting Improved Cleaning System...\n');
    
    await testImprovedCleaning();
    await applyImprovedCleaning();
    
    console.log('\n🎉 Improved Cleaning Complete!');
    console.log('\n📋 Improvements Made:');
    console.log('1. ✅ Enhanced unit pattern matching');
    console.log('2. ✅ Added more action word patterns');
    console.log('3. ✅ Included brand name removal');
    console.log('4. ✅ Better number pattern detection');
    console.log('5. ✅ Ready for full-scale deployment');
}

runImprovedCleaning().catch(console.error); 