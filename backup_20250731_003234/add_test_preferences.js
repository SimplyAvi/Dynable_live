/**
 * Browser Console Script to Add Test Preferences
 * Run this in your browser console while logged in
 * 
 * Author: Justin Linzan
 * Date: January 2025
 */

// Function to add test preferences
async function addTestPreferences() {
    console.log('🧪 Adding Test Preferences...');
    
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            throw new Error(`Failed to get user: ${userError.message}`);
        }
        
        console.log('✅ Current user:', user.id);
        console.log('✅ User email:', user.email);
        
        // Add some test allergen preferences
        const testAllergens = ['milk', 'eggs', 'peanuts'];
        console.log('📋 Adding test preferences...');
        console.log('   - Allergens:', testAllergens);
        
        const { data: saveResult, error: saveError } = await supabase.rpc('save_search_preferences', {
            p_user_id: user.id,
            p_search_term: 'test search term',
            p_allergens: testAllergens
        });
        
        if (saveError) {
            throw new Error(`Failed to save preferences: ${saveError.message}`);
        }
        
        console.log('✅ Test preferences saved:', saveResult);
        console.log('   - Search term:', saveResult.search_term);
        console.log('   - Allergens:', saveResult.selected_allergens);
        
        console.log('\n🎉 Test preferences added successfully!');
        console.log('📝 Next steps:');
        console.log('   1. Refresh the page');
        console.log('   2. Check if milk, eggs, and peanuts are now toggled');
        console.log('   3. Try toggling other allergens');
        console.log('   4. Verify they persist after page refresh');
        
        return saveResult;
        
    } catch (error) {
        console.error('❌ Failed to add test preferences:', error);
        throw error;
    }
}

// Function to check current preferences
async function checkCurrentPreferences() {
    console.log('🧪 Checking Current Preferences...');
    
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            throw new Error(`Failed to get user: ${userError.message}`);
        }
        
        console.log('✅ Current user:', user.id);
        
        // Check if user has preferences
        const { data: preferences, error: prefError } = await supabase.rpc('get_search_preferences', {
            p_user_id: user.id
        });
        
        if (prefError) {
            throw new Error(`Failed to get preferences: ${prefError.message}`);
        }
        
        console.log('✅ User preferences:', preferences);
        
        if (preferences && Object.keys(preferences).length > 0) {
            console.log('✅ User has saved preferences:');
            console.log('   - Search term:', preferences.search_term);
            console.log('   - Allergens:', preferences.selected_allergens);
        } else {
            console.log('ℹ️  User has no saved preferences');
        }
        
        return preferences;
        
    } catch (error) {
        console.error('❌ Failed to check preferences:', error);
        throw error;
    }
}

// Function to clear preferences
async function clearPreferences() {
    console.log('🧪 Clearing Preferences...');
    
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            throw new Error(`Failed to get user: ${userError.message}`);
        }
        
        console.log('✅ Current user:', user.id);
        
        // Clear preferences
        const { error: clearError } = await supabase.rpc('clear_search_preferences', {
            p_user_id: user.id
        });
        
        if (clearError) {
            throw new Error(`Failed to clear preferences: ${clearError.message}`);
        }
        
        console.log('✅ Preferences cleared successfully');
        
        return true;
        
    } catch (error) {
        console.error('❌ Failed to clear preferences:', error);
        throw error;
    }
}

// Export functions for browser console
window.addTestPreferences = addTestPreferences;
window.checkCurrentPreferences = checkCurrentPreferences;
window.clearPreferences = clearPreferences;

console.log('🎯 Allergy Filter Test Functions Loaded!');
console.log('Available functions:');
console.log('  - addTestPreferences()  : Add test allergen preferences');
console.log('  - checkCurrentPreferences() : Check current user preferences');
console.log('  - clearPreferences()    : Clear all user preferences');
console.log('');
console.log('💡 Run addTestPreferences() to add test data and see if the allergy filter works!'); 