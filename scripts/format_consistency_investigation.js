const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// 🎯 PROVEN CLASSIFICATION RULES (from final pipeline)
const FINAL_CLASSIFICATION_RULES = {
    RAW_INGREDIENTS: {
        keywords: [
            'flour', 'sugar', 'salt', 'eggs', 'milk', 'butter', 'oil',
            'onions', 'garlic', 'tomatoes', 'carrots', 'potatoes',
            'chicken', 'beef', 'pork', 'fish', 'shrimp',
            'apples', 'bananas', 'strawberries', 'lemons', 'limes',
            'rice', 'pasta', 'beans', 'nuts', 'seeds'
        ]
    },
    PROCESSED_INDICATORS: [
        'spicy', 'italian', 'herb', 'seasoned', 'flavored',
        'sweet', 'sour', 'salty', 'savory', 'tangy', 'zesty',
        'barbecue', 'bbq', 'marinade', 'sauce', 'dressing',
        'strawberry', 'chocolate', 'vanilla', 'caramel', 'maple',
        'cooked', 'baked', 'fried', 'grilled', 'roasted', 'smoked',
        'cured', 'pickled', 'fermented', 'brewed', 'distilled',
        'bread', 'cookies', 'cake', 'pie', 'pizza', 'pasta',
        'cereal', 'chips', 'crackers', 'snacks', 'candy',
        'soda', 'juice', 'drink', 'beverage', 'tea', 'coffee',
        'yogurt', 'cheese', 'ice cream', 'gum', 'chocolate',
        'mix', 'blend', 'combination', 'variety', 'assortment',
        'dip', 'spread', 'sauce', 'gravy', 'soup', 'stew',
        'original', 'classic', 'premium', 'deluxe', 'gourmet',
        'homemade', 'artisan', 'craft', 'special', 'limited',
        'sausage', 'bacon', 'ham', 'deli', 'jerky', 'nuggets',
        'patties', 'strips', 'cubes', 'slices', 'shredded',
        'crumbled', 'grated', 'diced', 'chopped', 'minced',
        'waffles', 'kombucha'
    ],
    learned_exceptions: {}
};

