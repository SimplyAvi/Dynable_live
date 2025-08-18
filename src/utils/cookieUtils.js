// 🍪 Cookie utilities for allergen management

/**
 * Save allergen preferences to cookies
 * @param {Object} allergies - Object with allergen keys and boolean values
 */
export function saveAllergensToCookies(allergies) {
    try {
        // Convert allergies object to array of selected allergens
        const selectedAllergens = Object.keys(allergies).filter(key => allergies[key]);
        
        // Save to localStorage as fallback (more reliable than cookies)
        localStorage.setItem('selectedAllergens', JSON.stringify(selectedAllergens));
        
        console.log('[COOKIE UTILS] ✅ Allergens saved to localStorage:', selectedAllergens);
        
        // Also try to save to cookies if possible
        if (typeof document !== 'undefined' && document.cookie !== undefined) {
            const cookieValue = JSON.stringify(selectedAllergens);
            document.cookie = `selectedAllergens=${encodeURIComponent(cookieValue)}; path=/; max-age=31536000`; // 1 year
            console.log('[COOKIE UTILS] ✅ Allergens also saved to cookies');
        }
        
        return true;
    } catch (error) {
        console.error('[COOKIE UTILS] ❌ Error saving allergens to cookies:', error);
        return false;
    }
}

/**
 * Load allergen preferences from cookies/localStorage
 * @returns {Array} Array of selected allergen strings
 */
export function loadAllergensFromCookies() {
    try {
        // Try localStorage first (more reliable)
        const localStorageAllergens = localStorage.getItem('selectedAllergens');
        if (localStorageAllergens) {
            const parsed = JSON.parse(localStorageAllergens);
            console.log('[COOKIE UTILS] ✅ Allergens loaded from localStorage:', parsed);
            return parsed;
        }
        
        // Fallback to cookies
        if (typeof document !== 'undefined' && document.cookie) {
            const cookies = document.cookie.split(';');
            const allergenCookie = cookies.find(cookie => cookie.trim().startsWith('selectedAllergens='));
            
            if (allergenCookie) {
                const cookieValue = allergenCookie.split('=')[1];
                const parsed = JSON.parse(decodeURIComponent(cookieValue));
                console.log('[COOKIE UTILS] ✅ Allergens loaded from cookies:', parsed);
                return parsed;
            }
        }
        
        console.log('[COOKIE UTILS] ℹ️ No saved allergens found');
        return [];
    } catch (error) {
        console.error('[COOKIE UTILS] ❌ Error loading allergens from cookies:', error);
        return [];
    }
}

/**
 * Clear allergen preferences from cookies/localStorage
 */
export function clearAllergensFromCookies() {
    try {
        // Clear from localStorage
        localStorage.removeItem('selectedAllergens');
        
        // Clear from cookies
        if (typeof document !== 'undefined') {
            document.cookie = 'selectedAllergens=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        
        console.log('[COOKIE UTILS] ✅ Allergens cleared from cookies and localStorage');
        return true;
    } catch (error) {
        console.error('[COOKIE UTILS] ❌ Error clearing allergens from cookies:', error);
        return false;
    }
} 