# 🎯 Frontend Integration Guide for Dynable RBAC System

**Author:** Justin Linzan  
**Date:** June 2025  
**Purpose:** Guide for updating existing components to use new role-based authentication

---

## ✅ **Priority 1 Complete: Frontend State Management**

The `src/redux/authSlice.js` has been successfully updated with:

### **🆕 New Features Added:**
- ✅ Role-based state management (`role`, `isVerifiedSeller`, `convertedFromAnonymous`)
- ✅ Supabase token support (`supabaseToken`)
- ✅ Backward compatibility with existing tokens
- ✅ Role-based selectors for components
- ✅ Permission-based selectors
- ✅ Utility selectors for common use cases

### **🔄 Backward Compatibility:**
- ✅ Handles both old and new token formats
- ✅ Graceful fallbacks for missing role information
- ✅ Legacy token support with default role assignment

---

## 📋 **Priority 2: Component Updates Required**

### **2.1 Components That Need Updates**

#### **🔴 HIGH PRIORITY (Critical for RBAC):**

1. **`src/components/Auth/ProtectedRoute.js`** - ⚠️ **NEEDS UPDATE**
   - **Current**: Basic authentication check
   - **Needed**: Role-based route protection
   - **Impact**: Route access control

2. **`src/components/Auth/Profile.js`** - ⚠️ **NEEDS UPDATE**
   - **Current**: Basic profile display
   - **Needed**: Role information, seller store details
   - **Impact**: User experience

3. **`src/components/Auth/Login.js`** - ⚠️ **NEEDS UPDATE**
   - **Current**: Basic login handling
   - **Needed**: Role information handling
   - **Impact**: Login flow

4. **`src/components/Auth/GoogleCallback.js`** - ⚠️ **NEEDS UPDATE**
   - **Current**: Basic callback processing
   - **Needed**: Role data handling, identity linking
   - **Impact**: OAuth flow

#### **🟡 MEDIUM PRIORITY (Enhancement):**

5. **`src/components/Auth/Signup.js`** - ⚠️ **NEEDS UPDATE**
   - **Current**: Basic signup
   - **Needed**: Role support, identity linking
   - **Impact**: Registration flow

6. **`src/App.js`** - ⚠️ **NEEDS UPDATE**
   - **Current**: Basic auth state loading
   - **Needed**: Role-based initialization
   - **Impact**: App startup

---

## 🔧 **How to Update Existing Components**

### **2.2 Updated Selectors Available**

#### **Basic Auth Selectors:**
```javascript
import { 
    selectCurrentUser, 
    selectIsAuthenticated, 
    selectAuthToken,
    selectAuthLoading,
    selectAuthError 
} from '../../redux/authSlice';
```

#### **Role-Based Selectors:**
```javascript
import {
    selectUserRole,
    selectIsAdmin,
    selectIsSeller,
    selectIsEndUser,
    selectIsVerifiedSeller,
    selectConvertedFromAnonymous
} from '../../redux/authSlice';
```

#### **Permission-Based Selectors:**
```javascript
import {
    selectCanManageProducts,
    selectCanManageUsers,
    selectCanAccessAdminPanel,
    selectCanAccessSellerPanel,
    selectCanCheckout,
    selectCanSaveProfile
} from '../../redux/authSlice';
```

#### **Utility Selectors:**
```javascript
import {
    selectUserDisplayName,
    selectUserEmail,
    selectUserPicture,
    selectUserStoreInfo,
    selectNeedsRoleUpgrade,
    selectHasAnonymousHistory
} from '../../redux/authSlice';
```

### **2.3 Component Update Examples**

#### **Example 1: ProtectedRoute Component**
```javascript
// Before:
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// After:
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, role } = useSelector((state) => ({
        isAuthenticated: selectIsAuthenticated(state),
        role: selectUserRole(state)
    }));
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return <Navigate to="/unauthorized" replace />;
    }
    
    return children;
};
```

#### **Example 2: Profile Component**
```javascript
// Before:
const user = useSelector(selectCurrentUser);

// After:
const user = useSelector(selectCurrentUser);
const role = useSelector(selectUserRole);
const isVerifiedSeller = useSelector(selectIsVerifiedSeller);
const storeInfo = useSelector(selectUserStoreInfo);

// Display role information
{role && <p><strong>Role:</strong> {role}</p>}
{isVerifiedSeller && <p><strong>Verified Seller</strong></p>}
{storeInfo && (
    <div>
        <p><strong>Store:</strong> {storeInfo.store_name}</p>
        <p><strong>Description:</strong> {storeInfo.store_description}</p>
    </div>
)}
```

#### **Example 3: Login Component**
```javascript
// Before:
dispatch(setCredentials(data));

// After:
// Handle both old and new response formats
if (data.user && data.token) {
    if (data.user.role) {
        // New format with role information
        dispatch(setCredentials(data));
    } else {
        // Legacy format - use backward compatibility
        dispatch(setLegacyCredentials(data));
    }
}
```

### **2.4 New Actions Available**

#### **Role Management Actions:**
```javascript
import {
    updateRole,
    updateSellerStatus,
    setAnonymousConversion,
    setLegacyCredentials
} from '../../redux/authSlice';

// Update user role (admin only)
dispatch(updateRole({ role: 'seller', is_verified_seller: false }));

// Update seller status
dispatch(updateSellerStatus({ 
    is_verified_seller: true, 
    store_name: 'My Store',
    store_description: 'Best products ever'
}));

// Handle anonymous conversion
dispatch(setAnonymousConversion({
    converted_from_anonymous: true,
    anonymous_cart_data: cartData
}));
```

---

## 🚀 **Priority 2 Implementation Plan**

### **Step 1: Update ProtectedRoute (Critical)**
1. Add role-based route protection
2. Create role-specific route components
3. Add unauthorized route handling

### **Step 2: Update Profile Component**
1. Display role information
2. Add seller store details
3. Add role-based profile sections

### **Step 3: Update Login/GoogleCallback**
1. Handle role information in responses
2. Add identity linking support
3. Maintain backward compatibility

### **Step 4: Update App.js**
1. Handle role-based initialization
2. Add role-based routing
3. Update auth state loading

---

## 🔍 **Testing Checklist**

### **Backward Compatibility Tests:**
- [ ] Existing users can still log in
- [ ] Old tokens work until expiration
- [ ] Cart functionality remains intact
- [ ] Profile updates still work

### **New Functionality Tests:**
- [ ] Role information displays correctly
- [ ] Role-based route protection works
- [ ] Permission selectors return correct values
- [ ] Admin/seller features accessible appropriately

### **Integration Tests:**
- [ ] Google OAuth flow with role data
- [ ] Identity linking for anonymous users
- [ ] Role updates from admin panel
- [ ] Seller status updates

---

## 📝 **Migration Notes**

### **For Existing Components:**
1. **No Breaking Changes**: Existing selectors still work
2. **Enhanced Functionality**: New selectors available
3. **Gradual Migration**: Can update components incrementally
4. **Backward Compatible**: Old tokens work until expiration

### **For New Components:**
1. **Use Role-Based Selectors**: For permission checking
2. **Use Permission Selectors**: For feature access
3. **Use Utility Selectors**: For common user data
4. **Handle Role Updates**: For dynamic role changes

---

## 🎯 **Next Steps**

1. **Update ProtectedRoute Component** (Priority 1)
2. **Update Profile Component** (Priority 2)
3. **Update Login/GoogleCallback** (Priority 3)
4. **Test Integration** (Priority 4)

The auth state management is now ready for role-based functionality! 🚀 