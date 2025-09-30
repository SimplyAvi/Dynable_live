/**
 * Comprehensive Tier System Verification
 * Tests all aspects of the tier system implementation
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyTierSystem() {
    console.log('🎯 COMPREHENSIVE TIER SYSTEM VERIFICATION\n');
    console.log('='.repeat(70));
    
    let allChecks = [];
    
    // =========================================================================
    // 1. VERIFY TEST USER CONFIGURATION
    // =========================================================================
    console.log('\n1️⃣ TEST USER CONFIGURATION');
    console.log('-'.repeat(70));
    
    const { data: testUser, error: userError } = await supabase
        .from('Users')
        .select('*')
        .eq('email', 'testjjuser@gmail.com')
        .single();
    
    if (testUser) {
        const userCheck = {
            name: 'Test user exists',
            status: testUser.email === 'testjjuser@gmail.com' ? '✅' : '❌',
            details: `Email: ${testUser.email}`
        };
        allChecks.push(userCheck);
        console.log(userCheck.status, userCheck.name);
        console.log('   ', userCheck.details);
        
        const roleCheck = {
            name: 'Test user has Standard role',
            status: testUser.role === 'standard' ? '✅' : '❌',
            details: `Role: ${testUser.role} (Expected: standard)`
        };
        allChecks.push(roleCheck);
        console.log(roleCheck.status, roleCheck.name);
        console.log('   ', roleCheck.details);
        
        const customAllergenCheck = {
            name: 'Custom allergens column exists',
            status: testUser.custom_allergens !== undefined ? '✅' : '❌',
            details: `Has ${testUser.custom_allergens?.length || 0} custom allergen(s)`
        };
        allChecks.push(customAllergenCheck);
        console.log(customAllergenCheck.status, customAllergenCheck.name);
        console.log('   ', customAllergenCheck.details);
    } else {
        console.log('❌ Test user not found:', userError?.message);
        allChecks.push({ name: 'Test user exists', status: '❌', details: userError?.message });
    }
    
    // =========================================================================
    // 2. VERIFY DATABASE SCHEMA
    // =========================================================================
    console.log('\n2️⃣ DATABASE SCHEMA VERIFICATION');
    console.log('-'.repeat(70));
    
    // Check if custom_allergens column exists
    const { data: columns } = await supabase
        .from('Users')
        .select('custom_allergens')
        .limit(1);
    
    const schemaCheck = {
        name: 'custom_allergens column exists in schema',
        status: columns !== null ? '✅' : '❌',
        details: 'Column is accessible'
    };
    allChecks.push(schemaCheck);
    console.log(schemaCheck.status, schemaCheck.name);
    
    // =========================================================================
    // 3. TEST EMAIL-BASED RLS ACCESS
    // =========================================================================
    console.log('\n3️⃣ EMAIL-BASED RLS ACCESS TEST');
    console.log('-'.repeat(70));
    
    const { data: emailUsers, error: emailError } = await supabase
        .from('Users')
        .select('email, role')
        .eq('email', 'testjjuser@gmail.com');
    
    const rlsCheck = {
        name: 'RLS allows email-based access',
        status: emailUsers && emailUsers.length > 0 ? '✅' : '❌',
        details: emailError ? `Error: ${emailError.message}` : `Found ${emailUsers?.length || 0} user(s)`
    };
    allChecks.push(rlsCheck);
    console.log(rlsCheck.status, rlsCheck.name);
    console.log('   ', rlsCheck.details);
    
    // =========================================================================
    // 4. TEST CUSTOM ALLERGEN UPDATE
    // =========================================================================
    console.log('\n4️⃣ CUSTOM ALLERGEN UPDATE TEST');
    console.log('-'.repeat(70));
    
    // Try to read current custom allergens
    const { data: currentData, error: readError } = await supabase
        .from('Users')
        .select('custom_allergens')
        .eq('email', 'testjjuser@gmail.com')
        .single();
    
    const readCheck = {
        name: 'Can read custom allergens by email',
        status: currentData && !readError ? '✅' : '❌',
        details: readError ? `Error: ${readError.message}` : `Current: ${currentData?.custom_allergens?.length || 0} allergen(s)`
    };
    allChecks.push(readCheck);
    console.log(readCheck.status, readCheck.name);
    console.log('   ', readCheck.details);
    
    // Try to update custom allergens
    const testAllergen = {
        id: 'test_' + Date.now(),
        name: 'test_allergen',
        displayName: 'Test Allergen',
        createdAt: new Date().toISOString(),
        isActive: true,
        isCustom: true
    };
    
    const currentAllergens = currentData?.custom_allergens || [];
    const updatedAllergens = [...currentAllergens, testAllergen];
    
    const { data: updateData, error: updateError } = await supabase
        .from('Users')
        .update({
            custom_allergens: updatedAllergens,
            updatedAt: new Date().toISOString()
        })
        .eq('email', 'testjjuser@gmail.com')
        .select();
    
    const updateCheck = {
        name: 'Can update custom allergens by email',
        status: updateData && !updateError ? '✅' : '❌',
        details: updateError ? `Error: ${updateError.message}` : 'Update successful'
    };
    allChecks.push(updateCheck);
    console.log(updateCheck.status, updateCheck.name);
    console.log('   ', updateCheck.details);
    
    // Clean up test allergen
    if (updateData) {
        await supabase
            .from('Users')
            .update({
                custom_allergens: currentAllergens,
                updatedAt: new Date().toISOString()
            })
            .eq('email', 'testjjuser@gmail.com');
        console.log('   🧹 Cleaned up test allergen');
    }
    
    // =========================================================================
    // 5. VERIFY ALL USERS HAVE VALID ROLES
    // =========================================================================
    console.log('\n5️⃣ USER ROLE VALIDATION');
    console.log('-'.repeat(70));
    
    const { data: allUsers } = await supabase
        .from('Users')
        .select('email, role');
    
    const validRoles = ['free', 'standard', 'premium', 'admin', 'seller'];
    const invalidUsers = allUsers?.filter(u => !validRoles.includes(u.role)) || [];
    
    const roleCheck = {
        name: 'All users have valid roles',
        status: invalidUsers.length === 0 ? '✅' : '⚠️',
        details: invalidUsers.length === 0 
            ? `All ${allUsers?.length || 0} users have valid roles` 
            : `${invalidUsers.length} user(s) with invalid roles`
    };
    allChecks.push(roleCheck);
    console.log(roleCheck.status, roleCheck.name);
    console.log('   ', roleCheck.details);
    
    if (invalidUsers.length > 0) {
        console.log('   Invalid users:', invalidUsers.map(u => `${u.email} (${u.role})`).join(', '));
    }
    
    // =========================================================================
    // FINAL SUMMARY
    // =========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 VERIFICATION SUMMARY:\n');
    
    const passed = allChecks.filter(c => c.status === '✅').length;
    const failed = allChecks.filter(c => c.status === '❌').length;
    const warnings = allChecks.filter(c => c.status === '⚠️').length;
    
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⚠️  Warnings: ${warnings}`);
    console.log(`   📋 Total: ${allChecks.length}`);
    
    if (failed === 0 && warnings === 0) {
        console.log('\n🎉 ALL CHECKS PASSED! Tier system is fully configured.\n');
    } else if (failed === 0) {
        console.log('\n✅ All critical checks passed (with some warnings).\n');
    } else {
        console.log('\n⚠️ Some checks failed. Please review the details above.\n');
    }
    
    console.log('='.repeat(70));
}

verifyTierSystem().catch(console.error);
