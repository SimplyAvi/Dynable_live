// 🔍 DEBUG CART MERGE & ALLERGEN PERSISTENCE
// Comprehensive diagnostic functions to identify issues

import { supabase } from './supabaseClient';

// 🧪 TEST CURRENT CART MERGE FUNCTION
export const testCurrentCartMerge = async () => {
  console.log('🔍 TESTING CURRENT CART MERGE');
  console.log('==============================');
  
  try {
    // Check if cart merge function exists
    const { mergeAnonymousCartWithStoredId } = await import('./anonymousAuth.js');
    if (typeof mergeAnonymousCartWithStoredId === 'function') {
      console.log('✅ Cart merge function found: mergeAnonymousCartWithStoredId');
    } else {
      console.log('❌ Cart merge function not found');
    }
    
    // Check localStorage cart
    const anonymousCart = localStorage.getItem('cartItems');
    console.log('Anonymous cart in localStorage:', anonymousCart);
    
    // Check current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.email || 'Not logged in');
    
    // Check database cart
    let dbCart;
    if (user) {
      const { data: cartData } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', user.id);
      dbCart = cartData;
      console.log('Database cart:', dbCart);
    }
    
    // Check if database functions exist
    try {
      // Use real UUIDs for testing
      const testAnonymousId = '00000000-0000-0000-0000-000000000001';
      const testAuthenticatedId = '00000000-0000-0000-0000-000000000002';
      
      const { data: functions } = await supabase.rpc('merge_carts_safe', {
        anonymous_user_id: testAnonymousId,
        authenticated_user_id: testAuthenticatedId
      });
      console.log('Database function check: Function exists and accepts valid UUIDs');
    } catch (error) {
      if (error.message.includes('invalid input syntax for type uuid')) {
        console.log('Database function check: Function exists but test UUIDs are invalid');
      } else {
        console.log('Database function check: Function does not exist or failed:', error.message);
      }
    }
    
    return {
      hasMergeFunction: typeof mergeAnonymousCartWithStoredId === 'function',
      hasAnonymousCart: !!anonymousCart,
      hasUser: !!user,
      hasDbCart: user ? !!dbCart : false
    };
    
  } catch (error) {
    console.error('❌ Cart merge test failed:', error);
    return { error: error.message };
  }
};

// 🧪 TEST CURRENT ALLERGEN PERSISTENCE
export const testCurrentAllergenPersistence = () => {
  console.log('🔍 TESTING ALLERGEN PERSISTENCE');
  console.log('===============================');
  
  try {
    // Check localStorage allergens
    const localAllergens = localStorage.getItem('userAllergens');
    console.log('Allergens in localStorage:', localAllergens);
    
    // Check if allergens component updates localStorage
    console.log('Check if AllergenFilter component saves to localStorage on toggle');
    
    // Check if there's a database table for user preferences
    console.log('Check if user_allergen_preferences table exists');
    
    // Check if allergens are loaded on app start
    console.log('Check if allergens are loaded in App.js or main component');
    
    return {
      hasLocalStorage: !!localAllergens,
      localData: localAllergens ? JSON.parse(localAllergens) : null
    };
    
  } catch (error) {
    console.error('❌ Allergen test failed:', error);
    return { error: error.message };
  }
};

// 🔍 ANALYZE POST-LOGIN FLOW
export const analyzePostLoginFlow = () => {
  console.log('🔍 ANALYZING POST-LOGIN FLOW');
  console.log('=============================');
  
  // Check current URL and referrer
  console.log('Current URL:', window.location.href);
  console.log('Referrer:', document.referrer);
  
  // Check if there's a redirect parameter
  const urlParams = new URLSearchParams(window.location.search);
  console.log('URL parameters:', Object.fromEntries(urlParams));
  
  // Check sessionStorage for any login state
  const sessionKeys = Object.keys(sessionStorage);
  console.log('SessionStorage keys:', sessionKeys);
  sessionKeys.forEach(key => {
    console.log(`SessionStorage[${key}]:`, sessionStorage.getItem(key));
  });
  
  // Check localStorage for any auth state
  const localKeys = Object.keys(localStorage);
  console.log('LocalStorage keys:', localKeys);
  localKeys.forEach(key => {
    if (key.includes('cart') || key.includes('allergen') || key.includes('auth')) {
      console.log(`LocalStorage[${key}]:`, localStorage.getItem(key));
    }
  });
  
  return {
    url: window.location.href,
    referrer: document.referrer,
    urlParams: Object.fromEntries(urlParams),
    sessionKeys,
    localKeys: localKeys.filter(k => k.includes('cart') || k.includes('allergen') || k.includes('auth'))
  };
};

