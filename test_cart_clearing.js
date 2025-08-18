// Browser-compatible cart clearing test functions
console.log('🧪 Cart Clearing Test Functions Loaded');

// Simple test function to check cart clearing functionality
window.testCompleteSystem = () => {
  console.log('🧪 Testing complete system...');
  
  // Check current cart state
  const cartState = window.store.getState().anonymousCart;
  console.log('📦 Current cart state:', {
    items: cartState.items,
    itemsCount: cartState.items.length,
    isAnonymous: cartState.isAnonymous,
    isLoggingOut: cartState.isLoggingOut,
    session: cartState.session ? 'exists' : 'null'
  });
  
  // Check auth state
  const authState = window.store.getState().auth;
  console.log('🔐 Current auth state:', {
    isAuthenticated: authState.isAuthenticated,
    currentUser: authState.currentUser ? 'exists' : 'null'
  });
  
  // Check products state
  const productsState = window.store.getState().products;
  console.log('🛍️ Current products state:', {
    products: productsState.products ? 'exists' : 'null',
    loading: productsState.loading
  });
  
  console.log('✅ System test completed!');
  return 'System test completed successfully';
};

// Manual cart clearing functions
window.manualClearCart = () => {
  const store = window.store;
  store.dispatch({ type: 'anonymousCart/forceClear' });
  store.dispatch({ type: 'anonymousCart/logout' });
  console.log('Cart manually cleared with force clear');
  console.log('New cart state:', store.getState().anonymousCart);
};

window.emergencyClearCart = () => {
  const store = window.store;
  const state = store.getState();
  console.log('Cart before emergency clear:', state.anonymousCart.items.length);
  console.log('Is logging out before:', state.anonymousCart.isLoggingOut);
  
  // Force clear all cart state
  store.dispatch({ type: 'anonymousCart/forceClear' });
  
  const newState = store.getState();
  console.log('Cart after emergency clear:', newState.anonymousCart.items.length);
  console.log('Is logging out after:', newState.anonymousCart.isLoggingOut);
  return newState.anonymousCart;
};

// Test logout flag functionality
window.testLogoutFlag = () => {
  const store = window.store;
  const state = store.getState();
  console.log('Current logout flag:', state.anonymousCart.isLoggingOut);
  console.log('Current cart items:', state.anonymousCart.items.length);
  
  // Set logout flag
  store.dispatch({ type: 'anonymousCart/logout' });
  
  const newState = store.getState();
  console.log('After logout action:');
  console.log('- Logout flag:', newState.anonymousCart.isLoggingOut);
  console.log('- Cart items:', newState.anonymousCart.items.length);
  console.log('- Is anonymous:', newState.anonymousCart.isAnonymous);
};

// Test timing and race condition fixes
window.testTimingFix = () => {
  console.log('Testing timing and race condition fixes...');
  console.log('Expected sequence after logout:');
  console.log('1. Redux state cleared');
  console.log('2. Database cart cleared');
  console.log('3. Anonymous auth initialized');
  console.log('4. Cart fetch delayed by 1 second');
  console.log('5. Empty cart fetched');
  
  const store = window.store;
  const state = store.getState();
  console.log('Current state:', {
    cartItems: state.anonymousCart.items.length,
    isLoggingOut: state.anonymousCart.isLoggingOut,
    isAnonymous: state.anonymousCart.isAnonymous,
    session: state.anonymousCart.session ? 'exists' : 'null'
  });
};

console.log('🧪 Available test functions:');
console.log('- window.testCompleteSystem() - Test complete system state');
console.log('- window.manualClearCart() - Manually clear cart');
console.log('- window.emergencyClearCart() - Emergency cart clear');
console.log('- window.testLogoutFlag() - Test logout flag');
console.log('- window.testTimingFix() - Test timing fixes'); 