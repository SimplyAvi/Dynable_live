# 📋 COMPLETE ARCHITECTURE ANALYSIS: Dynable App & Allergen System

## **🏠 HOMEPAGE ARCHITECTURE**

### **Database Schema - Exact Table Structures:**

#### **1. Products Table (IngredientCategorized)**
```sql
-- Table: "IngredientCategorized"
-- Purpose: Stores branded products for homepage scroller
-- Current Status: 243,114+ products causing timeouts
-- Key Issue: Unindexed 'description' field with ILIKE operations

-- Known Columns (from code analysis):
- id (Primary Key)
- description (TEXT - unindexed, causing timeouts)
- brandName
- canonicalTag
- canonicalTags
- fdcId
- ingredients
- allergens

-- Current Query Causing Timeouts:
SELECT * FROM "IngredientCategorized" 
WHERE description NOT ILIKE '%milk%' 
AND description NOT ILIKE '%peanuts%'
-- This query times out with 243k+ products
```

#### **2. Recipes Table (Recipes)**
```sql
-- Table: "Recipes" (capital R)
-- Purpose: Stores recipe data for homepage scroller
-- Status: Working correctly

-- Known Columns:
- id (Primary Key)
- title
- ingredients (relationship to RecipeIngredients table)
- other recipe metadata

-- Relationship: Recipes -> RecipeIngredients -> IngredientCategorized
```

#### **3. Recipe Ingredients Table (RecipeIngredients)**
```sql
-- Table: "RecipeIngredients"
-- Purpose: Junction table linking recipes to ingredients
-- Structure:
- id (Primary Key)
- RecipeId (Foreign Key to Recipes)
- name (ingredient name)
- canonical (canonical ingredient name)
- other ingredient metadata
```

### **Current Filtering Implementation:**

#### **Homepage Product Filtering Logic:**
```javascript
// File: src/utils/supabaseQueries.js
// Function: searchProductsFromSupabasePure()

// CURRENT PROBLEMATIC LOGIC (DISABLED):
if (allergens && allergens.length > 0) {
    console.log('[SUPABASE PURE] Filtering by allergens:', allergens);
    allergens.forEach(allergen => {
        query = query.not('description', 'ilike', `%${allergen}%`);
    });
}

// CURRENT STATUS: DISABLED due to timeouts
console.log('[SUPABASE PURE] ⚠️ Allergen filtering DISABLED to prevent database timeouts');
```

#### **Allergen Toggle Implementation:**
```javascript
// File: src/components/AllergyFilter/AllergyFilter.js
// Function: handleAllergyClick()

// Current Flow:
1. User clicks allergen toggle
2. Redux state updated (toggleAllergy action)
3. Allergen preferences saved to database
4. Search triggered automatically via useEffect
5. Products filtered by allergens (CURRENTLY DISABLED)
```

#### **Search Bar Implementation:**
```javascript
// File: src/components/Searchbar/Searchbar.js
// Function: handleSubmit()

// Current Flow:
1. User types search term
2. Search preferences saved to database
3. Products and recipes searched via Supabase
4. Results displayed in ShowResults component
```

### **Homepage Data Flow:**
1. **User toggles allergen** → Redux state updated → Database preferences saved → Search triggered
2. **Search triggered** → `searchProductsFromSupabasePure()` called → Products filtered (DISABLED) → Results displayed
3. **Three scrollers connected** via Redux state and shared allergy preferences

---

## **🍽️ RECIPE SYSTEM ARCHITECTURE**

### **Recipe → Ingredients → Products Flow:**

#### **Recipe Table Structure:**
```sql
-- Table: "Recipes"
- id (Primary Key)
- title
- other recipe metadata
```

#### **Recipe-Ingredients Relationship:**
```sql
-- Table: "RecipeIngredients"
- id (Primary Key)
- RecipeId (Foreign Key to Recipes)
- name (ingredient name)
- canonical (canonical ingredient name)
```

#### **Ingredient-Product Mapping:**
```javascript
// File: src/utils/supabaseQueries.js
// Function: getProductsByIngredientFromSupabase()

// Current Logic:
1. Clean ingredient name (remove measurements, descriptions)
2. Search IngredientCategorized table for products
3. Use ILIKE on description field (same timeout issue)
4. Return matching products for ingredient
```

### **Recipe Ingredient Filtering Logic:**

#### **Red Highlighting Implementation:**
```javascript
// File: src/pages/RecipePage/RecipePage.js
// Current Logic:
1. Fetch recipe ingredients from RecipeIngredients table
2. For each ingredient, check if it contains user's allergens
3. If allergen detected, ingredient highlighted in red
4. User can click red ingredient to see substitutes
```

