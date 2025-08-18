// 🎯 SINGLE SOURCE OF TRUTH: Allergen Mappings - CAMELCASE UNIFIED
// This consolidates all redundant mapping systems with TRUE full-stack consistency
// 🚨 CRITICAL: Only map actual allergen names, NOT safety phrases

/**
 * Standardized allergen mappings for the entire application
 * 
 * FORMAT STANDARDS (UNIFIED CAMELCASE):
 * - Frontend variables: camelCase (e.g., selectedAllergens)
 * - Database columns: camelCase (e.g., selectedAllergens)
 * - Allergen values: camelCase (e.g., 'milk', 'treeNuts', 'peanuts')
 * - NO CASE CONVERSIONS NEEDED ANYWHERE
 * - 🚨 CRITICAL: Only map actual allergen names, NOT safety phrases
 */

// 🎯 CORE ALLERGEN MAPPINGS (Unified camelCase format)
export const ALLERGEN_MAPPINGS = {
  // Primary allergens (standardized to camelCase)
  'milk': 'milk',
  'eggs': 'eggs',
  'fish': 'fish',
  'shellfish': 'shellfish',
  'treenuts': 'treeNuts',
  'peanuts': 'peanuts',
  'wheat': 'wheat',
  'soy': 'soy',
  'sesame': 'sesame',
  'gluten': 'gluten',
  
  // Alternative spellings and formats (all map to camelCase)
  'treenut': 'treeNuts',
  'tree nuts': 'treeNuts',
  'tree-nuts': 'treeNuts',
  'tree_nuts': 'treeNuts',
  'treenuts': 'treeNuts',
  'treeNuts': 'treeNuts',
  'TreeNuts': 'treeNuts',
  
  // Additional allergens
  'almonds': 'almonds',
  'cashews': 'cashews',
  'crab': 'crab',
  'lobster': 'lobster',
  'shrimp': 'shrimp',
  'celery': 'celery',
  'garlic': 'garlic',
  
  // Common variations (actual allergen names only)
  'nuts': 'treeNuts',
  
  // 🚨 REMOVED: Dangerous safety phrase mappings
  // 'nut free': 'treeNuts',     -- REMOVED: This indicates SAFETY, not allergens
  // 'nut_free': 'treeNuts',     -- REMOVED: This indicates SAFETY, not allergens
  // 'nut-free': 'treeNuts',     -- REMOVED: This indicates SAFETY, not allergens
};

// 🎯 VALIDATION: Allergen categories and severity levels
export const ALLERGEN_CATEGORIES = {
  'milk': { category: 'major', severity: 5, description: 'Milk and dairy products' },
  'eggs': { category: 'major', severity: 5, description: 'Eggs and egg products' },
  'fish': { category: 'major', severity: 5, description: 'Fish and fish products' },
  'shellfish': { category: 'major', severity: 5, description: 'Shellfish and crustaceans' },
  'treeNuts': { category: 'major', severity: 5, description: 'Tree nuts (almonds, walnuts, etc.)' },
  'peanuts': { category: 'major', severity: 5, description: 'Peanuts and peanut products' },
  'wheat': { category: 'major', severity: 4, description: 'Wheat and wheat products' },
  'soy': { category: 'major', severity: 4, description: 'Soy and soy products' },
  'sesame': { category: 'major', severity: 4, description: 'Sesame seeds and products' },
  'gluten': { category: 'major', severity: 4, description: 'Gluten-containing grains' }
};

/**
 * Map allergen from any format to standardized camelCase
 * @param {string} allergen - Allergen in any format
 * @returns {string} - Standardized camelCase allergen
 */
export function mapToCamelCase(allergen) {
  if (!allergen) return null;
  
  const normalized = allergen.toLowerCase().trim();
  return ALLERGEN_MAPPINGS[normalized] || allergen;
}

/**
 * Map array of allergens to camelCase format
 * @param {string[]} allergens - Array of allergens in any format
 * @returns {string[]} - Array of standardized camelCase allergens
 */
export function mapArrayToCamelCase(allergens) {
  console.log(`[ALLERGEN MAPPING] 🗺️ Mapping allergens array:`, allergens);
  
  if (!Array.isArray(allergens)) {
    console.warn(`[ALLERGEN MAPPING] ⚠️ Input is not an array:`, allergens);
    return [];
  }
  
  const mappedAllergens = allergens
    .map(allergen => {
      const mapped = mapToCamelCase(allergen);
      console.log(`[ALLERGEN MAPPING] 🔄 "${allergen}" → "${mapped}"`);
      return mapped;
    })
    .filter(allergen => allergen !== null);
  
  console.log(`[ALLERGEN MAPPING] ✅ Final mapped allergens:`, mappedAllergens);
  return mappedAllergens;
}

/**
 * Validate if allergen is in our standardized list
 * @param {string} allergen - Allergen to validate
 * @returns {boolean} - True if valid allergen
 */
export function isValidAllergen(allergen) {
  if (!allergen) return false;
  
  const normalized = allergen.toLowerCase().trim();
  return ALLERGEN_MAPPINGS.hasOwnProperty(normalized);
}

/**
 * Get all valid allergen names in camelCase format
 * @returns {string[]} - Array of valid allergens in camelCase
 */
export function getValidAllergens() {
  return Object.values(ALLERGEN_MAPPINGS);
}

/**
 * Get allergen category information
 * @param {string} allergen - Allergen in any format
 * @returns {object|null} - Category information or null if not found
 */
export function getAllergenCategory(allergen) {
  const camelCaseAllergen = mapToCamelCase(allergen);
  return ALLERGEN_CATEGORIES[camelCaseAllergen] || null;
}

// 🎯 EXPORT CONSTANTS FOR USE THROUGHOUT APPLICATION
export const VALID_ALLERGENS = getValidAllergens();
export const ALLERGEN_KEYS = Object.keys(ALLERGEN_MAPPINGS);

// 🎯 BACKWARD COMPATIBILITY (for existing code)
// These functions now just pass through since everything is camelCase
export const mapToDatabaseFormat = mapToCamelCase;
export const mapArrayToDatabaseFormat = mapArrayToCamelCase;
export const mapToFrontendFormat = mapToCamelCase;
export const mapArrayToFrontendFormat = mapArrayToCamelCase; 