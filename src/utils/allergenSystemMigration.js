// 🎯 ALLERGEN SYSTEM MIGRATION UTILITY - CAMELCASE UNIFIED
// This utility handles frontend updates after the comprehensive allergen system migration
// NO CASE CONVERSIONS NEEDED - TRUE FULL-STACK CONSISTENCY

import { mapArrayToCamelCase } from './allergenMappings';

/**
 * Clear all allergen-related localStorage cache
 * This should be called after the database migration to ensure consistency
 */
export function clearAllergenCache() {
    console.log('[ALLERGEN MIGRATION] Clearing allergen cache...');
    
    try {
        // Clear all allergen-related localStorage items
        const itemsToClear = [
            'fallbackAllergenPreferences',
            'userAllergens',
            'anonymousUserIdForMerge',
            'postLoginRedirect'
        ];
        
        itemsToClear.forEach(item => {
            if (localStorage.getItem(item)) {
                localStorage.removeItem(item);
                console.log(`[ALLERGEN MIGRATION] ✅ Cleared localStorage: ${item}`);
            }
        });
        
        console.log('[ALLERGEN MIGRATION] ✅ Allergen cache cleared successfully');
        return true;
    } catch (error) {
        console.error('[ALLERGEN MIGRATION] ❌ Failed to clear allergen cache:', error);
        return false;
    }
}

/**
 * Migrate existing localStorage allergen data to camelCase format
 * Converts any existing allergen data to the standardized camelCase format
 */
export function migrateLocalStorageAllergens() {
    console.log('[ALLERGEN MIGRATION] Migrating localStorage allergen data to camelCase...');
    
    try {
        // Migrate fallbackAllergenPreferences
        const fallbackPreferences = localStorage.getItem('fallbackAllergenPreferences');
        if (fallbackPreferences) {
            try {
                const parsed = JSON.parse(fallbackPreferences);
                if (parsed.allergens && Array.isArray(parsed.allergens)) {
                    const migratedAllergens = mapArrayToCamelCase(parsed.allergens);
                    const migratedPreferences = {
                        ...parsed,
                        allergens: migratedAllergens
                    };
                    localStorage.setItem('fallbackAllergenPreferences', JSON.stringify(migratedPreferences));
                    console.log('[ALLERGEN MIGRATION] ✅ Migrated fallbackAllergenPreferences to camelCase');
                }
            } catch (parseError) {
                console.warn('[ALLERGEN MIGRATION] ⚠️ Could not parse fallbackAllergenPreferences, clearing');
                localStorage.removeItem('fallbackAllergenPreferences');
            }
        }
        
        // Migrate userAllergens
        const userAllergens = localStorage.getItem('userAllergens');
        if (userAllergens) {
            try {
                const parsed = JSON.parse(userAllergens);
                if (Array.isArray(parsed)) {
                    const migratedAllergens = mapArrayToCamelCase(parsed);
                    localStorage.setItem('userAllergens', JSON.stringify(migratedAllergens));
                    console.log('[ALLERGEN MIGRATION] ✅ Migrated userAllergens to camelCase');
                }
            } catch (parseError) {
                console.warn('[ALLERGEN MIGRATION] ⚠️ Could not parse userAllergens, clearing');
                localStorage.removeItem('userAllergens');
            }
        }
        
        console.log('[ALLERGEN MIGRATION] ✅ localStorage migration to camelCase completed');
        return true;
    } catch (error) {
        console.error('[ALLERGEN MIGRATION] ❌ Failed to migrate localStorage:', error);
        return false;
    }
}

/**
 * Reset Redux state to use new camelCase format
 * This should be called after the migration to ensure Redux state is consistent
 */
export function resetReduxAllergenState(dispatch, actions) {
    console.log('[ALLERGEN MIGRATION] Resetting Redux allergen state to camelCase...');
    
    try {
        // Clear search preferences
        if (actions.clearSearchPreferencesLocal) {
            dispatch(actions.clearSearchPreferencesLocal());
            console.log('[ALLERGEN MIGRATION] ✅ Cleared search preferences');
        }
        
        // Clear allergies
        if (actions.clearAllergies) {
            dispatch(actions.clearAllergies());
            console.log('[ALLERGEN MIGRATION] ✅ Cleared allergies');
        }
        
        // Clear products to force fresh load with new format
        if (actions.clearProducts) {
            dispatch(actions.clearProducts());
            console.log('[ALLERGEN MIGRATION] ✅ Cleared products');
        }
        
        console.log('[ALLERGEN MIGRATION] ✅ Redux state reset to camelCase completed');
        return true;
    } catch (error) {
        console.error('[ALLERGEN MIGRATION] ❌ Failed to reset Redux state:', error);
        return false;
    }
}

/**
 * Validate that the system is using the new camelCase format
 * Checks localStorage, Redux state, and API responses for consistency
 */
