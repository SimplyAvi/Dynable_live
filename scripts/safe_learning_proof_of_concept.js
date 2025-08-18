const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// 🛡️ SAFE LEARNING CONFIGURATION
const SAFE_CONFIG = {
    // Ground truth for validation (your advisor's examples)
    ground_truth: {
        raw: [
            "flour", "eggs", "milk", "tomatoes", "chicken breast", 
            "olive oil", "onions", "garlic", "salt", "sugar"
        ],
        processed: [
            "chocolate chip cookies", "tomato sauce", "strawberry milk", 
            "italian sausage", "bread", "pasta sauce", "seasoned ground beef", 
            "flavored yogurt", "pizza", "cereal"
        ]
    },
    
    // Learning safety limits
    max_iterations: 5,
    min_accuracy_threshold: 90, // Must maintain 90%+ on ground truth
    max_rule_changes_per_iteration: 3, // Prevent overfitting
    performance_threshold: 100, // Max ms per classification
    
    // Rollback configuration
    save_checkpoints: true,
    max_rollback_depth: 3
};

// 🛡️ SAFE RULE MANAGEMENT
class SafeRuleManager {
    constructor() {
        this.rules = {
            raw_keywords: [
                'flour', 'sugar', 'salt', 'eggs', 'milk', 'butter', 'oil',
                'onions', 'garlic', 'tomatoes', 'carrots', 'potatoes',
                'chicken', 'beef', 'pork', 'fish', 'shrimp',
                'apples', 'bananas', 'strawberries', 'lemons', 'limes',
                'rice', 'pasta', 'beans', 'nuts', 'seeds'
            ],
            processed_indicators: [
                'spicy', 'italian', 'herb', 'seasoned', 'flavored',
                'sweet', 'sour', 'salty', 'savory', 'tangy', 'zesty',
                'barbecue', 'bbq', 'marinade', 'sauce', 'dressing',
                'strawberry', 'chocolate', 'vanilla', 'caramel', 'maple',
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
                'crumbled', 'grated', 'diced', 'chopped', 'minced'
            ],
            learned_exceptions: {},
            learned_indicators: { processed: [], raw: [] }
        };
        
        this.checkpoints = [];
        this.performance_history = [];
        this.accuracy_history = [];
    }
    
    // 🛡️ SAFE RULE UPDATE WITH VALIDATION
    safeUpdateRules(proposedChanges) {
        console.log('🛡️ Validating proposed rule changes...');
        
        // Create backup checkpoint
        this.createCheckpoint();
        
        // Apply changes temporarily
        const tempRules = JSON.parse(JSON.stringify(this.rules));
        this.applyChanges(tempRules, proposedChanges);
        
        // Test on ground truth
        const groundTruthAccuracy = this.testOnGroundTruth(tempRules);
        const performance = this.measurePerformance(tempRules);
        
        console.log(`   📊 Ground Truth Accuracy: ${groundTruthAccuracy}%`);
        console.log(`   ⚡ Performance: ${performance}ms per classification`);
        
        // Safety checks
        if (groundTruthAccuracy < SAFE_CONFIG.min_accuracy_threshold) {
            console.log('   ❌ REJECTED: Accuracy below threshold');
            return false;
        }
        
        if (performance > SAFE_CONFIG.performance_threshold) {
            console.log('   ❌ REJECTED: Performance degraded');
            return false;
        }
        
        if (this.detectRuleConflicts(tempRules)) {
            console.log('   ❌ REJECTED: Rule conflicts detected');
            return false;
        }
        
        // Apply changes safely
        this.rules = tempRules;
        console.log('   ✅ Changes applied safely');
        return true;
    }
    
    // 🛡️ ROLLBACK MECHANISM
    rollback() {
        if (this.checkpoints.length === 0) {
            console.log('❌ No checkpoints available for rollback');
            return false;
        }
        
        const lastCheckpoint = this.checkpoints.pop();
        this.rules = lastCheckpoint.rules;
        this.accuracy_history = lastCheckpoint.accuracy_history;
        this.performance_history = lastCheckpoint.performance_history;
        
        console.log('🔄 Rolled back to previous checkpoint');
        return true;
    }
    
