// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// TypeScript configuration for Deno Edge Functions
// These imports and Deno globals are available at runtime in Supabase Edge Functions

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 🚀 PHASE 5: Feature flag for semantic matching - DEFAULT TO TRUE
// @ts-ignore - Deno global is available in Edge Functions
const USE_SEMANTIC_MATCHING = Deno.env.get('USE_SEMANTIC_MATCHING') !== 'false';

interface RecipeIngredient {
  id: number;
  name: string;
  quantity: string;
  RecipeId: number;
}

interface ProcessedIngredient {
  id: number;
  name: string;
  quantity: string;
  canonical: string;
  products: any[];
  substitutes: any[];
  hasAllergens: boolean;
  allergenNotes: string[];
}

interface RecipeResponse {
  id: number;
  title: string;
  directions: string[];
  source: string;
  tags: string[];
  url: string;
  ingredients: ProcessedIngredient[];
  processingTime: number;
  totalProducts: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = performance.now();

  try {
    // @ts-ignore - Deno global is available in Edge Functions
    const supabase = createClient(
      // @ts-ignore - Deno.env is available in Edge Functions
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore - Deno.env is available in Edge Functions
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { recipeId, userAllergens = [] } = await req.json()

    console.log(`[EDGE FUNCTION] Processing recipe ${recipeId} with allergens:`, userAllergens)

    // 🛡️ ADDED: Query timeout protection using Promise.race
    const QUERY_TIMEOUT = 10000; // 10 seconds max per query
    
    // Helper function to add timeout to any promise
    const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
      );
      return Promise.race([promise, timeoutPromise]);
    };
    
