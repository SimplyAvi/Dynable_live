# Complete Data Pipeline & Substitution Logic Analysis

## **Phase 1: Complete Data Flow Analysis**

### **A. Data Flow Architecture**

```
Recipes (73,322) → Ingredients (683,784) → IngredientToCanonical (24,765) → CanonicalIngredients (61,653) → Products (243,108)
                                                        ↓
                                              AllergenDerivatives (53) & Substitutions
```

### **B. Current System Status**

#### ✅ **What's Working:**
- **Recipe → Ingredient Flow**: ✅ Complete (73,322 recipes, 683,784 ingredients)
- **Ingredient → Canonical Mapping**: ✅ 24,765 mappings (282% coverage)
- **Product Tagging**: ✅ 24,772 products tagged (10.2% coverage)
- **Allergen System**: ✅ 53 allergens configured (99.9% product coverage)
- **Database Constraints**: ✅ Fixed null mappings

#### ❌ **What's Missing:**
- **Substitution System**: ❌ Not fully implemented
- **Allergen Filtering**: ❌ Not working in API
- **Derivative Logic**: ❌ Not connected to filtering

### **C. Data Flow Details**

#### **1. Recipe → Ingredient Flow**
```javascript
// Models: Recipe.hasMany(Ingredient)
Recipe {
  title: STRING,
  directions: ARRAY(TEXT),
  ingredients: [Ingredient] // One-to-many
}

Ingredient {
  name: TEXT,        // "2 cups flour"
  quantity: STRING,  // "2 cups"
  RecipeId: INTEGER  // Foreign key
}
```

#### **2. Ingredient → Canonical Mapping**
```javascript
// Models: IngredientToCanonical (mapping table)
IngredientToCanonical {
  messyName: STRING,           // "flour" (cleaned)
  CanonicalIngredientId: INTEGER, // Links to canonical
  confidence: STRING           // "confident", "suggested", "low"
}

CanonicalIngredient {
  name: STRING,      // "flour" (standardized)
  aliases: ARRAY,    // ["all-purpose flour", "plain flour"]
  allergens: ARRAY   // ["wheat", "gluten"]
}
```

#### **3. Canonical → Product Connection**
```javascript
// Models: Food (products)
Food {
  description: TEXT,
  canonicalTag: STRING,        // "flour" (from product tagging)
  canonicalTagConfidence: STRING, // "confident", "suggested", "low"
  allergens: ARRAY,            // ["wheat", "gluten"]
  canonicalTags: ARRAY         // Multiple tags
}
```

## **Phase 2: Substitution & Derivatives Logic Analysis**

### **A. Substitution System**

#### **Models:**
```javascript
Substitution {
  CanonicalIngredientId: INTEGER, // Original ingredient
  substituteName: STRING,         // "almond flour"
  notes: STRING                   // "Wheat-free alternative"
}

AllergenDerivative {
  allergen: STRING,    // "wheat"
  derivative: STRING   // "flour"
}
```

#### **Substitution Logic Flow:**
1. **User selects allergen**: "wheat"
2. **System finds canonical ingredients** with wheat allergen
3. **System finds substitutions** for those ingredients
4. **System filters products** to show only substitute products
5. **API returns substitute products** instead of allergen-containing products

### **B. Allergen Filtering Logic**

#### **Current API Logic** (`/api/product/by-ingredient`):
```javascript
// 1. Clean ingredient name
const cleanedName = cleanIngredientName(ingredientName);

// 2. Map to canonical ingredient
const mapping = await IngredientToCanonical.findOne({ 
  where: { messyName: cleanedName.toLowerCase() } 
});

// 3. Find products with canonical tag
let where = {
  canonicalTag: canonical.toLowerCase(),
  canonicalTagConfidence: 'confident'
};

// 4. Apply allergen filtering (CURRENTLY NOT WORKING)
if (allergens && allergens.length > 0) {
  where[Sequelize.Op.and].push(
    Sequelize.literal(`("allergens" IS NULL OR NOT EXISTS (
      SELECT 1 FROM unnest("allergens") a WHERE UPPER(a) = ANY(ARRAY[${allergens.map(a => `'${a.toUpperCase()}'`).join(',')}])
    ))`)
  );
}
```

