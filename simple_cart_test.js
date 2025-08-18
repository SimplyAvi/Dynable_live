// 🧪 SIMPLE CART TEST
// Run this in the browser console to quickly check cart state

console.log('🧪 Simple Cart Test');

// Quick cart state check
const store = window.store;
const cartState = store.getState().anonymousCart;

console.log('Current cart state:');
console.log('- Items count:', cartState.items.length);
console.log('- Is anonymous:', cartState.isAnonymous);
console.log('- Is logging out:', cartState.isLoggingOut);
console.log('- Session:', cartState.session ? 'exists' : 'null');

if (cartState.items.length > 0) {
    console.log('❌ CART IS PERSISTING - Items found:', cartState.items);
} else {
    console.log('✅ CART IS CLEAR - No items found');
}

// Check if we're in a proper anonymous state
if (!cartState.isAnonymous && !cartState.session && cartState.items.length === 0) {
    console.log('✅ Proper anonymous state detected');
} else {
    console.log('❌ Improper state detected');
    console.log('- Should be anonymous:', cartState.isAnonymous);
    console.log('- Should have no session:', !cartState.session);
    console.log('- Should have no items:', cartState.items.length === 0);
} 