    // Step 1: Fetch recipe data with timeout
    const recipePromise = supabase
      .from('Recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    const recipeResult = await withTimeout(recipePromise, QUERY_TIMEOUT) as any;
    if (recipeResult.error || !recipeResult.data) {
      throw new Error(`Recipe not found: ${recipeResult.error?.message || 'Unknown error'}`)
    }
    const recipeData = recipeResult.data;

    // Step 2: Fetch recipe ingredients with timeout and limit
    const ingredientsPromise = supabase
      .from('RecipeIngredients')
      .select('*')
      .eq('RecipeId', recipeId)
      .limit(50); // 🛡️ ADDED: Limit to prevent massive queries

    const ingredientsResult = await withTimeout(ingredientsPromise, QUERY_TIMEOUT) as any;
    if (ingredientsResult.error) {
      throw new Error(`Failed to fetch ingredients: ${ingredientsResult.error.message}`)
    }
    const ingredientsData = ingredientsResult.data || [];

    console.log(`[EDGE FUNCTION] Found ${ingredientsData.length} ingredients for recipe ${recipeId}`)

    // 🛡️ ADDED: Early return if too many ingredients (performance protection)
    if (ingredientsData.length > 50) {
      console.warn(`[EDGE FUNCTION] ⚠️ Too many ingredients (${ingredientsData.length}), limiting to first 50`);
      ingredientsData.splice(50);
    }

    // Step 3: Process ingredients in batches to prevent timeout
    const BATCH_SIZE = 10;
    const processedIngredients: ProcessedIngredient[] = [];
    
    for (let i = 0; i < ingredientsData.length; i += BATCH_SIZE) {
      const batch = ingredientsData.slice(i, i + BATCH_SIZE);
      console.log(`[EDGE FUNCTION] Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(ingredientsData.length/BATCH_SIZE)}`);
      
      const batchPromises = batch.map(async (ingredient: RecipeIngredient) => {
        try {
          console.log(`[EDGE FUNCTION] Processing ingredient: ${ingredient.name}`)
          
          // Clean ingredient name for better matching
          const cleaned = cleanIngredientForMatching(ingredient.name)
          console.log(`[EDGE FUNCTION] Cleaned ingredient: ${ingredient.name} -> ${cleaned.canonical}`)
          
          // Find ALL matching products first (without allergen filtering)
          const allProductsPromise = findMatchingProducts(supabase, cleaned.canonical, {
            userAllergens: [], // Get all products first
            limit: 10
          });
          
          // Find substitutes with timeout
          const substitutesPromise = findSubstitutes(supabase, cleaned.canonical, userAllergens)
          
          // Wait for both promises with timeout
          const [allProducts, substitutes] = await Promise.all([
            withTimeout(allProductsPromise, 5000),
            withTimeout(substitutesPromise, 3000)
          ]);
          
          // Check for allergens in ALL products (before filtering)
          const allergenCheck = checkProductsForAllergens(allProducts, userAllergens)
          
          // Now filter products by allergens
          const products = filterProductsByAllergens(allProducts, userAllergens).slice(0, 5)

          return {
            id: ingredient.id,
            name: ingredient.name,
            quantity: ingredient.quantity,
            canonical: cleaned.canonical,
            products: products,
            substitutes: substitutes,
            hasAllergens: allergenCheck.hasAllergens,
            allergenNotes: allergenCheck.notes
          }
        } catch (error) {
          console.error(`[EDGE FUNCTION] Error processing ingredient ${ingredient.name}:`, error);
          // Return a basic ingredient object if processing fails
          return {
            id: ingredient.id,
            name: ingredient.name,
            quantity: ingredient.quantity,
            canonical: ingredient.name.toLowerCase(),
            products: [],
            substitutes: [],
            hasAllergens: false,
            allergenNotes: 'Processing failed'
          }
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      processedIngredients.push(...batchResults);
      
      // 🛡️ ADDED: Check if we're approaching timeout
      const elapsed = performance.now() - startTime;
      if (elapsed > 25000) { // 25 seconds max total
        console.warn(`[EDGE FUNCTION] ⚠️ Approaching timeout, stopping at ${processedIngredients.length} ingredients`);
        break;
      }
    }

    const processingTime = performance.now() - startTime
    const totalProducts = processedIngredients.reduce((sum, ing) => sum + ing.products.length, 0)

    console.log(`[EDGE FUNCTION] ✅ Processed recipe ${recipeId} in ${processingTime.toFixed(2)}ms with ${totalProducts} total products`)

    const response: RecipeResponse = {
      id: recipeData.id,
      title: recipeData.title,
      directions: recipeData.directions,
      source: recipeData.source,
      tags: recipeData.tags,
      url: recipeData.url,
      ingredients: processedIngredients,
      processingTime,
      totalProducts
    }

    return new Response(
      JSON.stringify({ success: true, data: response }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('[EDGE FUNCTION] ❌ Error processing recipe:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        processingTime: performance.now() - startTime
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Smart ingredient cleaning function
function cleanIngredientForMatching(rawIngredient: string) {
  if (!rawIngredient) return { original: '', cleaned: '', canonical: '', searchTerms: [] }
  
  const ingredient = rawIngredient.toLowerCase()
  
  // 🛡️ IMPROVED: Check for common compound ingredients first
  const compoundIngredients = [
    'cream of chicken soup', 'cream of mushroom soup', 'cream of celery soup',
    'chicken broth', 'beef broth', 'vegetable broth', 'chicken stock', 'beef stock',
    'tomato paste', 'tomato sauce', 'pasta sauce', 'marinara sauce',
    'olive oil', 'vegetable oil', 'canola oil', 'coconut oil',
    'all purpose flour', 'bread flour', 'cake flour', 'whole wheat flour',
    'brown sugar', 'white sugar', 'powdered sugar', 'granulated sugar',
    'sea salt', 'kosher salt', 'table salt', 'rock salt',
    'black pepper', 'white pepper', 'cayenne pepper', 'red pepper',
    'garlic powder', 'onion powder', 'chili powder', 'cumin powder',
    // 🚀 ADDED: More specific ingredient patterns
    'diced tomatoes', 'crushed tomatoes', 'stewed tomatoes', 'tomato juice',
    'fresh mushrooms', 'sliced mushrooms', 'mushroom pieces', 'mushroom stems',
    'fresh garlic', 'minced garlic', 'garlic cloves', 'garlic paste',
    'fresh onion', 'diced onion', 'sliced onion', 'onion powder',
    'bell pepper', 'green pepper', 'red pepper', 'yellow pepper',
    'cheddar cheese', 'shredded cheese', 'cheese blend', 'cheese sauce',
    'flour tortillas', 'corn tortillas', 'tortilla strips', 'tortilla chips'
  ]
  
  // Check if the ingredient contains any compound ingredients
  for (const compound of compoundIngredients) {
    if (ingredient.includes(compound)) {
      return { 
        original: rawIngredient, 
        cleaned: compound, 
        canonical: compound, 
        searchTerms: [compound, compound.replace(/\s+/g, '')] 
      }
    }
  }
  
  // If no compound ingredient found, use the original cleaning logic
  let cleanedIngredient = ingredient
    .replace(/\d+(\.\d+)?\s*(cups?|tbsp|tsp|oz|lbs?|grams?|ml|liters?)/gi, '') // Remove quantities/measurements
    .replace(/\b(a|an|the|of|for|with|and|or)\b/gi, '') // Remove articles
    .replace(/\((.*?)\)/g, '') // Remove parenthetical content
    .replace(/,.*$/, '') // Remove everything after first comma
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  const coreIngredient = extractCoreIngredient(cleanedIngredient)
  const searchTerms = generateSearchTerms(coreIngredient)
  
  return { 
    original: rawIngredient, 
    cleaned: cleanedIngredient, 
    canonical: coreIngredient, 
    searchTerms: searchTerms 
  }
}

// Extract the core ingredient from cleaned text
function extractCoreIngredient(ingredient: string): string {
  const words = ingredient.split(/\s+/).filter(word => word.length > 2)
  
  // Priority list of common ingredient words (most important first)
  const priorityIngredients = [
    'salmon', 'beef', 'chicken', 'pork', 'lamb', 'turkey', 'fish', 'shrimp', 'crab', 'lobster',
    'tomatoes', 'onions', 'garlic', 'pepper', 'salt', 'flour', 'sugar', 'butter', 'oil', 'eggs',
    'milk', 'cheese', 'cream', 'yogurt', 'bread', 'rice', 'pasta', 'noodles', 'potatoes', 'carrots',
    'lettuce', 'spinach', 'kale', 'basil', 'parsley', 'oregano', 'thyme', 'rosemary', 'cilantro',
    'lemon', 'lime', 'orange', 'apple', 'banana', 'strawberry', 'blueberry', 'raspberry',
    'almonds', 'walnuts', 'pecans', 'cashews', 'peanuts', 'sunflower', 'pumpkin', 'sesame'
  ]
  
  // Find the highest priority word
  for (const priority of priorityIngredients) {
    if (words.includes(priority)) {
      return priority
    }
  }
  
  // If no priority word found, use the last word (often the main ingredient)
  // But avoid words that are clearly not ingredients
  if (words.length > 0) {
    const lastWord = words[words.length - 1]
    const nonIngredientWords = ['removed', 'drained', 'flaked', 'chopped', 'diced', 'minced', 'grated', 'shredded', 'broth', 'juice', 'sauce']
    
    if (!nonIngredientWords.includes(lastWord)) {
      return lastWord
    } else if (words.length > 2) {
      // Try the second-to-last word
      return words[words.length - 2]
    }
  }
  
  return ingredient
}

// Generate search terms for flexible matching
function generateSearchTerms(canonical: string): string[] {
  const terms = [canonical]
  
  // Add singular/plural forms
  if (canonical.endsWith('s')) {
    terms.push(canonical.slice(0, -1)) // Remove 's' for singular
  } else {
    terms.push(canonical + 's') // Add 's' for plural
  }
  
  // Add common synonyms
  const synonyms: { [key: string]: string[] } = {
    'tomatoes': ['tomato', 'roma', 'cherry'],
    'onions': ['onion', 'yellow onion', 'white onion', 'red onion'],
    'garlic': ['garlic clove', 'garlic bulb'],
    'pepper': ['black pepper', 'white pepper', 'peppercorn'],
    'salt': ['sea salt', 'kosher salt', 'table salt'],
    'flour': ['all purpose flour', 'bread flour', 'cake flour'],
    'sugar': ['granulated sugar', 'white sugar', 'brown sugar'],
    'butter': ['unsalted butter', 'salted butter'],
    'oil': ['olive oil', 'vegetable oil', 'canola oil'],
    'eggs': ['egg', 'large egg', 'chicken egg'],
    'milk': ['whole milk', 'skim milk', '2% milk'],
    'cheese': ['cheddar cheese', 'mozzarella cheese', 'parmesan cheese'],
    'bread': ['white bread', 'whole wheat bread', 'sourdough bread'],
    'rice': ['white rice', 'brown rice', 'basmati rice'],
    'pasta': ['spaghetti', 'penne', 'fettuccine'],
    'potatoes': ['potato', 'russet potato', 'red potato'],
    'carrots': ['carrot', 'baby carrot'],
    'lettuce': ['romaine lettuce', 'iceberg lettuce', 'butter lettuce'],
    'spinach': ['baby spinach', 'fresh spinach'],
    'basil': ['fresh basil', 'sweet basil'],
    'parsley': ['fresh parsley', 'italian parsley'],
    'lemon': ['fresh lemon', 'lemon juice'],
    'lime': ['fresh lime', 'lime juice'],
    'apple': ['red apple', 'green apple', 'gala apple'],
    'banana': ['ripe banana', 'yellow banana'],
    'almonds': ['almond', 'sliced almonds', 'almond flour'],
    'walnuts': ['walnut', 'chopped walnuts'],
    'peanuts': ['peanut', 'peanut butter']
  }
  
  if (synonyms[canonical]) {
    terms.push(...synonyms[canonical])
  }
  
  return terms
}

// 🚀 PHASE 5: Main function with feature flag
async function findMatchingProducts(supabase: any, ingredientCanonical: string, options: { userAllergens: string[], limit: number }) {
  if (USE_SEMANTIC_MATCHING) {
    console.log(`[MATCHING] Using SEMANTIC matching for: ${ingredientCanonical}`);
    return findMatchingProductsSemantic(supabase, ingredientCanonical, options);
  } else {
    console.log(`[MATCHING] Using LEGACY text-based matching for: ${ingredientCanonical}`);
    return findMatchingProductsLegacy(supabase, ingredientCanonical, options);
  }
}

// 🚀 PHASE 5: New semantic matching function
async function findMatchingProductsSemantic(supabase: any, ingredientName: string, options: { userAllergens: string[], limit: number }) {
  const { userAllergens, limit } = options;
  
  try {
    // Step 1: Resolve ingredient to semantic entity
    const ingredientPromise = supabase
      .from('ingredients')
      .select('id, canonical_name, category, subcategory, aliases')
      .eq('canonical_name', ingredientName.toLowerCase())
      .limit(1);
    
    const { data: ingredientData, error: ingredientError } = await ingredientPromise;
    
    if (ingredientError || !ingredientData || ingredientData.length === 0) {
      console.log(`[SEMANTIC] No ingredient entity found for: ${ingredientName}, using legacy`);
      return findMatchingProductsLegacy(supabase, ingredientName, options);
    }
    
    const ingredient = ingredientData[0];
    console.log(`[SEMANTIC] ✅ Resolved "${ingredientName}" → ID ${ingredient.id} (${ingredient.category}/${ingredient.subcategory || 'N/A'})`);
    
    // Step 2: Get products via semantic mappings
    const mappingsPromise = supabase
      .from('ingredient_product_mapping')
      .select(`
        product_id,
        confidence_score,
        match_type
      `)
      .eq('ingredient_id', ingredient.id)
      .gte('confidence_score', 0.80)
      .order('confidence_score', { ascending: false })
      .limit(limit);
    
    const { data: mappings, error: mappingsError } = await mappingsPromise;
    
    if (mappingsError || !mappings || mappings.length === 0) {
      console.log(`[SEMANTIC] No mappings found for ${ingredient.canonical_name}, using legacy`);
      return findMatchingProductsLegacy(supabase, ingredientName, options);
    }
    
    // Step 3: Fetch product details
    const productIds = mappings.map(m => m.product_id);
    const productsPromise = supabase
      .from('products')
      .select('id, name, brand_name, allergens, description, is_active')
      .in('id', productIds)
      .eq('is_active', true);
    
    const { data: products, error: productsError } = await productsPromise;
    
    if (productsError || !products) {
      console.error('[SEMANTIC] Error fetching products:', productsError);
      return findMatchingProductsLegacy(supabase, ingredientName, options);
    }
    
    // Step 4: Filter by allergens
    const filteredProducts = filterProductsByAllergens(products, userAllergens);
    
    console.log(`[SEMANTIC] ✅ Found ${filteredProducts.length} products for "${ingredient.canonical_name}" via semantic mapping`);
    return filteredProducts;
    
  } catch (error) {
    console.error('[SEMANTIC] Error in semantic matching:', error);
    return findMatchingProductsLegacy(supabase, ingredientName, options);
  }
}

// 🔄 PHASE 5: Legacy text-based matching (fallback)
async function findMatchingProductsLegacy(supabase: any, ingredientCanonical: string, options: { userAllergens: string[], limit: number }) {
  const { userAllergens, limit } = options
  
  try {
    // Step 1: Try IngredientCanonical table first (if available)
    const canonicalPromise = supabase
      .from('IngredientCanonical')
      .select('matching_products, canonical_ingredient')
      .ilike('canonical_ingredient', `%${ingredientCanonical}%`)
      .limit(1);
    
    const canonicalResult = await canonicalPromise;
    
    if (!canonicalResult.error && canonicalResult.data && canonicalResult.data.length > 0) {
      console.log(`[EDGE FUNCTION] Found canonical mapping for: ${ingredientCanonical}`)
      
      // If we have pre-computed product IDs, fetch them directly
      if (canonicalResult.data[0].matching_products && canonicalResult.data[0].matching_products.length > 0) {
        const productIds = canonicalResult.data[0].matching_products.slice(0, limit)
        
        const productsPromise = supabase
          .from('IngredientCategorized')
          .select('*')
          .in('id', productIds);
        
        const productsResult = await productsPromise;
        
        if (!productsResult.error && productsResult.data) {
          // Filter by allergens if needed
          const filteredProducts = filterProductsByAllergens(productsResult.data, userAllergens)
          console.log(`[EDGE FUNCTION] Found ${filteredProducts.length} products via canonical mapping for ${ingredientCanonical}`)
          return filteredProducts
        }
      }
    }
    
    // Step 2: Fallback to direct search with optimization
    console.log(`[EDGE FUNCTION] Using direct search for: ${ingredientCanonical}`)
    
    // 🛡️ ADDED: Optimized query with better indexing and more precise matching
    const searchPromise = supabase
      .from('IngredientCategorized')
      .select('id, description, "brandName", allergens, "canonicalTag"') // 🛡️ ADDED: Select only needed fields
      .or(`description.ilike.%${ingredientCanonical}%,description.ilike.%${ingredientCanonical} %,description.ilike.% ${ingredientCanonical}%`)
      .limit(limit * 3); // Get more to account for allergen filtering and ranking
    
    const searchResult = await searchPromise;
    
    if (searchResult.error) {
      console.error('[EDGE FUNCTION] Error fetching products:', searchResult.error)
      return []
    }
    
    // Filter by allergens and rank products
    const filteredProducts = filterProductsByAllergens(searchResult.data || [], userAllergens)
    const rankedProducts = rankProducts(filteredProducts, ingredientCanonical)
    
    console.log(`[EDGE FUNCTION] Found ${rankedProducts.length} products for ${ingredientCanonical}`)
    return rankedProducts.slice(0, limit)
    
  } catch (error) {
    console.error('[EDGE FUNCTION] Error in findMatchingProducts:', error)
    return []
  }
}

// Filter products by user allergens
function filterProductsByAllergens(products: any[], userAllergens: string[]): any[] {
  if (!userAllergens || userAllergens.length === 0) {
    return products
  }
  
  return products.filter(product => {
    if (!product.allergens || !Array.isArray(product.allergens)) {
      return true // No allergen info, assume safe
    }
    
    // Check if product contains any of user's allergens
    const hasAllergen = userAllergens.some(allergen => 
      product.allergens.some((productAllergen: string) => 
        productAllergen.toLowerCase().includes(allergen.toLowerCase())
      )
    )
    
    return !hasAllergen
  })
}

// Rank products by relevance
function rankProducts(products: any[], ingredientCanonical: string): any[] {
  return products.sort((a, b) => {
    let scoreA = 0
    let scoreB = 0
    
    const descA = a.description.toLowerCase()
    const descB = b.description.toLowerCase()
    const canonical = ingredientCanonical.toLowerCase()
    
    // 🚀 IMPROVED: Much more precise scoring
    // Exact word match (highest priority)
    const exactMatchA = new RegExp(`\\b${canonical}\\b`).test(descA)
    const exactMatchB = new RegExp(`\\b${canonical}\\b`).test(descB)
    
    if (exactMatchA) scoreA += 50
    if (exactMatchB) scoreB += 50
    
    // Penalty for compound products (pizza, bagels, etc.)
    const compoundPenaltyA = /pizza|bagel|bread|cracker|chip|candy|sauce|dressing|marinade|seasoning/.test(descA) ? -20 : 0
    const compoundPenaltyB = /pizza|bagel|bread|cracker|chip|candy|sauce|dressing|marinade|seasoning/.test(descB) ? -20 : 0
    
    scoreA += compoundPenaltyA
    scoreB += compoundPenaltyB
    
    // Bonus for pure/raw ingredients
    const pureBonusA = /pure|fresh|raw|whole|organic/.test(descA) ? 15 : 0
    const pureBonusB = /pure|fresh|raw|whole|organic/.test(descB) ? 15 : 0
    
    scoreA += pureBonusA
    scoreB += pureBonusB
    
    // Higher score for non-generic brands
    if (a.brandName && a.brandName.toLowerCase() !== 'generic') {
      scoreA += 5
    }
    if (b.brandName && b.brandName.toLowerCase() !== 'generic') {
      scoreB += 5
    }
    
    // Higher score for products with canonical tags
    if (a.canonicalTag && a.canonicalTag.toLowerCase().includes(ingredientCanonical.toLowerCase())) {
      scoreA += 15
    }
    if (b.canonicalTag && b.canonicalTag.toLowerCase().includes(ingredientCanonical.toLowerCase())) {
      scoreB += 15
    }
    
    return scoreB - scoreA // Sort descending
  })
}

// Find substitutes for an ingredient
async function findSubstitutes(supabase: any, ingredientCanonical: string, userAllergens: string[]) {
  try {
    // Look for substitute mappings
    const substitutePromise = supabase
      .from('SubstituteMappings')
      .select('*')
      .ilike('original_product_canonical', `%${ingredientCanonical}%`)
      .limit(3); // 🛡️ ADDED: Reduced limit for performance
    
    const substituteResult = await substitutePromise;
    
    if (substituteResult.error || !substituteResult.data || substituteResult.data.length === 0) {
      return []
    }
    
    // 🛡️ ADDED: Process substitutes in parallel with timeout protection
    const substitutePromises = substituteResult.data.slice(0, 3).map(async (substitute: any) => {
      try {
        const productsPromise = findMatchingProducts(supabase, substitute.substitute_product_canonical, {
          userAllergens,
          limit: 2 // 🛡️ ADDED: Reduced limit for performance
        });
        
        // Add timeout to the products promise using Promise.race
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Substitute product lookup timeout')), 3000)
        );
        
        const products = await Promise.race([productsPromise, timeoutPromise]);
        
        return {
          substituteName: substitute.substitute_product_canonical,
          notes: substitute.cooking_notes || '',
          products: products
        }
      } catch (error) {
        console.error(`[EDGE FUNCTION] Error processing substitute ${substitute.substitute_product_canonical}:`, error);
        return {
          substituteName: substitute.substitute_product_canonical,
          notes: substitute.cooking_notes || '',
          products: []
        }
      }
    });
    
    const substitutes = await Promise.all(substitutePromises);
    return substitutes.filter(sub => sub.products.length > 0)
    
  } catch (error) {
    console.error('[EDGE FUNCTION] Error finding substitutes:', error)
    return []
  }
}

// Check if products contain user's allergens
function checkProductsForAllergens(products: any[], userAllergens: string[]) {
  if (!userAllergens || userAllergens.length === 0) {
    return { hasAllergens: false, notes: [] }
  }
  
  const notes: string[] = []
  let hasAllergens = false
  
  // Check each product for allergens
  for (const product of products) {
    if (product.allergens && Array.isArray(product.allergens)) {
      for (const productAllergen of product.allergens) {
        for (const userAllergen of userAllergens) {
          if (productAllergen.toLowerCase().includes(userAllergen.toLowerCase())) {
            hasAllergens = true
            if (!notes.includes(`Contains ${userAllergen}`)) {
              notes.push(`Contains ${userAllergen}`)
            }
          }
        }
      }
    }
  }
  
  return { hasAllergens, notes }
}

// Check if ingredient name contains allergens (legacy function)
function checkIngredientForAllergens(ingredientName: string, userAllergens: string[]) {
  const ingredient = ingredientName.toLowerCase()
  const notes: string[] = []
  let hasAllergens = false
  
  for (const allergen of userAllergens) {
    if (ingredient.includes(allergen.toLowerCase())) {
      hasAllergens = true
      notes.push(`Contains ${allergen}`)
    }
  }
  
  return { hasAllergens, notes }
}
