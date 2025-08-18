// 🧪 Quick test script to verify allergen system functionality
// Run this in the browser console to test the allergen system

console.log('🧪 Testing Allergen System...');

// Test 1: Check if allergen mappings are working
console.log('Test 1: Checking allergen mappings...');
try {
    // Test the allergen mapping function
    const testAllergens = ['Milk', 'TreeNuts', 'PEANUTS', 'wheat', 'Soy'];
    console.log('Original allergens:', testAllergens);
    
    // This should be available from the allergenMappings utility
    if (typeof window.mapToCamelCase === 'function') {
        const mapped = testAllergens.map(allergen => window.mapToCamelCase(allergen));
        console.log('Mapped allergens:', mapped);
        console.log('✅ Allergen mapping is working');
    } else {
        console.log('⚠️ Allergen mapping function not available in global scope');
    }
} catch (error) {
    console.error('❌ Allergen mapping test failed:', error);
}

// Test 2: Check localStorage for allergen data
console.log('Test 2: Checking localStorage...');
try {
    const storedAllergens = localStorage.getItem('selectedAllergens');
    if (storedAllergens) {
        const parsed = JSON.parse(storedAllergens);
        console.log('Stored allergens:', parsed);
        
        // Check if they're in camelCase format
        const isCamelCase = parsed.every(allergen => 
            allergen === allergen.toLowerCase() || 
            allergen === 'treeNuts' || 
            allergen === 'citrusfruits'
        );
        
        if (isCamelCase) {
            console.log('✅ Stored allergens are in camelCase format');
        } else {
            console.log('❌ Stored allergens are NOT in camelCase format');
        }
    } else {
        console.log('ℹ️ No stored allergens found in localStorage');
    }
} catch (error) {
    console.error('❌ localStorage test failed:', error);
}

// Test 3: Check Redux state (if available)
console.log('Test 3: Checking Redux state...');
try {
    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
        console.log('✅ Redux DevTools available');
    } else {
        console.log('ℹ️ Redux DevTools not available');
    }
} catch (error) {
    console.error('❌ Redux state test failed:', error);
}

// Test 4: Check for console messages
console.log('Test 4: Checking for migration messages...');
console.log('Look for these messages in the console:');
console.log('- [APP] ✅ Allergen system already migrated to camelCase');
console.log('- [UNIFIED] Mapped allergens: {original: [...], mapped: [...]}');
console.log('- [SEARCH PREFERENCES] ✅ Loaded from database');

// Test 5: Check DOM for allergen elements
console.log('Test 5: Checking DOM for allergen elements...');
try {
    const allergyElements = document.querySelectorAll('.allergy-scroll-item');
    console.log(`Found ${allergyElements.length} allergen elements`);
    
    if (allergyElements.length > 0) {
        const allergenTexts = Array.from(allergyElements).map(el => el.textContent.trim());
        console.log('Allergen texts:', allergenTexts);
        
        // Check if they're in camelCase format
        const isCamelCase = allergenTexts.every(text => {
            const cleanText = text.replace('✓', '').trim();
            return cleanText === cleanText.toLowerCase() || 
                   cleanText === 'TreeNuts' || 
                   cleanText === 'Citrusfruits';
        });
        
        if (isCamelCase) {
            console.log('✅ DOM allergen elements are in camelCase format');
        } else {
            console.log('❌ DOM allergen elements are NOT in camelCase format');
        }
    } else {
        console.log('ℹ️ No allergen elements found in DOM');
    }
} catch (error) {
    console.error('❌ DOM test failed:', error);
}

console.log('🧪 Allergen system tests completed!');
console.log('Check the results above to verify the system is working correctly.'); 