#### **Why Allergen Filtering Isn't Working:**
1. **Data Issue**: Products may not have allergen data populated
2. **Logic Issue**: Allergen filtering logic may be incorrect
3. **Case Sensitivity**: Allergen matching may be case-sensitive
4. **Derivative Issue**: Not expanding allergens with derivatives

## **Phase 3: Missing Scripts Identification**

### **A. Critical Missing Scripts**

#### **1. Substitution System Scripts**
```bash
# These scripts need to be run:
server/seed/addMissingSubstituteIngredients.js    # ❌ NOT RUN
server/seed/addMissingPureProducts.js            # ❌ NOT RUN
```

#### **2. Allergen System Scripts**
```bash
# This script was run but may need verification:
server/seed/comprehensiveAllergenSystem.js       # ✅ RUN (but verify results)
```

### **B. Script Analysis**

#### **addMissingSubstituteIngredients.js**
- **Purpose**: Creates substitution mappings for allergen-containing ingredients
- **What it does**: Maps canonical ingredients to substitute ingredients
- **Example**: `flour (wheat)` → `almond flour`, `rice flour`, `gluten-free flour`

#### **addMissingPureProducts.js**
- **Purpose**: Creates pure products for substitute ingredients
- **What it does**: Adds Food records for substitute ingredients
- **Example**: Creates "Pure Almond Flour" product for almond flour substitute

#### **comprehensiveAllergenSystem.js**
- **Purpose**: Sets up allergen derivatives and substitutions
- **What it does**: Creates AllergenDerivative and Substitution records
- **Status**: ✅ Run but needs verification

## **Phase 4: API Testing & Debugging**

### **A. Current API Issues**

#### **1. Allergen Filtering Not Working**
**Root Cause**: Products may not have allergen data, or filtering logic is broken

**Debug Steps**:
```sql
-- Check if products have allergen data
SELECT 
  COUNT(*) as total_products,
  COUNT(allergens) as products_with_allergens,
  COUNT(CASE WHEN allergens IS NOT NULL AND array_length(allergens, 1) > 0 THEN 1 END) as products_with_allergen_data
FROM "Food";

-- Check specific allergen data
SELECT description, allergens FROM "Food" WHERE allergens IS NOT NULL LIMIT 10;
```

#### **2. Substitution API Not Working**
**Root Cause**: Substitution data may not be populated

**Debug Steps**:
```sql
-- Check substitution data
SELECT COUNT(*) FROM "Substitutions";

-- Check allergen derivative data
SELECT COUNT(*) FROM "AllergenDerivatives";
```

### **B. API Testing Commands**

#### **Test 1: Basic Ingredient Search**
```bash
curl -X POST http://localhost:5001/api/product/by-ingredient \
-H "Content-Type: application/json" \
-d '{"ingredientName": "flour", "allergens": []}'
```

#### **Test 2: Allergen Filtering**
```bash
curl -X POST http://localhost:5001/api/product/by-ingredient \
-H "Content-Type: application/json" \
-d '{"ingredientName": "flour", "allergens": ["wheat"]}'
```

#### **Test 3: Substitute Search**
```bash
curl -X POST http://localhost:5001/api/product/by-ingredient \
-H "Content-Type: application/json" \
-d '{"ingredientName": "flour", "allergens": ["wheat"], "substituteName": "almond flour"}'
```

## **Phase 5: Complete System Architecture**

### **A. Data Flow Diagram**

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌─────────────┐
│   Recipes   │───▶│  Ingredients │───▶│IngredientToCanon│───▶│CanonicalIng │
│   (73,322)  │    │  (683,784)   │    │     (24,765)    │    │   (61,653)  │
└─────────────┘    └──────────────┘    └─────────────────┘    └─────────────┘
                                                                    │
                                                                    ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌─────────────┐
