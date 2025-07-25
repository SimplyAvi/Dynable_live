// Dynamic allergen list that fetches from database
// Fallback to basic allergens if API is unavailable
import { fetchAllergensFromSupabase, fetchAllergensFromSupabasePure } from './utils/supabaseQueries';

const fallbackAllergenList = {
    // Major Allergens (Big 9 + additional common ones)
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

/**
 * PURE SUPABASE TESTING FUNCTION - No fallback logic
 * Use this for testing the Supabase-first approach
 * This function will throw an error if Supabase fails
 * No fallback to hardcoded allergens
 */
export const fetchAllergensFromDatabasePure = async () => {
    console.log('[Allergens PURE] Fetching from Supabase database (no fallback)...');
    
    const allergens = await fetchAllergensFromSupabasePure();
    console.log(`[Allergens PURE] Successfully loaded ${Object.keys(allergens).length} allergens from Supabase:`, Object.keys(allergens));
    return allergens;
};

// Function to fetch allergens from Supabase database (with fallback)
export const fetchAllergensFromDatabase = async () => {
    try {
        console.log('[Allergens] Fetching from Supabase database...');
        
        const allergens = await fetchAllergensFromSupabase();
        console.log(`[Allergens] Successfully loaded ${Object.keys(allergens).length} allergens from Supabase:`, Object.keys(allergens));
        return allergens;
    } catch (error) {
        console.warn('[Allergens] Failed to fetch allergens from Supabase database, using fallback:', error.message);
        console.error('[Allergens] Full error details:', error);
        throw error; // Re-throw to trigger fallback
    }
};

// Default export for backward compatibility
// This will be replaced by dynamic fetching in components
const allergenList = fallbackAllergenList;

export default allergenList;