    // 🛡️ CHECKPOINT CREATION
    createCheckpoint() {
        const checkpoint = {
            rules: JSON.parse(JSON.stringify(this.rules)),
            accuracy_history: [...this.accuracy_history],
            performance_history: [...this.performance_history],
            timestamp: Date.now()
        };
        
        this.checkpoints.push(checkpoint);
        
        // Limit checkpoint depth
        if (this.checkpoints.length > SAFE_CONFIG.max_rollback_depth) {
            this.checkpoints.shift();
        }
        
        console.log(`💾 Created checkpoint (${this.checkpoints.length}/${SAFE_CONFIG.max_rollback_depth})`);
    }
    
    // 🛡️ CONFLICT DETECTION
    detectRuleConflicts(rules) {
        const conflicts = [];
        
        // Check for contradictory learned exceptions
        for (const [pattern1, classification1] of Object.entries(rules.learned_exceptions)) {
            for (const [pattern2, classification2] of Object.entries(rules.learned_exceptions)) {
                if (pattern1 !== pattern2 && 
                    pattern1.includes(pattern2) && 
                    classification1 !== classification2) {
                    conflicts.push(`${pattern1} vs ${pattern2}`);
                }
            }
        }
        
        if (conflicts.length > 0) {
            console.log('   ⚠️ Rule conflicts detected:', conflicts);
            return true;
        }
        
        return false;
    }
    
    // 🛡️ PERFORMANCE MONITORING
    measurePerformance(rules) {
        const startTime = Date.now();
        const testItems = [
            "flour", "chocolate chip cookies", "milk", "bread", 
            "tomatoes", "pizza", "salt", "cereal", "eggs", "sauce"
        ];
        
        testItems.forEach(item => this.classifyProduct(item, rules));
        
        const endTime = Date.now();
        const avgTime = (endTime - startTime) / testItems.length;
        
        return avgTime;
    }
    
    // 🛡️ GROUND TRUTH VALIDATION
    testOnGroundTruth(rules) {
        let correct = 0;
        let total = 0;
        
        // Test raw ingredients
        SAFE_CONFIG.ground_truth.raw.forEach(item => {
            const classification = this.classifyProduct(item, rules);
            if (classification === 'raw') correct++;
            total++;
        });
        
        // Test processed products
        SAFE_CONFIG.ground_truth.processed.forEach(item => {
            const classification = this.classifyProduct(item, rules);
            if (classification === 'processed') correct++;
            total++;
        });
        
        return (correct / total) * 100;
    }
    
    // 🛡️ SAFE CLASSIFICATION
    classifyProduct(name, rules = this.rules) {
        const cleanedName = this.cleanForClassification(name);
        
        // Check learned exceptions first (highest priority)
        for (const [pattern, classification] of Object.entries(rules.learned_exceptions)) {
            if (cleanedName.includes(pattern)) {
                return classification;
            }
        }
        
        // Check processed indicators
        const hasProcessedIndicators = rules.processed_indicators.some(indicator => 
            cleanedName.includes(indicator)
        );
        
        const hasLearnedProcessedIndicators = rules.learned_indicators.processed.some(indicator => 
            cleanedName.includes(indicator)
        );
        
        if (hasProcessedIndicators || hasLearnedProcessedIndicators) {
            return 'processed';
        }
        
        // Check raw ingredients
        const hasRawIngredients = rules.raw_keywords.some(keyword => 
            cleanedName.includes(keyword)
        );
        
        const hasLearnedRawIndicators = rules.learned_indicators.raw.some(indicator => 
            cleanedName.includes(indicator)
        );
        
        if (hasRawIngredients || hasLearnedRawIndicators) {
            return 'raw';
        }
        
        return 'unclear';
    }
    
