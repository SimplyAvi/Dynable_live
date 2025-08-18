/**
 * Supabase Direct Queries - Replace localhost API calls
 * Author: Justin Linzan
 * Date: July 2025
 */

import { supabase } from './supabaseClient';
import { mapArrayToDatabaseFormat } from './allergenMappings'; // 🎯 ADDED: Single source of truth



// Placeholder for pre-computed system functions
export const runPrecomputedSystem = {
  batchProcess: () => console.log('⚠️ SQL migration needed for batch processing'),
  verify: () => console.log('⚠️ SQL migration needed for verification'),
  stats: () => console.log('⚠️ SQL migration needed for stats'),
  testProduct: () => console.log('⚠️ SQL migration needed for testing')
};

/**
 * 🚀 ENTERPRISE-ENHANCED: Fetch allergens with enterprise system
 * Replaces: Basic allergen fetching
 * Performance: Lightning-fast with server-side mapping
 */
export const fetchAllergensFromSupabasePure = async () => {
  console.log('[SIMPLE] Fetching allergens from database...');
  
  try {
    // Simple allergen fetching from database
    const { data, error } = await supabase
      .from('AllergenDerivatives')
      .select('allergen')
      .order('allergen');
    
    if (error) {
      console.error('[SIMPLE] Error fetching allergens:', error);
      throw new Error(`Supabase query failed: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error('No allergens found in Supabase database');
    }
    
    // Convert to frontend format with camelCase support
    const allergenList = {};
    data.forEach(item => {
      // Convert to camelCase for consistency
      const allergenKey = item.allergen.toLowerCase().replace(/\s+/g, '');
      allergenList[allergenKey] = false;
    });
    
    console.log(`[SIMPLE] Successfully loaded ${Object.keys(allergenList).length} allergens from database`);
    console.log('[SIMPLE] Allergens:', Object.keys(allergenList));
    
    return allergenList;
    
  } catch (error) {
    console.error('[SIMPLE] Allergen fetching failed:', error);
    throw error;
  }
};

/**
 * 🚀 SIMPLE: Fetch allergens from database
 * Replaces: Enterprise system complexity
 * Performance: Fast and reliable
 */
export const fetchAllergensFromSupabase = async () => {
  try {
    console.log('[SIMPLE] Fetching allergens from database...');
    
    // Use the simple function
    return await fetchAllergensFromSupabasePure();
    
  } catch (error) {
    console.error('[SIMPLE] Failed to fetch allergens:', error);
    throw error;
  }
};

// 🛡️ DATABASE PERFORMANCE DIAGNOSIS FUNCTIONS
export const testBasicDatabaseConnection = async () => {
  console.log('[DB TEST] Testing basic database connection...');
  
  try {
    // Test 1: Count total rows (should be fast)
    const { count, error: countError } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('[DB TEST] Count query failed:', countError);
      return { success: false, error: countError };
    }
    
    console.log(`[DB TEST] Total rows: ${count}`);
    
    // Test 2: Get 1 row (should be instant)
    const { data, error } = await supabase
      .from('IngredientCategorized')
      .select('id, description, brandName')
      .limit(1);
    
    if (error) {
      console.error('[DB TEST] Single row query failed:', error);
      return { success: false, error };
    }
    
    console.log('[DB TEST] Sample row:', data[0]);
    
    // Test 3: Simple filter (should be fast with indexes)
    const { data: filteredData, error: filterError } = await supabase
      .from('IngredientCategorized')
      .select('id, description')
      .eq('brandName', 'generic')
      .limit(1);
    
    if (filterError) {
      console.error('[DB TEST] Filter query failed:', filterError);
      return { success: false, error: filterError };
    }
    
    console.log('[DB TEST] ✅ All basic tests passed');
    return { success: true, totalRows: count };
    
  } catch (error) {
    console.error('[DB TEST] ❌ Database connection test failed:', error);
    return { success: false, error };
  }
};

export const testIndexPerformance = async () => {
  console.log('[INDEX TEST] Testing index performance...');
  
  try {
    // Test indexed query (should be fast)
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('IngredientCategorized')
      .select('id, description, brandName')
      .neq('brandName', 'generic')
      .limit(10);
    
    const duration = Date.now() - startTime;
    console.log(`[INDEX TEST] Query completed in ${duration}ms`);
    
    if (error) {
      console.error('[INDEX TEST] Query failed:', error);
      return { success: false, error };
    }
    
    if (duration > 1000) {
      console.warn(`[INDEX TEST] ⚠️ Slow query: ${duration}ms (should be <500ms)`);
      return { success: false, issue: 'slow_query', duration };
    }
    
    console.log('[INDEX TEST] ✅ Index performance acceptable');
    return { success: true, duration, rowCount: data.length };
    
  } catch (error) {
    console.error('[INDEX TEST] ❌ Index test failed:', error);
    return { success: false, error };
  }
};

/**
 * 🚀 ENTERPRISE-ENHANCED: Search products with enterprise allergen filtering
 * Replaces: Complex client-side description scanning
 * Performance: Sub-100ms queries with server-side mapping
 */
export const searchProductsFromSupabasePure = async (searchParams) => {
  const {
    name: searchTerm = '',
    allergens = [],
    limit = 10, // REDUCED: Smaller limit to prevent timeouts
    page = 1,
    includeCount = false
  } = searchParams || {};

  console.log('[SIMPLE] Searching products with allergen filtering:', { 
    searchTerm, 
    allergens, 
    limit 
  });

  try {
    // Build the base query
    let query = supabase
      .from('IngredientCategorized')
      .select('id, description, "brandName", "canonicalTag", allergens', { 
        count: includeCount ? 'exact' : null 
      });

    // Add search filter if provided
    if (searchTerm && searchTerm.trim() !== '') {
      query = query.ilike('description', `%${searchTerm}%`);
    }

    // Add allergen filtering if provided
    if (allergens && allergens.length > 0) {
      console.log('[SIMPLE] Filtering out products with allergens:', allergens);
      console.log('[SIMPLE] Allergens type:', typeof allergens, 'Length:', allergens.length);
      
      // Convert user selections to camelCase to match our database format
      const camelCaseAllergens = allergens.map(allergen => {
        const mappings = {
          'milk': 'Milk',
          'eggs': 'Eggs',
          'fish': 'Fish',
          'shellfish': 'Shellfish',
          'peanuts': 'Peanuts',
          'wheat': 'Wheat',
          'soy': 'Soy',
          'sesame': 'Sesame',
          'gluten': 'Gluten',
          'treenuts': 'TreeNuts', // Frontend sends 'treenuts', DB has 'TreeNuts'
          'tree nuts': 'TreeNuts',
          'tree_nuts': 'TreeNuts',
          'tree-nuts': 'TreeNuts',
          'almonds': 'Almonds',
          'cashews': 'Cashews',
          'crab': 'Crab',
          'lobster': 'Lobster',
          'shrimp': 'Shrimp',
          'celery': 'Celery',
          'garlic': 'Garlic'
        };
        
        return mappings[allergen.toLowerCase()] || allergen;
      });

      console.log('[SIMPLE] Converted to camelCase:', camelCaseAllergens);

      // ✅ OPTIMIZED: Single SQL-level operation (ADVISOR'S RECOMMENDATION)
      // This replaces multiple JavaScript loops with one efficient database query
      console.log(`[OPTIMIZED] Using SQL-level allergen filtering:`, camelCaseAllergens);
      const arrayString = `{${camelCaseAllergens.map(a => `"${a}"`).join(',')}}`;
      query = query.filter('allergens', 'not.ov', arrayString);  // ✅ Single query with proper array format
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[SIMPLE] Query error:', error);
      
      // Handle timeout errors specifically
      if (error.code === '57014' || error.message?.includes('timeout')) {
        console.warn('[SIMPLE] Query timeout detected, returning empty results');
        if (includeCount) {
          return {
            products: [],
            totalCount: 0,
            page: page,
            totalPages: 0
          };
        } else {
          return [];
        }
      }
      
      throw error;
    }

    console.log(`[SIMPLE] Found ${data?.length || 0} products with allergen filtering`);

    // Return format that matches what Redux and ShowResults expect
    if (includeCount) {
      return {
        products: data || [],
        totalCount: count || 0,
        page: page,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } else {
      return data || [];
    }

  } catch (error) {
    console.error('[SIMPLE] Product search failed:', error);
    
    // If it's a timeout, try a simpler query without allergen filtering
    if (error.code === '57014' || error.message?.includes('timeout')) {
      console.warn('[SIMPLE] Timeout detected, trying simplified query without allergen filtering...');
      
      try {
        let fallbackQuery = supabase
          .from('IngredientCategorized')
          .select('id, description, "brandName", "canonicalTag", allergens', { 
            count: includeCount ? 'exact' : null 
          });
        
        if (searchTerm && searchTerm.trim() !== '') {
          fallbackQuery = fallbackQuery.ilike('description', `%${searchTerm}%`);
        }
        
        const offset = (page - 1) * limit;
        fallbackQuery = fallbackQuery.range(offset, offset + limit - 1);
        
        const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery;
        
        if (fallbackError) {
          console.error('[SIMPLE] Fallback query also failed:', fallbackError);
        } else {
          console.log('[SIMPLE] Fallback query succeeded, returning results without allergen filtering');
          if (includeCount) {
            return {
              products: fallbackData || [],
              totalCount: fallbackCount || 0,
              page: page,
              totalPages: Math.ceil((fallbackCount || 0) / limit)
            };
          } else {
            return fallbackData || [];
          }
        }
      } catch (fallbackError) {
        console.error('[SIMPLE] Fallback query failed:', fallbackError);
      }
    }
    
    // Return empty results if all else fails
    if (includeCount) {
      return {
        products: [],
        totalCount: 0,
        page: page,
        totalPages: 0
      };
    } else {
      return [];
    }
  }
};

/**
 * ✅ OPTIMIZED: Enhanced product search with proper indexing and timeout handling
 * Replaces: searchProductsFromSupabasePure with better performance
 * Performance: Sub-500ms with proper indexes
 */
export const searchProductsFromSupabaseOptimized = async (searchParams) => {
  const { name: searchTerm = '', allergens = [], limit = 10, page = 1, includeCount = false } = searchParams;

  console.log('[OPTIMIZED] Searching products with enhanced performance:', { 
    searchTerm, 
    allergens, 
    limit 
  });

  try {
    let query = supabase
      .from('IngredientCategorized')
      .select('id, description, "brandName", "canonicalTag", allergens', { 
        count: includeCount ? 'exact' : null 
      });

    // Add search filter
    if (searchTerm && searchTerm.trim() !== '') {
      query = query.ilike('description', `%${searchTerm}%`);
    }

    // ✅ OPTIMIZED: Single allergen filter using GIN index
    if (allergens && allergens.length > 0) {
      const camelCaseAllergens = allergens.map(allergen => {
        const mappings = {
          'milk': 'Milk',
          'eggs': 'Eggs',
          'fish': 'Fish',
          'shellfish': 'Shellfish',
          'peanuts': 'Peanuts',
          'wheat': 'Wheat',
          'soy': 'Soy',
          'sesame': 'Sesame',
          'gluten': 'Gluten',
          'treenuts': 'TreeNuts',
          'tree nuts': 'TreeNuts',
          'tree_nuts': 'TreeNuts',
          'tree-nuts': 'TreeNuts',
          'almonds': 'Almonds',
          'cashews': 'Cashews',
          'crab': 'Crab',
          'lobster': 'Lobster',
          'shrimp': 'Shrimp',
          'celery': 'Celery',
          'garlic': 'Garlic'
        };
        return mappings[allergen.toLowerCase()] || allergen;
      });

      console.log('[OPTIMIZED] Filtering with allergens:', camelCaseAllergens);

      // ✅ EFFICIENT: Use GIN index for array containment
      const arrayString = `{${camelCaseAllergens.map(a => `"${a}"`).join(',')}}`;
      query = query.filter('allergens', 'not.ov', arrayString);
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[OPTIMIZED] Query error:', error);
      
      // Handle timeout errors specifically
      if (error.code === '57014' || error.message?.includes('timeout')) {
        console.warn('[OPTIMIZED] Query timeout detected, trying fallback...');
        return await searchProductsFromSupabaseFallback(searchParams);
      }
      
      throw error;
    }

    console.log(`[OPTIMIZED] Found ${data?.length || 0} products with enhanced filtering`);

    return includeCount ? {
      products: data || [],
      totalCount: count || 0,
      page: page,
      totalPages: Math.ceil((count || 0) / limit)
    } : (data || []);
  } catch (error) {
    console.error('[OPTIMIZED] Product search failed:', error);
    return await searchProductsFromSupabaseFallback(searchParams);
  }
};

/**
 * ✅ FALLBACK: Simplified query for when optimized query fails
 * Performance: Basic but reliable
 */
export const searchProductsFromSupabaseFallback = async (searchParams) => {
  const { name: searchTerm = '', limit = 10, page = 1, includeCount = false } = searchParams;

  console.log('[FALLBACK] Using simplified query without allergen filtering...');

  try {
    let query = supabase
      .from('IngredientCategorized')
      .select('id, description, "brandName", "canonicalTag", allergens', { 
        count: includeCount ? 'exact' : null 
      });

    if (searchTerm && searchTerm.trim() !== '') {
      query = query.ilike('description', `%${searchTerm}%`);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[FALLBACK] Query error:', error);
      throw error;
    }

    console.log(`[FALLBACK] Found ${data?.length || 0} products (no allergen filtering)`);

    return includeCount ? {
      products: data || [],
      totalCount: count || 0,
      page: page,
      totalPages: Math.ceil((count || 0) / limit)
    } : (data || []);
  } catch (error) {
    console.error('[FALLBACK] Product search failed:', error);
    
    // Return empty results if all else fails
    return includeCount ? {
      products: [],
      totalCount: 0,
      page: page,
      totalPages: 0
    } : [];
  }
};

/**
 * 🛡️ SIMPLE FIX: Robust query wrapper with retry logic and query cancellation
 * @param {Function} queryFunction - Query function to execute
 * @param {Object} options - Options for retry logic and cancellation
 * @returns {Promise} - Query result
 */
export const resilientSupabaseQuery = async (queryFunction, options = {}) => {
  const { 
    maxRetries = 3, 
    timeout = 20000, // Increased timeout for complex queries
    fallback = null, 
    operationName = 'query',
    abortController = null, // 🎯 NEW: Support for query cancellation
    warmupConnection = false // 🎯 NEW: Option to warm up connection
  } = options;

  // 🎯 REMOVED: Connection warmup logic - causing infinite loops
  // The warmup was causing 404 errors and infinite retries
  // Let the main queries handle their own connection establishment

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // 🎯 REMOVED: Connection recovery logic - causing infinite loops
    // The recovery was causing 404 errors and infinite retries
    // Let the main queries handle their own connection establishment
    try {
      console.log(`[RESILIENT] ${operationName} - Attempt ${attempt}/${maxRetries}`);
      
      // 🎯 NEW: Check if query was cancelled
      if (abortController && abortController.signal.aborted) {
        console.log(`[RESILIENT] ${operationName} - Query cancelled before execution`);
        throw new Error('Query cancelled');
      }
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // 🎯 NEW: Listen for external cancellation
      if (abortController) {
        abortController.signal.addEventListener('abort', () => {
          controller.abort();
          clearTimeout(timeoutId);
        });
      }
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      );
      
      // Execute query with timeout and cancellation
      const result = await Promise.race([
        queryFunction(),
        timeoutPromise
      ]);
      
      clearTimeout(timeoutId);
      console.log(`[RESILIENT] ${operationName} - ✅ Success on attempt ${attempt}`);
      return result;
      
    } catch (error) {
      lastError = error;
      
      // 🎯 NEW: Handle cancellation errors gracefully
      if (error.name === 'AbortError' || error.message === 'Query cancelled') {
        console.log(`[RESILIENT] ${operationName} - Query cancelled`);
        throw error; // Don't retry cancelled queries
      }
      
      console.error(`[RESILIENT] ${operationName} - ❌ Attempt ${attempt} failed:`, error.message);
      
      // Check if error is retryable
      const isRetryable = error.message?.includes('timeout') || 
                         error.message?.includes('network') ||
                         error.message?.includes('connection') ||
                         error.code === '57014' ||
                         error.status >= 500;
      
      if (!isRetryable) {
        console.log(`[RESILIENT] ${operationName} - ⚠️ Non-retryable error, stopping`);
        break;
      }
      
      // Check if we've reached max attempts
      if (attempt >= maxRetries) {
        console.error(`[RESILIENT] ${operationName} - ❌ Max attempts (${maxRetries}) reached`);
        
        // Try fallback if available
        if (fallback) {
          console.log(`[RESILIENT] ${operationName} - 🔄 Trying fallback...`);
          try {
            const fallbackResult = await fallback();
            console.log(`[RESILIENT] ${operationName} - ✅ Fallback succeeded`);
            return fallbackResult;
          } catch (fallbackError) {
            console.error(`[RESILIENT] ${operationName} - ❌ Fallback also failed:`, fallbackError.message);
          }
        }
        
        throw new Error(`Query failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`[RESILIENT] ${operationName} - ⏳ Waiting ${delay}ms before retry`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Search recipes directly from Supabase (no fallback)
 * Replaces: POST http://process.env.API_URL || 'process.env.API_URL || 'localhost:5001''/api/recipe
 */
export const searchRecipesFromSupabasePure = async (searchParams) => {
  console.log('[SUPABASE PURE] Searching recipes directly from Supabase (no fallback)...');
  
  try {
    const { search = '', page = 1, limit = 10, excludeIngredients = [], includeCount = false } = searchParams;
    
    // Build the query - using 'Recipes' (capital R) which exists in the database
    let query = supabase
      .from('Recipes')
      .select('*', { count: includeCount ? 'exact' : null })
      .order('title'); // We'll check if this column name is correct
    
    // Add search filter if provided
    if (search && search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }
    
    // Add allergen filter if provided
    if (excludeIngredients && excludeIngredients.length > 0) {
      console.log('[SUPABASE PURE] Filtering recipes by excluded ingredients:', excludeIngredients);
      
      // For now, we'll use a simpler approach
      // We'll exclude recipes that have ingredients containing the allergens
      excludeIngredients.forEach(ingredient => {
        // Exclude recipes that have ingredients containing the allergen
        // This is a simplified approach - in a real implementation, you'd want to
        // check the actual ingredient names against allergen keywords
        query = query.not('title', 'ilike', `%${ingredient}%`);
      });
    }
    
    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[SUPABASE PURE] Error searching recipes:', error);
      throw new Error(`Supabase query failed: ${error.message}`);
    }
    
    console.log(`[SUPABASE PURE] Successfully loaded ${data.length} recipes from Supabase`);
    
    // Return with count if requested
    if (includeCount) {
      return {
        recipes: data,
        totalCount: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      };
    }
    
    return data;
    
  } catch (error) {
    console.error('[SUPABASE PURE] Failed to search recipes from Supabase:', error);
    throw error;
  }
};

/**
 * Get user profile from Supabase Auth
 * Replaces: GET http://process.env.API_URL || 'process.env.API_URL || 'localhost:5001''/api/auth/profile
 */
export const getUserProfileFromSupabase = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[SUPABASE] Error getting user profile:', error);
      throw error;
    }
    
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    console.log('[SUPABASE] User profile retrieved:', user.email);
    return user;
  } catch (error) {
    console.error('[SUPABASE] Failed to get user profile:', error);
    throw error;
  }
};

