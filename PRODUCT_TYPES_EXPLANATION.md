# Understanding Product Types in Dynable

## 🎯 The Two Types of Products

Your website has **TWO different types of product displays**, each serving a different purpose:

---

## 📦 **Type 1: Homepage Products (Direct Search Results)**

### **What They Are:**
- **Source**: `IngredientCategorized` table (now `products` table)
- **Purpose**: Direct product search and browsing
- **Display**: Horizontal scrolling on homepage
- **Count**: 243,114 products

### **Where They Appear:**
- Homepage top scroller (after search/filter)
- Direct product search results
- Main product catalog browsing

### **How They're Queried:**
```javascript
// From: src/utils/supabaseQueries.js
const foodResponse = await searchProductsUnified({
  searchTerm: searchTerm,
  allergens: selectedAllergens,
  page: currentPage,
  limit: itemsPerPage
});

// SQL Query:
SELECT * FROM "IngredientCategorized"
WHERE description ILIKE '%searchTerm%'
AND NOT (allergens && ARRAY['milk', 'eggs'])
LIMIT 20 OFFSET 0;
```

### **Characteristics:**
- ✅ **Direct products** - Actual purchasable items
- ✅ **Full product info** - Brand, price, allergens, nutrition
- ✅ **User can buy** - Added to cart directly
- ✅ **Filtered by allergens** - Respects user's allergen preferences
- ✅ **Search by name** - Text-based search on product description

### **Examples:**
- "STRAWBERRY MELON ICED TEA, STRAWBERRY MELON" by BRISK
- "CHOCOLATE CANDIES, CHOCOLATE" by M&M'S
- "RASPBERRY REAL BREWED TEA, RASPBERRY" by PURE LEAF

---

## 🍳 **Type 2: Recipe Products (Ingredient-Based Results)**

### **What They Are:**
- **Source**: `IngredientCategorized` table (now `products` table)
- **Purpose**: Product recommendations **for specific recipe ingredients**
- **Display**: Inside RecipePage, under each ingredient
- **Queried per ingredient**: When user clicks on a recipe

### **Where They Appear:**
- Inside a specific recipe page
- Under each ingredient in the recipe
- Example: Recipe calls for "eggs" → Shows egg products

### **How They're Queried:**
```typescript
// From: supabase/functions/recipe-processor/index.ts
// When user opens a recipe, Edge Function processes each ingredient

// For ingredient: "2 large eggs"
// 1. Clean: "eggs" → "egg"
// 2. Query products:

// Current (Text-Based):
SELECT * FROM "IngredientCategorized"
WHERE description ILIKE '%egg%'
LIMIT 10;

// Proposed (Semantic):
SELECT p.* FROM products p
JOIN ingredient_product_mapping ipm ON p.id = ipm.product_id
WHERE ipm.ingredient_id = (
  SELECT id FROM ingredients WHERE canonical_name = 'egg'
)
AND ipm.confidence_score >= 0.80
LIMIT 10;
```

### **Characteristics:**
- ✅ **Ingredient-specific** - Matched to recipe needs
- ✅ **Contextual** - "Eggs" shows egg products, not eggplant
- ✅ **Per-ingredient** - Each ingredient has its own product list
- ✅ **Filtered by allergens** - Respects user preferences
- ✅ **Substitutes available** - Alternative ingredient options

### **Current Problem (Text-Based):**
```
Recipe calls for: "egg"
Current system shows:
  ✅ "Large Grade A Eggs" (CORRECT)
  ✅ "Organic Free-Range Eggs" (CORRECT)
  ❌ "Japanese Eggplant" (FALSE POSITIVE - contains "egg")
  ❌ "Egg Roll Wrappers" (DEBATABLE - processed food)
```