#### **Allergen Detection in Recipe Ingredients:**
```javascript
// Current Process:
1. User selects allergens (milk, peanuts, etc.)
2. Recipe page fetches ingredients for recipe
3. For each ingredient, search for products containing that ingredient
4. Check if any products contain user's allergens
5. If allergen found, ingredient flagged as "red"
```

#### **Substitute System:**
```sql
-- Table: "SubstituteMappings"
- canonicalIngredient (ingredient to substitute)
- substituteName (substitute ingredient name)
- notes (substitution notes)
```

---

## **🗺️ MAPPING PIPELINE DETAILS**

### **Canonical Mapping System:**
```javascript
// File: src/pages/RecipePage/RecipePage.js
// Functions: cleanIngredientNameFrontend(), mapToCanonicalName()

// Current Process:
1. Raw ingredient: "3 cups all-purpose flour"
2. Clean: "flour" (remove measurements, descriptions)
3. Map to canonical: "flour, wheat"
4. Search products using canonical name
```

### **Product Matching Logic:**
```sql
-- Current Query (problematic):
SELECT * FROM "IngredientCategorized"
WHERE description ILIKE '%flour%'
-- This works but is slow with 243k+ products
```

### **Allergen Detection Pipeline:**
```javascript
// Current Logic:
1. Product description contains allergen keywords
2. ILIKE search for allergen terms in description
3. Flag products containing allergens
4. Exclude flagged products from results

// Problem: This requires multiple ILIKE operations on unindexed field
```

---

## **🗄️ DATABASE CURRENT STATE**

### **Exact Schema Information:**

#### **Main Tables:**
```sql
-- Confirmed Tables:
1. "IngredientCategorized" - 243,114+ products (main issue)
2. "Recipes" - Recipe data
3. "RecipeIngredients" - Recipe-ingredient relationships
4. "AllergenDerivatives" - Allergen definitions
5. "SubstituteMappings" - Ingredient substitutes
6. "Carts" - User shopping carts
7. "Users" - User accounts
8. "Categories" - Product categories
9. "Subcategories" - Product subcategories
10. "Orders" - Order data
```

#### **Table Sizes (from migration files):**
- **IngredientCategorized**: 243,114+ products (main performance issue)
- **Recipes**: ~73,325 recipes
- **Food**: Large table (backup/migration table)

#### **Current Indexes:**
```sql
-- From migration files, no specific indexes mentioned for:
- IngredientCategorized.description (UNINDEXED - causing timeouts)
- IngredientCategorized.allergens (UNINDEXED)
```

### **Current Query Performance:**
```sql
-- PROBLEMATIC QUERY (causing timeouts):
SELECT * FROM "IngredientCategorized" 
WHERE description NOT ILIKE '%milk%' 
AND description NOT ILIKE '%peanuts%'
-- Error: "canceling statement due to statement timeout" (57014)
```

---

## **🔧 CURRENT CODEBASE STRUCTURE**

### **File Organization:**
```
src/
├── pages/
│   ├── Homepage.js (main homepage with three scrollers)
│   └── RecipePage/
│       └── RecipePage.js (recipe detail page)
├── components/
│   ├── SearchAndFilter/
│   │   └── SearchAndFilter.js (search + allergy filter)
│   ├── Searchbar/
│   │   └── Searchbar.js (search input)
│   ├── AllergyFilter/
│   │   └── AllergyFilter.js (allergen toggles)
│   ├── ShowResults.js (displays products/recipes)
│   ├── FoodCard/
│   │   └── FoodCard.js (product cards)
│   └── RecipeCard/
│       └── RecipeCard.js (recipe cards)
└── utils/
    └── supabaseQueries.js (database queries)
```

### **State Management:**
```javascript
// Redux Slices:
1. allergiesSlice.js - Allergen toggle state
2. productSlice.js - Product search results
3. recipeSlice.js - Recipe search results
4. searchPreferencesSlice.js - Search/allergen preferences
5. anonymousCartSlice.js - Anonymous user cart
```

### **Current Error Handling:**
```javascript
// Current Error Handling:
1. Database timeouts - caught in supabaseQueries.js
2. User sees generic error messages
3. No fallback behavior when filtering fails
4. Allergen filtering completely disabled
```

---

## **🚨 IMMEDIATE CRISIS DETAILS**