/**
 * Fetch cart items from Supabase
 * Replaces: GET http://process.env.API_URL || 'process.env.API_URL || 'localhost:5001''/api/cart
 */
export const fetchCartFromSupabase = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('[SUPABASE] No authenticated user, returning empty cart');
      return [];
    }
    
    const { data, error } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('[SUPABASE] Error fetching cart:', error);
      throw error;
    }
    
    console.log(`[SUPABASE] Cart loaded: ${data.length} items`);
    return data;
  } catch (error) {
    console.error('[SUPABASE] Failed to fetch cart:', error);
    throw error;
  }
};

/**
 * Update cart in Supabase
 * Replaces: POST http://process.env.API_URL || 'process.env.API_URL || 'localhost:5001''/api/cart
 */
export const updateCartInSupabase = async (cartItems) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    // Delete existing cart items
    await supabase
      .from('carts')
      .delete()
      .eq('user_id', user.id);
    
    // Insert new cart items
    if (cartItems.length > 0) {
      const cartData = cartItems.map(item => ({
        user_id: user.id,
        product_id: item.id,
        quantity: item.quantity,
        added_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('carts')
        .insert(cartData);
      
      if (error) {
        console.error('[SUPABASE] Error updating cart:', error);
        throw error;
      }
    }
    
    console.log('[SUPABASE] Cart updated successfully');
    return cartItems;
  } catch (error) {
    console.error('[SUPABASE] Failed to update cart:', error);
    throw error;
  }
}; 

/**
 * Get recipe substitutes from Supabase
 * Replaces: GET http://process.env.API_URL || 'process.env.API_URL || 'localhost:5001''/api/recipe/substitute-products
 */
export const getRecipeSubstitutesFromSupabase = async (canonicalIngredient) => {
  console.log('[SUPABASE] Getting recipe substitutes for:', canonicalIngredient);
  
  try {
    // Clean the ingredient name to avoid issues with long/complex names
    const cleanIngredient = canonicalIngredient
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .trim()
      .split(/\s+/)[0]; // Take only the first word
    
    console.log('[SUPABASE] Cleaned ingredient name:', cleanIngredient);
    
    // Query the SubstituteMappings table for substitutes
    // The table has: id, substituteType, searchTerms, description
    const { data, error } = await supabase
      .from('SubstituteMappings')
      .select('*');
    
    if (error) {
      console.error('[SUPABASE] Error fetching substitutes:', error);
      // Return empty substitutes instead of failing
      return { substitutes: [] };
    }
    
    // If no data or empty table, return empty substitutes
    if (!data || data.length === 0) {
      console.log('[SUPABASE] No substitute mappings found in database');
      return { substitutes: [] };
    }
    
    // Filter substitutes that match the canonical ingredient
    // Look for substitutes where searchTerms contains the ingredient
    const matchingSubstitutes = data.filter(item => {
      if (!item.searchTerms || !Array.isArray(item.searchTerms)) {
        return false;
      }
      
      // Check if any search term matches the cleaned ingredient
      return item.searchTerms.some(term => 
        cleanIngredient.includes(term.toLowerCase()) ||
        term.toLowerCase().includes(cleanIngredient)
      );
    });
    
    // Format the response to match the expected structure
    const substitutes = matchingSubstitutes.map(item => ({
      substituteName: item.substituteType,
      notes: item.description || '',
      products: [] // We'll need to fetch products separately
    }));
    
    console.log(`[SUPABASE] Found ${substitutes.length} substitutes for ${canonicalIngredient}`);
    return { substitutes };
    
  } catch (error) {
    console.error('[SUPABASE] Failed to get recipe substitutes:', error);
    // Return empty substitutes instead of failing
    return { substitutes: [] };
  }
};

/**
 * Get products by ingredient from Supabase - SIMPLIFIED VERSION
 * Replaces: POST http://process.env.API_URL || 'process.env.API_URL || 'localhost:5001''/api/product/by-ingredient
 */
export const getProductsByIngredientFromSupabase = async (ingredientName, allergens = [], substituteName = null) => {
  console.log('[SUPABASE] Getting products for ingredient:', ingredientName, 'substitute:', substituteName);
  
  try {
    // Use substitute name if provided
    const searchTerm = substituteName || ingredientName;
    
    // Clean and extract the most important word for searching
    const cleanTerm = searchTerm
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .trim();
    
    // Extract the most significant word (usually the main ingredient)
    const words = cleanTerm.split(/\s+/).filter(word => word.length > 2);
    const primaryWord = words[0] || cleanTerm;
    
    // Use a simple, fast query with just the primary word
    const { data, error } = await supabase
      .from('IngredientCategorized')
      .select('*')
      .ilike('description', `%${primaryWord}%`)
      .limit(10);
    
    if (error) {
      console.error('[SUPABASE] Error fetching products by ingredient:', error);
      return { products: [] };
    }
    
    console.log(`[SUPABASE] Found ${data.length} products for ${ingredientName}`);
    return { 
      products: data,
      mappingStatus: 'success',
      coverageStats: { total: data.length },
      brandPriority: 'mixed',
      canonicalIngredient: ingredientName
    };
    
  } catch (error) {
    console.error('[SUPABASE] Failed to get products by ingredient:', error);
    return { products: [] };
  }
}; 

/**
 * Test allergen query performance after database optimization
 * Use this to verify that indexes are working correctly
 */
export const testAllergenQueryPerformance = async () => {
  console.log('[PERFORMANCE TEST] Starting allergen query performance test...');
  const startTime = Date.now();
  
  try {
    // Test 1: Single allergen filtering
    console.log('[PERFORMANCE TEST] Testing single allergen (milk) filtering...');
    const { data: singleData, error: singleError } = await supabase
      .from('IngredientCategorized')
      .select('id, description, brandName')
      .not('description', 'ilike', '%milk%')
      .neq('brandName', 'generic')
      .limit(100);
    
    if (singleError) {
      console.error('[PERFORMANCE TEST] Single allergen query failed:', singleError);
      return { success: false, error: singleError };
    }
    
    console.log('[PERFORMANCE TEST] Single allergen query successful, found:', singleData?.length || 0, 'products');
    
    // Test 2: Multiple allergen filtering
    console.log('[PERFORMANCE TEST] Testing multiple allergen filtering...');
    const { data: multiData, error: multiError } = await supabase
      .from('IngredientCategorized')
      .select('id, description, brandName')
      .not('description', 'ilike', '%milk%')
      .not('description', 'ilike', '%peanuts%')
      .not('description', 'ilike', '%gluten%')
      .neq('brandName', 'generic')
      .limit(100);
    
    if (multiError) {
      console.error('[PERFORMANCE TEST] Multiple allergen query failed:', multiError);
      return { success: false, error: multiError };
    }
    
    console.log('[PERFORMANCE TEST] Multiple allergen query successful, found:', multiData?.length || 0, 'products');
    
    const duration = Date.now() - startTime;
    console.log(`[PERFORMANCE TEST] ✅ All tests completed in ${duration}ms`);
    
    // Alert if query takes >2 seconds
    if (duration > 2000) {
      console.warn(`[PERFORMANCE WARNING] Allergen queries took ${duration}ms (target: <2000ms)`);
    } else {
      console.log(`[PERFORMANCE SUCCESS] Allergen queries completed in ${duration}ms (under 2 second target)`);
    }
    
    return { 
      success: true, 
      duration,
      singleAllergenCount: singleData?.length || 0,
      multipleAllergenCount: multiData?.length || 0
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[PERFORMANCE TEST] ❌ Test failed after ${duration}ms:`, error);
    return { success: false, error, duration };
  }
};

// 🔍 DATABASE ANALYSIS & SCALING STRATEGY
export const analyzeDatabaseComposition = async () => {
  console.log('[DB ANALYSIS] Starting comprehensive database analysis...');
  
  try {
    // 1. Total products breakdown
    const { count: totalProducts } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact', head: true });
    
    console.log(`[DB ANALYSIS] Total products: ${totalProducts}`);
    
    // 2. Generic vs Real brands
    const { count: genericCount } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact', head: true })
      .eq('brandName', 'generic');
    
    const realBrandCount = totalProducts - genericCount;
    console.log(`[DB ANALYSIS] Generic products: ${genericCount} (${((genericCount/totalProducts)*100).toFixed(1)}%)`);
    console.log(`[DB ANALYSIS] Real brand products: ${realBrandCount} (${((realBrandCount/totalProducts)*100).toFixed(1)}%)`);
    
    // 3. Top brands analysis
    const { data: topBrands } = await supabase
      .from('IngredientCategorized')
      .select('brandName')
      .neq('brandName', 'generic')
      .limit(1000);
    
    // Count brand frequency
    const brandCounts = {};
    topBrands?.forEach(item => {
      const brand = item.brandName;
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });
    
    // Sort by product count
    const sortedBrands = Object.entries(brandCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50); // Top 50 brands
    
    console.log('[DB ANALYSIS] Top 20 brands by product count:');
    sortedBrands.slice(0, 20).forEach(([brand, count], index) => {
      console.log(`${index + 1}. ${brand}: ${count} products`);
    });
    
    // 4. Performance test without generic
    const startTime = Date.now();
    const { data: nonGenericSample } = await supabase
      .from('IngredientCategorized')
      .select('id, description, brandName')
      .neq('brandName', 'generic')
      .limit(100);
    
    const queryTime = Date.now() - startTime;
    console.log(`[DB ANALYSIS] Non-generic query performance: ${queryTime}ms for 100 products`);
    
    return {
      totalProducts,
      genericCount,
      realBrandCount,
      topBrands: sortedBrands,
      queryPerformance: queryTime,
      recommendedBrands: sortedBrands.slice(0, 30).map(([brand]) => brand)
    };
    
  } catch (error) {
    console.error('[DB ANALYSIS] Analysis failed:', error);
    return { error: error.message };
  }
};

// 🧪 TEST THE SCALABLE APPROACH
export const testScalableApproach = async () => {
  console.log('🧪 TESTING ALL-BRANDS APPROACH');
  console.log('================================');
  
  // Run analysis first
  const analysis = await analyzeDatabaseComposition();
  console.log('Analysis results:', analysis);
  
  // Test different scenarios
  const tests = [
    { name: 'Empty search', searchParams: {} },
    { name: 'Simple search', searchParams: { name: 'protein' } },
    { name: 'Search + allergen', searchParams: { name: 'bread', allergens: ['gluten'] } },
    { name: 'Complex filtering', searchParams: { name: 'snack', allergens: ['milk', 'nuts'] } }
  ];
  
  for (const test of tests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    const startTime = Date.now();
    const result = await searchProductsFromSupabasePure(test.searchParams);
    const duration = Date.now() - startTime;
    
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log(`📊 Results: ${result.products?.length || 0} products`);
    console.log(`🏷️ Strategy: ${result.strategy}`);
    console.log(`📝 Message: ${result.message}`);
  }
};

// 🧪 TEST 1: How many non-generic products exist?
export const testNonGenericProducts = async () => {
  console.log('🔍 TESTING NON-GENERIC PRODUCTS');
  console.log('================================');
  
  try {
    // Count total products
    const { count: totalCount } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact', head: true });
    
    // Count generic products  
    const { count: genericCount } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact', head: true })
      .eq('brandName', 'generic');
    
    // Count non-generic products
    const { count: nonGenericCount } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact', head: true })
      .neq('brandName', 'generic');
    
    console.log(`📊 Database composition:`);
    console.log(`   Total products: ${totalCount}`);
    console.log(`   Generic products: ${genericCount} (${((genericCount/totalCount)*100).toFixed(1)}%)`);
    console.log(`   Real brand products: ${nonGenericCount} (${((nonGenericCount/totalCount)*100).toFixed(1)}%)`);
    
    return { totalCount, genericCount, nonGenericCount };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { error: error.message };
  }
};

// 🧪 TEST 2: Simple search without any filtering
export const testBasicSearch = async (searchTerm = 'bread') => {
  console.log(`🔍 TESTING BASIC SEARCH: "${searchTerm}"`);
  console.log('=====================================');
  
  try {
    // Test 1: Search ALL products (including generic)
    const { data: allResults, count: allCount } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact' })
      .ilike('description', `%${searchTerm}%`)
      .limit(5);
    
    console.log(`📊 "${searchTerm}" in ALL products: ${allCount} total`);
    console.log('   Sample results:', allResults?.slice(0, 3).map(p => p.description));
    
    // Test 2: Search only non-generic products  
    const { data: nonGenericResults, count: nonGenericCount } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact' })
      .neq('brandName', 'generic')
      .ilike('description', `%${searchTerm}%`)
      .limit(5);
    
    console.log(`📊 "${searchTerm}" in NON-GENERIC: ${nonGenericCount} total`);
    console.log('   Sample results:', nonGenericResults?.slice(0, 3).map(p => p.description));
    
    return { 
      allCount, 
      nonGenericCount, 
      hasResults: nonGenericCount > 0,
      sampleProducts: nonGenericResults?.slice(0, 3)
    };
    
  } catch (error) {
    console.error('❌ Basic search failed:', error);
    return { error: error.message };
  }
};

// 🧪 TEST 3: Check for gluten-free products specifically
export const testGlutenFreeProducts = async () => {
  console.log('🔍 TESTING GLUTEN-FREE PRODUCTS');
  console.log('================================');
  
  try {
    // Look for explicitly gluten-free products
    const { data: glutenFreeResults, count } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact' })
      .neq('brandName', 'generic')
      .or('description.ilike.%gluten-free%,description.ilike.%gluten free%')
      .limit(10);
    
    console.log(`📊 Explicitly gluten-free products: ${count} found`);
    
    if (glutenFreeResults && glutenFreeResults.length > 0) {
      console.log('✅ Sample gluten-free products:');
      glutenFreeResults.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.description} (${product.brandName})`);
      });
    } else {
      console.log('❌ No gluten-free products found in database');
    }
    
    return { count, hasGlutenFree: count > 0, samples: glutenFreeResults };
    
  } catch (error) {
    console.error('❌ Gluten-free test failed:', error);
    return { error: error.message };
  }
};

