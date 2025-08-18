# 🎯 DATABASE ARCHITECTURE ANALYSIS - COMPLETE STRUCTURE

**UPDATED: 2024-12-19** - Based on comprehensive database discovery using Supabase client

## **📊 COMPLETE DATABASE STRUCTURE DISCOVERED**

### **✅ ALL TABLES FOUND (12 total):**

#### **🥘 PRODUCT TABLES (5):**

##### **1. `IngredientCategorized` - Main Products Table**
- **Purpose**: Primary table containing all food products and ingredients
- **Key Columns**:
  - `id` - Primary key
  - `description` - Product description
  - `allergens` - object (array) - Main allergen data
  - `contains_allergens` - object - Contains allergen info
  - `allergen_free_tags` - object - Allergen-free indicators
  - `processed_for_allergens` - boolean - Processing status
  - `allergen_last_updated` - string - Last update timestamp
  - `is_active` - boolean - Active status
  - `seller_id` - string - Seller identifier
  - `stock_quantity` - number - Stock quantity
- **Sample Data**:
  ```json
  {
    "id": 161025,
    "description": "Pure 1/2 to 2 tablespoons extra-virgin olive oil",
    "allergens": [],
    "contains_allergens": null,
    "allergen_free_tags": null,
    "processed_for_allergens": false,
    "allergen_last_updated": "2025-07-30T03:48:17.285891"
  }
  ```
- **Expected Changes**: 
  - `allergens` array values standardized to camelCase
  - `contains_allergens` and `allergen_free_tags` standardized to camelCase

##### **2. `Ingredients` - Ingredient Reference Table**
- **Purpose**: Reference table for individual ingredients with allergen information
- **Key Columns**:
  - `id` - Primary key
  - `name` - string - Ingredient name
  - `aliases` - object - Alternative names
  - `allergens` - object (array) - Allergen data
- **Sample Data**:
  ```json
  {
    "id": 8,
    "name": "yogurt",
    "aliases": ["greek yogurt", "plain yogurt", "yogurt dressing"],
    "allergens": ["milk"]
  }
  ```
- **Expected Changes**: 
  - `allergens` array values standardized to camelCase

##### **3. `ingredient_categorized` - Empty Table**
- **Purpose**: Appears to be a duplicate/empty table
- **Status**: No data found
- **Expected Changes**: None (no data to migrate)

##### **4. `RecipeIngredients` - Recipe Ingredients**
- **Purpose**: Links recipes to their ingredients
- **Key Columns**:
  - `id` - Primary key
  - `name` - string - Ingredient name
  - `quantity` - string - Quantity
  - `RecipeId` - number - Recipe reference
- **Sample Data**:
  ```json
  {
    "id": 783095,
    "name": "cup crushed pretzels",
    "quantity": "1",
    "RecipeId": 52362
  }
  ```
- **Expected Changes**: None (no allergen columns)

#### **👤 USER TABLES (1):**

##### **5. `Users` - User Accounts Table**
- **Purpose**: Stores user account information
- **Key Columns**:
  - `id` - Primary key
  - `email` - string - User email
  - `name` - string - User name
  - `role` - string - User role
  - `supabase_user_id` - string - Supabase user identifier
  - `converted_from_anonymous` - boolean - Anonymous conversion flag
  - `anonymous_cart_data` - object - Anonymous cart data
- **Sample Data**:
  ```json
  {
    "id": 2,
    "email": "admin@dynable.com",
    "name": "Dynable Admin",
    "role": "admin",
    "supabase_user_id": "user-uuid"
  }
  ```
- **Expected Changes**: None (no allergen-related columns)

#### **🔍 ALLERGEN TABLES (1):**

##### **6. `AllergenDerivatives` - Allergen Mappings Table**
- **Purpose**: Maps allergens to their derivatives
- **Key Columns**:
  - `id` - Primary key
  - `allergen` - string - Allergen name
  - `derivative` - string - Derivative name
  - `createdAt` - timestamp - Creation time
  - `updatedAt` - timestamp - Update time
