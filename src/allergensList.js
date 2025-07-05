// Dynamic allergen list that fetches from database
// Fallback to basic allergens if API is unavailable
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
        const response = await fetch('http://localhost:5001/api/allergens');
        if (response.ok) {
            const allergens = await response.json();
            return allergens;
        }
    } catch (error) {
        console.warn('Failed to fetch allergens from database, using fallback:', error);
    }
    return fallbackAllergenList;
};

// Default export for backward compatibility
// This will be replaced by dynamic fetching in components
const allergenList = fallbackAllergenList;

export default allergenList;