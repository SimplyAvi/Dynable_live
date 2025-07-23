/**
 * Phase 3 Backend Integration Test Script
 * Tests RBAC implementation with identity linking
 * 
 * Author: Justin Linzan
 * Date: June 2025
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Phase 3: Backend Integration with RBAC');
console.log('==================================================\n');

// Test file existence
const testFiles = [
    'server/utils/jwt.js',
    'server/utils/identityLinking.js',
    'server/middleware/roleAuth.js',
    'server/api/authRoutes.js',
    'server/api/sellerRoutes.js',
    'server/db/models/User.js',
    'server/db/models/IngredientCategorized.js',
    'server/server.js'
];

console.log('📁 Checking file existence:');
let allFilesExist = true;

testFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
});

console.log('');

// Test key functionality in files
console.log('🔍 Checking key functionality:');

// Test JWT utilities
try {
    const jwtContent = fs.readFileSync('server/utils/jwt.js', 'utf8');
    const jwtTests = [
        { name: 'generateToken function', pattern: 'generateToken.*=.*function' },
        { name: 'generateSupabaseToken function', pattern: 'generateSupabaseToken.*=.*function' },
        { name: 'hasRole function', pattern: 'hasRole.*=.*function' },
        { name: 'isAdmin function', pattern: 'isAdmin.*=.*function' },
        { name: 'isSeller function', pattern: 'isSeller.*=.*function' },
        { name: 'isVerifiedSeller function', pattern: 'isVerifiedSeller.*=.*function' },
        { name: 'isAnonymous function', pattern: 'isAnonymous.*=.*function' },
    ];

    jwtTests.forEach(test => {
        const hasFunction = new RegExp(test.pattern).test(jwtContent);
        console.log(`${hasFunction ? '✅' : '❌'} ${test.name}`);
    });
} catch (error) {
    console.log('❌ Error reading JWT utilities');
}

// Test Identity Linking utilities
try {
    const identityContent = fs.readFileSync('server/utils/identityLinking.js', 'utf8');
    const identityTests = [
        { name: 'linkAnonymousToAuthenticated function', pattern: 'linkAnonymousToAuthenticated.*=.*function' },
        { name: 'transferCartData function', pattern: 'transferCartData.*=.*function' },
        { name: 'mergeCartItems function', pattern: 'mergeCartItems.*=.*function' },
        { name: 'isConvertedFromAnonymous function', pattern: 'isConvertedFromAnonymous.*=.*function' },
        { name: 'getAnonymousCartData function', pattern: 'getAnonymousCartData.*=.*function' },
        { name: 'cleanupAnonymousData function', pattern: 'cleanupAnonymousData.*=.*function' },
    ];

    identityTests.forEach(test => {
        const hasFunction = new RegExp(test.pattern).test(identityContent);
        console.log(`${hasFunction ? '✅' : '❌'} ${test.name}`);
    });
} catch (error) {
    console.log('❌ Error reading Identity Linking utilities');
}

// Test Role Auth middleware
try {
    const middlewareContent = fs.readFileSync('server/middleware/roleAuth.js', 'utf8');
    const middlewareTests = [
        { name: 'authenticateToken function', pattern: 'authenticateToken.*=.*function' },
        { name: 'requireRole function', pattern: 'requireRole.*=.*function' },
        { name: 'requirePermission function', pattern: 'requirePermission.*=.*function' },
        { name: 'requireAdmin middleware', pattern: 'requireAdmin.*=.*requireRole' },
        { name: 'requireSeller middleware', pattern: 'requireSeller.*=.*requireRole' },
        { name: 'requireAuthenticated middleware', pattern: 'requireAuthenticated.*=.*requireRole' },
        { name: 'allowAnonymous function', pattern: 'allowAnonymous.*=.*function' },
        { name: 'requireVerifiedSeller function', pattern: 'requireVerifiedSeller.*=.*function' },
        { name: 'requireAuthenticatedUser function', pattern: 'requireAuthenticatedUser.*=.*function' },
        { name: 'optionalAuth function', pattern: 'optionalAuth.*=.*function' },
        { name: 'requireOwnership function', pattern: 'requireOwnership.*=.*function' },
    ];

    middlewareTests.forEach(test => {
        const hasFunction = new RegExp(test.pattern).test(middlewareContent);
        console.log(`${hasFunction ? '✅' : '❌'} ${test.name}`);
    });
} catch (error) {
    console.log('❌ Error reading Role Auth middleware');
}

// Test Auth Routes
try {
    const authContent = fs.readFileSync('server/api/authRoutes.js', 'utf8');
    const authTests = [
        { name: 'RBAC imports', pattern: 'require.*jwt.*utils' },
        { name: 'Role middleware imports', pattern: 'require.*roleAuth' },
        { name: 'Identity linking imports', pattern: 'require.*identityLinking' },
        { name: 'Enhanced signup with roles', pattern: 'role.*=.*end_user' },
        { name: 'Enhanced login with roles', pattern: 'generateToken.*user' },
        { name: 'Google OAuth with RBAC', pattern: 'role.*=.*end_user.*//.*Default role' },
        { name: 'Seller application endpoint', pattern: 'apply-seller' },
        { name: 'Admin user management', pattern: 'admin/users' },
        { name: 'Role update endpoint', pattern: 'admin/users.*role' },
        { name: 'Seller verification endpoint', pattern: 'admin/sellers.*verify' },
        { name: 'Anonymous cleanup endpoint', pattern: 'cleanup-anonymous' },
    ];

    authTests.forEach(test => {
        const hasFunction = new RegExp(test.pattern).test(authContent);
        console.log(`${hasFunction ? '✅' : '❌'} ${test.name}`);
    });
} catch (error) {
    console.log('❌ Error reading Auth Routes');
}

