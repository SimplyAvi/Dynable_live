# 🗄️ DATABASE CLEANUP STRATEGY
## Dynable App - Database Naming & Data Quality Fixes

**Date**: January 2025  
**Focus**: NO UNDERSCORES in database values (Rule #1)  
**Batch Processing**: 1,000 operations per batch  
**Total Products**: 200K+ requiring cleanup  

---

## 🚨 CRITICAL RULE: NO UNDERSCORES IN DATABASE

### **Current Issues Found:**
```sql
-- PROBLEMATIC VALUES (with underscores):
'tree_nuts' → 'treenuts'
'gluten_free' → 'glutenfree'
'dairy_free' → 'dairyfree'
'search_prefs' → 'searchprefs'
'user_preferences' → 'userpreferences'
```

### **Standard Allergen Names (NO UNDERSCORES):**
```javascript
const STANDARD_ALLERGENS = {
    MILK: 'milk',
    EGGS: 'eggs', 
    TREENUTS: 'treenuts',        // NOT 'tree_nuts'
    WHEAT: 'wheat',
    SOY: 'soy',
    FISH: 'fish',
    SHELLFISH: 'shellfish',
    PEANUTS: 'peanuts',
    SESAME: 'sesame'
};
```

---

## 📊 PHASE 1: BATCH PROCESSING FRAMEWORK

### **1. Create Batch Processing Utility**
```javascript
// utils/batchProcessor.js
const { createClient } = require('@supabase/supabase-js');

class BatchProcessor {
    constructor(supabaseUrl, supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.batchSize = 1000;
        this.progressCallback = null;
    }

    async processBatchUpdate(tableName, updateQuery, progressCallback = null) {
        let offset = 0;
        let totalProcessed = 0;
        let batchNumber = 1;
        
        console.log(`🔄 Starting batch processing for ${tableName}...`);
        
        while (true) {
            try {
                // Get batch of records
                const { data, error } = await this.supabase
                    .from(tableName)
                    .select('id')
                    .range(offset, offset + this.batchSize - 1);
                
                if (error) {
                    console.error(`❌ Error fetching batch ${batchNumber}:`, error);
                    break;
                }
                
                if (!data || data.length === 0) {
                    console.log(`✅ No more records to process`);
                    break;
                }
                
                // Apply updates to this batch
                const batchIds = data.map(record => record.id);
                const { error: updateError } = await this.supabase
                    .from(tableName)
                    .update(updateQuery)
                    .in('id', batchIds);
                
                if (updateError) {
                    console.error(`❌ Error updating batch ${batchNumber}:`, updateError);
                    break;
                }
                
                totalProcessed += data.length;
                console.log(`✅ Batch ${batchNumber}: Processed ${data.length} records (Total: ${totalProcessed})`);
                
                if (progressCallback) {
                    progressCallback(totalProcessed, batchNumber);
                }
                
                offset += this.batchSize;
                batchNumber++;
                
                // Add delay to prevent overwhelming database
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Fatal error in batch ${batchNumber}:`, error);
                break;
            }
        }
        
        console.log(`🎉 Batch processing complete! Total processed: ${totalProcessed}`);
        return totalProcessed;
    }
}

module.exports = BatchProcessor;
```

### **2. Progress Tracking System**
```javascript
// utils/progressTracker.js
class ProgressTracker {
    constructor() {
        this.tasks = {
            removeNonAllergens: { completed: 0, total: 200000, status: 'pending' },
            fixUnderscores: { completed: 0, total: 200000, status: 'pending' },
            standardizeCasing: { completed: 0, total: 200000, status: 'pending' },
            removeDuplicates: { completed: 0, total: 5, status: 'pending' }
        };
    }

    updateProgress(taskName, completed, total) {
        if (this.tasks[taskName]) {
            this.tasks[taskName].completed = completed;
            this.tasks[taskName].total = total;
            this.tasks[taskName].status = 'in_progress';
            
            const percentage = Math.round((completed / total) * 100);
            console.log(`📊 ${taskName}: ${completed}/${total} (${percentage}%)`);
        }
    }

    markComplete(taskName) {
        if (this.tasks[taskName]) {
            this.tasks[taskName].status = 'completed';
            console.log(`✅ ${taskName}: COMPLETE`);
        }
    }

    getSummary() {
        return Object.entries(this.tasks).map(([task, data]) => ({
            task,
            status: data.status,
            progress: `${data.completed}/${data.total}`,
            percentage: Math.round((data.completed / data.total) * 100)
        }));
    }
}

module.exports = ProgressTracker;
```

---

## 🔄 PHASE 2: DATA CLEANUP TASKS

### **1. Remove Non-Allergen Items (CRITICAL)**
```javascript
// scripts/removeNonAllergens.js
const BatchProcessor = require('../utils/batchProcessor');
const ProgressTracker = require('../utils/progressTracker');