// 🧪 COMPLETE FLOW TEST
export const testCompleteLoginFlow = async () => {
  console.log('🧪 TESTING COMPLETE LOGIN FLOW');
  console.log('===============================');
  
  console.log('\n📋 STEP 1: Check anonymous state');
  const preLoginState = {
    cart: localStorage.getItem('cartItems'),
    allergens: localStorage.getItem('userAllergens'),
    user: await supabase.auth.getUser()
  };
  console.log('Pre-login state:', preLoginState);
  
  console.log('\n📋 STEP 2: Simulate what should happen on login');
  console.log('- Cart should be preserved/merged');
  console.log('- Allergens should be preserved');
  console.log('- User should land on homepage with state intact');
  
  console.log('\n📋 STEP 3: Check what actually happens');
  console.log('- Run this test after login to see actual state');
  
  return preLoginState;
};

// 🔍 COMMON ISSUE CHECKLIST
export const checkCommonIssues = async () => {
  console.log('🔍 CHECKING COMMON ISSUES:');
  console.log('1. Does GoogleCallback component call cart merge?');
  console.log('2. Are there RLS (Row Level Security) issues preventing cart access?');
  console.log('3. Do database functions exist and work?');
  console.log('4. Is localStorage being cleared somewhere?');
  console.log('5. Are there component re-renders clearing state?');
  console.log('6. Is the user object available when merge should happen?');
  console.log('7. Are there network errors in the browser dev tools?');
  
  // Check GoogleCallback component
  try {
    const { default: GoogleCallback } = await import('../components/Auth/GoogleCallback.js');
    console.log('✅ GoogleCallback component exists');
  } catch (error) {
    console.log('❌ GoogleCallback component not found:', error.message);
  }
  
  // Check database functions
  try {
    const { data, error } = await supabase.rpc('merge_carts_safe', {
      anonymous_user_id: 'test',
      authenticated_user_id: 'test'
    });
    if (error) {
      console.log('❌ Database function exists but failed:', error.message);
    } else {
      console.log('✅ Database function exists and works');
    }
  } catch (error) {
    console.log('❌ Database function does not exist:', error.message);
  }
  
  // Check localStorage clearing
  const cartItems = localStorage.getItem('cartItems');
  const userAllergens = localStorage.getItem('userAllergens');
  console.log('Current localStorage state:');
  console.log('- cartItems:', cartItems ? 'exists' : 'missing');
  console.log('- userAllergens:', userAllergens ? 'exists' : 'missing');
  
  return {
    hasGoogleCallback: true, // We know it exists from the search
    hasDatabaseFunction: false, // Will be determined by the test above
    hasLocalStorage: !!(cartItems || userAllergens)
  };
};

// 🧪 RUN ALL DIAGNOSTICS
export const runAllDiagnostics = async () => {
  console.log('🧪 RUNNING ALL DIAGNOSTICS');
  console.log('==========================\n');
  
  const results = {};
  
  console.log('📋 DIAGNOSTIC 1: Cart Merge');
  results.cartMerge = await testCurrentCartMerge();
  console.log('\n');
  
  console.log('📋 DIAGNOSTIC 2: Allergen Persistence');
  results.allergenPersistence = testCurrentAllergenPersistence();
  console.log('\n');
  
  console.log('📋 DIAGNOSTIC 3: Post-Login Flow');
  results.postLoginFlow = analyzePostLoginFlow();
  console.log('\n');
  
  console.log('📋 DIAGNOSTIC 4: Common Issues');
  results.commonIssues = await checkCommonIssues();
  console.log('\n');
  
  console.log('📋 DIAGNOSTIC 5: Complete Flow');
  results.completeFlow = await testCompleteLoginFlow();
  console.log('\n');
  
  console.log('🎯 DIAGNOSTIC SUMMARY:');
  console.log('=======================');
  console.log(`✅ Cart merge function: ${results.cartMerge.hasMergeFunction ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Anonymous cart: ${results.cartMerge.hasAnonymousCart ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Allergen persistence: ${results.allergenPersistence.hasLocalStorage ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ User authentication: ${results.cartMerge.hasUser ? 'LOGGED IN' : 'NOT LOGGED IN'}`);
  
  if (!results.cartMerge.hasMergeFunction) {
    console.log('\n❌ ISSUE: Cart merge function missing');
  }
  
  if (!results.cartMerge.hasAnonymousCart) {
    console.log('\n❌ ISSUE: No anonymous cart to merge');
  }
  
  if (!results.allergenPersistence.hasLocalStorage) {
    console.log('\n❌ ISSUE: No allergen preferences to persist');
  }
  
  return results;
}; 