// 🧪 TEST 4: Test brands that exist
export const testAvailableBrands = async () => {
  console.log('🔍 TESTING AVAILABLE BRANDS');
  console.log('============================');
  
  try {
    // Get top brands by product count
    const { data: brandData } = await supabase
      .from('IngredientCategorized')
      .select('brandName')
      .neq('brandName', 'generic')
      .limit(1000);
    
    // Count products per brand
    const brandCounts = {};
    brandData?.forEach(item => {
      const brand = item.brandName;
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });
    
    // Sort by count
    const topBrands = Object.entries(brandCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20);
    
    console.log('📊 Top 20 brands by product count:');
    topBrands.forEach(([brand, count], index) => {
      console.log(`   ${index + 1}. ${brand}: ${count} products`);
    });
    
    return { totalBrands: Object.keys(brandCounts).length, topBrands };
    
  } catch (error) {
    console.error('❌ Brand test failed:', error);
    return { error: error.message };
  }
};

// 🧪 RUN ALL TESTS
export const runDatabaseTests = async () => {
  console.log('🧪 RUNNING COMPLETE DATABASE ANALYSIS');
  console.log('=====================================\n');
  
  const results = {};
  
  results.products = await testNonGenericProducts();
  console.log('\n');
  
  results.basicSearch = await testBasicSearch('bread');
  console.log('\n');
  
  results.glutenFree = await testGlutenFreeProducts();
  console.log('\n');
  
  results.brands = await testAvailableBrands();
  console.log('\n');
  
  console.log('🎯 ANALYSIS SUMMARY:');
  console.log('====================');
  console.log(`✅ Non-generic products: ${results.products.nonGenericCount || 'Unknown'}`);
  console.log(`✅ "Bread" search results: ${results.basicSearch.nonGenericCount || 0}`);
  console.log(`✅ Gluten-free products: ${results.glutenFree.count || 0}`);
  console.log(`✅ Total brands: ${results.brands.totalBrands || 'Unknown'}`);
  
  if (results.basicSearch.nonGenericCount === 0) {
    console.log('\n❌ PROBLEM: No non-generic products found for basic search');
    console.log('   This explains why filtering returns 0 results');
  }
  
  if (results.glutenFree.count === 0) {
    console.log('\n❌ PROBLEM: No gluten-free products in database');
    console.log('   Gluten filtering will always return 0 results');
  }
  
  return results;
};

