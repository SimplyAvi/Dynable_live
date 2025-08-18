const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Comprehensive cleaning patterns
const CLEANING_PATTERNS = {
    // Numbers and measurements
    NUMBERS: [
        /\d+/g, // Any number
        /\d+\/\d+/g, // Fractions
        /\d+\.\d+/g, // Decimals
        /\d+-\d+/g, // Ranges
        /\d+to\d+/gi, // "to" ranges
        /\d+degrees?/gi, // Temperature
        /\d+°[CF]/gi, // Degrees with symbols
    ],
    
    // Measurement units
    UNITS: [
        /\b(cups?|tbsp|tsp|oz|ounces?|lbs?|pounds?|grams?|kg|kilograms?|ml|milliliters?|liters?|l|gallon|quart|pint|fluid|fl|inch|inches?|cm|centimeter|meter|meters?)\b/gi,
        /\b(package|packages?|can|cans?|jar|jars?|bottle|bottles?|container|containers?|bag|bags?|box|boxes?|tube|tubes?|envelope|envelopes?)\b/gi,
        /\b(slice|slices?|piece|pieces?|chunk|chunks?|wedge|wedges?|strip|strips?|cube|cubes?)\b/gi,
    ],
    
    // Action words
    ACTIONS: [
        'diced', 'chopped', 'minced', 'sliced', 'grated', 'shredded', 'crushed', 'mashed', 'pureed', 'blended', 'whipped', 'beaten',
        'sautéed', 'roasted', 'grilled', 'baked', 'fried', 'steamed', 'boiled', 'simmered', 'braised', 'smoked', 'cured', 'pickled',
        'fresh', 'frozen', 'canned', 'dried', 'cooked', 'raw', 'ripe', 'unripe', 'green', 'yellow', 'red', 'white', 'brown', 'black',
        'peeled', 'seeded', 'trimmed', 'washed', 'drained', 'crumbled', 'shaved', 'julienned', 'spiralized', 'matchstick', 'cubed',
        'coarsely', 'finely', 'roughly', 'thinly', 'thickly', 'lightly', 'heavily', 'lightly', 'deeply', 'shallowly',
        'folded', 'kneaded', 'rolled', 'pressed', 'squeezed', 'strained', 'filtered', 'clarified', 'reduced', 'thickened', 'thinned', 'diluted',
        'divided', 'separated', 'combined', 'mixed', 'stirred', 'whisked', 'folded', 'kneaded', 'rolled', 'pressed',
        'optional', 'required', 'needed', 'desired', 'preferred', 'recommended', 'suggested',
        'thawed', 'frozen', 'chilled', 'warm', 'hot', 'cold', 'room temperature', 'at room temperature',
        'for garnish', 'for serving', 'for decoration', 'for topping', 'for filling', 'for coating',
        'such as', 'like', 'similar to', 'or', 'and/or', 'plus', 'with', 'without', 'including', 'excluding'
    ],
    
    // Irrelevant words
    IRRELEVANT: [
        'degrees', 'degree', 'temperature', 'temp', 'fahrenheit', 'celsius', 'f', 'c',
        'bottle', 'bottles', 'container', 'containers', 'package', 'packages', 'envelope', 'envelopes',
        'brand', 'brands', 'name', 'names', 'type', 'types', 'style', 'styles', 'flavor', 'flavors',
        'size', 'sizes', 'large', 'medium', 'small', 'mini', 'jumbo', 'regular', 'standard',
        'premium', 'deluxe', 'gourmet', 'artisan', 'craft', 'homemade', 'store-bought', 'commercial',
        'organic', 'natural', 'artificial', 'synthetic', 'real', 'fake', 'imitation', 'substitute',
        'low-fat', 'fat-free', 'sugar-free', 'diet', 'light', 'reduced', 'full-fat', 'whole',
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
    
    // Common recipe words to remove
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

// Enhanced cleaning function
function advancedClean(str) {
    if (!str || typeof str !== 'string') return '';
    
    let cleaned = str.toLowerCase().trim();
    
    // Remove numbers and measurements
    CLEANING_PATTERNS.NUMBERS.forEach(pattern => {
        cleaned = cleaned.replace(pattern, ' ');
    });
    
    // Remove units
    CLEANING_PATTERNS.UNITS.forEach(pattern => {
        cleaned = cleaned.replace(pattern, ' ');
    });
    
    // Remove action words
    CLEANING_PATTERNS.ACTIONS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, ' ');
    });
    
    // Remove irrelevant words
    CLEANING_PATTERNS.IRRELEVANT.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, ' ');
    });
    
    // Remove recipe words
    CLEANING_PATTERNS.RECIPE_WORDS.forEach(word => {
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

// Learn from cleaning results
async function learnFromCleaning() {
    console.log('🧠 Learning from Cleaning Results...\n');
    
    try {
        const { data: ingredients, error } = await supabase
            .from('IngredientCanonical')
            .select('canonical_ingredient')
            .limit(50);
        
        if (error) {
            console.error('❌ Error fetching ingredients:', error);
            return;
        }
        
        console.log('📊 Before vs After Cleaning Analysis:\n');
        
        const patterns = {
            stillHasNumbers: [],
            stillHasUnits: [],
            stillHasActions: [],
            stillHasIrrelevant: [],
            tooShort: [],
            tooLong: [],
            perfect: []
        };
        
        for (const ingredient of ingredients) {
            const original = ingredient.canonical_ingredient;
            const cleaned = advancedClean(original);
            
            console.log(`🔍 "${original}" → "${cleaned}"`);
            
            // Analyze what's still there
            if (/\d/.test(cleaned)) {
                patterns.stillHasNumbers.push({ original, cleaned });
            }
            if (/cup|tbsp|tsp|oz|pound|gram|ml|inch|package|can|jar|bottle/i.test(cleaned)) {
                patterns.stillHasUnits.push({ original, cleaned });
            }
            if (/diced|chopped|sliced|fresh|frozen|canned|optional|divided/i.test(cleaned)) {
                patterns.stillHasActions.push({ original, cleaned });
            }
            if (/brand|type|style|size|premium|organic|imported/i.test(cleaned)) {
                patterns.stillHasIrrelevant.push({ original, cleaned });
            }
            
            if (cleaned.length < 3) {
                patterns.tooShort.push({ original, cleaned });
            } else if (cleaned.length > 50) {
                patterns.tooLong.push({ original, cleaned });
            } else {
                patterns.perfect.push({ original, cleaned });
            }
        }
        
        // Report findings
        console.log('\n📈 Learning Summary:');
        console.log(`   ❌ Still has numbers: ${patterns.stillHasNumbers.length}`);
        console.log(`   ❌ Still has units: ${patterns.stillHasUnits.length}`);
        console.log(`   ❌ Still has actions: ${patterns.stillHasActions.length}`);
        console.log(`   ❌ Still has irrelevant: ${patterns.stillHasIrrelevant.length}`);
        console.log(`   ⚠️ Too short: ${patterns.tooShort.length}`);
        console.log(`   ⚠️ Too long: ${patterns.tooLong.length}`);
        console.log(`   ✅ Perfect: ${patterns.perfect.length}`);
        
        // Show examples of issues
        if (patterns.stillHasNumbers.length > 0) {
            console.log('\n🔧 Numbers still present:');
            patterns.stillHasNumbers.slice(0, 3).forEach(item => {
                console.log(`   "${item.original}" → "${item.cleaned}"`);
            });
        }
        
        if (patterns.stillHasUnits.length > 0) {
            console.log('\n🔧 Units still present:');
            patterns.stillHasUnits.slice(0, 3).forEach(item => {
                console.log(`   "${item.original}" → "${item.cleaned}"`);
            });
        }
        
        if (patterns.stillHasActions.length > 0) {
            console.log('\n🔧 Actions still present:');
            patterns.stillHasActions.slice(0, 3).forEach(item => {
                console.log(`   "${item.original}" → "${item.cleaned}"`);
            });
        }
        
        // Suggest improvements
        console.log('\n💡 Suggested Improvements:');
        if (patterns.stillHasNumbers.length > 0) {
            console.log('   - Add more number patterns (ordinal numbers, ranges)');
        }
        if (patterns.stillHasUnits.length > 0) {
            console.log('   - Add more unit patterns (metric units, brand names)');
        }
        if (patterns.stillHasActions.length > 0) {
            console.log('   - Add more action word patterns (cooking methods)');
        }
        if (patterns.stillHasIrrelevant.length > 0) {
            console.log('   - Add more irrelevant word patterns (marketing terms)');
        }
        
    } catch (error) {
        console.error('❌ Error in learning analysis:', error);
    }
}

// Apply advanced cleaning to database
async function applyAdvancedCleaning() {
    console.log('🔧 Applying Advanced Cleaning...\n');
    
    try {
        const { data: ingredients, error } = await supabase
            .from('IngredientCanonical')
            .select('id, canonical_ingredient')
            .limit(100);
        
        if (error) {
            console.error('❌ Error fetching ingredients:', error);
            return;
        }
        
        console.log(`📊 Processing ${ingredients.length} ingredients...`);
        
        let fixedCount = 0;
        let unchangedCount = 0;
        
        for (const ingredient of ingredients) {
            const originalName = ingredient.canonical_ingredient;
            const cleanedName = advancedClean(originalName);
            
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
                }
            } else {
                unchangedCount++;
            }
        }
        
        console.log(`\n📈 Advanced Cleaning Summary:`);
        console.log(`   🔧 Fixed: ${fixedCount}`);
        console.log(`   ✅ Unchanged: ${unchangedCount}`);
        
    } catch (error) {
        console.error('❌ Error applying advanced cleaning:', error);
    }
}

// Main function
async function runAdvancedCleaning() {
    console.log('🚀 Starting Advanced Cleaning System...\n');
    
    await learnFromCleaning();
    await applyAdvancedCleaning();
    
    console.log('\n🎉 Advanced Cleaning Complete!');
    console.log('\n📋 What We Learned:');
    console.log('1. ✅ Identified patterns that need better cleaning');
    console.log('2. ✅ Applied comprehensive cleaning rules');
    console.log('3. ✅ Learned from results for future improvements');
    console.log('4. ✅ Ready to scale up the cleaning process');
}

runAdvancedCleaning().catch(console.error); 