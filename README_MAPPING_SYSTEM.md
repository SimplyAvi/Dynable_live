# Recipe-to-Product Mapping System

A simple, efficient two-phase mapping system to solve database timeout issues in recipe-to-product workflows.

## 🎯 **What This Solves**

- **Database Timeouts**: Recipe requests currently take 30+ seconds
- **Performance Issues**: Complex queries on 243K+ products
- **CamelCase Consistency**: Universal camelCase for all multi-word variables

## 📋 **Two-Phase System**

### **Phase 1: Product Canonical Mapping**
- Processes all 243K+ products
- Removes descriptors: "zero sugar coca cola" → "cola"
- Groups similar products under canonical names
- Stores product_ids arrays for fast lookups
- Universal camelCase: "extra virgin olive oil" → "extraVirginOliveOil"

### **Phase 2: Ingredient Canonical Mapping**
- Processes recipe ingredients
- Removes action words: "diced tomatoes" → "tomatoes"
- Removes measurements: "2 cups flour" → "flour"
- Maps to pre-computed product IDs from Phase 1
- Universal camelCase: "chopped green onions" → "greenOnions"

## 🚀 **Quick Start**

### **1. Deploy Database Schema**
```bash
# Run the SQL migration
psql -d your_database -f database/migrations/create_simple_mapping_tables.sql
```

### **2. Run the Deployment Script**
```bash
# Interactive deployment with progress tracking
./scripts/deploy_mapping_system.sh
```

### **3. Manual Deployment (Alternative)**
```bash
# Phase 1: Product mapping (background)
nohup node scripts/product_canonical_mapping.js > logs/product_mapping.log 2>&1 &

# Phase 2: Ingredient mapping (after Phase 1 completes)
nohup node scripts/ingredient_canonical_mapping.js > logs/ingredient_mapping.log 2>&1 &

# Test performance
node scripts/test_recipe_performance.js
```

## 📊 **Features**

### **Background Processing**
- Hours-long execution support
- Resume capability from interruptions
- Progress tracking with ETA
- Graceful shutdown handling

### **Universal CamelCase**
- **ALL multi-word variables** use camelCase
- Products: "wholeWheatBread", "extraVirginOliveOil"
- Ingredients: "dicedTomatoes", "choppedOnions"
- Allergens: "treeNuts", "blackPepper", "coconutOil"

### **Performance Optimized**
- Pre-computed product arrays for fast lookups
- Indexed database tables
- Batch processing for 243K+ records
- Memory management for large datasets

## 📈 **Success Criteria**

After implementation:
- ✅ Recipe requests complete in <1 second (no timeouts)
- ✅ All multi-word variables use camelCase consistently
- ✅ Product matching uses pre-computed arrays (fast lookups)
- ✅ Scripts can run in background for hours without issues
- ✅ Resume capability if interrupted

## 🔧 **Monitoring**

### **Check Progress**
```bash
# Phase 1 progress
tail -f logs/product_mapping.log

# Phase 2 progress  
tail -f logs/ingredient_mapping.log

# Check running processes
ps aux | grep mapping
```

### **Stop Processes**
```bash
# Stop Phase 1
kill $(cat logs/product_mapping.pid)

# Stop Phase 2
kill $(cat logs/ingredient_mapping.pid)
```

### **Test Performance**
```bash
# Test recipe lookup performance
node scripts/test_recipe_performance.js
```

## 📁 **Files Created**

### **Database**
- `database/migrations/create_simple_mapping_tables.sql` - Database schema

### **Scripts**
- `scripts/product_canonical_mapping.js` - Phase 1 processing
- `scripts/ingredient_canonical_mapping.js` - Phase 2 processing
- `scripts/test_recipe_performance.js` - Performance testing
- `scripts/deploy_mapping_system.sh` - Deployment script

### **Logs**
- `logs/product_mapping.log` - Phase 1 progress
- `logs/ingredient_mapping.log` - Phase 2 progress
- `logs/product_mapping_checkpoint.json` - Phase 1 resume data
- `logs/ingredient_mapping_checkpoint.json` - Phase 2 resume data

## 🎯 **CamelCase Examples**

### **Products**
- "zero sugar coca cola" → "cola"
- "all purpose flour" → "flour"
- "extra virgin olive oil" → "extraVirginOliveOil"
- "2% reduced fat milk" → "reducedFatMilk"
- "gluten-free penne pasta" → "glutenFreePennePasta"

### **Ingredients**
- "2 cups diced tomatoes" → "tomatoes"
- "chopped onions" → "onions"
- "minced garlic" → "garlic"
- "chopped green onions" → "greenOnions"
- "diced roma tomatoes" → "romaTomatoes"

### **Allergens**
- "tree nuts" → "treeNuts"
- "black pepper" → "blackPepper"
- "coconut oil" → "coconutOil"
- "bell pepper" → "bellPepper"
- "artificial colors" → "artificialColors"

## ⚠️ **Important Notes**

1. **Phase 1 must complete before Phase 2** - Ingredient mapping depends on product mapping
2. **Background processing** - Scripts can run for hours, use `nohup` or deployment script
3. **Resume capability** - Scripts save progress and can resume if interrupted
4. **Universal camelCase** - ALL multi-word variables use camelCase, not just examples
5. **Performance target** - Recipe requests should complete in <1 second

## 🚫 **What's NOT Included**

- Complex safety validation systems
- Human review queues
- Confidence scoring
- Phased rollouts
- User acceptance testing
- Complex monitoring dashboards

**Focus: Performance and camelCase consistency for 243K+ products.** 