│   Products  │◀───│  Allergen    │◀───│  Substitutions  │◀───│CanonicalIng │
│  (243,108)  │    │ Derivatives  │    │                 │    │   (61,653)  │
│             │    │    (53)      │    │                 │    │             │
└─────────────┘    └──────────────┘    └─────────────────┘    └─────────────┘
```

### **B. API Flow**

#### **1. Recipe Search Flow**
```
Frontend → /api/recipe (POST) → Filter by allergens → Return filtered recipes
```

#### **2. Product Search Flow**
```
Frontend → /api/product/by-ingredient (POST) → Clean ingredient → Map to canonical → Find products → Apply allergen filter → Return products
```

#### **3. Substitute Search Flow**
```
Frontend → /api/recipe/substitute-products (GET) → Find canonical → Find substitutions → Find substitute products → Return substitutes
```

## **Phase 6: Missing Components & Solutions**

### **A. Missing Components**

#### **1. Substitution Data**
- **Issue**: Substitution mappings not populated
- **Solution**: Run `addMissingSubstituteIngredients.js`

#### **2. Pure Products for Substitutes**
- **Issue**: No products for substitute ingredients
- **Solution**: Run `addMissingPureProducts.js`

#### **3. Allergen Data on Products**
- **Issue**: Products may not have allergen data
- **Solution**: Verify allergen data population

#### **4. Allergen Filtering Logic**
- **Issue**: Filtering logic may be broken
- **Solution**: Debug and fix allergen filtering

### **B. Phase 2 Execution Plan**

#### **Step 1: Run Missing Scripts**
```bash
cd server
node seed/addMissingSubstituteIngredients.js
node seed/addMissingPureProducts.js
```

#### **Step 2: Verify Allergen System**
```bash
cd server
node seed/comprehensiveAllergenSystem.js  # Re-run if needed
```

#### **Step 3: Test API Endpoints**
```bash
cd server
node test_api_endpoints.js
```

#### **Step 4: Debug Allergen Filtering**
- Check product allergen data
- Test allergen filtering logic
- Fix any issues found

### **C. Expected Results After Phase 2**

#### **✅ Complete System Should Have:**
- **Substitution System**: Working substitute mappings
- **Allergen Filtering**: Working allergen filtering in API
- **Pure Products**: Products for substitute ingredients
- **Derivative Logic**: Allergen derivatives working
- **Complete Pipeline**: Recipes → Ingredients → Canonicals → Products → Allergen Filtering

#### **🎯 Success Criteria:**
1. **Allergen filtering works** in `/api/product/by-ingredient`
2. **Substitution system works** in `/api/recipe/substitute-products`
3. **Pure products available** for substitute ingredients
4. **No 500 errors** in API endpoints
5. **Complete data pipeline** operational

## **Key Questions Answered**

### **1. Where is allergen data stored?**
- **CanonicalIngredients**: `allergens` array field
- **Food (Products)**: `allergens` array field
- **AllergenDerivatives**: Separate table for allergen relationships

### **2. How does allergen filtering work?**
- **API Logic**: Filters products by excluding those with specified allergens
- **Current Issue**: Logic may be broken or data missing
- **Solution**: Debug and fix filtering logic

### **3. What are derivatives?**
- **Allergen Derivatives**: Related allergen terms (e.g., "wheat" → "flour")
- **Purpose**: Expand allergen searches to catch related terms
- **Example**: User allergic to "wheat" should also avoid "flour", "bread", etc.

### **4. How do substitutions work?**
- **Substitution Table**: Maps canonical ingredients to substitutes
- **API Logic**: When allergen detected, show substitute products
- **Example**: "flour (wheat)" → "almond flour", "rice flour"

### **5. What scripts are missing?**
- **addMissingSubstituteIngredients.js**: Creates substitution mappings
- **addMissingPureProducts.js**: Creates products for substitutes
- **Verification scripts**: To check system status

### **6. Why isn't allergen filtering working?**
- **Data Issue**: Products may not have allergen data
- **Logic Issue**: Allergen filtering logic may be incorrect
- **Missing Scripts**: Substitution system not fully implemented

## **Next Steps**

### **Immediate Actions:**
1. **Run missing scripts**: `addMissingSubstituteIngredients.js` and `addMissingPureProducts.js`
2. **Test API endpoints**: Verify allergen filtering and substitution logic
3. **Debug any issues**: Fix allergen filtering if needed
4. **Verify complete system**: Ensure all components work together

### **Success Metrics:**
- ✅ Allergen filtering works in API
- ✅ Substitution system operational
- ✅ No 500 errors in backend
- ✅ Complete data pipeline functional
- ✅ Frontend allergen filtering works

**The foundation is solid - just need to complete the substitution and allergen filtering components!** 