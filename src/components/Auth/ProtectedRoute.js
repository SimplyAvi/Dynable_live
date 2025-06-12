/**
 * Protected Route Component
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * This component provides route protection for authenticated users:
 * - Checks authentication status using Redux state
 * - Redirects to login page if user is not authenticated
 * - Renders child components if user is authenticated
 * 
 * Usage:
 * <ProtectedRoute>
 *   <YourProtectedComponent />
 * </ProtectedRoute>
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../redux/authSlice';

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute; 