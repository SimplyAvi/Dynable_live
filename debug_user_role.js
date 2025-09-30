/**
 * Debug User Role in Browser Console
 * Copy and paste this into your browser console to debug the user role issue
 */

console.log('🔍 DEBUGGING USER ROLE ISSUE');

// Check Redux state
const state = window.store?.getState();
console.log('📊 Full Redux State:', state);

// Check auth state specifically
const authState = state?.auth;
console.log('🔐 Auth State:', authState);

// Check user data
const user = authState?.user;
console.log('👤 User Data:', user);

// Check user role specifically
const userRole = user?.role;
console.log('🎯 User Role:', userRole);

// Check if user is authenticated
const isAuthenticated = authState?.isAuthenticated;
console.log('✅ Is Authenticated:', isAuthenticated);

// Check what the tier system thinks
console.log('🧪 Tier System Analysis:');
console.log('  - User Role from Redux:', userRole);
console.log('  - Is Standard?', userRole === 'standard');
console.log('  - Is Admin?', userRole === 'admin');
console.log('  - Is Free?', userRole === 'free');
console.log('  - Is End User?', userRole === 'end_user');

// Check if the user role loading function would trigger
if (user) {
    const needsRefresh = !user.role || user.role === 'end_user';
    console.log('🔄 Needs Role Refresh?', needsRefresh);
    console.log('  - Has Role?', !!user.role);
    console.log('  - Role Value:', user.role);
    console.log('  - Is End User?', user.role === 'end_user');
}

// Check what the tier validation would do
if (userRole) {
    console.log('🎯 Tier Validation Test:');
    console.log('  - Current Role:', userRole);
    console.log('  - Should be Standard?', userRole === 'standard');
    console.log('  - Should be Admin?', userRole === 'admin');
    console.log('  - Should be Premium?', userRole === 'premium');
    console.log('  - Should be Seller?', userRole === 'seller');
    console.log('  - Is Free?', userRole === 'free');
    
    if (userRole === 'standard' || userRole === 'admin' || userRole === 'premium' || userRole === 'seller') {
        console.log('✅ User should have unlimited allergens');
    } else {
        console.log('❌ User is on Free tier - limited to 2 allergens');
    }
} else {
    console.log('❌ No user role found - defaulting to Free tier');
}

// Check if the user role loading is being called
console.log('🔍 Checking if user role loading is working...');
console.log('  - User Email:', user?.email);
console.log('  - User ID:', user?.id);
console.log('  - User Name:', user?.name);