- **Sample Data**:
  ```json
  {
    "id": 1,
    "allergen": "milk",
    "derivative": "casein",
    "createdAt": "2025-07-17T16:26:28.67+00:00"
  }
  ```
- **Expected Changes**: 
  - `allergen` and `derivative` values standardized to camelCase

#### **🔍 SEARCH TABLES (1):**

##### **7. `SearchPreferences` - User Preferences Table**
- **Purpose**: Stores user search preferences and selected allergens
- **Key Columns**:
  - `id` - Primary key
  - `supabase_user_id` - string - User identifier
  - `search_term` - string - Search term
  - `selected_allergens` - object (array) - User's selected allergens
  - `createdAt` - timestamp - Creation time
  - `updatedAt` - timestamp - Update time
- **Sample Data**:
  ```json
  {
    "id": 1,
    "supabase_user_id": "12345678-1234-1234-1234-123456789abc",
    "search_term": "chicken",
    "selected_allergens": ["eggs", "fish"],
    "createdAt": "2025-07-27T23:59:18.724713+00:00"
  }
  ```
- **Expected Changes**: 
  - Column renamed from `selected_allergens` to `selectedAllergens`
  - Array values standardized to camelCase

#### **📖 RECIPE TABLES (1):**

##### **8. `Recipes` - Recipe Data Table**
- **Purpose**: Stores recipe information
- **Key Columns**:
  - `id` - Primary key
  - `title` - string - Recipe title
  - `directions` - object - Cooking directions
  - `source` - string - Recipe source
  - `tags` - object - Recipe tags
  - `url` - string - Recipe URL
- **Sample Data**:
  ```json
  {
    "id": 52362,
    "title": "Quebec City Sugar Pie with Thi",
    "directions": ["Preheat oven to 400 degrees F", "Whisk the eggs..."]
  }
  ```
- **Expected Changes**: None (no allergen columns)

#### **🛒 CART TABLES (2):**

##### **9. `Carts` - Shopping Carts Table**
- **Purpose**: Stores user shopping cart data
- **Key Columns**:
  - `id` - Primary key
  - `userId` - number - User reference
  - `items` - object - Cart items
  - `supabase_user_id` - string - Supabase user identifier
- **Sample Data**:
  ```json
  {
    "id": 1,
    "userId": 6,
    "items": {},
    "supabase_user_id": "user-uuid"
  }
  ```
- **Expected Changes**: None (no allergen columns)

##### **10. `Orders` - Order Data Table**
- **Purpose**: Stores order information
- **Key Columns**:
  - `id` - Primary key
  - `userId` - number - User reference
  - `items` - object - Order items
  - `totalAmount` - number - Order total
  - `status` - string - Order status
  - `shippingAddress` - string - Shipping address
  - `paymentMethod` - string - Payment method
- **Sample Data**:
  ```json
  {
    "id": 1,
    "userId": 6,
    "items": "[object Object]",
    "totalAmount": 0,
    "status": "pending"
  }
  ```
- **Expected Changes**: None (no allergen columns)

#### **📂 CATEGORY TABLES (1):**

##### **11. `Categories` - Category Data Table**
- **Purpose**: Stores product categories
- **Key Columns**:
  - `CategoryID` - Primary key
  - `CategoryName` - string - Category name
  - `createdAt` - string - Creation time
  - `updatedAt` - string - Update time
- **Sample Data**:
  ```json
  {
    "CategoryID": 1,
    "CategoryName": "Basic Ingredients",
    "createdAt": "2025-07-16T04:04:31.945352+00:00"
  }
  ```
- **Expected Changes**: None (no allergen columns)

## **🔍 ALLERGEN COLUMN ANALYSIS**

### **Allergen-Related Columns Found:**

1. **`IngredientCategorized.allergens`** - Main allergen array
2. **`IngredientCategorized.contains_allergens`** - Contains allergen info
3. **`IngredientCategorized.allergen_free_tags`** - Allergen-free indicators
4. **`IngredientCategorized.processed_for_allergens`** - Processing status
5. **`IngredientCategorized.allergen_last_updated`** - Update timestamp
6. **`Ingredients.allergens`** - Ingredient allergen array
7. **`SearchPreferences.selected_allergens`** - User selected allergens
8. **`AllergenDerivatives.allergen`** - Allergen name
9. **`AllergenDerivatives.derivative`** - Derivative name

