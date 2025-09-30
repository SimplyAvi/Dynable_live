# 🔍 Debugging Allergen Filtering & Cart Issues

## Issues Reported:
1. ❌ Normal allergens are not filtering products
2. ❌ Cart items disappear after logout → login cycle

## Investigation Results:

### 1. **Allergen Filtering Analysis**

**From logs:**
```
AllergyFilter.js:237 [AllergyFilter] Search preferences changed: (2) ['shrimp', 'treeNuts']
AllergyFilter.js:483 [AllergyFilter] Tier system debug: {userRole: 'standard', isAuthenticated: true, currentAllergenCount: 2...}
```

**Evidence:**
- ✅ Allergens ARE being selected (shrimp, treeNuts)
- ✅ `searchPreferences.selectedAllergens` contains `['shrimp', 'treeNuts']`
- ✅ Tier system correctly identifies 2 allergens selected

**Potential Issue:**
The `isAllergenButtonDisabled` function is being called for EVERY allergen on EVERY render to determine the button's disabled state. This is called in the render cycle (lines 603-607) for each of the 19 allergen buttons.

**Why this might break filtering:**
Looking at line 483, the tier validation is happening, but the actual **allergen toggle** logic might be getting blocked or the `setSelectedAllergens` dispatch might not be working properly.

**Need to check:**
1. Is `setSelectedAllergens` actually updating Redux?
2. Is Homepage receiving the updated `selectedAllergens`?
3. Is the query being called with the correct allergens?

### 2. **Cart Persistence Analysis**

**From debug script:**
```
2️⃣ CHECKING CART DATA:
⚠️ No cart items found
   Error: invalid input syntax for type integer: "dbdd91b7-862e-4f07-85f9-c821128a9d4d"

3️⃣ CHECKING LEGACY CART STORAGE:
✅ User data found:
   Legacy cart data: 1 items
```

**Evidence:**
- ❌ Carts table query FAILS (userId is integer, but we're passing UUID string)
- ✅ Legacy cart storage (`anonymous_cart_data` in Users table) HAS 1 item

**Root Cause:**
The `Carts` table has two columns:
- `userId` (integer) - Legacy column
- `supabase_user_id` (UUID) - New column for Supabase Auth

The cart queries are using `userId` (integer) instead of `supabase_user_id` (UUID).

**Need to fix:**
1. Update cart queries to use `supabase_user_id` instead of `userId`
2. OR update cart queries to use email-based access (like we did for Users table)

## Recommended Fixes:

### Fix 1: Allergen Filtering
**Remove the `isAllergenButtonDisabled` call from render cycle** - move the disabled state calculation to a memoized value or only check when needed.

### Fix 2: Cart Persistence  
**Update cart queries to use `supabase_user_id`** or implement email-based fallback similar to custom allergens.