    // 🛡️ ENHANCED CLEANING
    cleanForClassification(str) {
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
    
    // 🛡️ APPLY CHANGES SAFELY
    applyChanges(rules, changes) {
        if (changes.new_processed_indicators) {
            changes.new_processed_indicators.forEach(indicator => {
                if (!rules.processed_indicators.includes(indicator)) {
                    rules.processed_indicators.push(indicator);
                    rules.learned_indicators.processed.push(indicator);
                }
            });
        }
        
        if (changes.exceptions_needed) {
            changes.exceptions_needed.forEach(exception => {
                const exceptionKey = `${exception.pattern}_in_${exception.context}`;
                rules.learned_exceptions[exceptionKey] = exception.correct_classification;
            });
        }
    }
}

// 🧪 SAFE LEARNING PROOF OF CONCEPT
class SafeLearningPOC {
    constructor() {
        this.ruleManager = new SafeRuleManager();
        this.learning_history = [];
    }
    
    // 🧪 TEST ON SMALL DATASET (50 products)
    async testOnSmallDataset() {
        console.log('🧪 Testing Safe Learning on Small Dataset (50 products)...\n');
        
        try {
            const { data: products, error } = await supabase
                .from('ProductCanonical')
                .select('id, original_product_name, canonical_product_name')
                .limit(50);
            
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
            
            for (const product of products) {
                const classification = this.ruleManager.classifyProduct(product.canonical_product_name);
                classifications[classification].push({
                    id: product.id,
                    original: product.original_product_name,
                    canonical: product.canonical_product_name,
                    classification: classification
                });
            }
            
            console.log('📊 Small Dataset Results:');
            console.log(`   ✅ Raw: ${classifications.raw.length} (${((classifications.raw.length / products.length) * 100).toFixed(1)}%)`);
            console.log(`   🏭 Processed: ${classifications.processed.length} (${((classifications.processed.length / products.length) * 100).toFixed(1)}%)`);
            console.log(`   ❓ Unclear: ${classifications.unclear.length} (${((classifications.unclear.length / products.length) * 100).toFixed(1)}%)`);
            console.log('');
            
            return classifications;
            
        } catch (error) {
            console.error('❌ Error in small dataset test:', error);
            return null;
        }
    }
    
    // 🧪 MANUAL VALIDATION OF RESULTS
    async manualValidation() {
        console.log('🧪 Manual Validation of Results...\n');
        
        const results = await this.testOnSmallDataset();
        if (!results) return;
        
        console.log('📋 RAW INGREDIENTS EXAMPLES:');
        results.raw.slice(0, 5).forEach((item, index) => {
            console.log(`   ${index + 1}. "${item.original}" → ${item.classification.toUpperCase()}`);
        });
        console.log('');
        
        console.log('📋 PROCESSED PRODUCTS EXAMPLES:');
        results.processed.slice(0, 5).forEach((item, index) => {
            console.log(`   ${index + 1}. "${item.original}" → ${item.classification.toUpperCase()}`);
        });
        console.log('');
        
        console.log('📋 UNCLEAR CASES EXAMPLES:');
        results.unclear.slice(0, 5).forEach((item, index) => {
            console.log(`   ${index + 1}. "${item.original}" → ${item.classification.toUpperCase()}`);
        });
        console.log('');
        
        return results;
    }
    
    // 🧪 SAFE LEARNING ITERATION
    async safeLearningIteration() {
        console.log('🔄 Safe Learning Iteration...\n');
        
        // Test current rules on ground truth
        const groundTruthAccuracy = this.ruleManager.testOnGroundTruth();
        console.log(`📊 Current Ground Truth Accuracy: ${groundTruthAccuracy}%`);
        
        // Test on small dataset
        const results = await this.testOnSmallDataset();
        if (!results) return false;
        
        // Analyze potential improvements (MANUAL REVIEW REQUIRED)
        const potentialImprovements = this.analyzeForImprovements(results);
        
        if (potentialImprovements.length === 0) {
            console.log('✅ No improvements needed');
            return true;
        }
        
        console.log('🔍 Potential Improvements Found:');
        potentialImprovements.forEach((improvement, index) => {
            console.log(`   ${index + 1}. ${improvement.description}`);
        });
        console.log('');
        
        // MANUAL VALIDATION REQUIRED - No automatic rule changes
        console.log('⚠️ MANUAL VALIDATION REQUIRED');
        console.log('   - Review potential improvements above');
        console.log('   - Validate patterns are correct');
        console.log('   - No automatic rule changes in safe mode');
        console.log('');
        
        return true;
    }
    
