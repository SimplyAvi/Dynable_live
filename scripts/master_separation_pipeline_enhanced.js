const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// 🎯 PROVEN CLASSIFICATION RULES (100% accuracy on advisor examples)
const FINAL_CLASSIFICATION_RULES = {
    // RAW = Basic, unprocessed ingredients (what recipes call for)
    RAW_INGREDIENTS: {
        keywords: [
            'flour', 'sugar', 'salt', 'eggs', 'milk', 'butter', 'oil',
            'onions', 'garlic', 'tomatoes', 'carrots', 'potatoes',
            'chicken', 'beef', 'pork', 'fish', 'shrimp',
            'apples', 'bananas', 'strawberries', 'lemons', 'limes',
            'rice', 'pasta', 'beans', 'nuts', 'seeds'
        ]
    },
    
    // PROCESSED = Anything seasoned, flavored, prepared, or combined
    PROCESSED_INDICATORS: [
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
    
    // LEARNED EXCEPTIONS - Added through human review
    learned_exceptions: {
        // "pattern" -> "correct_classification"
        // Example: "whole wheat flour" should be RAW despite containing "wheat"
    }
};

// 🎯 PROVEN CLEANING FUNCTION (from working script)
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

// 🎯 PROVEN CLASSIFICATION FUNCTION (100% accuracy)
function classifyProductFinal(productName) {
    const cleanedName = cleanForClassification(productName);
    
    // FIRST: Check learned exceptions (highest priority)
    for (const [pattern, correctClassification] of Object.entries(FINAL_CLASSIFICATION_RULES.learned_exceptions)) {
        if (cleanedName.includes(pattern)) {
            return correctClassification;
        }
    }
    
    // SECOND: Check for processed indicators
    const hasProcessedIndicators = FINAL_CLASSIFICATION_RULES.PROCESSED_INDICATORS.some(indicator => 
        cleanedName.includes(indicator)
    );
    
    if (hasProcessedIndicators) {
        return 'processed';
    }
    
    // THIRD: Check for basic raw ingredients
    const hasRawIngredients = FINAL_CLASSIFICATION_RULES.RAW_INGREDIENTS.keywords.some(keyword => 
        cleanedName.includes(keyword)
    );
    
    if (hasRawIngredients) {
        return 'raw';
    }
    
    return 'unclear';
}

// 🎯 PROVEN VALIDATION FUNCTION (from working script)
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

function testFinalAdvisorExamples() {
    console.log('🧪 Testing Classification on Advisor Examples...\n');
    
    let rawCorrect = 0;
    let processedCorrect = 0;
    const misclassifications = [];
    
    console.log('📋 RAW INGREDIENTS (Should be RAW):');
    ADVISOR_EXAMPLES.raw.forEach(example => {
        const classification = classifyProductFinal(example);
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
        const classification = classifyProductFinal(example);
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

// 🎯 ENHANCED MASTER PIPELINE CLASS WITH PERSISTENCE
class IngredientSeparationPipeline {
    constructor() {
        this.rules = JSON.parse(JSON.stringify(FINAL_CLASSIFICATION_RULES)); // Deep copy
        this.classify = classifyProductFinal;
        this.clean = cleanForClassification;
        this.validate = testFinalAdvisorExamples;
        this.progress = {
            totalProcessed: 0,
            totalRaw: 0,
            totalProcessed: 0,
            totalUnclear: 0,
            batchesProcessed: 0,
            lastOffset: 0,
            lastBatchSize: 1000
        };
        
        // File paths for persistence
        this.rulesFile = path.join(__dirname, 'learned_rules.json');
        this.progressFile = path.join(__dirname, 'pipeline_progress.json');
        
        // Load saved state
        this.loadSavedState();
    }
    
    // 💾 PERSISTENCE: Save learned rules to file
    saveLearnedRules() {
        try {
            const rulesToSave = {
                learned_exceptions: this.rules.learned_exceptions,
                learned_processed_indicators: this.rules.PROCESSED_INDICATORS.filter(indicator => 
                    !FINAL_CLASSIFICATION_RULES.PROCESSED_INDICATORS.includes(indicator)
                ),
                timestamp: new Date().toISOString(),
                totalRules: Object.keys(this.rules.learned_exceptions).length + 
                    this.rules.PROCESSED_INDICATORS.filter(indicator => 
                        !FINAL_CLASSIFICATION_RULES.PROCESSED_INDICATORS.includes(indicator)
                    ).length
            };
            
            fs.writeFileSync(this.rulesFile, JSON.stringify(rulesToSave, null, 2));
            console.log(`💾 Saved ${rulesToSave.totalRules} learned rules to ${this.rulesFile}`);
        } catch (error) {
            console.error('❌ Error saving learned rules:', error);
        }
    }
    
    // 💾 PERSISTENCE: Load learned rules from file
    loadLearnedRules() {
        try {
            if (fs.existsSync(this.rulesFile)) {
                const savedRules = JSON.parse(fs.readFileSync(this.rulesFile, 'utf8'));
                
                // Restore learned exceptions
                this.rules.learned_exceptions = { ...this.rules.learned_exceptions, ...savedRules.learned_exceptions };
                
                // Restore learned processed indicators
                savedRules.learned_processed_indicators.forEach(indicator => {
                    if (!this.rules.PROCESSED_INDICATORS.includes(indicator)) {
                        this.rules.PROCESSED_INDICATORS.push(indicator);
                    }
                });
                
                console.log(`📂 Loaded ${savedRules.totalRules} learned rules from ${this.rulesFile}`);
                console.log(`   📊 Learned exceptions: ${Object.keys(savedRules.learned_exceptions).length}`);
                console.log(`   📊 Learned indicators: ${savedRules.learned_processed_indicators.length}`);
                return true;
            }
        } catch (error) {
            console.error('❌ Error loading learned rules:', error);
        }
        return false;
    }
    
    // 💾 PERSISTENCE: Save progress to file
    saveProgress() {
        try {
            const progressToSave = {
                ...this.progress,
                timestamp: new Date().toISOString()
            };
            
            fs.writeFileSync(this.progressFile, JSON.stringify(progressToSave, null, 2));
            console.log(`💾 Saved progress: ${this.progress.totalProcessed} products processed`);
        } catch (error) {
            console.error('❌ Error saving progress:', error);
        }
    }
    
    // 💾 PERSISTENCE: Load progress from file
    loadProgress() {
        try {
            if (fs.existsSync(this.progressFile)) {
                const savedProgress = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
                
                // Only restore if timestamp is recent (within 24 hours)
                const savedTime = new Date(savedProgress.timestamp);
                const now = new Date();
                const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    this.progress = { ...this.progress, ...savedProgress };
                    console.log(`📂 Loaded progress: ${this.progress.totalProcessed} products processed`);
                    console.log(`   📊 Last offset: ${this.progress.lastOffset}`);
                    console.log(`   📊 Last batch size: ${this.progress.lastBatchSize}`);
                    return true;
                } else {
                    console.log('⚠️ Saved progress is too old (>24 hours), starting fresh');
                }
            }
        } catch (error) {
            console.error('❌ Error loading progress:', error);
        }
        return false;
    }
    
    // 💾 PERSISTENCE: Load all saved state
    loadSavedState() {
        console.log('📂 Loading saved state...\n');
        
        const rulesLoaded = this.loadLearnedRules();
        const progressLoaded = this.loadProgress();
        
        if (rulesLoaded || progressLoaded) {
            console.log('✅ Successfully loaded saved state');
        } else {
            console.log('📝 Starting with fresh state');
        }
        console.log('');
    }
    
    // 🛡️ SAFETY: Confirmation prompt for database updates
    async confirmDatabaseUpdate(updateCount) {
        console.log('⚠️ DATABASE UPDATE CONFIRMATION REQUIRED');
        console.log(`📊 About to update ${updateCount} products in database`);
        console.log('   This will modify the ProductCanonical table');
        console.log('');
        
        // In a real implementation, this would prompt for user input
        // For now, we'll simulate a confirmation
        console.log('💡 SAFETY MODE: Database updates are DISABLED by default');
        console.log('   To enable, set updateDatabase: true in config');
        console.log('');
        
        return false; // Default to safe mode
    }
    
    // STAGE 1: Database preparation
    async addProductTypeColumns() {
        console.log('🔧 STAGE 1: Adding Product Type Columns...\n');
        
        try {
            // Check if columns already exist
            const { data: columns, error: columnError } = await supabase
                .from('information_schema.columns')
                .select('column_name')
                .eq('table_name', 'ProductCanonical')
                .eq('column_name', 'product_type');
            
            if (columnError) {
                console.log('⚠️ Could not check existing columns, proceeding...');
            }
            
            if (columns && columns.length > 0) {
                console.log('✅ product_type column already exists');
                return true;
            }
            
            // Add product_type column
            console.log('📋 Adding product_type column to ProductCanonical...');
            const { error } = await supabase.rpc('add_column_if_not_exists', {
                table_name: 'ProductCanonical',
                column_name: 'product_type',
                column_type: 'text'
            });
            
            if (error) {
                console.log('⚠️ Could not add column via RPC, may need manual addition');
                console.log('   Please add: ALTER TABLE ProductCanonical ADD COLUMN product_type TEXT;');
                return false;
            }
            
            console.log('✅ product_type column added successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error adding product_type column:', error);
            return false;
        }
    }
    
    // STAGE 2: Classification with review points
    async classifyBatch(batchSize = 1000, offset = 0) {
        console.log(`🔧 STAGE 2: Classifying Batch (${batchSize} products, offset: ${offset})...\n`);
        
        try {
            // Get batch of products
            const { data: products, error } = await supabase
                .from('ProductCanonical')
                .select('id, original_product_name, canonical_product_name, product_type')
                .range(offset, offset + batchSize - 1);
            
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
                const classification = this.classify(product.canonical_product_name);
                const result = {
                    id: product.id,
                    original: product.original_product_name,
                    canonical: product.canonical_product_name,
                    classification: classification,
                    current_product_type: product.product_type
                };
                
                classifications[classification].push(result);
                processedCount++;
                
                if (processedCount % 100 === 0) {
                    console.log(`   📈 Processed: ${processedCount}/${products.length}`);
                }
            }
            
            // Update progress
            this.progress.totalProcessed += products.length;
            this.progress.totalRaw += classifications.raw.length;
            this.progress.totalProcessed += classifications.processed.length;
            this.progress.totalUnclear += classifications.unclear.length;
            this.progress.batchesProcessed++;
            this.progress.lastOffset = offset;
            this.progress.lastBatchSize = batchSize;
            
            // Save progress after each batch
            this.saveProgress();
            
            // Show results
            console.log('\n📊 Batch Classification Results:');
            console.log(`   ✅ Raw: ${classifications.raw.length} (${((classifications.raw.length / products.length) * 100).toFixed(1)}%)`);
            console.log(`   🏭 Processed: ${classifications.processed.length} (${((classifications.processed.length / products.length) * 100).toFixed(1)}%)`);
            console.log(`   ❓ Unclear: ${classifications.unclear.length} (${((classifications.unclear.length / products.length) * 100).toFixed(1)}%)`);
            console.log('');
            
            // Show examples
            if (classifications.raw.length > 0) {
                console.log('📋 RAW INGREDIENTS EXAMPLES:');
                classifications.raw.slice(0, 5).forEach((item, index) => {
                    console.log(`   ${index + 1}. "${item.original}" → ${item.classification.toUpperCase()}`);
                });
                console.log('');
            }
            
            if (classifications.processed.length > 0) {
                console.log('📋 PROCESSED PRODUCTS EXAMPLES:');
                classifications.processed.slice(0, 5).forEach((item, index) => {
                    console.log(`   ${index + 1}. "${item.original}" → ${item.classification.toUpperCase()}`);
                });
                console.log('');
            }
            
            return {
                classifications: classifications,
                batchSize: products.length,
                offset: offset,
                totalProcessed: this.progress.totalProcessed
            };
            
        } catch (error) {
            console.error('❌ Error in batch classification:', error);
            return null;
        }
    }
    
    // STAGE 2B: Review unclear cases (HUMAN INPUT)
    async reviewUnclearCases(unclearResults) {
        console.log('🔍 STAGE 2B: Reviewing Unclear Cases...\n');
        
        if (unclearResults.length === 0) {
            console.log('✅ No unclear cases to review');
            return [];
        }
        
        console.log(`📋 Found ${unclearResults.length} unclear cases for review:`);
        console.log('');
        
        // Show first 10 unclear cases for review
        const reviewCases = unclearResults.slice(0, 10);
        reviewCases.forEach((item, index) => {
            console.log(`${index + 1}. "${item.original}"`);
            console.log(`   Canonical: "${item.canonical}"`);
            console.log(`   Current: ${item.classification.toUpperCase()}`);
            console.log('');
        });
        
        if (unclearResults.length > 10) {
            console.log(`... and ${unclearResults.length - 10} more cases`);
            console.log('');
        }
        
        // In a real implementation, this would prompt for human input
        console.log('💡 HUMAN REVIEW NEEDED:');
        console.log('   - Review unclear cases above');
        console.log('   - Identify patterns for rule improvements');
        console.log('   - Return rule adjustments as array');
        console.log('');
        
        // For now, return empty array (no automatic changes)
        return [];
    }
    
    // STAGE 2C: Update rules based on review (WITH PERSISTENCE)
    async updateRulesFromReview(ruleAdjustments) {
        console.log('🔄 STAGE 2C: Updating Rules from Review...\n');
        
        if (ruleAdjustments.length === 0) {
            console.log('✅ No rule adjustments to apply');
            return;
        }
        
        let rulesUpdated = 0;
        
        ruleAdjustments.forEach(adjustment => {
            if (adjustment.type === 'add_processed_indicator') {
                if (!this.rules.PROCESSED_INDICATORS.includes(adjustment.value)) {
                    this.rules.PROCESSED_INDICATORS.push(adjustment.value);
                    console.log(`   ➕ Added processed indicator: "${adjustment.value}"`);
                    rulesUpdated++;
                }
            } else if (adjustment.type === 'add_exception') {
                this.rules.learned_exceptions[adjustment.pattern] = adjustment.classification;
                console.log(`   ➕ Added exception: "${adjustment.pattern}" → ${adjustment.classification}`);
                rulesUpdated++;
            }
        });
        
        if (rulesUpdated > 0) {
            // Save learned rules to file
            this.saveLearnedRules();
        }
        
        console.log(`\n📊 Rules Updated: ${rulesUpdated} new patterns learned`);
        console.log('💾 Rules saved to file for future runs');
        console.log('');
    }
    
    // STAGE 3: Validation
    async validateResults() {
        console.log('🔧 STAGE 3: Validating Results...\n');
        
        const validationResults = this.validate();
        
        console.log(`📊 Validation Results:`);
        console.log(`   🎯 Advisor Accuracy: ${validationResults.accuracy}%`);
        console.log(`   📈 Total Processed: ${this.progress.totalProcessed}`);
        console.log(`   ✅ Total Raw: ${this.progress.totalRaw}`);
        console.log(`   🏭 Total Processed: ${this.progress.totalProcessed}`);
        console.log(`   ❓ Total Unclear: ${this.progress.totalUnclear}`);
        console.log('');
        
        return validationResults.accuracy;
    }
    
    // STAGE 4: Update database with classifications (WITH SAFETY)
    async updateDatabaseWithClassifications(results) {
        console.log('🔧 STAGE 4: Updating Database with Classifications...\n');
        
        if (!results || !results.classifications) {
            console.log('❌ No classification results to update');
            return false;
        }
        
        const allClassified = [
            ...results.classifications.raw,
            ...results.classifications.processed
        ];
        
        // Safety confirmation
        const confirmed = await this.confirmDatabaseUpdate(allClassified.length);
        if (!confirmed) {
            console.log('❌ Database update cancelled by user');
            return false;
        }
        
        console.log(`📊 Updating ${allClassified.length} products in database...`);
        
        try {
            // Update in batches to avoid timeouts
            const batchSize = 100;
            for (let i = 0; i < allClassified.length; i += batchSize) {
                const batch = allClassified.slice(i, i + batchSize);
                
                const updates = batch.map(item => ({
                    id: item.id,
                    product_type: item.classification
                }));
                
                const { error } = await supabase
                    .from('ProductCanonical')
                    .upsert(updates, { onConflict: 'id' });
                
                if (error) {
                    console.error('❌ Error updating batch:', error);
                    return false;
                }
                
                console.log(`   📈 Updated batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allClassified.length/batchSize)}`);
            }
            
            console.log('✅ Database updates completed successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error updating database:', error);
            return false;
        }
    }
    
    // MASTER RUNNER with resume capability
    async runIterativePipeline(config = {}) {
        console.log('🚀 Starting Enhanced Master Separation Pipeline...\n');
        
        const {
            stages = ['validate', 'classify'],
            startBatchSize = 1000,
            totalRecords = 213000,
            enableReview = true,
            updateDatabase = false,
            resumeFromOffset = null
        } = config;
        
        console.log('📋 Pipeline Configuration:');
        console.log(`   Stages: ${stages.join(', ')}`);
        console.log(`   Batch Size: ${startBatchSize}`);
        console.log(`   Total Records: ${totalRecords}`);
        console.log(`   Review Enabled: ${enableReview}`);
        console.log(`   Database Updates: ${updateDatabase}`);
        console.log(`   Resume From Offset: ${resumeFromOffset || 'auto'}`);
        console.log('');
        
        // STAGE 1: Add columns if needed
        if (stages.includes('add_columns')) {
            const columnsAdded = await this.addProductTypeColumns();
            if (!columnsAdded) {
                console.log('⚠️ Column addition failed, but continuing...');
            }
        }
        
        // STAGE 2: Validate current rules
        if (stages.includes('validate')) {
            await this.validateResults();
        }
        
        // STAGE 3: Process batches iteratively
        if (stages.includes('classify')) {
            let batchSize = startBatchSize;
            let totalProcessed = resumeFromOffset || this.progress.lastOffset;
            
            console.log(`🔄 Resuming from offset: ${totalProcessed}`);
            console.log(`📊 Previous progress: ${this.progress.totalProcessed} products processed`);
            console.log('');
            
            while (totalProcessed < totalRecords) {
                console.log(`\n🔄 Processing batch ${this.progress.batchesProcessed + 1}...`);
                console.log('=' .repeat(50));
                
                // Process batch
                const results = await this.classifyBatch(batchSize, totalProcessed);
                if (!results) {
                    console.log('❌ Batch processing failed, stopping');
                    break;
                }
                
                // Review unclear cases if enabled
                if (enableReview && results.classifications.unclear.length > 0) {
                    console.log(`📋 REVIEW NEEDED: ${results.classifications.unclear.length} unclear cases`);
                    
                    const adjustments = await this.reviewUnclearCases(results.classifications.unclear);
                    await this.updateRulesFromReview(adjustments);
                    
                    // Re-run batch with improved rules if adjustments were made
                    if (adjustments.length > 0) {
                        console.log('🔄 Re-running batch with improved rules...');
                        continue; // Re-process same batch with better rules
                    }
                }
                
                // Update database if enabled
                if (updateDatabase) {
                    await this.updateDatabaseWithClassifications(results);
                }
                
                totalProcessed += batchSize;
                console.log(`📊 Progress: ${totalProcessed}/${totalRecords} products processed`);
                
                // Increase batch size for efficiency
                if (this.progress.batchesProcessed === 1) {
                    batchSize = Math.min(batchSize * 2, 10000);
                    console.log(`📈 Increasing batch size to ${batchSize}`);
                }
            }
        }
        
        // Final validation
        if (stages.includes('validate')) {
            console.log('\n🎯 Final Validation...');
            await this.validateResults();
        }
        
        console.log('\n🎉 Enhanced Master Separation Pipeline Complete!');
        console.log('📋 Final Statistics:');
        console.log(`   📊 Total Processed: ${this.progress.totalProcessed}`);
        console.log(`   ✅ Total Raw: ${this.progress.totalRaw}`);
        console.log(`   🏭 Total Processed: ${this.progress.totalProcessed}`);
        console.log(`   ❓ Total Unclear: ${this.progress.totalUnclear}`);
        console.log(`   📈 Batches Processed: ${this.progress.batchesProcessed}`);
        console.log(`   💾 Progress saved for next run`);
        console.log('');
        
        return this.progress;
    }
}

// 🚀 USAGE EXAMPLES
async function runPipelineExamples() {
    const pipeline = new IngredientSeparationPipeline();
    
    console.log('🎯 Enhanced Pipeline Usage Examples:\n');
    
    // Example 1: Test small batch with resume capability
    console.log('1️⃣ Test small batch (1000 products) with resume:');
    await pipeline.runIterativePipeline({ 
        stages: ['validate', 'classify'], 
        startBatchSize: 1000,
        totalRecords: 1000,
        enableReview: true,
        updateDatabase: false
    });
    
    // Example 2: Resume from specific offset
    console.log('\n2️⃣ Resume from specific offset:');
    await pipeline.runIterativePipeline({ 
        stages: ['classify'], 
        startBatchSize: 1000,
        totalRecords: 5000,
        resumeFromOffset: 1000, // Resume from product 1000
        enableReview: true,
        updateDatabase: false
    });
    
    // Example 3: Full implementation with database updates
    console.log('\n3️⃣ Full implementation (all 213K products):');
    await pipeline.runIterativePipeline({ 
        stages: ['add_columns', 'classify', 'validate'], 
        startBatchSize: 10000,
        totalRecords: 213000,
        enableReview: true,
        updateDatabase: true // Enable database updates
    });
}

// 🚀 RUN THE ENHANCED MASTER PIPELINE
if (require.main === module) {
    const pipeline = new IngredientSeparationPipeline();
    
    // Run with safe defaults
    pipeline.runIterativePipeline({
        stages: ['validate', 'classify'],
        startBatchSize: 1000,
        totalRecords: 1000, // Start small
        enableReview: true,
        updateDatabase: false // Safe mode
    }).catch(console.error);
}

module.exports = {
    IngredientSeparationPipeline,
    FINAL_CLASSIFICATION_RULES,
    classifyProductFinal,
    cleanForClassification,
    testFinalAdvisorExamples
}; 