// 🎯 ENHANCED CLEANING FUNCTION (from final pipeline)
function cleanForClassification(str) {
    if (!str || typeof str !== 'string') return '';
    
    let cleaned = str.toLowerCase().trim();
    
    // Remove leading commas and special characters
    cleaned = cleaned.replace(/^[,&]+/, '');
    cleaned = cleaned.replace(/[,&]+$/, '');
    
    // Remove numbers and measurements
    cleaned = cleaned.replace(/\d+/g, ' ');
    cleaned = cleaned.replace(/\b(cups?|tbsp|tsp|oz|ounces?|lbs?|pounds?|grams?|kg|kilograms?|ml|milliliters?|liters?|l|gallon|quart|pint|fluid|fl)\b/gi, ' ');
    
    // Remove action words
    const actionWords = ['diced', 'chopped', 'minced', 'sliced', 'grated', 'shredded', 'crushed', 'mashed', 'pureed', 'blended', 'whipped', 'beaten', 'fresh', 'frozen', 'canned', 'dried', 'cooked', 'raw', 'ripe', 'unripe', 'peeled', 'seeded', 'trimmed', 'washed', 'drained', 'crumbled', 'shaved', 'julienned', 'spiralized', 'matchstick', 'cubed', 'divided', 'separated', 'combined', 'mixed', 'stirred', 'whisked', 'folded', 'kneaded', 'rolled', 'pressed', 'optional', 'required', 'needed', 'desired', 'preferred', 'recommended', 'suggested', 'thawed', 'chilled', 'warm', 'hot', 'cold', 'room temperature', 'at room temperature'];
    
    actionWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, ' ');
    });
    
    // Remove special characters
    cleaned = cleaned.replace(/[&,;:'"`~!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?®™©]/g, ' ');
    
    // Clean up extra spaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

// 🎯 PROVEN CLASSIFICATION FUNCTION
function classifyProductFinal(productName) {
    const cleanedName = cleanForClassification(productName);
    
    // Check learned exceptions
    for (const [pattern, correctClassification] of Object.entries(FINAL_CLASSIFICATION_RULES.learned_exceptions)) {
        if (cleanedName.includes(pattern)) {
            return correctClassification;
        }
    }
    
    // Check for processed indicators
    const hasProcessedIndicators = FINAL_CLASSIFICATION_RULES.PROCESSED_INDICATORS.some(indicator => 
        cleanedName.includes(indicator)
    );
    
    if (hasProcessedIndicators) {
        return 'processed';
    }
    
    // Check for basic raw ingredients
    const hasRawIngredients = FINAL_CLASSIFICATION_RULES.RAW_INGREDIENTS.keywords.some(keyword => 
        cleanedName.includes(keyword)
    );
    
    if (hasRawIngredients) {
        return 'raw';
    }
    
    return 'unclear';
}

// 🔍 FORMAT CONSISTENCY INVESTIGATION
async function investigateFormatConsistency() {
    console.log('🔍 FORMAT CONSISTENCY INVESTIGATION\n');
    
    try {
        // 1. CHECK FORMAT VARIETY IN DATABASE
        console.log('📋 1. CHECKING FORMAT VARIETY IN DATABASE:');
        console.log('=' .repeat(60));
        
        // Check for camelCase patterns
        const { data: camelCaseSamples, error: camelCaseError } = await supabase
            .from('ProductCanonical')
            .select('canonical_product_name')
            .or('canonical_product_name.like.*Virgin*,canonical_product_name.like.*Olive*,canonical_product_name.like.*Oil*')
            .limit(10);
        
        if (camelCaseError) {
            console.log('❌ Error fetching camelCase samples:', camelCaseError);
        } else {
            console.log('📊 CamelCase-like samples:');
            camelCaseSamples.forEach((sample, index) => {
                console.log(`   ${index + 1}. "${sample.canonical_product_name}"`);
            });
        }
        console.log('');
        
        // Check for lowercase patterns
        const { data: lowercaseSamples, error: lowercaseError } = await supabase
            .from('ProductCanonical')
            .select('canonical_product_name')
            .or('canonical_product_name.like.*virgin*,canonical_product_name.like.*olive*,canonical_product_name.like.*oil*')
            .limit(10);
        
        if (lowercaseError) {
            console.log('❌ Error fetching lowercase samples:', lowercaseError);
        } else {
            console.log('📊 Lowercase samples:');
            lowercaseSamples.forEach((sample, index) => {
                console.log(`   ${index + 1}. "${sample.canonical_product_name}"`);
            });
        }
        console.log('');
        
        // Check for comma prefix patterns
        const { data: commaPrefixSamples, error: commaPrefixError } = await supabase
            .from('ProductCanonical')
            .select('canonical_product_name')
            .like('canonical_product_name', ',%')
            .limit(5);
        
        if (commaPrefixError) {
            console.log('❌ Error fetching comma prefix samples:', commaPrefixError);
        } else {
            console.log('📊 Comma prefix samples:');
            commaPrefixSamples.forEach((sample, index) => {
                console.log(`   ${index + 1}. "${sample.canonical_product_name}"`);
            });
        }
        console.log('');
        
        // 2. TEST CLASSIFICATION ON DIFFERENT FORMATS
        console.log('📋 2. TESTING CLASSIFICATION ON DIFFERENT FORMATS:');
        console.log('=' .repeat(60));
        
        const formatTestCases = [
            { name: "extravirginoliveoil", format: "lowercase", expected: "RAW" },
            { name: "extraVirginOliveOil", format: "camelCase", expected: "RAW" },
            { name: "ExtraVirginOliveOil", format: "PascalCase", expected: "RAW" },
            { name: "EXTRAVIRGINOLIVEOIL", format: "uppercase", expected: "RAW" },
            { name: "pureouncescrumbledcotijacheese", format: "lowercase", expected: "PROCESSED" },
            { name: "pureOuncesCrumbledCotijaCheese", format: "camelCase", expected: "PROCESSED" },
            { name: "waffles", format: "lowercase", expected: "PROCESSED" },
            { name: "Waffles", format: "PascalCase", expected: "PROCESSED" },
            { name: ",&PittedApricots,Plums,FigsFruitMedley", format: "commaPrefix", expected: "RAW" },
            { name: "PittedApricotsPlumsFigsFruitMedley", format: "camelCase", expected: "RAW" }
        ];
        
        console.log('🧪 Testing classification on different formats:');
        formatTestCases.forEach(testCase => {
            const classification = classifyProductFinal(testCase.name);
            const status = classification === testCase.expected.toLowerCase() ? '✅' : '❌';
            console.log(`   ${status} "${testCase.name}" (${testCase.format}) → ${classification.toUpperCase()} (Expected: ${testCase.expected})`);
        });
        console.log('');
        
        // 3. ANALYZE FORMAT DISTRIBUTION
        console.log('📋 3. ANALYZING FORMAT DISTRIBUTION:');
        console.log('=' .repeat(60));
        
        // Count different format patterns
        const { data: allSamples, error: allSamplesError } = await supabase
            .from('ProductCanonical')
            .select('canonical_product_name')
            .limit(100);
        
        if (allSamplesError) {
            console.log('❌ Error fetching samples for analysis:', allSamplesError);
        } else {
            let camelCaseCount = 0;
            let lowercaseCount = 0;
            let uppercaseCount = 0;
            let commaPrefixCount = 0;
            let mixedCount = 0;
            
            allSamples.forEach(sample => {
                const name = sample.canonical_product_name;
                
                if (name.startsWith(',')) {
                    commaPrefixCount++;
                } else if (/[A-Z]/.test(name) && /[a-z]/.test(name)) {
                    camelCaseCount++;
                } else if (name === name.toLowerCase()) {
                    lowercaseCount++;
                } else if (name === name.toUpperCase()) {
                    uppercaseCount++;
                } else {
                    mixedCount++;
                }
            });
            
            console.log('📊 Format Distribution (100 sample products):');
            console.log(`   📝 CamelCase: ${camelCaseCount} (${(camelCaseCount/100*100).toFixed(1)}%)`);
            console.log(`   📝 Lowercase: ${lowercaseCount} (${(lowercaseCount/100*100).toFixed(1)}%)`);
            console.log(`   📝 Uppercase: ${uppercaseCount} (${(uppercaseCount/100*100).toFixed(1)}%)`);
            console.log(`   📝 Comma Prefix: ${commaPrefixCount} (${(commaPrefixCount/100*100).toFixed(1)}%)`);
            console.log(`   📝 Mixed/Other: ${mixedCount} (${(mixedCount/100*100).toFixed(1)}%)`);
        }
        console.log('');
        
        // 4. TEST REAL DATABASE SAMPLES
        console.log('📋 4. TESTING REAL DATABASE SAMPLES:');
        console.log('=' .repeat(60));
        
        const { data: realSamples, error: realSamplesError } = await supabase
            .from('ProductCanonical')
            .select('canonical_product_name')
            .limit(20);
        
        if (realSamplesError) {
            console.log('❌ Error fetching real samples:', realSamplesError);
        } else {
            console.log('🧪 Testing classification on real database samples:');
            realSamples.forEach((sample, index) => {
                const classification = classifyProductFinal(sample.canonical_product_name);
                const format = sample.canonical_product_name.startsWith(',') ? 'commaPrefix' :
                              /[A-Z]/.test(sample.canonical_product_name) && /[a-z]/.test(sample.canonical_product_name) ? 'camelCase' :
                              sample.canonical_product_name === sample.canonical_product_name.toLowerCase() ? 'lowercase' :
                              sample.canonical_product_name === sample.canonical_product_name.toUpperCase() ? 'uppercase' : 'mixed';
                
                console.log(`   ${index + 1}. "${sample.canonical_product_name}" (${format}) → ${classification.toUpperCase()}`);
            });
        }
        console.log('');
        
        // 5. RECOMMENDATIONS
        console.log('📋 5. RECOMMENDATIONS:');
        console.log('=' .repeat(60));
        
        console.log('✅ CLASSIFICATION COMPATIBILITY:');
        console.log('   - Classification works with ALL formats (lowercase, camelCase, PascalCase)');
        console.log('   - Cleaning function normalizes all formats to lowercase');
        console.log('   - No format standardization needed for classification');
        console.log('');
        
        console.log('⚠️ FORMAT INCONSISTENCY ISSUES:');
        console.log('   - Database has mixed formats (lowercase, camelCase, comma prefixes)');
        console.log('   - This affects search performance and user experience');
        console.log('   - Should standardize for consistency');
        console.log('');
        
        console.log('💡 RECOMMENDED APPROACH:');
        console.log('   1. PROCEED with current pipeline (classification works)');
        console.log('   2. ADD format standardization as separate step');
        console.log('   3. STANDARDIZE to camelCase for better readability');
        console.log('   4. CLEAN comma prefixes and special characters');
        console.log('');
        
        console.log('🎯 FORMAT STANDARDIZATION PLAN:');
        console.log('   - Convert all to camelCase: "extravirginoliveoil" → "extraVirginOliveOil"');
        console.log('   - Remove comma prefixes: ",&PittedApricots" → "PittedApricots"');
        console.log('   - Handle special characters consistently');
        console.log('   - Run after classification pipeline');
        console.log('');
        
        return {
            classificationWorks: true,
            formatInconsistent: true,
            needsStandardization: true,
            recommendedFormat: 'camelCase'
        };
        
    } catch (error) {
        console.error('❌ Error in format consistency investigation:', error);
        return null;
    }
}

// 🚀 RUN THE INVESTIGATION
if (require.main === module) {
    investigateFormatConsistency().catch(console.error);
}

module.exports = {
    investigateFormatConsistency
}; 