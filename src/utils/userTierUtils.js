/**
 * User Tier System Utilities
 * Author: Justin Linzan
 * Date: September 2025
 * 
 * Handles user tier-based restrictions:
 * - Free: 2 allergen limit, no custom allergens
 * - Standard: Unlimited allergens + custom allergens
 * - Premium: Hidden tier (future features)
 */

// User tier definitions
export const USER_TIERS = {
    FREE: 'free',
    STANDARD: 'standard', 
    PREMIUM: 'premium',
    ADMIN: 'admin',
    SELLER: 'seller'
};

// Tier capabilities
export const TIER_CAPABILITIES = {
    [USER_TIERS.FREE]: {
        maxAllergens: 2,
        canAddCustomAllergens: false,
        features: ['view_products', 'view_recipes', 'add_to_cart', 'toggle_allergens']
    },
    [USER_TIERS.STANDARD]: {
        maxAllergens: 999, // Effectively unlimited
        canAddCustomAllergens: true,
        features: ['view_products', 'view_recipes', 'add_to_cart', 'toggle_allergens', 'custom_allergens']
    },
    [USER_TIERS.PREMIUM]: {
        maxAllergens: 999, // Effectively unlimited
        canAddCustomAllergens: true,
        features: ['view_products', 'view_recipes', 'add_to_cart', 'toggle_allergens', 'custom_allergens', 'premium_features']
    },
    [USER_TIERS.ADMIN]: {
        maxAllergens: 999,
        canAddCustomAllergens: true,
        features: ['all'] // Admins have all features
    },
    [USER_TIERS.SELLER]: {
        maxAllergens: 999,
        canAddCustomAllergens: true,
        features: ['view_products', 'view_recipes', 'add_to_cart', 'toggle_allergens', 'custom_allergens', 'manage_products']
    }
};

/**
 * Get user's current tier from Redux state
 */
export const getUserTier = (authState) => {
    if (!authState?.user) return USER_TIERS.FREE;
    return authState.user.role || USER_TIERS.FREE;
};

/**
 * Get tier capabilities for a user
 */
export const getUserCapabilities = (authState) => {
    const tier = getUserTier(authState);
    return TIER_CAPABILITIES[tier] || TIER_CAPABILITIES[USER_TIERS.FREE];
};

/**
 * Check if user can toggle more allergens
 */
export const canToggleAllergen = (authState, currentAllergenCount) => {
    const capabilities = getUserCapabilities(authState);
    return currentAllergenCount < capabilities.maxAllergens;
};

/**
 * Check if user can add custom allergens
 */
export const canAddCustomAllergen = (authState) => {
    const capabilities = getUserCapabilities(authState);
    return capabilities.canAddCustomAllergens;
};

/**
 * Get the maximum number of allergens a user can toggle
 */
export const getMaxAllergens = (authState) => {
    const capabilities = getUserCapabilities(authState);
    return capabilities.maxAllergens;
};

/**
 * Check if user has a specific feature
 */
export const hasFeature = (authState, feature) => {
    const capabilities = getUserCapabilities(authState);
    return capabilities.features.includes('all') || capabilities.features.includes(feature);
};

/**
 * Get tier display name
 */
export const getTierDisplayName = (tier) => {
    const displayNames = {
        [USER_TIERS.FREE]: 'Free',
        [USER_TIERS.STANDARD]: 'Standard',
        [USER_TIERS.PREMIUM]: 'Premium',
        [USER_TIERS.ADMIN]: 'Admin',
        [USER_TIERS.SELLER]: 'Seller'
    };
    return displayNames[tier] || 'Free';
};

/**
 * Check if tier is premium or higher
 */
export const isPremiumOrHigher = (tier) => {
    return [USER_TIERS.PREMIUM, USER_TIERS.ADMIN].includes(tier);
};

/**
 * Check if tier is standard or higher
 */
export const isStandardOrHigher = (tier) => {
    return [USER_TIERS.STANDARD, USER_TIERS.PREMIUM, USER_TIERS.ADMIN, USER_TIERS.SELLER].includes(tier);
};

/**
 * Get upgrade suggestion message for free users
 */
export const getUpgradeMessage = (authState, currentAllergenCount) => {
    const tier = getUserTier(authState);
    
    if (tier === USER_TIERS.FREE) {
        const capabilities = getUserCapabilities(authState);
        if (currentAllergenCount >= capabilities.maxAllergens) {
            return {
                type: 'allergen_limit',
                message: 'You\'ve reached the allergen limit for Free tier. Upgrade to Standard for unlimited allergens and custom allergens.',
                action: 'upgrade_to_standard'
            };
        }
    }
    
    return null;
};

/**
 * Validate allergen toggle attempt
 */
export const validateAllergenToggle = (authState, currentAllergenCount, isTogglingOn) => {
    const tier = getUserTier(authState);
    const capabilities = getUserCapabilities(authState);
    
    // If toggling off, always allow
    if (!isTogglingOn) {
        return { allowed: true };
    }
    
    // Check if user can toggle more allergens
    if (!canToggleAllergen(authState, currentAllergenCount)) {
        return {
            allowed: false,
            reason: 'allergen_limit_reached',
            message: getUpgradeMessage(authState, currentAllergenCount)?.message || 'Allergen limit reached'
        };
    }
    
    return { allowed: true };
};

/**
 * Log tier-related actions for analytics
 */
export const logTierAction = (action, tier, details = {}) => {
    console.log(`[TIER_ACTION] ${action}`, {
        tier,
        timestamp: new Date().toISOString(),
        ...details
    });
    
    // TODO: Send to analytics service
    // analytics.track('tier_action', { action, tier, ...details });
};