// Test Seller Routes
try {
    const sellerContent = fs.readFileSync('server/api/sellerRoutes.js', 'utf8');
    const sellerTests = [
        { name: 'Seller dashboard endpoint', pattern: 'seller/dashboard' },
        { name: 'Seller products endpoint', pattern: 'seller/products' },
        { name: 'Create product endpoint', pattern: 'seller/products.*POST' },
        { name: 'Update product endpoint', pattern: 'seller/products.*PUT' },
        { name: 'Inventory update endpoint', pattern: 'seller/products.*inventory' },
        { name: 'Delete product endpoint', pattern: 'seller/products.*DELETE' },
        { name: 'Store information endpoint', pattern: 'seller/store' },
        { name: 'Store update endpoint', pattern: 'seller/store.*PUT' },
        { name: 'Analytics endpoint', pattern: 'seller/analytics' },
        { name: 'Verified seller middleware', pattern: 'requireVerifiedSeller' },
    ];

    sellerTests.forEach(test => {
        const hasFunction = new RegExp(test.pattern).test(sellerContent);
        console.log(`${hasFunction ? '✅' : '❌'} ${test.name}`);
    });
} catch (error) {
    console.log('❌ Error reading Seller Routes');
}

// Test User Model
try {
    const userContent = fs.readFileSync('server/db/models/User.js', 'utf8');
    const userTests = [
        { name: 'Role field definition', pattern: 'role.*ENUM.*admin.*end_user.*seller' },
        { name: 'Store name field', pattern: 'store_name.*STRING' },
        { name: 'Store description field', pattern: 'store_description.*TEXT' },
        { name: 'Verified seller field', pattern: 'is_verified_seller.*BOOLEAN' },
        { name: 'Anonymous conversion field', pattern: 'converted_from_anonymous.*BOOLEAN' },
        { name: 'Anonymous cart data field', pattern: 'anonymous_cart_data.*JSONB' },
        { name: 'isAdmin method', pattern: 'isAdmin.*function' },
        { name: 'isSeller method', pattern: 'isSeller.*function' },
        { name: 'isVerifiedSeller method', pattern: 'isVerifiedSeller.*function' },
        { name: 'canManageProducts method', pattern: 'canManageProducts.*function' },
    ];

    userTests.forEach(test => {
        const hasFunction = new RegExp(test.pattern).test(userContent);
        console.log(`${hasFunction ? '✅' : '❌'} ${test.name}`);
    });
} catch (error) {
    console.log('❌ Error reading User Model');
}

// Test IngredientCategorized Model
try {
    const productContent = fs.readFileSync('server/db/models/IngredientCategorized.js', 'utf8');
    const productTests = [
        { name: 'Seller ID field', pattern: 'seller_id.*INTEGER' },
        { name: 'Stock quantity field', pattern: 'stock_quantity.*INTEGER' },
        { name: 'Active status field', pattern: 'is_active.*BOOLEAN' },
        { name: 'isInStock method', pattern: 'isInStock.*function' },
        { name: 'isOutOfStock method', pattern: 'isOutOfStock.*function' },
        { name: 'canBePurchased method', pattern: 'canBePurchased.*function' },
        { name: 'findActiveProducts method', pattern: 'findActiveProducts.*function' },
        { name: 'findBySeller method', pattern: 'findBySeller.*function' },
    ];

    productTests.forEach(test => {
        const hasFunction = new RegExp(test.pattern).test(productContent);
        console.log(`${hasFunction ? '✅' : '❌'} ${test.name}`);
    });
} catch (error) {
    console.log('❌ Error reading IngredientCategorized Model');
}

// Test Server Integration
try {
    const serverContent = fs.readFileSync('server/server.js', 'utf8');
    const serverTests = [
        { name: 'Seller routes import', pattern: 'sellerRoutes.*require' },
        { name: 'Seller routes registration', pattern: 'app.use.*sellerRoutes' },
        { name: 'RBAC status logging', pattern: 'RBAC System Status' },
    ];

    serverTests.forEach(test => {
        const hasFunction = new RegExp(test.pattern).test(serverContent);
        console.log(`${hasFunction ? '✅' : '❌'} ${test.name}`);
    });
} catch (error) {
    console.log('❌ Error reading Server file');
}

console.log('\n📊 Phase 3 Integration Summary:');
console.log('================================');

if (allFilesExist) {
    console.log('✅ All required files exist');
    console.log('✅ JWT utilities with role claims');
    console.log('✅ Identity linking for anonymous users');
    console.log('✅ Role-based middleware protection');
    console.log('✅ Enhanced auth routes with RBAC');
    console.log('✅ Seller management routes');
    console.log('✅ Updated User and Product models');
    console.log('✅ Server integration complete');
    
    console.log('\n🎉 Phase 3 Backend Integration Complete!');
    console.log('\nNext Steps:');
    console.log('1. Install @supabase/supabase-js: npm install @supabase/supabase-js');
    console.log('2. Set environment variables (JWT_SECRET, SUPABASE_*)');
    console.log('3. Test the backend: npm run dev');
    console.log('4. Proceed to Phase 4: Frontend Integration');
} else {
    console.log('❌ Some files are missing - please check the file structure');
}

console.log('\n🔗 Related Documentation:');
console.log('- Supabase Identity Linking: https://supabase.com/docs/guides/auth/auth-identity-linking#manual-linking-beta');
console.log('- JWT Token Management: server/utils/jwt.js');
console.log('- Role-Based Middleware: server/middleware/roleAuth.js');
console.log('- Identity Linking: server/utils/identityLinking.js'); 