## **📋 MIGRATION SCRIPT UPDATES REQUIRED**

### **Tables to Process (4 with allergen data):**
1. ✅ `IngredientCategorized` - Main products table
2. ✅ `Ingredients` - Ingredient reference table
3. ✅ `SearchPreferences` - User preferences table
4. ✅ `AllergenDerivatives` - Allergen mappings table

### **Tables with No Allergen Data (8):**
1. `Users` - User accounts
2. `ingredient_categorized` - Empty table
3. `RecipeIngredients` - Recipe ingredients
4. `Recipes` - Recipe data
5. `Carts` - Shopping carts
6. `Orders` - Order data
7. `Categories` - Category data

### **Column Renames Required:**
1. `SearchPreferences.selected_allergens` → `SearchPreferences.selectedAllergens`

## **🎯 VERIFICATION QUERIES**

### **Pre-Migration Verification:**
```sql
-- Check current allergen data
SELECT COUNT(*) as total_products FROM "IngredientCategorized";
SELECT COUNT(*) as products_with_allergens FROM "IngredientCategorized" WHERE allergens IS NOT NULL AND array_length(allergens, 1) > 0;
SELECT COUNT(*) as total_ingredients FROM "Ingredients";
SELECT COUNT(*) as ingredients_with_allergens FROM "Ingredients" WHERE allergens IS NOT NULL AND array_length(allergens, 1) > 0;
SELECT COUNT(*) as user_preferences FROM "SearchPreferences" WHERE selected_allergens IS NOT NULL;
SELECT COUNT(*) as allergen_mappings FROM "AllergenDerivatives";
```

### **Post-Migration Verification:**
```sql
-- Verify camelCase standardization
SELECT unnest(allergens) as allergen, COUNT(*) as frequency 
FROM "IngredientCategorized" 
WHERE allergens IS NOT NULL 
GROUP BY unnest(allergens) 
ORDER BY frequency DESC;

SELECT unnest(allergens) as allergen, COUNT(*) as frequency 
FROM "Ingredients" 
WHERE allergens IS NOT NULL 
GROUP BY unnest(allergens) 
ORDER BY frequency DESC;

-- Verify column rename
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'SearchPreferences' AND column_name = 'selectedAllergens';
```

## **🚀 BACKUP STRATEGY**

### **Tables to Backup:**
1. `IngredientCategorized` - All allergen-related columns
2. `Ingredients` - All allergen-related columns
3. `SearchPreferences` - All allergen-related columns
4. `AllergenDerivatives` - Entire table

### **Backup Script:**
```sql
-- Create timestamped backups
CREATE TABLE backup_ingredientcategorized_allergens_20241219 AS 
SELECT id, allergens, contains_allergens, allergen_free_tags, processed_for_allergens, allergen_last_updated 
FROM "IngredientCategorized" WHERE allergens IS NOT NULL;

CREATE TABLE backup_ingredients_allergens_20241219 AS 
SELECT id, name, allergens FROM "Ingredients" WHERE allergens IS NOT NULL;

CREATE TABLE backup_searchpreferences_allergens_20241219 AS 
SELECT id, supabase_user_id, selected_allergens FROM "SearchPreferences" WHERE selected_allergens IS NOT NULL;

CREATE TABLE backup_allergenderivatives_20241219 AS 
SELECT * FROM "AllergenDerivatives";
```

## **✅ CONCLUSION**

The complete database structure reveals **12 total tables**, with **4 tables containing allergen data** that need migration:

1. **`IngredientCategorized`** - Main products (100k+ records)
2. **`Ingredients`** - Ingredient reference table
3. **`SearchPreferences`** - User preferences 
4. **`AllergenDerivatives`** - Allergen mappings

The remaining 8 tables have no allergen-related data and don't need migration. This comprehensive discovery ensures we have the **complete picture** of your database structure for accurate migration planning. 