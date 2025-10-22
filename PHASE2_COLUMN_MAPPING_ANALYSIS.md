# Phase 2 Column Mapping Analysis

## 🔍 Current `IngredientCategorized` Table Structure

Based on actual database query, the table has **34 columns**:

| # | Column Name | Type | Sample Value |
|---|-------------|------|--------------|
| 1 | id | number | 36340 |
| 2 | foodClass | string | "Branded" |
| 3 | description | string | "JAPANESE EDAMAME SALAD" |
| 4 | modifiedDate | string (timestamp) | "2023-06-23T04:00:00+00:00" |
| 5 | availableDate | string (timestamp) | "2023-06-23T04:00:00+00:00" |
| 6 | marketCountry | string | "United States" |
| 7 | brandOwner | string | "Zina's Salads" |
| 8 | brandName | string | "UNBRANDED" |
| 9 | gtinUpc | string | "0021054660811" |
| 10 | dataSource | string | "LI" |
| 11 | ingredients | string | "EDAMAME, CARROTS, RED ROASTED PEPPER..." |
| 12 | servingSize | number | 113 |
| 13 | servingSizeUnit | string | "GRM" |
| 14 | householdServingFullText | string | "4oz (113g)" |
| 15 | shortDescription | string | "" (can be empty) |
| 16 | brandedFoodCategory | string | "Pre-Packaged Fruit & Vegetables" |
| 17 | dataType | string | "Branded" |
| 18 | fdcId | number | 2594792 |
| 19 | publicationDate | string (timestamp) | "2023-07-13T04:00:00+00:00" |
| 20 | packageWeight | string | "12 oz" |
| 21 | allergens | array | ["sesame","corn","garlic","soy"] |
| 22 | SubcategoryID | NULL/number | NULL |
| 23 | canonicalTag | NULL/string | NULL |
| 24 | canonicalTagConfidence | NULL/string | NULL |
| 25 | createdAt | string (timestamp) | "2025-06-25T08:43:14.971+00:00" |
| 26 | updatedAt | string (timestamp) | "2025-07-05T01:46:43.168+00:00" |
| 27 | canonicalTags | NULL/array | NULL |
| 28 | seller_id | NULL/number | NULL |
| 29 | stock_quantity | number | 0 |
| 30 | is_active | boolean | true |
| 31 | contains_allergens | NULL/array | NULL |
| 32 | allergen_free_tags | NULL/array | NULL |
| 33 | processed_for_allergens | boolean | false |
| 34 | allergen_last_updated | string (timestamp) | "2025-07-30T03:48:17.285891" |

---

## 🎯 Proposed `products` Table Mapping

### ✅ **Direct Column Mappings (Match Exactly)**

| New Column | Old Column | Notes |
|------------|------------|-------|
| id | id | ✅ Primary key |
| brand_owner | brandOwner | ✅ Direct copy |
| brand_name | brandName | ✅ Direct copy |
| serving_size | servingSize | ✅ Direct copy |
| serving_size_unit | servingSizeUnit | ✅ Direct copy |
| household_serving_text | householdServingFullText | ✅ Direct copy |
| fdc_id | fdcId | ✅ Direct copy |
| gtin_upc | gtinUpc | ✅ Direct copy |
| data_source | dataSource | ✅ Direct copy |
| food_class | foodClass | ✅ Direct copy |
| data_type | dataType | ✅ Direct copy |
| seller_id | seller_id | ✅ Direct copy |
| stock_quantity | stock_quantity | ✅ Direct copy |
| is_active | is_active | ✅ Direct copy |
| allergens | allergens | ✅ Direct copy (array) |
| contains_allergens | contains_allergens | ✅ Direct copy (array) |
| allergen_free_tags | allergen_free_tags | ✅ Direct copy (array) |
| processed_for_allergens | processed_for_allergens | ✅ Direct copy |
| allergen_last_updated | allergen_last_updated | ✅ Direct copy |
| package_weight | packageWeight | ✅ Direct copy |
| created_at | createdAt | ✅ Direct copy |
| updated_at | updatedAt | ✅ Direct copy |
| modified_date | modifiedDate | ✅ Direct copy |
| available_date | availableDate | ✅ Direct copy |
| publication_date | publicationDate | ✅ Direct copy |
| category_id | SubcategoryID | ✅ Direct copy (will fix naming later) |
| subcategory_id | SubcategoryID | ✅ Same as category for now |

