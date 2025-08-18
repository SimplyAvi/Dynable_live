const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// 🧠 EVOLVING CLASSIFICATION RULES - Updated automatically by the script
let EVOLVING_RULES = {
    // Base raw ingredients (what recipes call for)
    raw_keywords: [
        'flour', 'sugar', 'salt', 'eggs', 'milk', 'butter', 'oil',
        'onions', 'garlic', 'tomatoes', 'carrots', 'potatoes',
        'chicken', 'beef', 'pork', 'fish', 'shrimp',
        'apples', 'bananas', 'strawberries', 'lemons', 'limes',
        'rice', 'pasta', 'beans', 'nuts', 'seeds'
    ],
    
    // Processed indicators (anything seasoned/flavored/prepared)
    processed_indicators: [
        // Flavors and seasonings
        'spicy', 'italian', 'herb', 'seasoned', 'flavored',
        'sweet', 'sour', 'salty', 'savory', 'tangy', 'zesty',
        'barbecue', 'bbq', 'marinade', 'sauce', 'dressing',
        'strawberry', 'chocolate', 'vanilla', 'caramel', 'maple',
        
        // Preparation methods
        'cooked', 'baked', 'fried', 'grilled', 'roasted', 'smoked',
        'cured', 'pickled', 'fermented', 'brewed', 'distilled',
        
        // Product types (always processed)
        'bread', 'cookies', 'cake', 'pie', 'pizza', 'pasta',
        'cereal', 'chips', 'crackers', 'snacks', 'candy',
        'soda', 'juice', 'drink', 'beverage', 'tea', 'coffee',
        'yogurt', 'cheese', 'ice cream', 'gum', 'chocolate',
        
        // Combined/mixed products
        'mix', 'blend', 'combination', 'variety', 'assortment',
        'dip', 'spread', 'sauce', 'gravy', 'soup', 'stew',
        
        // Branded/prepared items
        'original', 'classic', 'premium', 'deluxe', 'gourmet',
        'homemade', 'artisan', 'craft', 'special', 'limited',
        
        // Specific processed foods
        'sausage', 'bacon', 'ham', 'deli', 'jerky', 'nuggets',
        'patties', 'strips', 'cubes', 'slices', 'shredded',
        'crumbled', 'grated', 'diced', 'chopped', 'minced'
    ],
    
    // 🆕 LEARNED EXCEPTIONS - Added automatically by the script
    learned_exceptions: {
        // "pattern" -> "correct_classification"
        // Example: "whole wheat flour" should be RAW despite containing "wheat"
    },
    
    // 🆕 LEARNED PATTERNS - New indicators discovered by the script
    learned_indicators: {
        processed: [],
        raw: []
    },
    
    // 🆕 CONFIDENCE SCORES - Track how reliable each rule is
    confidence_scores: {
        raw_keywords: {},
        processed_indicators: {},
        learned_exceptions: {}
    }
};

// 🧠 LEARNING TRACKING
let LEARNING_HISTORY = {
    iterations: [],
    accuracy_progression: [],
    discovered_patterns: [],
    rule_updates: []
};

