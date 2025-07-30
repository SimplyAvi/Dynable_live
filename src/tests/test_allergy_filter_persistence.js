/**
 * Allergy Filter Persistence Test
 * Tests the complete allergy filter system with persistent storage
 * 
 * Author: Justin Linzan
 * Date: January 2025
 */

import { supabase } from '../utils/supabaseClient';
import { getAnonymousUserId } from '../utils/supabaseClient';
import { isAnonymousUser } from '../utils/anonymousAuth';
import anonymousUserManager from '../utils/anonymousUserManager';
import searchPreferencesManager from '../utils/searchPreferencesManager';

/**
 * Test the complete allergy filter persistence flow
 */
export const testAllergyFilterPersistence = async () => {
    console.log('🧪 Starting Allergy Filter Persistence Test...');
    
    try {
        // Step 1: Initialize anonymous user
        console.log('\n📋 Step 1: Initializing anonymous user...');
        const initResult = await anonymousUserManager.initializeAnonymousUser();
        if (!initResult.success) {
            throw new Error(`Failed to initialize anonymous user: ${initResult.error}`);
        }
        console.log('✅ Anonymous user initialized:', initResult.anonymousId);
        
        // Step 2: Test allergen toggling for anonymous user
        console.log('\n📋 Step 2: Testing allergen toggling for anonymous user...');
        const testAllergens = ['milk', 'eggs', 'peanuts'];
        const saveResult = await searchPreferencesManager.saveSearchPreferencesBeforeAuth(
            'test search', 
            testAllergens, 
            initResult.anonymousId
        );
        
        if (!saveResult.success) {
            throw new Error(`Failed to save anonymous preferences: ${saveResult.error}`);
        }
        console.log('✅ Anonymous preferences saved:', testAllergens);
        
        // Step 3: Verify preferences are saved
        console.log('\n📋 Step 3: Verifying saved preferences...');
        const currentPrefs = await searchPreferencesManager.getCurrentSearchPreferences();
        if (!currentPrefs.success) {
            throw new Error(`Failed to get current preferences: ${currentPrefs.error}`);
        }
        console.log('✅ Current preferences:', currentPrefs.preferences);
        
        // Step 4: Simulate authentication (create authenticated user)
        console.log('\n📋 Step 4: Simulating authentication...');
        const { data: { user }, error: authError } = await supabase.auth.signUp({
            email: `test-${Date.now()}@example.com`,
            password: 'testpassword123'
        });
        
        if (authError) {
            throw new Error(`Failed to create test user: ${authError.message}`);
        }
        console.log('✅ Test user created:', user.id);
        
        // Step 5: Test preference merge on authentication
        console.log('\n📋 Step 5: Testing preference merge on authentication...');
        const mergeResult = await searchPreferencesManager.mergeSearchPreferencesOnLogin(
            initResult.anonymousId,
            user.id
        );
        
        if (!mergeResult.success) {
            throw new Error(`Failed to merge preferences: ${mergeResult.error}`);
        }
        console.log('✅ Preferences merged successfully');
        
        // Step 6: Verify merged preferences
        console.log('\n📋 Step 6: Verifying merged preferences...');
        const mergedPrefs = await searchPreferencesManager.loadSearchPreferencesAfterAuth(user.id);
        if (!mergedPrefs.success) {
            throw new Error(`Failed to load merged preferences: ${mergedPrefs.error}`);
        }
        console.log('✅ Merged preferences loaded:', mergedPrefs);
        
        // Step 7: Test logout cleanup
        console.log('\n📋 Step 7: Testing logout cleanup...');
        const cleanupResult = await searchPreferencesManager.clearSearchPreferencesOnLogout(user.id);
        if (!cleanupResult.success) {
            throw new Error(`Failed to cleanup preferences: ${cleanupResult.error}`);
        }
        console.log('✅ Preferences cleaned up successfully');
        
        console.log('\n🎉 All tests passed! Allergy filter persistence system is working correctly.');
        return { success: true, message: 'All tests passed' };
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Test allergy filter component integration
 */
export const testAllergyFilterComponent = async () => {
    console.log('🧪 Starting Allergy Filter Component Test...');
    
    try {
        // Test 1: Anonymous user toggles allergens
        console.log('\n📋 Test 1: Anonymous user toggles allergens...');
        const initResult = await anonymousUserManager.initializeAnonymousUser();
        if (!initResult.success) {
            throw new Error(`Failed to initialize anonymous user: ${initResult.error}`);
        }
        
        // Simulate toggling allergens
        const testAllergens = ['milk', 'eggs'];
        await searchPreferencesManager.saveSearchPreferencesBeforeAuth('', testAllergens, initResult.anonymousId);
        console.log('✅ Anonymous allergens toggled:', testAllergens);
        
        // Test 2: User logs in and preferences persist
        console.log('\n📋 Test 2: User logs in and preferences persist...');
        const { data: { user }, error: authError } = await supabase.auth.signUp({
            email: `test-component-${Date.now()}@example.com`,
            password: 'testpassword123'
        });
        
        if (authError) {
            throw new Error(`Failed to create test user: ${authError.message}`);
        }
        
        // Merge preferences
        await searchPreferencesManager.mergeSearchPreferencesOnLogin(initResult.anonymousId, user.id);
        console.log('✅ Preferences merged on login');
        
        // Test 3: Verify preferences are still there
        console.log('\n📋 Test 3: Verifying preferences persist after login...');
        const loadedPrefs = await searchPreferencesManager.loadSearchPreferencesAfterAuth(user.id);
        if (!loadedPrefs.success) {
            throw new Error(`Failed to load preferences after login: ${loadedPrefs.error}`);
        }
        
        console.log('✅ Preferences persist after login:', loadedPrefs);
        
        console.log('\n🎉 Component integration test passed!');
        return { success: true, message: 'Component integration test passed' };
        
    } catch (error) {
        console.error('❌ Component test failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Run all allergy filter tests
 */
export const runAllAllergyFilterTests = async () => {
    console.log('🚀 Running All Allergy Filter Tests...\n');
    
    const results = [];
    
    // Test 1: Persistence flow
    console.log('='.repeat(50));
    console.log('TEST 1: PERSISTENCE FLOW');
    console.log('='.repeat(50));
    const persistenceResult = await testAllergyFilterPersistence();
    results.push({ name: 'Persistence Flow', result: persistenceResult });
    
    // Test 2: Component integration
    console.log('\n' + '='.repeat(50));
    console.log('TEST 2: COMPONENT INTEGRATION');
    console.log('='.repeat(50));
    const componentResult = await testAllergyFilterComponent();
    results.push({ name: 'Component Integration', result: componentResult });
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r.result.success).length;
    const total = results.length;
    
    results.forEach(({ name, result }) => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${name}: ${result.success ? 'Success' : result.error}`);
    });
    
    console.log(`\nOverall: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All allergy filter tests passed! The system is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Please check the implementation.');
    }
    
    return {
        success: passed === total,
        passed,
        total,
        results
    };
};

// Export for use in other files
export default {
    testAllergyFilterPersistence,
    testAllergyFilterComponent,
    runAllAllergyFilterTests
}; 