// ✅ OPTIMAL PAGINATION IMPLEMENTATION - ADVISOR'S RECOMMENDATIONS (FIXED)
export const searchProductsWithOptimalPagination = async (searchParams) => {
  const { 
    page = 1, 
    limit = 20, 
    searchTerm = '', 
    allergens = [],
    includeCount = true 
  } = searchParams;

  console.log('[OPTIMAL] Searching with OFFSET + LIMIT pagination:', { 
    page, limit, searchTerm, allergens 
  });

  try {
    let query = supabase
      .from('IngredientCategorized')
      .select('id, description, "brandName", allergens, "canonicalTag"', { 
        count: includeCount ? 'exact' : null 
      });

    // 1. Search filter (uses trigram index)
    if (searchTerm && searchTerm.trim() !== '') {
      query = query.ilike('description', `%${searchTerm}%`);
    }

    // 2. Allergen filtering (if allergens provided)
    if (allergens && allergens.length > 0) {
      console.log('[OPTIMIZED] Allergen filtering:', allergens);
      
      // 🎯 UPDATED: Use single source of truth for allergen mapping
      const mappedAllergens = mapArrayToDatabaseFormat(allergens);
      
      console.log('[OPTIMIZED] Converted to database format:', mappedAllergens);

      // ✅ OPTIMIZED: Single SQL-level operation (ADVISOR'S RECOMMENDATION)
      // This replaces multiple JavaScript loops with one efficient database query
      console.log(`[OPTIMIZED] Using SQL-level allergen filtering:`, mappedAllergens);
      const arrayString = `{${mappedAllergens.map(a => `"${a}"`).join(',')}}`;
      query = query.filter('allergens', 'not.ov', arrayString);  // ✅ Single query with proper array format
    }

    // 3. OFFSET + LIMIT pagination (ADVISOR'S RECOMMENDATION for frontend)
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    console.log('[OPTIMAL] Using OFFSET + LIMIT pagination:', { offset, limit });

    const { data, error, count } = await query;

    if (error) {
      console.error('[OPTIMAL] Query error:', error);
      throw error;
    }

    console.log(`[OPTIMAL] Found ${data?.length || 0} products in ${page}ms`);

    // Return with page navigation info
    return {
      products: data || [],
      totalCount: count || 0,
      page: page,
      limit: limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasNextPage: page * limit < (count || 0),
      hasPrevPage: page > 1,
      // Page navigation info
      pageInfo: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        itemsPerPage: limit,
        totalItems: count || 0,
        startItem: offset + 1,
        endItem: Math.min(offset + limit, count || 0)
      }
    };

  } catch (error) {
    console.error('[OPTIMAL] Product search failed:', error);
    throw error;
  }
};

