/**
 * Debug Tier System
 * Author: Justin Linzan
 * Date: September 2025
 * 
 * This script helps debug why the tier system isn't working
 */

// Add this to your browser console to debug the tier system
console.log('🔍 DEBUGGING TIER SYSTEM');

// Check Redux state
const state = window.store?.getState();
console.log('📊 Redux State:', state);

// Check auth state
const authState = state?.auth;
console.log('🔐 Auth State:', authState);

// Check user data
const user = authState?.user;
console.log('👤 User Data:', user);

// Check user role
const userRole = user?.role;
console.log('🎯 User Role:', userRole);

// Check if user is authenticated
const isAuthenticated = authState?.isAuthenticated;
console.log('✅ Is Authenticated:', isAuthenticated);

// Check allergies state
const allergies = state?.allergies?.allergies;
console.log('🥜 Allergies State:', allergies);

// Count selected allergens
const selectedAllergens = Object.values(allergies || {}).filter(Boolean);
console.log('📊 Selected Allergens Count:', selectedAllergens.length);
console.log('📋 Selected Allergens:', selectedAllergens);

// Check tier validation
if (userRole) {
    console.log('🎯 Tier Analysis:');
    console.log('  - User Role:', userRole);
    console.log('  - Is Standard?', userRole === 'standard');
    console.log('  - Is Admin?', userRole === 'admin');
    console.log('  - Is Free?', userRole === 'free');
    
    if (userRole === 'standard' || userRole === 'admin' || userRole === 'premium' || userRole === 'seller') {
        console.log('✅ User should have unlimited allergens');
    } else {
        console.log('❌ User is on Free tier - limited to 2 allergens');
    }
} else {
    console.log('❌ No user role found - defaulting to Free tier');
}

// Check if tier validation is working
console.log('🧪 Testing Tier Validation:');
const authStateForTier = { user, isAuthenticated };
console.log('  - Auth State for Tier:', authStateForTier);

// Import tier utils (if available)
if (window.getUserTier) {
    const tier = window.getUserTier(authStateForTier);
    console.log('  - Detected Tier:', tier);
}

if (window.validateAllergenToggle) {
    const validation = window.validateAllergenToggle(authStateForTier, selectedAllergens.length, true);
    console.log('  - Toggle Validation:', validation);
}