### **Future Solution (Semantic):**
```
Recipe calls for: "egg"
New system shows:
  ✅ "Large Grade A Eggs" (confidence: 0.99)
  ✅ "Organic Free-Range Eggs" (confidence: 0.98)
  ✅ "Liquid Egg Whites" (confidence: 0.85)
  ❌ "Japanese Eggplant" (NOT SHOWN - different ingredient_id)
  ❌ "Egg Roll Wrappers" (NOT SHOWN - different ingredient_id)
```

---

## 🔄 **How They Differ: Side-by-Side**

| Aspect | Homepage Products | Recipe Products |
|--------|------------------|-----------------|
| **Source Table** | `IngredientCategorized` | `IngredientCategorized` |
| **Query Type** | Direct search by product name | Search by ingredient match |
| **User Intent** | Browse/search for products | Find products for recipe ingredient |
| **Search Field** | `description` (product name) | `description` (matched to ingredient) |
| **Display Location** | Homepage horizontal scroller | RecipePage under each ingredient |
| **Pagination** | Yes (Redux-controlled) | Yes (per ingredient) |
| **Allergen Filtering** | Yes | Yes |
| **Add to Cart** | Yes (via FoodCard) | Yes (via ProductSelector) |
| **Quantity** | Show 20 per page | Show 5-10 per ingredient |

---

## 🎯 **The Key Difference:**

### **Homepage Products (Type 1):**
**User asks**: "Show me all products that contain the word 'chocolate'"

**System returns**: All products where `description ILIKE '%chocolate%'`
- Chocolate bars
- Chocolate milk
- Chocolate chips
- Hot chocolate mix

### **Recipe Products (Type 2):**
**Recipe asks**: "I need 'eggs' for this recipe"

**System returns**: All products that match the ingredient "eggs"
- Currently: All products where `description ILIKE '%egg%'` ❌ (includes eggplant)
- Future: All products mapped to `ingredient_id=42` (egg) ✅ (excludes eggplant)

---

## 🔍 **Why This Matters for Phase 3:**

The **ingredient taxonomy** we're building in Phase 3 is specifically for **Type 2 (Recipe Products)**.

### **Impact on Homepage Products (Type 1):**
- ❌ **No change** - Will continue using text-based search
- ✅ **Still works** - Users can search by product name
- ✅ **Fast** - Simple text matching, no semantic overhead

### **Impact on Recipe Products (Type 2):**
- ✅ **MAJOR improvement** - Semantic matching eliminates false positives
- ✅ **Better accuracy** - "egg" won't show "eggplant"
- ✅ **Confidence scores** - Rank products by relevance
- ✅ **Faster queries** - Pre-computed mappings vs full table scans

---

## 📋 **Database Tables Involved:**

### **For Homepage Products (Type 1):**
```
User Search → IngredientCategorized (or products) table
             └─ Direct text search on `description` field
             └─ Returns matching products
```

### **For Recipe Products (Type 2):**
```
Recipe Ingredient → Edge Function → Clean ingredient name
                                  ↓
                    ingredients table (semantic lookup)
                                  ↓
                    ingredient_product_mapping (pre-computed)
                                  ↓
                    products table (fetch matched products)
                                  ↓
                    Return contextual products
```

---

## ✅ **Summary:**

| Question | Answer |
|----------|--------|
| Are they the same products? | **YES** - Both use the same product database |
| Do they use the same table? | **YES** - Both query `IngredientCategorized` (or `products`) |
| Do they use the same matching? | **NO** - Homepage uses text search, Recipes use ingredient matching |
| Will Phase 3 affect homepage? | **NO** - Only affects recipe ingredient matching |
| Will Phase 3 fix eggplant issue? | **YES** - Only for recipe products, not homepage search |

---

## 🎯 **Key Insight:**

The **ingredient taxonomy** and **semantic matching** only apply to **Recipe Products (Type 2)**.

If a user searches "egg" on the homepage, they might WANT to see "eggplant" because they're browsing. But when a recipe calls for "egg", they should NEVER see "eggplant" - that's the problem we're solving! 🎯

