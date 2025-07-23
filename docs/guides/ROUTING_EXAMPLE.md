# 🛣️ Role-Based Routing Example for Dynable RBAC System

**Author:** Justin Linzan  
**Date:** June 2025  
**Purpose:** Example implementation of role-based routing in App.js

---

## 📋 **Updated App.js Routing Example**

Here's how to implement role-based routing in your `src/App.js`:

```javascript
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from './redux/authSlice';
import { fetchAllergens } from './redux/allergiesSlice';
import { fetchCart, initializeAnonymousCart } from './redux/cartSlice';

// Import enhanced route protection components
import ProtectedRoute, { 
    AdminRoute, 
    SellerRoute, 
    VerifiedSellerRoute,
    AuthenticatedRoute,
    EndUserRoute,
    OptionalAuthRoute 
} from './components/Auth/ProtectedRoute';

// Import your existing components
import Homepage from './pages/Homepage';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Profile from './components/Auth/Profile';
import GoogleCallback from './components/Auth/GoogleCallback';
import CartPage from './pages/CartPage';
import ProductPage from './pages/ProductPage';
import RecipePage from './pages/RecipePage';
import AboutUsPage from './pages/AboutUsPage/AboutUsPage';

// Import new role-based components (to be created)
import AdminDashboard from './components/Admin/AdminDashboard';
import SellerDashboard from './components/Seller/SellerDashboard';
import UnauthorizedPage from './components/Auth/UnauthorizedPage';
import SellerVerificationPage from './components/Seller/SellerVerificationPage';

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  useEffect(() => {
    // Fetch allergens from database on app start
    dispatch(fetchAllergens());
  }, [dispatch]);

  useEffect(() => {
    // Load token from localStorage on app start
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch user profile to get user data
      fetch('http://localhost:5001/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(userData => {
        // Handle both old and new user formats
        if (userData.role) {
          // New format with role information
          dispatch(setCredentials({ user: userData, token }));
        } else {
          // Legacy format - use backward compatibility
          dispatch(setLegacyCredentials({ user: userData, token }));
        }
        // Always hydrate cart from backend after login
        dispatch(fetchCart());
      })
      .catch(error => {
        console.error('Error loading user profile:', error);
        localStorage.removeItem('token');
        // Do NOT call initializeAnonymousCart here!
        // Let the next effect run (with no token) and handle it.
      });
    } else if (!isAuthenticated) {
      // No token and not authenticated: treat as anonymous
      dispatch(initializeAnonymousCart());
    }
  }, [dispatch, isAuthenticated]);

  // Always fetch cart from backend when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[APP] User authenticated, fetching cart from backend');
      console.log('[APP] Current location:', window.location.pathname);
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<GoogleCallback />} />
          <Route path="/about" element={<AboutUsPage />} />
          
          {/* Product and Recipe Routes (Public) */}
          <Route path="/products" element={<ProductPage />} />
          <Route path="/recipes" element={<RecipePage />} />
          
          {/* Unauthorized Page */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Basic Protected Routes (Backward Compatible) */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/cart" 
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            } 
          />

          {/* Role-Based Protected Routes */}
          
          {/* Admin Routes */}
          <Route 
            path="/admin/*" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          
          {/* Seller Routes */}
          <Route 
            path="/seller/*" 
            element={
              <SellerRoute>
                <SellerDashboard />
              </SellerRoute>
            } 
          />
          
          {/* Verified Seller Routes */}
          <Route 
            path="/seller/verified/*" 
            element={
              <VerifiedSellerRoute>
                <SellerDashboard />
              </VerifiedSellerRoute>
            } 
          />
          
          {/* Seller Verification Page */}
          <Route 
            path="/seller/verification-required" 
            element={
              <SellerRoute>
                <SellerVerificationPage />
              </SellerRoute>
            } 
          />

          {/* End User Routes (Regular Users Only) */}
          <Route 
            path="/user/dashboard" 
            element={
              <EndUserRoute>
                <UserDashboard />
              </EndUserRoute>
            } 
          />

          {/* Authenticated Routes (Any Authenticated User) */}
          <Route 
            path="/orders" 
            element={
              <AuthenticatedRoute>
                <OrdersPage />
              </AuthenticatedRoute>
            } 
          />

          {/* Optional Auth Routes (Show different content for auth/unauth) */}
          <Route 
            path="/checkout" 
            element={
              <OptionalAuthRoute 
                fallback={<LoginPrompt />}
              >
                <CheckoutPage />
              </OptionalAuthRoute>
            } 
          />

          {/* Advanced Role-Based Protection Examples */}
          
          {/* Multiple Role Access */}
          <Route 
            path="/management/*" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'seller']}>
                <ManagementPanel />
              </ProtectedRoute>
            } 
          />
          
          {/* Custom Fallback for Unauthorized Access */}
          <Route 
            path="/premium/*" 
            element={
              <ProtectedRoute 
                allowedRoles={['admin', 'seller']}
                fallback={<UpgradePrompt />}
              >
                <PremiumFeatures />
              </ProtectedRoute>
            } 
          />

          {/* Conditional Routes Based on User State */}
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <OnboardingFlow />
              </ProtectedRoute>
            } 
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

---

## 🎯 **Usage Examples**

### **1. Basic Protection (Backward Compatible)**
```javascript
<ProtectedRoute>
  <Profile />