    // 🧪 ANALYZE FOR IMPROVEMENTS (SAFE MODE)
    analyzeForImprovements(results) {
        const improvements = [];
        
        // Look for patterns in unclear cases
        const unclearPatterns = {};
        results.unclear.forEach(item => {
            const words = this.ruleManager.cleanForClassification(item.canonical).split(' ');
            words.forEach(word => {
                if (word.length > 3) {
                    unclearPatterns[word] = (unclearPatterns[word] || 0) + 1;
                }
            });
        });
        
        // Suggest potential processed indicators
        Object.entries(unclearPatterns)
            .filter(([word, count]) => count >= 2)
            .forEach(([word, count]) => {
                improvements.push({
                    type: 'potential_processed_indicator',
                    word: word,
                    count: count,
                    description: `Consider adding "${word}" as processed indicator (${count} occurrences)`
                });
            });
        
        return improvements;
    }
    
    // 🧪 PERFORMANCE BENCHMARKING
    benchmarkPerformance() {
        console.log('⚡ Performance Benchmarking...\n');
        
        const testItems = [
            "flour", "chocolate chip cookies", "milk", "bread", 
            "tomatoes", "pizza", "salt", "cereal", "eggs", "sauce",
            "olive oil", "italian sausage", "garlic", "strawberry milk"
        ];
        
        const startTime = Date.now();
        testItems.forEach(item => this.ruleManager.classifyProduct(item));
        const endTime = Date.now();
        
        const totalTime = endTime - startTime;
        const avgTime = totalTime / testItems.length;
        
        console.log(`📊 Performance Results:`);
        console.log(`   ⏱️ Total Time: ${totalTime}ms`);
        console.log(`   📈 Average Time: ${avgTime.toFixed(2)}ms per classification`);
        console.log(`   🎯 Items Processed: ${testItems.length}`);
        console.log('');
        
        return avgTime;
    }
    
    // 🧪 RUN COMPLETE SAFE TEST
    async runSafeTest() {
        console.log('🚀 Starting Safe Learning Proof of Concept...\n');
        
        // Step 1: Test ground truth accuracy
        const groundTruthAccuracy = this.ruleManager.testOnGroundTruth();
        console.log(`🎯 Initial Ground Truth Accuracy: ${groundTruthAccuracy}%`);
        console.log('');
        
        // Step 2: Test on small dataset
        const results = await this.manualValidation();
        
        // Step 3: Benchmark performance
        const performance = this.benchmarkPerformance();
        
        // Step 4: Safe learning iteration
        await this.safeLearningIteration();
        
        console.log('🎉 Safe Learning POC Complete!');
        console.log('📋 Key Safety Features:');
        console.log('   ✅ Ground truth validation');
        console.log('   ✅ Performance monitoring');
        console.log('   ✅ Rollback mechanism');
        console.log('   ✅ Manual validation required');
        console.log('   ✅ No automatic rule changes');
        console.log('');
        
        return {
            groundTruthAccuracy,
            performance,
            results
        };
    }
}

// 🚀 RUN THE SAFE PROOF OF CONCEPT
if (require.main === module) {
    const poc = new SafeLearningPOC();
    poc.runSafeTest().catch(console.error);
}

module.exports = {
    SafeLearningPOC,
    SafeRuleManager,
    SAFE_CONFIG
}; 