### 🔄 **Computed/Transformed Columns**

| New Column | Source Logic | Notes |
|------------|--------------|-------|
| name | description | ✅ Use description as product name |
| description | description | ✅ Duplicate for full description |
| short_description | shortDescription | ✅ Direct copy |
| ingredients_text | ingredients | ✅ Direct copy (rename) |
| is_processed | Computed | ✅ Check if SubcategoryID is in processed food list |
| is_fresh_produce | Computed | ✅ Check if SubcategoryID is in fresh produce list |
| is_basic_ingredient | NULL/false | ⚠️ Default to false, will be computed later |
| price | NULL | ⚠️ Not in old table, default to NULL |

### ❌ **Columns NOT Being Migrated**

These old columns are **NOT used** in the new schema:
- `canonicalTag` - Replaced by new mapping system
- `canonicalTags` - Replaced by new mapping system
- `canonicalTagConfidence` - Replaced by confidence scoring in junction table
- `brandedFoodCategory` - Not needed (using Subcategories instead)
- `marketCountry` - Not in new schema (can add if needed)

---

## ⚠️ **ISSUES IDENTIFIED**

### **Issue 1: name vs description Duplication** ❌

**Current Plan:**
```sql
name = description,
description = description,
```

**Problem**: We're duplicating the same value to both columns!

**Better Approach:**
```sql
name = description,  -- Short product name
description = NULL,  -- Leave empty for now, can populate later if needed
```

**OR** if we want to preserve more info:
```sql
name = description,  -- Product name
description = CONCAT('Brand: ', "brandName", ' | ', description),  -- Richer description
```

---

### **Issue 2: category_id vs subcategory_id Confusion** ⚠️

**Current Plan:**
```sql
category_id = "SubcategoryID",
subcategory_id = "SubcategoryID",
```

**Problem**: Both map to the same value!

**Reality Check**: 
- Old table has `SubcategoryID` (which references `Subcategories.SubcategoryID`)
- `Subcategories` table has `CategoryID` (parent category)
- New table has both `category_id` and `subcategory_id`

**Correct Approach:**
```sql
subcategory_id = "SubcategoryID",  -- Direct mapping
category_id = (
    SELECT "CategoryID" 
    FROM "Subcategories" 
    WHERE "SubcategoryID" = "IngredientCategorized"."SubcategoryID"
)  -- Look up parent category
```

---

### **Issue 3: timestamp vs timestamp with time zone** ⚠️

**Current columns** return strings like: `"2025-07-30T03:48:17.285891"`

**New table expects**: `TIMESTAMP` type

**PostgreSQL Handling**: Should auto-convert, but we should verify timezone handling

---

## ✅ **CORRECTED Phase 2 Migration SQL**

