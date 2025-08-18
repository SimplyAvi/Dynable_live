// 🎯 UPDATED: Allergen Validation with Single Source of Truth
// This consolidates validation logic and prevents future data inconsistencies

import { 
    ALLERGEN_MAPPINGS, 
    ALLERGEN_CATEGORIES, 
    mapToDatabaseFormat, 
    isValidAllergen,
    VALID_ALLERGENS 
} from './allergenMappings';

/**
 * Validate allergen data before saving to database
 * @param {string[]} allergens - Array of allergens to validate
 * @returns {object} - Validation result with errors and warnings
 */
export function validateAllergenData(allergens) {
    const result = {
        isValid: true,
        errors: [],
        warnings: [],
        standardized: []
    };

    if (!Array.isArray(allergens)) {
        result.isValid = false;
        result.errors.push('Allergens must be an array');
        return result;
    }

    // Validate each allergen
    allergens.forEach((allergen, index) => {
        if (!allergen || typeof allergen !== 'string') {
            result.isValid = false;
            result.errors.push(`Allergen ${index + 1}: Must be a non-empty string`);
            return;
        }

        const trimmed = allergen.trim();
        if (trimmed.length === 0) {
            result.isValid = false;
            result.errors.push(`Allergen ${index + 1}: Cannot be empty`);
            return;
        }

        // Check if allergen is valid
        if (!isValidAllergen(trimmed)) {
            result.warnings.push(`Allergen ${index + 1}: "${trimmed}" is not in our standardized list`);
        }

        // Standardize to database format
        const standardized = mapToDatabaseFormat(trimmed);
        if (standardized && !result.standardized.includes(standardized)) {
            result.standardized.push(standardized);
        }
    });

    // Check for duplicates
    const duplicates = result.standardized.filter((item, index) => 
        result.standardized.indexOf(item) !== index
    );
    
    if (duplicates.length > 0) {
        result.warnings.push(`Duplicate allergens found: ${duplicates.join(', ')}`);
        // Remove duplicates
        result.standardized = [...new Set(result.standardized)];
    }

    return result;
}

/**
 * Validate allergen format consistency
 * @param {string} allergen - Allergen to validate format
 * @returns {object} - Format validation result
 */
export function validateAllergenFormat(allergen) {
    const result = {
        isValid: true,
        errors: [],
        suggestions: []
    };

    if (!allergen || typeof allergen !== 'string') {
        result.isValid = false;
        result.errors.push('Allergen must be a string');
        return result;
    }

    const trimmed = allergen.trim();
    
    // Check for common format issues
    if (trimmed.includes(' ')) {
        result.errors.push('No spaces allowed. Use "treenuts" not "tree nuts"');
        result.suggestions.push('treenuts');
    }

    if (trimmed.includes('_')) {
        result.errors.push('No underscores allowed. Use "treenuts" not "tree_nuts"');
        result.suggestions.push('treenuts');
    }

    if (trimmed.includes('-')) {
        result.errors.push('No hyphens allowed. Use "treenuts" not "tree-nuts"');
        result.suggestions.push('treenuts');
    }

    // Check for proper casing
    if (trimmed !== trimmed.toLowerCase()) {
        result.warnings.push('Allergen should be lowercase. Converting automatically.');
    }

    return result;
}

/**
 * Get allergen safety information
 * @param {string} allergen - Allergen to check
 * @returns {object|null} - Safety information or null if not found
 */
export function getAllergenSafetyInfo(allergen) {
    const dbFormat = mapToDatabaseFormat(allergen);
    return ALLERGEN_CATEGORIES[dbFormat] || null;
}

/**
 * Check for allergen contradictions
 * @param {string[]} allergens - Array of allergens to check
 * @returns {object} - Contradiction analysis
 */
export function checkAllergenContradictions(allergens) {
    const result = {
        hasContradictions: false,
        contradictions: [],
        warnings: []
    };

    const standardized = allergens.map(mapToDatabaseFormat);
    
    // Check for known contradictions
    const contradictions = [
        ['TreeNuts', 'Peanuts'], // Tree nuts and peanuts are different
        ['Wheat', 'Gluten'],     // Wheat contains gluten
        ['Milk', 'Lactose']      // Milk contains lactose
    ];

    contradictions.forEach(([allergen1, allergen2]) => {
        if (standardized.includes(allergen1) && standardized.includes(allergen2)) {
            result.hasContradictions = true;
            result.contradictions.push(`${allergen1} and ${allergen2} may be redundant`);
        }
    });

    return result;
}

/**
 * Validate allergen data for database storage
 * @param {object} data - Data object containing allergens
 * @returns {object} - Validation result
 */
export function validateAllergenDataForStorage(data) {
    const result = {
        isValid: true,
        errors: [],
        warnings: [],
        standardized: {}
    };

    // Validate selectedallergens field
    if (data.selectedallergens) {
        const validation = validateAllergenData(data.selectedallergens);
        if (!validation.isValid) {
            result.isValid = false;
            result.errors.push(...validation.errors);
        }
        if (validation.warnings.length > 0) {
            result.warnings.push(...validation.warnings);
        }
        result.standardized.selectedallergens = validation.standardized;
    }

    // Validate allergens field (for products)
    if (data.allergens) {
        const validation = validateAllergenData(data.allergens);
        if (!validation.isValid) {
            result.isValid = false;
            result.errors.push(...validation.errors);
        }
        if (validation.warnings.length > 0) {
            result.warnings.push(...validation.warnings);
        }
        result.standardized.allergens = validation.standardized;
    }

    return result;
}

/**
 * Get all valid allergen names for UI display
 * @returns {string[]} - Array of valid allergen names in frontend format
 */
export function getValidAllergenNames() {
    return Object.keys(ALLERGEN_MAPPINGS).filter(key => 
        !key.includes(' ') && !key.includes('_') && !key.includes('-')
    );
}

/**
 * Get allergen display name for UI
 * @param {string} allergen - Allergen in any format
 * @returns {string} - Display name for UI
 */
export function getAllergenDisplayName(allergen) {
    const dbFormat = mapToDatabaseFormat(allergen);
    const category = ALLERGEN_CATEGORIES[dbFormat];
    
    if (category) {
        return category.description || dbFormat;
    }
    
    return allergen;
}

// 🎯 EXPORT VALIDATION FUNCTIONS
export {
    isValidAllergen,
    mapToDatabaseFormat,
    VALID_ALLERGENS,
    ALLERGEN_MAPPINGS,
    ALLERGEN_CATEGORIES
}; 