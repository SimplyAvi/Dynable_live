# Recipe-to-Product Mapping System Guide

## Overview

The Recipe-to-Product Mapping System is a comprehensive solution designed to solve database timeout issues in recipe-to-product workflows. It implements a three-phase approach that pre-computes mappings and maintains them as data changes.

## 🎯 **Problem Solved**

### **Before (Causing Timeouts):**
- Recipe request → Complex LIKE queries on 243K+ products
- Ingredient matching → Exponential complexity with multiple ingredients
- Substitute finding → Array operations on large datasets
- Allergen filtering → Multiple array operations per product

### **After (Fast & Efficient):**
- Recipe request → Pre-computed mappings (sub-second response)
- Ingredient matching → Direct array lookups
- Substitute finding → Pre-computed allergen-safe alternatives
- Allergen filtering → Pre-filtered product lists

## 📊 **System Architecture**

### **Phase 1: Product Canonical Mapping**
```
Original Products → Clean Names → Canonical Groups
"zero sugar coca cola" → "cola" → [product_ids: [123, 456, 789]]
"diet pepsi" → "cola" → [product_ids: [123, 456, 789]]
"original coke" → "cola" → [product_ids: [123, 456, 789]]
```

### **Phase 2: Ingredient Canonical Mapping**
```
Recipe Ingredients → Clean Names → Product Matches
"2 cups diced tomatoes" → "tomatoes" → [product_ids: [101, 102, 103]]
"chopped onions" → "onions" → [product_ids: [201, 202, 203]]
"minced garlic" → "garlic" → [product_ids: [301, 302, 303]]
```

### **Phase 3: Substitute Mapping Generation**
```
Original Product → Allergen-Safe Alternatives
"flour" (wheat) → "almond flour" (treeNuts), "coconut flour" (treeNuts)
"milk" (dairy) → "almond milk" (treeNuts), "soy milk" (soy)
"eggs" (eggs) → "flax eggs" (none), "chia eggs" (none)
```

## 🗄️ **Database Schema**