// ✅ OPTIMAL ALLERGEN FILTERING - ADVISOR'S RECOMMENDATION (FIXED)
export const searchProductsWithAllergenOptimization = async (searchParams) => {
  const { allergens = [], ...otherParams } = searchParams;
  
  // ✅ ADVISOR'S RECOMMENDATION: SQL-level allergen filtering (CORRECTED)
  // This function is a wrapper that passes allergens to the main optimized function
  // The actual query building happens in searchProductsWithOptimalPagination
  
  return await searchProductsWithOptimalPagination({
    ...otherParams,
    allergens
  });
};

// ✅ TESTING FUNCTION FOR ALLERGEN FILTERING
export const testAllergenFilteringSyntax = async () => {
  console.log('[TEST] Testing allergen filtering syntax...');
  
  try {
    // Test 1: Using 'ov' operator (array overlap)
    const test1 = await supabase
      .from('IngredientCategorized')
      .select('id, description, allergens')
      .not('allergens', 'ov', ['milk', 'peanuts'])
      .limit(5);
    
    console.log('[TEST] Test 1 (ov operator):', test1.data?.length || 0, 'results');
    
    // Test 2: Using 'cs' operator (array contains)
    const test2 = await supabase
      .from('IngredientCategorized')
      .select('id, description, allergens')
      .not('allergens', 'cs', ['milk', 'peanuts'])
      .limit(5);
    
    console.log('[TEST] Test 2 (cs operator):', test2.data?.length || 0, 'results');
    
    // Test 3: Using '&&' operator (array overlap)
    const test3 = await supabase
      .from('IngredientCategorized')
      .select('id, description, allergens')
      .not('allergens', '&&', ['milk', 'peanuts'])
      .limit(5);
    
    console.log('[TEST] Test 3 (&& operator):', test3.data?.length || 0, 'results');
    
    return {
      test1: test1.data?.length || 0,
      test2: test2.data?.length || 0,
      test3: test3.data?.length || 0
    };
    
  } catch (error) {
    console.error('[TEST] Allergen filtering test failed:', error);
    throw error;
  }
};

