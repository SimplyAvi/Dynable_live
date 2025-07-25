/**
 * Supabase Direct Queries - Replace localhost API calls
 * Author: Justin Linzan
 * Date: July 2025
 */

import { supabase } from './supabaseClient';

/**
 * PURE SUPABASE TESTING FUNCTION - No fallback logic
 * Use this for testing the Supabase-first approach
 * Replaces: GET http://localhost:5001/api/allergens
 */
export const fetchAllergensFromSupabasePure = async () => {
  console.log('[SUPABASE PURE] Fetching allergens directly from Supabase (no fallback)...');
  
  const { data, error } = await supabase
    .from('AllergenDerivatives')
    .select('allergen')
    .order('allergen');
  
  if (error) {
    console.error('[SUPABASE PURE] Error fetching allergens:', error);
    throw new Error(`Supabase query failed: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    throw new Error('No allergens found in Supabase database');
  }
  
  // Convert to frontend format
  const allergenList = {};
  data.forEach(item => {
    const allergenKey = item.allergen.toLowerCase().replace(/\s+/g, '');
    allergenList[allergenKey] = false;
  });
  
  console.log(`[SUPABASE PURE] Successfully loaded ${Object.keys(allergenList).length} allergens from Supabase`);
  console.log('[SUPABASE PURE] Allergens:', Object.keys(allergenList));
  
  return allergenList;
};

/**
 * Fetch allergens directly from Supabase (with fallback)
 * Replaces: GET http://localhost:5001/api/allergens
 */
export const fetchAllergensFromSupabase = async () => {
  try {
    console.log('[SUPABASE] Fetching allergens directly from database...');
    
    const { data, error } = await supabase
      .from('AllergenDerivatives')
      .select('allergen')
      .order('allergen');
    
    if (error) {
      console.error('[SUPABASE] Error fetching allergens:', error);
      throw error;
    }
    
    // Convert to frontend format
    const allergenList = {};
    data.forEach(item => {
      const allergenKey = item.allergen.toLowerCase().replace(/\s+/g, '');
      allergenList[allergenKey] = false;
    });
    
    console.log(`[SUPABASE] Successfully loaded ${Object.keys(allergenList).length} allergens`);
    return allergenList;
  } catch (error) {
    console.error('[SUPABASE] Failed to fetch allergens:', error);
    throw error;
  }
};

/**
 * Search products directly from Supabase (no fallback)
 * Replaces: GET http://localhost:5001/api/product/search
 */
export const searchProductsFromSupabasePure = async (searchParams) => {
  console.log('[SUPABASE PURE] Searching products directly from Supabase (no fallback)...');
  
  try {
    const { name = '', page = 1, limit = 10, allergens = [] } = searchParams;
    
    // Build the query
    let query = supabase
      .from('IngredientCategorized')
      .select('*')
      .order('description');
    
    // Add search filter if name provided
    if (name && name.trim()) {
      query = query.ilike('description', `%${name.trim()}%`);
    }
    
    // Add allergen filter if provided
    if (allergens && allergens.length > 0) {
      // For now, return all products since allergen filtering is complex
      // TODO: Implement proper allergen filtering logic
      console.log('[SUPABASE PURE] Allergen filtering not yet implemented, returning all products');
    }
    
    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[SUPABASE PURE] Error searching products:', error);
      throw new Error(`Supabase query failed: ${error.message}`);
    }
    
    console.log(`[SUPABASE PURE] Successfully loaded ${data.length} products from Supabase`);
    return data;
    
  } catch (error) {
    console.error('[SUPABASE PURE] Failed to search products from Supabase:', error);
    throw error;
  }
};

/**
 * Search recipes directly from Supabase (no fallback)
 * Replaces: POST http://localhost:5001/api/recipe
 */
export const searchRecipesFromSupabasePure = async (searchParams) => {
  console.log('[SUPABASE PURE] Searching recipes directly from Supabase (no fallback)...');
  
  try {
    const { search = '', page = 1, limit = 10 } = searchParams;
    
    // Build the query - using 'Recipes' (capital R) which exists in the database
    let query = supabase
      .from('Recipes')
      .select('*')
      .order('title'); // We'll check if this column name is correct
    
    // Add search filter if provided
    if (search && search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }
    
    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[SUPABASE PURE] Error searching recipes:', error);
      throw new Error(`Supabase query failed: ${error.message}`);
    }
    
    console.log(`[SUPABASE PURE] Successfully loaded ${data.length} recipes from Supabase`);
    return data;
    
  } catch (error) {
    console.error('[SUPABASE PURE] Failed to search recipes from Supabase:', error);
    throw error;
  }
};

/**
 * Get user profile from Supabase Auth
 * Replaces: GET http://localhost:5001/api/auth/profile
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
 * Replaces: GET http://localhost:5001/api/cart
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
 * Replaces: POST http://localhost:5001/api/cart
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
 * Replaces: GET http://localhost:5001/api/recipe/substitute-products
 */
export const getRecipeSubstitutesFromSupabase = async (canonicalIngredient) => {
  console.log('[SUPABASE] Getting recipe substitutes for:', canonicalIngredient);
  
  try {
    // Query the SubstituteMappings table for substitutes
    const { data, error } = await supabase
      .from('SubstituteMappings')
      .select('*')
      .eq('canonicalIngredient', canonicalIngredient);
    
    if (error) {
      console.error('[SUPABASE] Error fetching substitutes:', error);
      return { substitutes: [] };
    }
    
    // Format the response to match the expected structure
    const substitutes = data.map(item => ({
      substituteName: item.substituteName,
      notes: item.notes,
      products: [] // We'll need to fetch products separately
    }));
    
    console.log(`[SUPABASE] Found ${substitutes.length} substitutes for ${canonicalIngredient}`);
    return { substitutes };
    
  } catch (error) {
    console.error('[SUPABASE] Failed to get recipe substitutes:', error);
    return { substitutes: [] };
  }
};

/**
 * Get products by ingredient from Supabase - SIMPLIFIED VERSION
 * Replaces: POST http://localhost:5001/api/product/by-ingredient
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