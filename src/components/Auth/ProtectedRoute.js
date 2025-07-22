/**
 * Enhanced Protected Route Component with Role-Based Access Control
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * This component provides route protection for authenticated users:
 * - Basic authentication check (backward compatible)
 * - Role-based route protection (new)
 * - Convenience components for common role patterns
 * - Unauthorized access handling
 * 
 * Usage Examples:
 * // Basic protection (current - still works)
 * <ProtectedRoute>
 *   <Profile />
 * </ProtectedRoute>
 * 
 * // Role-based protection (new)
 * <ProtectedRoute allowedRoles={['admin']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * // Convenience components (new)
 * <AdminRoute>
 *   <AdminDashboard />
 * </AdminRoute>
 * 
 * <SellerRoute>
 *   <SellerDashboard />
 * </SellerRoute>
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
    selectIsAuthenticated, 
    selectUserRole,
    selectIsAdmin,
    selectIsSeller,
    selectIsVerifiedSeller
} from '../../redux/authSlice';

/**
 * Enhanced ProtectedRoute component with role-based protection
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string[]} props.allowedRoles - Array of allowed roles (optional)
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 * @param {React.ReactNode} props.fallback - Fallback component for unauthorized access
 */
const ProtectedRoute = ({ 
    children, 
    allowedRoles = [], 
    requireAuth = true,
    fallback = null 
}) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const userRole = useSelector(selectUserRole);

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If specific roles are required
    if (allowedRoles.length > 0) {
        const hasRequiredRole = allowedRoles.includes(userRole);
        
        if (!hasRequiredRole) {
            // Return fallback component or redirect to unauthorized page
            if (fallback) {
                return fallback;
            }
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return children;
};

/**
 * Admin-only route component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {React.ReactNode} props.fallback - Fallback component for unauthorized access
 */
export const AdminRoute = ({ children, fallback = null }) => {
    const isAdmin = useSelector(selectIsAdmin);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        if (fallback) {
            return fallback;
        }
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

/**
 * Seller-only route component (includes admin)
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {React.ReactNode} props.fallback - Fallback component for unauthorized access
 * @param {boolean} props.requireVerified - Whether seller must be verified (default: false)
 */
export const SellerRoute = ({ children, fallback = null, requireVerified = false }) => {
    const isSeller = useSelector(selectIsSeller);
    const isVerifiedSeller = useSelector(selectIsVerifiedSeller);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check if user is a seller
    if (!isSeller) {
        if (fallback) {
            return fallback;
        }
        return <Navigate to="/unauthorized" replace />;
    }

    // If verification is required, check seller verification status
    if (requireVerified && !isVerifiedSeller) {
        if (fallback) {
            return fallback;
        }
        return <Navigate to="/seller/verification-required" replace />;
    }

    return children;
};

/**
 * Verified seller-only route component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {React.ReactNode} props.fallback - Fallback component for unauthorized access
 */
export const VerifiedSellerRoute = ({ children, fallback = null }) => {
    return (
        <SellerRoute requireVerified={true} fallback={fallback}>
            {children}
        </SellerRoute>
    );
};

/**
 * Authenticated user route component (excludes anonymous users)
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {React.ReactNode} props.fallback - Fallback component for unauthorized access
 */
export const AuthenticatedRoute = ({ children, fallback = null }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const convertedFromAnonymous = useSelector(state => state.auth.convertedFromAnonymous);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check if user was converted from anonymous (optional check)
    if (convertedFromAnonymous) {
        // You can add special handling for converted users if needed
        // For now, we'll allow them access
    }

    return children;
};

/**
 * End user route component (regular authenticated users)
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {React.ReactNode} props.fallback - Fallback component for unauthorized access
 */
export const EndUserRoute = ({ children, fallback = null }) => {
    const userRole = useSelector(selectUserRole);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Only allow end_user role (not admin or seller)
    if (userRole !== 'end_user') {
        if (fallback) {
            return fallback;
        }
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

/**
 * Optional authentication route component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {React.ReactNode} props.fallback - Fallback component for unauthenticated users
 */
export const OptionalAuthRoute = ({ children, fallback = null }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);

    if (!isAuthenticated && fallback) {
        return fallback;
    }

    return children;
};

// Export the main ProtectedRoute component as default
export default ProtectedRoute; 