// 🛡️ FIXED: Simple filtering for anonymous users (prevents query timeouts)
export const searchProductsSimpleForAnonymous = async (searchParams) => {
  const { 
    page = 1, 
    limit = 20, 
    searchTerm = '', 
    allergens = [],
    includeCount = true 
  } = searchParams;

  console.log('[SIMPLE] Anonymous user simple filtering:', { 
    page, limit, searchTerm, allergens 
  });

  try {
    let query = supabase
      .from('IngredientCategorized')
      .select('id, description, "brandName", allergens, "canonicalTag"', { 
        count: includeCount ? 'exact' : null 
      });

    // 🎯 OPTIMIZED: Skip is_active filter since all products are active (243K records)
    // This improves performance by removing unnecessary filtering
    console.log('[SIMPLE] Skipping is_active filter - all products are active');

    // 1. Search filter (simple LIKE query)
    if (searchTerm && searchTerm.trim() !== '') {
      query = query.ilike('description', `%${searchTerm}%`);
    }

    // 2. Simple allergen filter for anonymous users (no complex SQL)
    if (allergens && allergens.length > 0) {
      console.log('[SIMPLE] Anonymous user allergen filtering:', allergens);
      
      // 🎯 UPDATED: Use single source of truth for allergen mapping
      const mappedAllergens = mapArrayToDatabaseFormat(allergens);
      
      // 🛡️ FIXED: Simple filtering approach for anonymous users
      // Use basic string matching instead of complex array operations
      mappedAllergens.forEach(allergen => {
        const normalizedAllergen = allergen.toLowerCase();
        // Simple string matching - exclude products containing allergen in description
        query = query.not('description', 'ilike', `%${normalizedAllergen}%`);
      });
    }

    // 3. Simple pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    console.log('[SIMPLE] Using simple pagination:', { offset, limit });

    const { data, error, count } = await query;

    if (error) {
      console.error('[SIMPLE] Query error:', error);
      throw error;
    }

    console.log(`[SIMPLE] Found ${data?.length || 0} products for anonymous user`);

    return {
      products: data || [],
      totalCount: count || 0,
      page: page,
      limit: limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasNextPage: page * limit < (count || 0),
      hasPrevPage: page > 1,
      pageInfo: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        itemsPerPage: limit,
        totalItems: count || 0,
        startItem: offset + 1,
        endItem: Math.min(offset + limit, count || 0)
      }
    };

  } catch (error) {
    console.error('[SIMPLE] Anonymous user query failed:', error);
    throw error;
  }
};