// Enhanced cleaning function
function cleanForClassification(str) {
    if (!str || typeof str !== 'string') return '';
    
    let cleaned = str.toLowerCase().trim();
    
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

// 🧠 CLASSIFICATION FUNCTION - Uses evolving rules
function classifyProduct(name) {
    const cleanedName = cleanForClassification(name);
    
    // 🆕 FIRST: Check learned exceptions (highest priority)
    for (const [pattern, correctClassification] of Object.entries(EVOLVING_RULES.learned_exceptions)) {
        if (cleanedName.includes(pattern)) {
            return correctClassification;
        }
    }
    
    // SECOND: Check for processed indicators
    const hasProcessedIndicators = EVOLVING_RULES.processed_indicators.some(indicator => 
        cleanedName.includes(indicator)
    );
    
    // 🆕 Check learned processed indicators
    const hasLearnedProcessedIndicators = EVOLVING_RULES.learned_indicators.processed.some(indicator => 
        cleanedName.includes(indicator)
    );
    
    if (hasProcessedIndicators || hasLearnedProcessedIndicators) {
        return 'processed';
    }
    
    // THIRD: Check for basic raw ingredients
    const hasRawIngredients = EVOLVING_RULES.raw_keywords.some(keyword => 
        cleanedName.includes(keyword)
    );
    
    // 🆕 Check learned raw indicators
    const hasLearnedRawIndicators = EVOLVING_RULES.learned_indicators.raw.some(indicator => 
        cleanedName.includes(indicator)
    );
    
    if (hasRawIngredients || hasLearnedRawIndicators) {
        return 'raw';
    }
    
    return 'unclear';
}

// 🧠 ADVISOR EXAMPLES - Ground truth for learning
const ADVISOR_EXAMPLES = {
    raw: [
        "flour", "eggs", "milk", "tomatoes", "chicken breast", 
        "olive oil", "onions", "garlic", "salt", "sugar"
    ],
    processed: [
        "chocolate chip cookies", "tomato sauce", "strawberry milk", 
        "italian sausage", "bread", "pasta sauce", "seasoned ground beef", 
        "flavored yogurt", "pizza", "cereal"
    ]
};

// 🧠 TEST CLASSIFICATION ON ADVISOR EXAMPLES
function testAdvisorExamples() {
    console.log('🧪 Testing Classification on Advisor Examples...\n');
    
    let rawCorrect = 0;
    let processedCorrect = 0;
    const misclassifications = [];
    
    console.log('📋 RAW INGREDIENTS (Should be RAW):');
    ADVISOR_EXAMPLES.raw.forEach(example => {
        const classification = classifyProduct(example);
        const status = classification === 'raw' ? '✅' : '❌';
        if (classification === 'raw') {
            rawCorrect++;
        } else {
            misclassifications.push({
                name: example,
                predicted: classification,
                expected: 'raw',
                type: 'raw_misclassified'
            });
        }
        console.log(`   ${status} "${example}" → ${classification.toUpperCase()}`);
    });
    
    console.log(`   📊 Raw Accuracy: ${rawCorrect}/${ADVISOR_EXAMPLES.raw.length} (${(rawCorrect/ADVISOR_EXAMPLES.raw.length*100).toFixed(0)}%)`);
    console.log('');
    
    console.log('📋 PROCESSED PRODUCTS (Should be PROCESSED):');
    ADVISOR_EXAMPLES.processed.forEach(example => {
        const classification = classifyProduct(example);
        const status = classification === 'processed' ? '✅' : '❌';
        if (classification === 'processed') {
            processedCorrect++;
        } else {
            misclassifications.push({
                name: example,
                predicted: classification,
                expected: 'processed',
                type: 'processed_misclassified'
            });
        }
        console.log(`   ${status} "${example}" → ${classification.toUpperCase()}`);
    });
    
    console.log(`   📊 Processed Accuracy: ${processedCorrect}/${ADVISOR_EXAMPLES.processed.length} (${(processedCorrect/ADVISOR_EXAMPLES.processed.length*100).toFixed(0)}%)`);
    console.log('');
    
    const totalAccuracy = ((rawCorrect + processedCorrect) / (ADVISOR_EXAMPLES.raw.length + ADVISOR_EXAMPLES.processed.length) * 100).toFixed(1);
    console.log(`🎯 OVERALL ADVISOR ACCURACY: ${totalAccuracy}%`);
    console.log('');
    
    return {
        accuracy: parseFloat(totalAccuracy),
        misclassifications: misclassifications
    };
}

// 🧠 TEST CLASSIFICATION ON REAL DATA
async function testClassificationOnBatch(batchSize = 1000) {
    console.log(`🧪 Testing Classification on ${batchSize} Products...\n`);
    
    try {
        const { data: products, error } = await supabase
            .from('ProductCanonical')
            .select('id, original_product_name, canonical_product_name')
            .limit(batchSize);
        
        if (error) {
            console.error('❌ Error fetching products:', error);
            return null;
        }
        
        console.log(`📊 Processing ${products.length} products...\n`);
        
        const classifications = {
            raw: [],
            processed: [],
            unclear: []
        };
        
        let processedCount = 0;
        
        for (const product of products) {
            const classification = classifyProduct(product.canonical_product_name);
            classifications[classification].push({
                id: product.id,
                original: product.original_product_name,
                canonical: product.canonical_product_name,
                classification: classification
            });
            
            processedCount++;
            
            if (processedCount % 100 === 0) {
                console.log(`   📈 Processed: ${processedCount}/${products.length}`);
            }
        }
        
        console.log('\n📊 Classification Results:');
        console.log(`   ✅ Raw: ${classifications.raw.length} (${((classifications.raw.length / products.length) * 100).toFixed(1)}%)`);
        console.log(`   🏭 Processed: ${classifications.processed.length} (${((classifications.processed.length / products.length) * 100).toFixed(1)}%)`);
        console.log(`   ❓ Unclear: ${classifications.unclear.length} (${((classifications.unclear.length / products.length) * 100).toFixed(1)}%)`);
        console.log('');
        
        return classifications;
        
    } catch (error) {
        console.error('❌ Error in classification test:', error);
        return null;
    }
}

// 🧠 ANALYZE FAILURES AND LEARN PATTERNS
function analyzeFailures(misclassifications) {
    console.log('🔍 Analyzing Failures and Learning Patterns...\n');
    
    const patterns = {
        raw_misclassified_as_processed: [],
        processed_misclassified_as_raw: [],
        new_processed_indicators: [],
        new_raw_indicators: [],
        exceptions_needed: []
    };
    
    misclassifications.forEach(item => {
        const cleanedName = cleanForClassification(item.name);
        
        if (item.type === 'raw_misclassified') {
            // Should be RAW but classified as PROCESSED
            console.log(`   ❌ "${item.name}" should be RAW but got PROCESSED`);
            
            // Look for processed indicators that shouldn't apply
            EVOLVING_RULES.processed_indicators.forEach(indicator => {
                if (cleanedName.includes(indicator)) {
                    patterns.exceptions_needed.push({
                        pattern: indicator,
                        context: cleanedName,
                        correct_classification: 'raw'
                    });
                }
            });
            
        } else if (item.type === 'processed_misclassified') {
            // Should be PROCESSED but classified as RAW
            console.log(`   ❌ "${item.name}" should be PROCESSED but got RAW`);
            
            // Extract new processed indicators
            const words = cleanedName.split(' ').filter(word => word.length > 2);
            words.forEach(word => {
                if (!EVOLVING_RULES.processed_indicators.includes(word) && 
                    !EVOLVING_RULES.raw_keywords.includes(word)) {
                    patterns.new_processed_indicators.push(word);
                }
            });
        }
    });
    
    return patterns;
}

// 🧠 UPDATE RULES BASED ON LEARNED PATTERNS
function updateRulesFromMistakes(patterns) {
    console.log('🔄 Updating Rules Based on Learned Patterns...\n');
    
    let rulesUpdated = 0;
    
    // Add new processed indicators
    patterns.new_processed_indicators.forEach(indicator => {
        if (!EVOLVING_RULES.processed_indicators.includes(indicator)) {
            EVOLVING_RULES.processed_indicators.push(indicator);
            EVOLVING_RULES.learned_indicators.processed.push(indicator);
            console.log(`   ➕ Added processed indicator: "${indicator}"`);
            rulesUpdated++;
        }
    });
    
    // Add exceptions for false positives
    patterns.exceptions_needed.forEach(exception => {
        const exceptionKey = `${exception.pattern}_in_${exception.context}`;
        EVOLVING_RULES.learned_exceptions[exceptionKey] = exception.correct_classification;
        console.log(`   ➕ Added exception: "${exceptionKey}" → ${exception.correct_classification}`);
        rulesUpdated++;
    });
    
    console.log(`\n📊 Rules Updated: ${rulesUpdated} new patterns learned`);
    console.log('');
    
    return rulesUpdated;
}

// 🧠 MAIN LEARNING CYCLE
async function runLearningCycle() {
    console.log('🚀 Starting Self-Learning Master Script...\n');
    
    let iteration = 1;
    let advisorAccuracy = 0;
    const maxIterations = 10;
    const targetAccuracy = 95;
    
    while (advisorAccuracy < targetAccuracy && iteration <= maxIterations) {
        console.log(`🔄 Learning Iteration ${iteration}`);
        console.log('=' .repeat(50));
        
        // Test current rules on advisor examples
        const advisorResults = testAdvisorExamples();
        advisorAccuracy = advisorResults.accuracy;
        
        // Test on real data
        const realDataResults = await testClassificationOnBatch(1000);
        
        // Analyze failures and learn patterns
        const patterns = analyzeFailures(advisorResults.misclassifications);
        
        // Update rules based on learned patterns
        const rulesUpdated = updateRulesFromMistakes(patterns);
        
        // Track learning history
        LEARNING_HISTORY.iterations.push({
            iteration: iteration,
            advisor_accuracy: advisorAccuracy,
            rules_updated: rulesUpdated,
            patterns_discovered: patterns
        });
        
        console.log(`📊 Iteration ${iteration} Summary:`);
        console.log(`   🎯 Advisor Accuracy: ${advisorAccuracy}%`);
        console.log(`   🔧 Rules Updated: ${rulesUpdated}`);
        console.log(`   📈 Learning Progress: ${((advisorAccuracy / targetAccuracy) * 100).toFixed(1)}%`);
        console.log('');
        
        if (advisorAccuracy >= targetAccuracy) {
            console.log(`🎉 Target accuracy (${targetAccuracy}%) reached!`);
            break;
        }
        
        iteration++;
    }
    
    // Final results
    console.log('🎉 Learning Cycle Complete!');
    console.log(`📊 Final Advisor Accuracy: ${advisorAccuracy}%`);
    console.log(`🔄 Total Iterations: ${iteration}`);
    console.log(`📈 Total Rules Learned: ${Object.keys(EVOLVING_RULES.learned_exceptions).length + EVOLVING_RULES.learned_indicators.processed.length}`);
    console.log('');
    
    // Show final rules
    console.log('📋 Final Evolved Rules:');
    console.log(`   Raw Keywords: ${EVOLVING_RULES.raw_keywords.length}`);
    console.log(`   Processed Indicators: ${EVOLVING_RULES.processed_indicators.length}`);
    console.log(`   Learned Exceptions: ${Object.keys(EVOLVING_RULES.learned_exceptions).length}`);
    console.log(`   Learned Processed Indicators: ${EVOLVING_RULES.learned_indicators.processed.length}`);
    console.log('');
    
    return {
        finalAccuracy: advisorAccuracy,
        iterations: iteration,
        evolvedRules: EVOLVING_RULES,
        learningHistory: LEARNING_HISTORY
    };
}

// 🧠 EXPORT THE EVOLVED CLASSIFICATION FUNCTION
function getEvolvedClassificationFunction() {
    return {
        classifyProduct: classifyProduct,
        rules: EVOLVING_RULES,
        accuracy: LEARNING_HISTORY.iterations.length > 0 ? 
            LEARNING_HISTORY.iterations[LEARNING_HISTORY.iterations.length - 1].advisor_accuracy : 0
    };
}

// 🚀 RUN THE LEARNING CYCLE
if (require.main === module) {
    runLearningCycle().catch(console.error);
}

module.exports = {
    runLearningCycle,
    getEvolvedClassificationFunction,
    classifyProduct,
    EVOLVING_RULES
}; 