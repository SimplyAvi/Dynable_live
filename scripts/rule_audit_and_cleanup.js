const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// 🚨 CURRENT RULES AUDIT
const CURRENT_RULES = {
    RAW_INGREDIENTS: {
        keywords: [
            'flour', 'sugar', 'salt', 'eggs', 'milk', 'butter', 'oil',
            'onions', 'garlic', 'tomatoes', 'carrots', 'potatoes',
            'chicken', 'beef', 'pork', 'fish', 'shrimp',
            'apples', 'bananas', 'strawberries', 'lemons', 'limes',
            'rice', 'pasta', 'beans', 'nuts', 'seeds', 'water', 'raisins', 'fruits', 'beets', 'shallots', 'yolks',
            'turkey', 'oranges', 'farro', 'corn', 'olives', 'pasta', 'rice', 'apples', 'beans', 'cranberry', 'quinoa', 'artichokes', 'celery', 'tilapia', 'avocado', 'organic', 'whole', 'grain', 'vegetable'
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
        'waffles', 'kombucha',
        'mints', 'cookie', 'margarine', 'hummus', 'cottage',
        'jam', 'ketchup', 'candies', 'chews',
        'pad thai', 'broth', 'roll', 'toppings',
        'pretzels', 'puree', 'burger',
        'buns', 'mustard', 'chips',
        'muffins', 'oatmeal', 'granola', 'scallops',
        'tortillas', 'relish',
        'pastries', 'jelly', 'coppa', 'alfredo',
        'olives', 'icing', 'vinaigrette', 'pimiento', 'pasta', 'macaroni', 'toaster', 'pastries', 'cereal', 'rice', 'crisp', 'frosted', 'balsamic', 'manzanilla', 'stuffed', 'pitted', 'ripe', 'green', 'bright', 'annie',
        'gelatin', 'parfait', 'gel', 'chiffon', 'mist', 'crme', 'layer', 'treat', 'bites', 'lakeview', 'winky', 'luisa', 'kellogg', 'kelloggs', 'cereal', 'jacks', 'krispies', 'special', 'smart', 'crispix',
        'salsa', 'salad', 'chili', 'cobbler', 'restaurant', 'mild', 'crave', 'antique', 'white', 'mexican', 'style', 'thai', 'mango', 'everything', 'peach'
    ]
};

// 🚨 BRAND NAMES TO REMOVE
const BRAND_NAMES = [
    'great value', 'annie', 'kellogg', 'kelloggs', 'lakeview', 'winky', 'luisa',
    'columbia', 'mothers maid', 'furmanos', 'shearers', 'crave-n-rave'
];

// 🚨 DESCRIPTORS TO REMOVE
const DESCRIPTORS = [
    'green', 'white', 'ripe', 'bright', 'antique', 'mild', 'everything',
    'original', 'classic', 'premium', 'deluxe', 'gourmet', 'artisan', 'craft', 'special', 'limited'
];

// 🚨 CONFLICT RESOLUTION
const CONFLICT_RESOLUTION = {
    // Items that should be RAW (remove from PROCESSED)
    'olives': 'RAW',
    'pasta': 'RAW', // Basic pasta is raw ingredient
    'rice': 'RAW',  // Basic rice is raw ingredient
    'beans': 'RAW',
    'cereal': 'RAW', // Basic cereal grains are raw
    'organic': 'RAW',
    'whole': 'RAW',
    'grain': 'RAW',
    'vegetable': 'RAW'
};

function auditRules() {
    console.log('🚨 RULE AUDIT & CLEANUP\n');
    
    // 1. IDENTIFY CONFLICTS
    console.log('1️⃣ CONFLICT ANALYSIS:');
    const rawKeywords = CURRENT_RULES.RAW_INGREDIENTS.keywords;
    const processedIndicators = CURRENT_RULES.PROCESSED_INDICATORS;
    
    const conflicts = [];
    rawKeywords.forEach(keyword => {
        if (processedIndicators.includes(keyword)) {
            conflicts.push(keyword);
        }
    });
    
    console.log(`   Found ${conflicts.length} conflicts:`);
    conflicts.forEach(conflict => {
        console.log(`   ❌ "${conflict}" appears in both RAW and PROCESSED`);
    });
    
    // 2. IDENTIFY BRAND NAMES
    console.log('\n2️⃣ BRAND NAME ANALYSIS:');
    const brandNamesFound = [];
    processedIndicators.forEach(indicator => {
        if (BRAND_NAMES.some(brand => indicator.toLowerCase().includes(brand))) {
            brandNamesFound.push(indicator);
        }
    });
    
    console.log(`   Found ${brandNamesFound.length} brand names:`);
    brandNamesFound.forEach(brand => {
        console.log(`   ❌ "${brand}" is a brand name, not a product type`);
    });
    
    // 3. IDENTIFY DESCRIPTORS
    console.log('\n3️⃣ DESCRIPTOR ANALYSIS:');
    const descriptorsFound = [];
    processedIndicators.forEach(indicator => {
        if (DESCRIPTORS.includes(indicator.toLowerCase())) {
            descriptorsFound.push(indicator);
        }
    });
    
    console.log(`   Found ${descriptorsFound.length} descriptors:`);
    descriptorsFound.forEach(descriptor => {
        console.log(`   ❌ "${descriptor}" is a descriptor, not a product type`);
    });
    
    return { conflicts, brandNamesFound, descriptorsFound };
}

function createCleanRules() {
    console.log('\n🧹 CREATING CLEAN RULES...\n');
    
    // Start with clean base rules
    const CLEAN_RULES = {
        RAW_INGREDIENTS: {
            keywords: [
                // Basic raw ingredients
                'flour', 'sugar', 'salt', 'eggs', 'milk', 'butter', 'oil',
                'onions', 'garlic', 'tomatoes', 'carrots', 'potatoes',
                'chicken', 'beef', 'pork', 'fish', 'shrimp',
                'apples', 'bananas', 'strawberries', 'lemons', 'limes',
                'rice', 'pasta', 'beans', 'nuts', 'seeds', 'water', 'raisins', 
                'fruits', 'beets', 'shallots', 'yolks', 'turkey', 'oranges', 
                'farro', 'corn', 'olives', 'cranberry', 'quinoa', 'artichokes', 
                'celery', 'tilapia', 'avocado', 'organic', 'whole', 'grain', 'vegetable'
            ]
        },
        PROCESSED_INDICATORS: [
            // Processing methods
            'spicy', 'italian', 'herb', 'seasoned', 'flavored',
            'sweet', 'sour', 'salty', 'savory', 'tangy', 'zesty',
            'barbecue', 'bbq', 'marinade', 'sauce', 'dressing',
            'cooked', 'baked', 'fried', 'grilled', 'roasted', 'smoked',
            'cured', 'pickled', 'fermented', 'brewed', 'distilled',
            
            // Processed food types
            'bread', 'cookies', 'cake', 'pie', 'pizza',
            'chips', 'crackers', 'snacks', 'candy',
            'soda', 'juice', 'drink', 'beverage', 'tea', 'coffee',
            'yogurt', 'cheese', 'ice cream', 'gum', 'chocolate',
            'mix', 'blend', 'combination', 'variety', 'assortment',
            'dip', 'spread', 'gravy', 'soup', 'stew',
            'sausage', 'bacon', 'ham', 'deli', 'jerky', 'nuggets',
            'patties', 'strips', 'cubes', 'slices', 'shredded',
            'crumbled', 'grated', 'diced', 'chopped', 'minced',
            'waffles', 'kombucha', 'mints', 'cookie', 'margarine', 
            'hummus', 'cottage', 'jam', 'ketchup', 'candies', 'chews',
            'pad thai', 'broth', 'roll', 'toppings', 'pretzels', 
            'puree', 'burger', 'buns', 'mustard', 'muffins', 
            'oatmeal', 'granola', 'scallops', 'tortillas', 'relish',
            'pastries', 'jelly', 'coppa', 'alfredo', 'icing', 
            'vinaigrette', 'pimiento', 'macaroni', 'toaster', 
            'balsamic', 'manzanilla', 'stuffed', 'pitted', 
            'gelatin', 'parfait', 'gel', 'chiffon', 'mist', 
            'crme', 'layer', 'treat', 'bites', 'cereal', 
            'jacks', 'krispies', 'special', 'smart', 'crispix',
            'salsa', 'salad', 'chili', 'cobbler', 'restaurant', 
            'crave', 'mexican', 'style', 'thai', 'mango', 'peach'
        ]
    };
    
    console.log('✅ CLEAN RULES CREATED:');
    console.log(`   RAW ingredients: ${CLEAN_RULES.RAW_INGREDIENTS.keywords.length}`);
    console.log(`   PROCESSED indicators: ${CLEAN_RULES.PROCESSED_INDICATORS.length}`);
    
    return CLEAN_RULES;
}

function validateRuleAddition(newRule, ruleType) {
    console.log(`\n🔍 VALIDATING RULE: "${newRule}" (${ruleType})`);
    
    // Check if it's a brand name
    if (BRAND_NAMES.some(brand => newRule.toLowerCase().includes(brand))) {
        console.log(`   ❌ REJECTED: "${newRule}" is a brand name`);
        return false;
    }
    
    // Check if it's a descriptor
    if (DESCRIPTORS.includes(newRule.toLowerCase())) {
        console.log(`   ❌ REJECTED: "${newRule}" is a descriptor`);
        return false;
    }
    
    // Check for conflicts
    const cleanRules = createCleanRules();
    if (ruleType === 'PROCESSED' && cleanRules.RAW_INGREDIENTS.keywords.includes(newRule)) {
        console.log(`   ❌ REJECTED: "${newRule}" already in RAW ingredients`);
        return false;
    }
    
    if (ruleType === 'RAW' && cleanRules.PROCESSED_INDICATORS.includes(newRule)) {
        console.log(`   ❌ REJECTED: "${newRule}" already in PROCESSED indicators`);
        return false;
    }
    
    console.log(`   ✅ ACCEPTED: "${newRule}" is valid for ${ruleType}`);
    return true;
}

// 🚀 RUN THE AUDIT
if (require.main === module) {
    console.log('🚨 COMPREHENSIVE RULE AUDIT & CLEANUP\n');
    
    // Run audit
    const auditResults = auditRules();
    
    // Create clean rules
    const cleanRules = createCleanRules();
    
    // Test validation
    console.log('\n4️⃣ RULE VALIDATION TESTING:');
    const testRules = [
        { rule: 'kellogg', type: 'PROCESSED' },
        { rule: 'green', type: 'PROCESSED' },
        { rule: 'pasta', type: 'PROCESSED' },
        { rule: 'quinoa', type: 'RAW' },
        { rule: 'salsa', type: 'PROCESSED' }
    ];
    
    testRules.forEach(test => {
        validateRuleAddition(test.rule, test.type);
    });
    
    console.log('\n📊 AUDIT SUMMARY:');
    console.log(`   Conflicts found: ${auditResults.conflicts.length}`);
    console.log(`   Brand names found: ${auditResults.brandNamesFound.length}`);
    console.log(`   Descriptors found: ${auditResults.descriptorsFound.length}`);
    console.log(`   Clean RAW ingredients: ${cleanRules.RAW_INGREDIENTS.keywords.length}`);
    console.log(`   Clean PROCESSED indicators: ${cleanRules.PROCESSED_INDICATORS.length}`);
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('   1. Remove all brand names from rules');
    console.log('   2. Remove all descriptors from rules');
    console.log('   3. Resolve conflicts (RAW takes precedence)');
    console.log('   4. Add validation to prevent future contamination');
    console.log('   5. Focus on product types, not brands/descriptors');
}

module.exports = {
    auditRules,
    createCleanRules,
    validateRuleAddition,
    BRAND_NAMES,
    DESCRIPTORS,
    CONFLICT_RESOLUTION
}; 