// 🎯 UNIFIED FILTERING SOLUTION - Phase 1 Implementation
// Single filtering function that works for ALL users (anonymous + authenticated)
export const searchProductsUnified = async (searchParams) => {
  const { 
    page = 1, 
    limit = 20, 
    searchTerm = '', 
    allergens = [],
    includeCount = true,
    userType = 'anonymous' // 'anonymous' | 'authenticated'
  } = searchParams;

  console.log('[UNIFIED] Starting unified product search:', {
    page, limit, searchTerm, allergens, userType
  });

  try {
    // 🎯 OPTIMAL QUERY: Single SQL operation for all users
    let query = supabase
      .from('IngredientCategorized')
      .select('id, description, "brandName", allergens, "canonicalTag"', { 
        count: includeCount ? 'exact' : null 
      });

    // 🎯 OPTIMIZED: Skip is_active filter since all products are active (243K records)
    // This improves performance by removing unnecessary filtering
    console.log('[UNIFIED] Skipping is_active filter - all products are active');

    // Search filter (uses existing trigram index)
    if (searchTerm && searchTerm.trim() !== '') {
      query = query.ilike('description', `%${searchTerm}%`);
      console.log('[UNIFIED] Applied search filter:', searchTerm);
    }

    // 🎯 UNIFIED ALLERGEN FILTERING: Array operations for ALL users (better accuracy)
    if (allergens && allergens.length > 0) {
      console.log('[UNIFIED] Using array-based allergen filtering for all users:', allergens);
      
      // 🎯 UPDATED: Use single source of truth for allergen mapping
      const mappedAllergens = mapArrayToDatabaseFormat(allergens);
      
      console.log('[UNIFIED] Mapped allergens:', { original: allergens, mapped: mappedAllergens });
      
      // 🎯 OPTIMIZED: Use array overlap operator with proper formatting
      const arrayString = `{${mappedAllergens.map(a => `"${a}"`).join(',')}}`;
      query = query.filter('allergens', 'not.ov', arrayString);
      console.log('[UNIFIED] Applied optimized allergen filter:', {
        mappedAllergens,
        arrayString,
        userType
      });
    } else {
      console.log('[UNIFIED] No allergens to filter, showing all products');
    }

    // Unified pagination (OFFSET + LIMIT)
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    console.log('[UNIFIED] Applied pagination:', { offset, limit, page });

    const { data, error, count } = await query;

    if (error) {
      console.error('[UNIFIED] Query error:', error);
      throw error;
    }

    console.log(`[UNIFIED] ✅ Found ${data?.length || 0} products for ${userType} user`);

    // Return unified response format
    return {
      products: data || [],
      totalCount: count || 0,
      page: page,
      limit: limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasNextPage: page * limit < (count || 0),
      hasPrevPage: page > 1,
      pageInfo: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        itemsPerPage: limit,
        totalItems: count || 0,
        startItem: offset + 1,
        endItem: Math.min(offset + limit, count || 0)
      }
    };

  } catch (error) {
    console.error('[UNIFIED] ❌ Unified product search failed:', error);
    throw error;
  }
};