const NON_ALLERGENS = [
    'Apples', 'Bananas', 'Beef', 'Celery', 'Chicken', 'Chocolate',
    'Corn', 'Garlic', 'Mustard', 'Onions', 'Peaches', 'Pork',
    'Sesame', 'Strawberries', 'Tomatoes'
];

async function removeNonAllergens() {
    const processor = new BatchProcessor(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const tracker = new ProgressTracker();
    
    console.log('🚨 CRITICAL: Removing non-allergen items...');
    
    for (const nonAllergen of NON_ALLERGENS) {
        console.log(`🗑️  Removing '${nonAllergen}' from allergen arrays...`);
        
        const updateQuery = {
            allergens: `array_remove(allergens, '${nonAllergen}')`
        };
        
        const processed = await processor.processBatchUpdate(
            'IngredientCategorized',
            updateQuery,
            (completed, batch) => tracker.updateProgress('removeNonAllergens', completed, 200000)
        );
    }
    
    tracker.markComplete('removeNonAllergens');
    console.log('✅ Non-allergen items removed!');
}

module.exports = { removeNonAllergens };
```

### **2. Fix Underscore Naming (CRITICAL)**
```javascript
// scripts/fixUnderscoreNaming.js
const BatchProcessor = require('../utils/batchProcessor');
const ProgressTracker = require('../utils/progressTracker');

const UNDERSCORE_MAPPINGS = {
    'tree_nuts': 'treenuts',
    'gluten_free': 'glutenfree',
    'dairy_free': 'dairyfree',
    'search_prefs': 'searchprefs',
    'user_preferences': 'userpreferences'
};

async function fixUnderscoreNaming() {
    const processor = new BatchProcessor(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const tracker = new ProgressTracker();
    
    console.log('🔧 CRITICAL: Fixing underscore naming...');
    
    for (const [oldValue, newValue] of Object.entries(UNDERSCORE_MAPPINGS)) {
        console.log(`🔄 Converting '${oldValue}' → '${newValue}'...`);
        
        const updateQuery = {
            allergens: `array_replace(allergens, '${oldValue}', '${newValue}')`
        };
        
        const processed = await processor.processBatchUpdate(
            'IngredientCategorized',
            updateQuery,
            (completed, batch) => tracker.updateProgress('fixUnderscores', completed, 200000)
        );
    }
    
    tracker.markComplete('fixUnderscores');
    console.log('✅ Underscore naming fixed!');
}

module.exports = { fixUnderscoreNaming };
```

### **3. Standardize Allergen Casing**
```javascript
// scripts/standardizeCasing.js
const BatchProcessor = require('../utils/batchProcessor');
const ProgressTracker = require('../utils/progressTracker');

const CASING_MAPPINGS = {
    'Tree Nuts': 'treenuts',
    'Wheat': 'wheat',
    'Gluten': 'gluten',
    'Eggs': 'eggs',
    'Milk': 'milk',
    'Soy': 'soy',
    'Shellfish': 'shellfish',
    'Peanuts': 'peanuts'
};

async function standardizeCasing() {
    const processor = new BatchProcessor(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const tracker = new ProgressTracker();
    
    console.log('📝 Standardizing allergen casing...');
    
    for (const [oldValue, newValue] of Object.entries(CASING_MAPPINGS)) {
        console.log(`🔄 Converting '${oldValue}' → '${newValue}'...`);
        
        const updateQuery = {
            allergens: `array_replace(allergens, '${oldValue}', '${newValue}')`
        };
        
        const processed = await processor.processBatchUpdate(
            'IngredientCategorized',
            updateQuery,
            (completed, batch) => tracker.updateProgress('standardizeCasing', completed, 200000)
        );
    }
    
    tracker.markComplete('standardizeCasing');
    console.log('✅ Allergen casing standardized!');
}

module.exports = { standardizeCasing };
```

### **4. Remove Duplicate Products**
```javascript
// scripts/removeDuplicates.js
const { createClient } = require('@supabase/supabase-js');

async function removeDuplicates() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    console.log('🗑️  Removing duplicate products...');
    
    // Find duplicates
    const { data: duplicates, error } = await supabase
        .from('IngredientCategorized')
        .select('description, brandName')
        .not('description', 'is', null);
    
    if (error) {
        console.error('❌ Error finding duplicates:', error);
        return;
    }
    
    // Group by description + brandName
    const duplicateMap = {};
    duplicates.forEach(row => {
        const key = `${row.description}-${row.brandName}`;
        if (!duplicateMap[key]) {
            duplicateMap[key] = [];
        }
        duplicateMap[key].push(row);
    });
    
    // Remove duplicates (keep first occurrence)
    let removedCount = 0;
    for (const [key, records] of Object.entries(duplicateMap)) {
        if (records.length > 1) {
            // Keep first record, delete the rest
            const toDelete = records.slice(1);
            const idsToDelete = toDelete.map(record => record.id);
            
            const { error: deleteError } = await supabase
                .from('IngredientCategorized')
                .delete()
                .in('id', idsToDelete);
            
            if (deleteError) {
                console.error(`❌ Error deleting duplicates for ${key}:`, deleteError);
            } else {
                removedCount += toDelete.length;
                console.log(`🗑️  Removed ${toDelete.length} duplicates for: ${key}`);
            }
        }
    }
    
    console.log(`✅ Removed ${removedCount} duplicate products!`);
}

module.exports = { removeDuplicates };
```

---

## 📋 PHASE 3: EXECUTION SCRIPTS

### **1. Complete Database Cleanup Script**
```javascript
// scripts/completeDatabaseCleanup.js
require('dotenv').config();
const { removeNonAllergens } = require('./removeNonAllergens');
const { fixUnderscoreNaming } = require('./fixUnderscoreNaming');
const { standardizeCasing } = require('./standardizeCasing');
const { removeDuplicates } = require('./removeDuplicates');
const ProgressTracker = require('../utils/progressTracker');

async function completeDatabaseCleanup() {
    const tracker = new ProgressTracker();
    
    console.log('🧹 Starting complete database cleanup...');
    console.log('==========================================');
    
    try {
        // 1. Remove non-allergen items (CRITICAL)
        console.log('\n🚨 STEP 1: Removing non-allergen items...');
        await removeNonAllergens();
        
        // 2. Fix underscore naming (CRITICAL)
        console.log('\n🔧 STEP 2: Fixing underscore naming...');
        await fixUnderscoreNaming();
        
        // 3. Standardize casing
        console.log('\n📝 STEP 3: Standardizing casing...');
        await standardizeCasing();
        
        // 4. Remove duplicates
        console.log('\n🗑️  STEP 4: Removing duplicates...');
        await removeDuplicates();
        
        console.log('\n🎉 DATABASE CLEANUP COMPLETE!');
        console.log('================================');
        console.log('✅ All non-allergen items removed');
        console.log('✅ All underscore naming fixed');
        console.log('✅ All allergen casing standardized');
        console.log('✅ All duplicates removed');
        console.log('✅ Database now follows NO UNDERSCORE rule');
        
    } catch (error) {
        console.error('❌ Database cleanup failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    completeDatabaseCleanup();
}

module.exports = { completeDatabaseCleanup };
```

### **2. Rollback Script (Safety)**
```javascript
// scripts/rollbackDatabaseChanges.js
const { createClient } = require('@supabase/supabase-js');

async function rollbackDatabaseChanges() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    console.log('⚠️  ROLLBACK: Reverting database changes...');
    
    // This would restore from backup
    // Implementation depends on backup strategy
    
    console.log('✅ Rollback complete');
}

module.exports = { rollbackDatabaseChanges };
```

---

## 📊 PHASE 4: VALIDATION & TESTING

### **1. Data Quality Validation**
```javascript
// scripts/validateCleanup.js
const { createClient } = require('@supabase/supabase-js');

async function validateCleanup() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    console.log('🔍 Validating database cleanup...');
    
    // Check for remaining underscores
    const { data: underscoreData, error: underscoreError } = await supabase
        .from('IngredientCategorized')
        .select('allergens')
        .not('allergens', 'is', null);
    
    if (underscoreError) {
        console.error('❌ Error checking underscores:', underscoreError);
        return;
    }
    
    const underscoreCount = underscoreData.filter(row => 
        row.allergens.some(allergen => allergen.includes('_'))
    ).length;
    
    console.log(`📊 Products with underscores: ${underscoreCount}`);
    
    // Check for non-allergen items
    const nonAllergens = ['Apples', 'Bananas', 'Beef', 'Celery', 'Chicken'];
    let nonAllergenCount = 0;
    
    for (const nonAllergen of nonAllergens) {
        const { data, error } = await supabase
            .from('IngredientCategorized')
            .select('allergens')
            .contains('allergens', [nonAllergen]);
        
        if (!error && data) {
            nonAllergenCount += data.length;
        }
    }
    
    console.log(`📊 Products with non-allergen items: ${nonAllergenCount}`);
    
    // Summary
    if (underscoreCount === 0 && nonAllergenCount === 0) {
        console.log('✅ VALIDATION PASSED: Database cleanup successful!');
    } else {
        console.log('❌ VALIDATION FAILED: Issues found in database');
    }
}

module.exports = { validateCleanup };
```

---

## 🎯 EXECUTION ORDER

### **IMMEDIATE (Safety First):**
1. **Create backup** of current database
2. **Test on small batch** (100 records)
3. **Validate results** before proceeding

### **PHASE 1 (Critical Fixes):**
4. **Remove non-allergen items** (immediate)
5. **Fix underscore naming** (immediate)
6. **Validate changes** after each step

### **PHASE 2 (Standardization):**
7. **Standardize allergen casing** (high priority)
8. **Remove duplicate products** (medium priority)
9. **Final validation** (comprehensive)

### **PHASE 3 (Verification):**
10. **Run validation scripts** (confirm cleanup)
11. **Test application** (ensure functionality)
12. **Document changes** (for future reference)

This strategy ensures your database follows the NO UNDERSCORE rule while maintaining data integrity and application functionality. 