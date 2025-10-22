# Phase 5: Edge Function Update - Semantic Matching

## 🎯 Goal

Update the Edge Function to use semantic matching instead of text-based matching. This **activates the eggplant/egg fix**!

## 📊 Current vs New Approach

### **Current (Text-Based):**
```typescript
// Find products by text matching
const products = await supabase
  .from('IngredientCategorized')
  .select('*')
  .ilike('description', `%${ingredientCanonical}%`)
  .limit(10);

// Problem: "egg" matches "eggplant"! ❌
```

### **New (Semantic):**
```typescript
// Step 1: Resolve ingredient to ID
const { data: ingredient } = await supabase
  .from('ingredients')
  .select('id, canonical_name, category')
  .or(`canonical_name.eq.${ingredientName},aliases.cs.{${ingredientName}}`)
  .limit(1);

// Step 2: Get mapped products
const { data: products } = await supabase
  .from('products')
  .select(`
    id, name, brand_name, allergens,
    ingredient_product_mapping!inner(confidence_score, match_type)
  `)
  .eq('ingredient_product_mapping.ingredient_id', ingredient.id)
  .gte('ingredient_product_mapping.confidence_score', 0.80)
  .limit(10);

// Result: ONLY products mapped to "egg" (ID 182930)
// "Eggplant" products are mapped to different ID (185593)
// NO OVERLAP! ✅
```

## 🔧 Key Changes Required

### **File: `supabase/functions/recipe-processor/index.ts`**

#### **Change 1: Add Feature Flag**
```typescript
// At top of file
const USE_SEMANTIC_MATCHING = Deno.env.get('USE_SEMANTIC_MATCHING') === 'true';
```

#### **Change 2: Create New Semantic Function**
```typescript
async function findMatchingProductsSemantic(
  supabase: any,
  ingredientName: string, 
  options: { userAllergens: string[], limit: number }
) {
  const { userAllergens, limit } = options;
  
  try {
    // Step 1: Resolve ingredient to semantic entity
    const { data: ingredientData, error: ingredientError } = await supabase
      .from('ingredients')
      .select('id, canonical_name, category, subcategory')
      .eq('canonical_name', ingredientName.toLowerCase())
      .limit(1);
    
    if (ingredientError || !ingredientData || ingredientData.length === 0) {
      console.log(`[SEMANTIC] No ingredient found for: ${ingredientName}, falling back to text search`);
      return findMatchingProductsLegacy(supabase, ingredientName, options);
    }
    
    const ingredient = ingredientData[0];
    console.log(`[SEMANTIC] Resolved "${ingredientName}" to ingredient ID ${ingredient.id} (${ingredient.category})`);
    
    // Step 2: Get products via mappings
    const { data: mappings, error: mappingsError } = await supabase
      .from('ingredient_product_mapping')
      .select(`
        product_id,
        confidence_score,
        match_type,
        products (
          id,
          name,
          brand_name,
          allergens,
          description,
          is_active
        )
      `)
      .eq('ingredient_id', ingredient.id)
      .gte('confidence_score', 0.80)
      .eq('products.is_active', true)
      .order('confidence_score', { ascending: false })
      .limit(limit);
    
    if (mappingsError) {
      console.error('[SEMANTIC] Error fetching mappings:', mappingsError);
      return findMatchingProductsLegacy(supabase, ingredientName, options);
    }
    
    // Step 3: Extract products and filter by allergens
    const products = (mappings || []).map(m => m.products).filter(p => p);
    const filteredProducts = filterProductsByAllergens(products, userAllergens);
    
    console.log(`[SEMANTIC] Found ${filteredProducts.length} products for ${ingredient.canonical_name} (category: ${ingredient.category})`);
    return filteredProducts;
    
  } catch (error) {
    console.error('[SEMANTIC] Error:', error);
    return findMatchingProductsLegacy(supabase, ingredientName, options);
  }
}
```

#### **Change 3: Rename Old Function to Legacy**
```typescript
// Rename existing function
async function findMatchingProductsLegacy(supabase: any, ingredientCanonical: string, options: { userAllergens: string[], limit: number }) {
  // Keep existing text-based logic as fallback
  // ... existing code ...
}
```

#### **Change 4: Update Main Function with Feature Flag**
```typescript
async function findMatchingProducts(supabase: any, ingredientCanonical: string, options: { userAllergens: string[], limit: number }) {
  if (USE_SEMANTIC_MATCHING) {
    return findMatchingProductsSemantic(supabase, ingredientCanonical, options);
  } else {
    return findMatchingProductsLegacy(supabase, ingredientCanonical, options);
  }
}
```

## 🔄 Deployment Strategy

### **Step 1: Update with Feature Flag OFF (Safe)**
- Deploy new code with `USE_SEMANTIC_MATCHING = false`
- Website continues using old text-based matching
- No changes to user experience
- **Zero risk**

### **Step 2: Test Semantic Matching**
- Set `USE_SEMANTIC_MATCHING = true` in Supabase Edge Function secrets
- Test with specific recipes
- Verify egg products don't show eggplant
- **Controlled testing**

### **Step 3: Gradual Rollout**
- Enable for 10% of users
- Monitor for issues
- Increase to 50%, then 100%
- **Safe rollout**

## ✅ Benefits of This Approach

1. ✅ **Feature flag** - Can turn on/off instantly
2. ✅ **Fallback logic** - If semantic fails, uses old system
3. ✅ **Zero downtime** - Smooth transition
4. ✅ **Easy rollback** - Just turn flag off

## 📋 Files to Update

1. `supabase/functions/recipe-processor/index.ts` - Main Edge Function
2. Add environment variable in Supabase Dashboard
3. Test with sample recipes

## 🎯 Expected Result

**Before Phase 5:**
```
Recipe: "2 large eggs"
Products shown: egg products + eggplant ❌
```

**After Phase 5:**
```
Recipe: "2 large eggs"
Products shown: egg products ONLY ✅
```

Ready to implement? 🚀

