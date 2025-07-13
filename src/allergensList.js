// Dynamic allergen list that fetches from database
// Fallback to basic allergens if API is unavailable
import { buildApiUrl, allergens } from './config/api';

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

// Function to fetch allergens from database
export const fetchAllergensFromDatabase = async () => {
    try {
        const apiUrl = buildApiUrl(allergens);
        console.log(`[Allergens] Fetching from: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        console.log(`[Allergens] API response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const allergens = await response.json();
            console.log(`[Allergens] Successfully loaded ${Object.keys(allergens).length} allergens from database:`, Object.keys(allergens));
            return allergens;
        } else {
            console.warn(`[Allergens] API returned ${response.status}: ${response.statusText}`);
            throw new Error(`API returned ${response.status}`);
        }
    } catch (error) {
        console.warn('[Allergens] Failed to fetch allergens from database, using fallback:', error.message);
        console.error('[Allergens] Full error details:', error);
        throw error; // Re-throw to trigger fallback
    }
};

// Default export for backward compatibility
// This will be replaced by dynamic fetching in components
const allergenList = fallbackAllergenList;

export default allergenList;