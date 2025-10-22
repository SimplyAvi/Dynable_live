# Phase 2 Execution Guide - Product Data Migration

## 🎯 What This Does

Migrates **243,114 products** from `IngredientCategorized` → `products` table in batches of 10,000. Your website continues working with the old table during this process - **zero downtime**.

## 🔧 Key Improvements Over Original Plan

### ✅ **Fixed Issues:**

1. **No more name/description duplication**
   - `name` = product description
   - `description` = NULL (can populate later)

2. **Proper category lookup**
   - `subcategory_id` = direct mapping from SubcategoryID
   - `category_id` = looked up via JOIN with Subcategories table

3. **Correct classification flags**
   - Uses actual flags from Subcategories table
   - Handles NULL subcategories gracefully with COALESCE

4. **Better progress tracking**
   - RAISE NOTICE for real-time progress
   - Updates migration_status table per batch

## 📋 Files Created

1. **`database/migrations/phase2_migrate_products.sql`** - The migration SQL
2. **`scripts/verify_phase2.js`** - Verification script
3. **`PHASE2_COLUMN_MAPPING_ANALYSIS.md`** - Detailed column mapping

## 🚀 How to Execute

### **Option 1: Supabase Dashboard (Recommended)**

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Open: `database/migrations/phase2_migrate_products.sql`
5. Copy entire contents
6. Paste into SQL Editor
7. Click **Run**
8. Watch progress in the "Messages" panel
9. Wait ~20-30 minutes for completion

### **Option 2: psql Command Line**

```bash
psql "YOUR_CONNECTION_STRING" -f database/migrations/phase2_migrate_products.sql
```

## ⏱️ Timeline

- **Batch size**: 10,000 products
- **Number of batches**: ~25 batches
- **Delay per batch**: 0.1 seconds
- **Estimated time**: 20-30 minutes

## 📊 Progress Monitoring

You'll see real-time progress like this:

```
============================================
PHASE 2: PRODUCT MIGRATION
============================================
Total products to migrate: 243114
Batch size: 10000
Estimated batches: 25
Estimated time: 3 minutes
============================================

Batch 1: Migrated 10000 products (10000 / 243114 total, 4.1% complete)
Batch 2: Migrated 10000 products (20000 / 243114 total, 8.2% complete)
Batch 3: Migrated 10000 products (30000 / 243114 total, 12.3% complete)
...
Batch 25: Migrated 3114 products (243114 / 243114 total, 100.0% complete)

============================================
✅ PHASE 2 COMPLETE
============================================
Total products migrated: 243114
Total batches processed: 25
============================================
```

## ✅ Verification

After migration completes, run:

```bash
node scripts/verify_phase2.js
```

### **Expected Results:**

```
✅ Phase 2 Status: completed
   Records processed: 243114 / 243114
   
Old table (IngredientCategorized): 243,114 records
New table (products): 243,114 records
✅ PASS: Record counts match!

Products with category_id: 243,114
Products with subcategory_id: 243,114
Processed products: 50,000 (example)
Fresh produce products: 30,000 (example)

✅ Old IngredientCategorized table: STILL EXISTS
   Website should still be working!
```

## 🎯 Success Criteria

- ✅ Record counts match (243,114 in both tables)
- ✅ All products have `name` populated
- ✅ Category mappings are correct
- ✅ Classification flags (is_processed, is_fresh_produce) are set
- ✅ Old table still exists and website works
- ✅ migration_status shows "completed"

## 📊 What Gets Migrated

### **All Fields:**

| Field | Source | Notes |
|-------|--------|-------|
| id | id | ✅ Primary key preserved |
| name | description | ✅ Product name |
| brand_name | brandName | ✅ Direct copy |
| brand_owner | brandOwner | ✅ Direct copy |
| subcategory_id | SubcategoryID | ✅ Direct copy |
| category_id | Subcategories.CategoryID | ✅ Via JOIN |
| is_processed | Subcategories.is_processed_food | ✅ Via JOIN |
| is_fresh_produce | Subcategories.is_fresh_produce | ✅ Via JOIN |
| allergens | allergens | ✅ Array preserved |
| contains_allergens | contains_allergens | ✅ Array preserved |
| allergen_free_tags | allergen_free_tags | ✅ Array preserved |
| fdc_id | fdcId | ✅ External identifier |
| gtin_upc | gtinUpc | ✅ Barcode |
| ingredients_text | ingredients | ✅ Full ingredient list |
| ... and 20+ more fields | ... | ✅ All preserved |

### **Fields NOT Migrated:**

- `canonicalTag` - Replaced by new mapping system
- `canonicalTags` - Replaced by new mapping system
- `canonicalTagConfidence` - Replaced by confidence scoring
- `brandedFoodCategory` - Using Subcategories instead

## 🛡️ Safety Features

- ✅ **Batch processing** - No database locks
- ✅ **ON CONFLICT DO NOTHING** - Safe to re-run
- ✅ **Old table untouched** - Website keeps working
- ✅ **Progress tracking** - Can resume if interrupted
- ✅ **Verification queries** - Auto-checks at end

## 🔄 Rollback (If Needed)

```sql
-- Clear products table and re-run migration
TRUNCATE TABLE products CASCADE;

-- Then re-run the migration SQL
```

## ⚠️ Troubleshooting

### **Error: "out of memory"**

Reduce batch size:
```sql
batch_size INT := 5000;  -- Instead of 10000
```

### **Error: "relation does not exist"**

Make sure Phase 1 completed successfully:
```bash
node scripts/verify_phase0_phase1.js
```

### **Migration seems stuck**

Check progress in migration_status table:
```sql
SELECT * FROM migration_status 
WHERE phase = 'Phase 2' 
ORDER BY started_at DESC 
LIMIT 1;
```

### **Record counts don't match**

Check for conflicts:
```sql
SELECT COUNT(*) FROM products;
-- If less than IngredientCategorized count, re-run migration
-- ON CONFLICT DO NOTHING will skip existing records
```

## 📋 Next Steps

After Phase 2 is verified:

1. ✅ **Verify website still works** - Test critical flows
2. ✅ **Run verification script** - `node scripts/verify_phase2.js`
3. 📋 **Proceed to Phase 3** - Build ingredient taxonomy (Week 3)

Reference: **DATABASE_ARCHITECTURE_ANALYSIS.md** for full migration plan.

---

## 🎯 Ready to Execute?

The SQL file is ready with all fixes:
- ✅ Correct column mappings
- ✅ Proper category lookup
- ✅ No data duplication
- ✅ Progress tracking
- ✅ Verification queries

**Run it in Supabase SQL Editor and watch the progress!** 🚀