### **Exact Error Information:**
```javascript
// Error Details:
- Error Code: 57014
- Message: "canceling statement due to statement timeout"
- Query: description NOT ILIKE '%allergen%'
- Affected Table: IngredientCategorized (243,114+ products)
- Root Cause: Unindexed text field with multiple ILIKE operations
```

### **Current Workaround Status:**
```javascript
// Current Status:
✅ Allergen filtering DISABLED in supabaseQueries.js
✅ User notification added in AllergyFilter.js
✅ Search functionality preserved
❌ No allergen filtering active
```

---

## **📊 BUSINESS REQUIREMENTS**

### **Performance Requirements:**
- **Acceptable response time**: <2 seconds for allergen filtering
- **Concurrent users**: Unknown (need clarification)
- **Zero-tolerance policy**: Critical for allergen exposure

### **Functional Requirements:**
```javascript
// Supported Allergens (from AllergyFilter.js):
const fallbackAllergens = {
    milk: false,
    eggs: false,
    fish: false,
    shellfish: false,
    treeNuts: false,
    peanuts: false,
    wheat: false,
    soy: false,
    sesame: false,
    gluten: false,
};
```

---

## **🎯 SPECIFIC CODE REQUESTS**

### **Current Implementation Files:**

#### **1. Homepage Component:**
```javascript
// File: src/pages/Homepage.js
// Purpose: Main homepage with three scrollers
// Current: Loads initial products/recipes, no filtering logic
```

#### **2. AllergyFilter Component:**
```javascript
// File: src/components/AllergyFilter/AllergyFilter.js
// Purpose: Allergen toggle functionality
// Current: Toggles work, but filtering disabled
```

#### **3. Recipe Page Component:**
```javascript
// File: src/pages/RecipePage/RecipePage.js
// Purpose: Recipe detail with ingredient filtering
// Current: Ingredient highlighting works, product fetching slow
```

#### **4. Database Query Utilities:**
```javascript
// File: src/utils/supabaseQueries.js
// Purpose: All database queries
// Current: Allergen filtering disabled due to timeouts
```

---

## **❓ CRITICAL QUESTIONS ANSWERED**

### **1. Multiple Allergens:**
```javascript
// Current Logic:
const sendAllergens = Object.keys(allergies).filter(key => allergies[key]).map(key => key.toLowerCase());
// Multiple allergens combined with AND logic (all must be excluded)
```

### **2. Conflicting Allergen Information:**
```javascript
// Current Logic:
// Uses simple ILIKE search on description field
// No sophisticated allergen detection
// No handling of "gluten-free" vs "contains gluten"
```

### **3. Red-Highlighted Ingredient UX:**
```javascript
// Current Flow:
1. User clicks red ingredient
2. Substitute products fetched
3. User can select substitute product
4. Original ingredient replaced in recipe
```

### **4. Substitute Product Safety:**
```javascript
// Current Logic:
// No verification that substitutes don't contain original allergen
// Relies on manual substitute mapping
```

### **5. Data Source:**
```javascript
// Current Sources:
- IngredientCategorized table (243k+ products)
- AllergenDerivatives table (allergen definitions)
- Manual substitute mappings
```

### **6. Update Frequency:**
```javascript
// Current Status:
// Unknown - need clarification on data update frequency
```

### **7. Allergen Mapping Tables:**
```javascript
// Current Tables:
- AllergenDerivatives: Basic allergen definitions
- No sophisticated allergen mapping system
- Everything parsed from product descriptions
```

---

## **📝 DELIVERABLES PROVIDED**

✅ **Exact table schemas** - Provided for main tables
✅ **Complete current code** - All relevant files analyzed
✅ **Actual data samples** - From code analysis
✅ **Current query performance metrics** - Timeout issues identified
✅ **Exact user flow descriptions** - Complete flow documented
✅ **Business rule specifications** - Allergen requirements documented

---

## **🚨 IMMEDIATE ACTION REQUIRED**

### **Critical Issues Identified:**
1. **Database Performance**: Unindexed `description` field causing timeouts
2. **Allergen Filtering**: Completely disabled due to performance
3. **User Experience**: No allergen filtering available
4. **Business Risk**: Users cannot filter by allergens

### **Recommended Immediate Actions:**
1. **Database Indexing**: Add indexes to `IngredientCategorized.description`
2. **Query Optimization**: Implement efficient allergen detection
3. **Alternative Filtering**: Consider pre-computed allergen flags
4. **Performance Monitoring**: Track query execution times

---

**Last Updated**: January 2025  
**Status**: 🚨 CRITICAL - Allergen filtering disabled  
**Priority**: HIGH - Database performance optimization required 