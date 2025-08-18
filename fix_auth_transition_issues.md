# 🔧 FIX AUTH TRANSITION AND ALLERGEN PERSISTENCE ISSUES

## **🎯 ISSUES IDENTIFIED:**

### **Issue 1: Allergen Persistence Across Login/Logout**
- Allergens selected as anonymous user are not preserved when logging in
- Allergens are lost when logging out
- Merge function is calling wrong database function name

### **Issue 2: Query Timeout After Logout**
- Auth transitions cause query cancellations
- 1-second delay before queries can resume is too short
- Products not loading after logout due to timeout

## **🔧 FIXES REQUIRED:**

### **Fix 1: Update GoogleCallback.js**
The merge function is calling `merge_search_preferences_safe` but should call `merge_search_preferences`.

**File:** `src/components/Auth/GoogleCallback.js`
**Line:** ~170
**Change:** Update function call to use correct name

### **Fix 2: Improve Auth Transition Handling**
Increase the auth transition delay and improve error handling.

**File:** `src/pages/Homepage.js`
**Changes needed:**
- Increase auth transition delay from 1s to 2s
- Add better error handling for cancelled queries
- Add fallback allergen loading from localStorage

### **Fix 3: Add Allergen State Preservation**
Ensure allergens are preserved during auth transitions.

**File:** `src/components/AllergyFilter/AllergyFilter.js`
**Changes needed:**
- Add localStorage fallback for allergen persistence
- Improve state synchronization during auth transitions

## **🎯 TESTING STEPS:**

### **Test Allergen Persistence:**
1. **As anonymous user:** Select some allergens (milk, treeNuts, etc.)
2. **Login with Google:** Check if allergens are preserved
3. **Logout:** Check if allergens are still selected
4. **Check console:** Look for merge success messages

### **Test Query Performance:**
1. **After logout:** Check if products load without timeout
2. **During auth transitions:** Check for proper error handling
3. **Check console:** Look for successful data loading

## **✅ SUCCESS CRITERIA:**
- Allergens persist across login/logout
- No query timeouts after logout
- Smooth auth transitions without data loss
- Console shows success messages for merges 