### **ProductCanonical Table**
```sql
CREATE TABLE "ProductCanonical" (
    id SERIAL PRIMARY KEY,
    original_product_name TEXT NOT NULL,      -- "zero sugar coca cola"
    canonical_product_name TEXT NOT NULL,     -- "cola"
    product_category TEXT,                    -- "beverage"
    base_ingredients TEXT[],                  -- ["cola nut", "caffeine"]
    allergens TEXT[],                         -- ["artificialSweeteners"]
    descriptors TEXT[],                       -- ["zero_sugar", "diet"]
    product_ids INTEGER[],                    -- All matching product IDs
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **IngredientCanonical Table**
```sql
CREATE TABLE "IngredientCanonical" (
    id SERIAL PRIMARY KEY,
    original_ingredient TEXT NOT NULL,        -- "2 cups diced tomatoes"
    canonical_ingredient TEXT NOT NULL,       -- "tomatoes"
    ingredient_category TEXT,                 -- "vegetable"
    preparation_method TEXT,                  -- "diced"
    quantity_measurement TEXT,                -- "2 cups"
    matching_products INTEGER[],              -- Pre-computed product IDs
    substitute_ingredients TEXT[],            -- ["bell peppers", "sun dried tomatoes"]
    substitute_product_ids INTEGER[],         -- Pre-computed substitute product IDs
    allergen_considerations TEXT[],           -- Allergen info for substitutes
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **SubstituteMappings Table**
```sql
CREATE TABLE "SubstituteMappings" (
    id SERIAL PRIMARY KEY,
    original_product_canonical TEXT NOT NULL,  -- "flour"
    original_allergens TEXT[],                 -- ["wheat", "gluten"]
    substitute_product_canonical TEXT NOT NULL, -- "almond_flour"
    substitute_allergens TEXT[],               -- ["treeNuts"]
    substitute_ratio TEXT,                     -- "1:1"
    cooking_notes TEXT,                        -- "May affect texture"
    dietary_categories TEXT[],                 -- ["glutenFree", "keto"]
    confidence_score DECIMAL(3,2),             -- 0.95
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 **Implementation Scripts**

### **1. Analysis Script**
```bash
node scripts/analyze_recipe_system.js
```
**Purpose:** Analyzes current system and identifies bottlenecks

### **2. Database Schema**
```bash
# Run the migration
psql -d your_database -f database/migrations/create_recipe_mapping_system.sql
```
**Purpose:** Creates the three mapping tables with indexes and functions

### **3. Product Canonical Mapping**
```bash
node scripts/product_canonical_mapping.js
```
**Purpose:** Processes products and creates canonical mappings

### **4. Ingredient Canonical Mapping**
```bash
node scripts/ingredient_canonical_mapping.js
```
**Purpose:** Processes recipe ingredients and maps to products

### **5. Substitute Mapping Generator**
```bash
node scripts/substitute_mapping_generator.js
```
**Purpose:** Generates allergen-safe substitute mappings

### **6. Master Orchestration Script**
```bash
# Run complete system
node scripts/run_recipe_mapping_system.js

# Run individual phases
node scripts/run_recipe_mapping_system.js phase1
node scripts/run_recipe_mapping_system.js phase2
node scripts/run_recipe_mapping_system.js phase3

# Test the system
node scripts/run_recipe_mapping_system.js test
```

## 📈 **Performance Improvements**

### **Before Implementation:**
- Recipe request: 30+ seconds (timeout)
- Product matching: Complex LIKE queries
- Substitute finding: Array operations
- Allergen filtering: Multiple array operations

### **After Implementation:**
- Recipe request: <1 second
- Product matching: Direct array lookups
- Substitute finding: Pre-computed mappings
- Allergen filtering: Pre-filtered lists

## 🔄 **Ongoing Maintenance**

### **Automatic Updates**
The system includes ongoing scripts that:
- Process new products as they're added
- Update mappings when product data changes
- Maintain substitute mappings with confidence scores
- Clean up orphaned mappings

### **Scheduled Jobs**
```bash
# Add to crontab for daily maintenance
0 2 * * * cd /path/to/dynable && node scripts/run_recipe_mapping_system.js
```

## 🧪 **Testing the System**

### **Test Individual Components**
```bash
# Test product canonical mapping
node scripts/product_canonical_mapping.js

# Test ingredient canonical mapping
node scripts/ingredient_canonical_mapping.js

# Test substitute generation
node scripts/substitute_mapping_generator.js
```

### **Test Complete System**
```bash
# Test the entire mapping system
node scripts/run_recipe_mapping_system.js test
```

### **Sample Test Results**
```
🧪 TESTING MAPPING SYSTEM
==========================

🔍 Testing ingredient: "diced tomatoes"
✅ Found mapping: "diced tomatoes" → "tomatoes"
📊 Product matches: 15
🔄 Substitute ingredients: 3

🔍 Testing substitutes for: "flour"
✅ Found 4 substitutes for "flour":
   - almond_flour (confidence: 0.95)
   - coconut_flour (confidence: 0.90)
   - rice_flour (confidence: 0.85)
   - oat_flour (confidence: 0.80)
```

## 📊 **Data Quality Features**

### **Product Name Cleaning**
- Removes descriptors: "zero sugar", "diet", "organic"
- Removes brand names: "coca cola", "kraft", "heinz"
- Removes measurements: "16oz", "2 liter"
- Standardizes naming conventions

### **Ingredient Name Cleaning**
- Removes action words: "diced", "chopped", "minced"
- Removes measurements: "2 cups", "1 tbsp"
- Removes color descriptors: "red", "yellow"
- Extracts preparation methods and quantities

### **Allergen Safety**
- Pre-computes allergen-safe alternatives
- Maintains confidence scores for substitute quality
- Supports dietary restrictions (gluten-free, vegan, etc.)
- Handles complex allergen combinations

## 🔍 **Monitoring & Analytics**

### **Performance Metrics**
- Processing rate (mappings/second)
- Database query performance
- Memory usage optimization
- Error rate tracking

### **Data Quality Metrics**
- Mapping coverage percentage
- Substitute availability by allergen
- Confidence score distribution
- Orphaned mapping detection

### **System Health Checks**
```bash
# Check mapping coverage
SELECT COUNT(*) FROM "ProductCanonical";
SELECT COUNT(*) FROM "IngredientCanonical";
SELECT COUNT(*) FROM "SubstituteMappings";

# Check performance
SELECT AVG(confidence_score) FROM "SubstituteMappings";
SELECT COUNT(*) FROM "IngredientCanonical" WHERE matching_products IS NULL;
```

## 🚀 **Deployment Guide**

### **Step 1: Deploy Database Schema**
```bash
# Run the migration
psql -d your_database -f database/migrations/create_recipe_mapping_system.sql
```

### **Step 2: Run Initial Mapping**
```bash
# Run the complete system
node scripts/run_recipe_mapping_system.js
```

### **Step 3: Set Up Maintenance**
```bash
# Add to crontab for daily maintenance
crontab -e
# Add: 0 2 * * * cd /path/to/dynable && node scripts/run_recipe_mapping_system.js
```

### **Step 4: Monitor Performance**
```bash
# Test the system
node scripts/run_recipe_mapping_system.js test

# Check system health
node scripts/analyze_recipe_system.js
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Database Connection Errors**
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection
node -e "const { createClient } = require('@supabase/supabase-js'); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.auth.getSession().then(console.log).catch(console.error);"
```

#### **2. Mapping Generation Failures**
```bash
# Check table existence
psql -d your_database -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('ProductCanonical', 'IngredientCanonical', 'SubstituteMappings');"

# Check data quality
node scripts/analyze_recipe_system.js
```

#### **3. Performance Issues**
```bash
# Check database indexes
psql -d your_database -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('productcanonical', 'ingredientcanonical', 'substitutemappings');"

# Monitor query performance
node scripts/run_recipe_mapping_system.js test
```

### **Debug Mode**
```bash
# Enable debug logging
DEBUG=recipe-mapping node scripts/run_recipe_mapping_system.js
```

## 📚 **API Integration**

### **Updated Query Functions**
The system provides new query functions that use the pre-computed mappings:

```javascript
// Old (slow) approach
const products = await supabase
    .from('IngredientCategorized')
    .select('*')
    .ilike('description', `%${ingredient}%`);

// New (fast) approach
const { data: mapping } = await supabase
    .from('IngredientCanonical')
    .select('matching_products')
    .eq('canonical_ingredient', cleanIngredientName(ingredient))
    .single();

const products = await supabase
    .from('IngredientCategorized')
    .select('*')
    .in('id', mapping.matching_products);
```

### **Substitute Lookup**
```javascript
// Find allergen-safe substitutes
const { data: substitutes } = await supabase
    .from('SubstituteMappings')
    .select('*')
    .eq('original_product_canonical', productCanonical)
    .not('substitute_allergens', 'cs', JSON.stringify(excludeAllergens))
    .order('confidence_score', { ascending: false });
```

## 🎯 **Success Criteria**

After implementation:
- ✅ **Recipe requests complete in <1 second** (no timeouts)
- ✅ **Accurate ingredient-to-product matching** (minimal false positives/negatives)
- ✅ **Intelligent substitute suggestions** based on allergen exclusions
- ✅ **Ongoing mapping system** that processes new data automatically
- ✅ **Clean canonical naming** for consistent lookups

## 📞 **Support**

For issues or questions:
1. Check the troubleshooting section above
2. Run the analysis script to identify problems
3. Test individual components to isolate issues
4. Monitor system performance and data quality metrics

The Recipe-to-Product Mapping System provides a robust, scalable solution for handling complex recipe-to-product workflows while maintaining excellent performance and data quality. 