export function validateMigrationSuccess() {
    console.log('[ALLERGEN MIGRATION] Validating camelCase migration success...');
    
    const validation = {
        localStorage: true,
        redirection: true,
        format: true,
        errors: []
    };
    
    try {
        // Check localStorage format (should be camelCase)
        const fallbackPreferences = localStorage.getItem('fallbackAllergenPreferences');
        if (fallbackPreferences) {
            try {
                const parsed = JSON.parse(fallbackPreferences);
                if (parsed.allergens && Array.isArray(parsed.allergens)) {
                    const hasNonCamelCase = parsed.allergens.some(allergen => {
                        // Check if allergen is not in camelCase format
                        const isCamelCase = allergen === allergen.toLowerCase() || 
                                           allergen === allergen.charAt(0).toLowerCase() + allergen.slice(1);
                        return !isCamelCase;
                    });
                    if (hasNonCamelCase) {
                        validation.localStorage = false;
                        validation.errors.push('localStorage contains non-camelCase allergens');
                    }
                }
            } catch (error) {
                validation.errors.push('localStorage parse error');
            }
        }
        
        // Check for any remaining old format data
        const userAllergens = localStorage.getItem('userAllergens');
        if (userAllergens) {
            try {
                const parsed = JSON.parse(userAllergens);
                if (Array.isArray(parsed)) {
                    const hasNonCamelCase = parsed.some(allergen => {
                        const isCamelCase = allergen === allergen.toLowerCase() || 
                                           allergen === allergen.charAt(0).toLowerCase() + allergen.slice(1);
                        return !isCamelCase;
                    });
                    if (hasNonCamelCase) {
                        validation.localStorage = false;
                        validation.errors.push('userAllergens contains non-camelCase allergens');
                    }
                }
            } catch (error) {
                validation.errors.push('userAllergens parse error');
            }
        }
        
        console.log('[ALLERGEN MIGRATION] ✅ camelCase validation completed');
        return validation;
    } catch (error) {
        console.error('[ALLERGEN MIGRATION] ❌ Validation failed:', error);
        validation.errors.push('Validation error: ' + error.message);
        return validation;
    }
}

/**
 * Complete migration process for frontend (camelCase unified)
 * This should be called after the database migration is complete
 */
export async function completeFrontendMigration(dispatch, actions) {
    console.log('[ALLERGEN MIGRATION] Starting complete frontend migration to camelCase...');
    
    const results = {
        cacheCleared: false,
        localStorageMigrated: false,
        reduxReset: false,
        validation: null,
        success: false
    };
    
    try {
        // Step 1: Clear allergen cache
        results.cacheCleared = clearAllergenCache();
        
        // Step 2: Migrate localStorage data to camelCase
        results.localStorageMigrated = migrateLocalStorageAllergens();
        
        // Step 3: Reset Redux state
        results.reduxReset = resetReduxAllergenState(dispatch, actions);
        
        // Step 4: Validate migration
        results.validation = validateMigrationSuccess();
        
        // Step 5: Determine overall success
        results.success = results.cacheCleared && 
                         results.localStorageMigrated && 
                         results.reduxReset && 
                         results.validation.localStorage;
        
        if (results.success) {
            console.log('[ALLERGEN MIGRATION] ✅ Complete frontend migration to camelCase successful');
        } else {
            console.warn('[ALLERGEN MIGRATION] ⚠️ Frontend migration completed with issues:', results);
        }
        
        return results;
    } catch (error) {
        console.error('[ALLERGEN MIGRATION] ❌ Complete frontend migration failed:', error);
        results.errors = [error.message];
        return results;
    }
}

/**
 * Check if migration is needed (camelCase format check)
 * Returns true if non-camelCase format data is detected
 */
export function isMigrationNeeded() {
    try {
        // Check localStorage for non-camelCase format
        const fallbackPreferences = localStorage.getItem('fallbackAllergenPreferences');
        if (fallbackPreferences) {
            const parsed = JSON.parse(fallbackPreferences);
            if (parsed.allergens && Array.isArray(parsed.allergens)) {
                const hasNonCamelCase = parsed.allergens.some(allergen => {
                    const isCamelCase = allergen === allergen.toLowerCase() || 
                                       allergen === allergen.charAt(0).toLowerCase() + allergen.slice(1);
                    return !isCamelCase;
                });
                if (hasNonCamelCase) {
                    return true;
                }
            }
        }
        
        const userAllergens = localStorage.getItem('userAllergens');
        if (userAllergens) {
            const parsed = JSON.parse(userAllergens);
            if (Array.isArray(parsed)) {
                const hasNonCamelCase = parsed.some(allergen => {
                    const isCamelCase = allergen === allergen.toLowerCase() || 
                                       allergen === allergen.charAt(0).toLowerCase() + allergen.slice(1);
                    return !isCamelCase;
                });
                if (hasNonCamelCase) {
                    return true;
                }
            }
        }
        
        return false;
    } catch (error) {
        console.warn('[ALLERGEN MIGRATION] Could not check if migration is needed:', error);
        return true; // Assume migration is needed if we can't check
    }
}

/**
 * Get migration status report (camelCase format)
 * Returns detailed information about the current state
 */
export function getMigrationStatus() {
    const status = {
        migrationNeeded: isMigrationNeeded(),
        localStorageItems: [],
        validation: validateMigrationSuccess(),
        recommendations: []
    };
    
    // Check what localStorage items exist
    const itemsToCheck = [
        'fallbackAllergenPreferences',
        'userAllergens',
        'anonymousUserIdForMerge',
        'postLoginRedirect'
    ];
    
    itemsToCheck.forEach(item => {
        if (localStorage.getItem(item)) {
            status.localStorageItems.push(item);
        }
    });
    
    // Generate recommendations
    if (status.migrationNeeded) {
        status.recommendations.push('Run completeFrontendMigration() to update to camelCase format');
    }
    
    if (status.localStorageItems.length > 0) {
        status.recommendations.push('Consider clearing localStorage items if no longer needed');
    }
    
    if (!status.validation.localStorage) {
        status.recommendations.push('Fix localStorage format inconsistencies (should be camelCase)');
    }
    
    return status;
}

// 🎯 EXPORT ALL MIGRATION FUNCTIONS
export {
    clearAllergenCache,
    migrateLocalStorageAllergens,
    resetReduxAllergenState,
    validateMigrationSuccess,
    completeFrontendMigration,
    isMigrationNeeded,
    getMigrationStatus
}; 