```sql
-- Phase 2: Migrate Products Data (Corrected)
DO $$
DECLARE
    batch_size INT := 10000;
    offset_val INT := 0;
    total_count INT;
    processed_count INT := 0;
BEGIN
    SELECT COUNT(*) INTO total_count FROM "IngredientCategorized";
    RAISE NOTICE 'Starting migration of % products...', total_count;
    
    WHILE offset_val < total_count LOOP
        -- Insert batch into new products table
        INSERT INTO products (
            -- Identity
            id,
            
            -- Product names
            name,
            description,
            short_description,
            
            -- Brand info
            brand_name,
            brand_owner,
            
            -- Categorization (CORRECTED)
            subcategory_id,
            category_id,
            
            -- Classification (CORRECTED)
            is_processed,
            is_fresh_produce,
            is_basic_ingredient,
            
            -- Allergen data
            allergens,
            contains_allergens,
            allergen_free_tags,
            processed_for_allergens,
            allergen_last_updated,
            
            -- Nutritional info
            serving_size,
            serving_size_unit,
            household_serving_text,
            
            -- External identifiers
            fdc_id,
            gtin_upc,
            
            -- Data source
            data_source,
            food_class,
            data_type,
            
            -- E-commerce
            seller_id,
            stock_quantity,
            is_active,
            price,
            
            -- Packaging
            package_weight,
            ingredients_text,
            
            -- Timestamps
            created_at,
            updated_at,
            modified_date,
            available_date,
            publication_date
        )
        SELECT 
            -- Identity
            ic.id,
            
            -- Product names (CORRECTED)
            ic.description as name,
            NULL as description,  -- Leave NULL for now
            ic."shortDescription" as short_description,
            
            -- Brand info
            ic."brandName" as brand_name,
            ic."brandOwner" as brand_owner,
            
            -- Categorization (CORRECTED)
            ic."SubcategoryID" as subcategory_id,
            s."CategoryID" as category_id,  -- Look up parent category
            
            -- Classification (CORRECTED)
            COALESCE(s.is_processed_food, false) as is_processed,
            COALESCE(s.is_fresh_produce, false) as is_fresh_produce,
            COALESCE(s.is_basic_ingredient, false) as is_basic_ingredient,
            
            -- Allergen data
            ic.allergens,
            ic.contains_allergens,
            ic.allergen_free_tags,
            ic.processed_for_allergens,
            ic.allergen_last_updated::timestamp,
            
            -- Nutritional info
            ic."servingSize" as serving_size,
            ic."servingSizeUnit" as serving_size_unit,
            ic."householdServingFullText" as household_serving_text,
            
            -- External identifiers
            ic."fdcId" as fdc_id,
            ic."gtinUpc" as gtin_upc,
            
            -- Data source
            ic."dataSource" as data_source,
            ic."foodClass" as food_class,
            ic."dataType" as data_type,
            
            -- E-commerce
            ic.seller_id,
            ic.stock_quantity,
            ic.is_active,
            NULL as price,  -- Not in old table
            
            -- Packaging
            ic."packageWeight" as package_weight,
            ic.ingredients as ingredients_text,
            
            -- Timestamps
            ic."createdAt"::timestamp as created_at,
            ic."updatedAt"::timestamp as updated_at,
            ic."modifiedDate"::timestamp as modified_date,
            ic."availableDate"::timestamp as available_date,
            ic."publicationDate"::timestamp as publication_date
            
        FROM "IngredientCategorized" ic
        LEFT JOIN "Subcategories" s ON ic."SubcategoryID" = s."SubcategoryID"
        ORDER BY ic.id
        LIMIT batch_size OFFSET offset_val
        ON CONFLICT (id) DO NOTHING;
        
        GET DIAGNOSTICS processed_count = ROW_COUNT;
        offset_val := offset_val + batch_size;
        
        -- Log progress
        INSERT INTO migration_status (phase, step, status, records_processed, total_records)
        VALUES ('Phase 2', 'Product Migration', 'in_progress', offset_val, total_count);
        
        RAISE NOTICE 'Migrated batch: % / % products (% in this batch)', offset_val, total_count, processed_count;
        
        -- Small delay to prevent overwhelming database
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    -- Mark as completed
    UPDATE migration_status 
    SET status = 'completed', completed_at = NOW()
    WHERE phase = 'Phase 2' AND step = 'Product Migration'
    ORDER BY started_at DESC LIMIT 1;
    
    RAISE NOTICE '✅ Migration complete: % products migrated', total_count;
END $$;
```

---

## 📊 **Key Changes Made:**

1. ✅ **Fixed name/description duplication** - name uses description, description is NULL
2. ✅ **Fixed category lookup** - Joins with Subcategories to get parent CategoryID
3. ✅ **Fixed classification flags** - Uses COALESCE to handle NULL subcategories
4. ✅ **Added LEFT JOIN** - Handles products without subcategories
5. ✅ **Added type casting** - Explicitly cast timestamps
6. ✅ **Added progress logging** - RAISE NOTICE for better visibility
7. ✅ **Added completion marker** - Updates migration_status when done

---

## 🎯 **Recommendation:**

**Before running Phase 2**, let me create the corrected migration file with these fixes. The original plan had 3 issues that would cause:
1. Data duplication (name = description twice)
2. Missing category relationships
3. Incorrect classification flags

Should I create the corrected Phase 2 migration file now?