</ProtectedRoute>
```

### **2. Role-Based Protection**
```javascript
<ProtectedRoute allowedRoles={['admin']}>
  <AdminPanel />
</ProtectedRoute>

<ProtectedRoute allowedRoles={['admin', 'seller']}>
  <ManagementPanel />
</ProtectedRoute>
```

### **3. Convenience Components**
```javascript
<AdminRoute>
  <AdminDashboard />
</AdminRoute>

<SellerRoute>
  <SellerDashboard />
</SellerRoute>

<VerifiedSellerRoute>
  <VerifiedSellerDashboard />
</VerifiedSellerRoute>

<EndUserRoute>
  <UserDashboard />
</EndUserRoute>
```

### **4. Custom Fallbacks**
```javascript
<ProtectedRoute 
  allowedRoles={['admin']}
  fallback={<UpgradePrompt />}
>
  <PremiumFeatures />
</ProtectedRoute>
```

### **5. Optional Authentication**
```javascript
<OptionalAuthRoute fallback={<LoginPrompt />}>
  <CheckoutPage />
</OptionalAuthRoute>
```

---

## 🔧 **Component Implementation Examples**

### **UnauthorizedPage Component**
```javascript
// src/components/Auth/UnauthorizedPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../../redux/authSlice';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const userRole = useSelector(selectUserRole);

  return (
    <div className="unauthorized-page">
      <h1>Access Denied</h1>
      <p>You don't have permission to access this page.</p>
      <p>Your current role: {userRole}</p>
      <button onClick={() => navigate('/')}>Go Home</button>
      <button onClick={() => navigate('/profile')}>View Profile</button>
    </div>
  );
};

export default UnauthorizedPage;
```

### **SellerVerificationPage Component**
```javascript
// src/components/Seller/SellerVerificationPage.js
import React from 'react';
import { useSelector } from 'react-redux';
import { selectUserStoreInfo } from '../../redux/authSlice';

const SellerVerificationPage = () => {
  const storeInfo = useSelector(selectUserStoreInfo);

  return (
    <div className="seller-verification">
      <h1>Seller Verification Required</h1>
      <p>Your seller account is pending verification.</p>
      {storeInfo && (
        <div>
          <p><strong>Store Name:</strong> {storeInfo.store_name}</p>
          <p><strong>Description:</strong> {storeInfo.store_description}</p>
        </div>
      )}
      <p>Please contact support for verification assistance.</p>
    </div>
  );
};

export default SellerVerificationPage;
```

---

## 🚀 **Benefits of This Approach**

1. **Backward Compatibility**: Existing routes continue to work
2. **Flexible Protection**: Multiple levels of access control
3. **Clean Code**: Convenience components for common patterns
4. **Custom Fallbacks**: Graceful handling of unauthorized access
5. **Role-Based Logic**: Centralized in route components
6. **Easy Testing**: Each route type can be tested independently

The enhanced ProtectedRoute system is now ready for your RBAC implementation! 🎉 