/**
 * Unauthorized Page Component
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * This component displays when users try to access pages they don't have permission for:
 * - Shows current user role
 * - Provides navigation options
 * - Explains why access was denied
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUserRole, selectUserDisplayName } from '../../redux/authSlice';
import './Auth.css';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const userRole = useSelector(selectUserRole);
  const userDisplayName = useSelector(selectUserDisplayName);

  return (
    <div className="auth-container">
      <div className="auth-box unauthorized-page">
        <h2>🚫 Access Denied</h2>
        
        <div className="unauthorized-content">
          <p>Sorry, {userDisplayName}, you don't have permission to access this page.</p>
          
          <div className="role-info">
            <p><strong>Your current role:</strong> {userRole || 'Unknown'}</p>
            <p><strong>Required permissions:</strong> Not available for your role</p>
          </div>

          <div className="unauthorized-actions">
            <button 
              className="auth-button primary"
              onClick={() => navigate('/')}
            >
              🏠 Go Home
            </button>
            
            <button 
              className="auth-button secondary"
              onClick={() => navigate('/profile')}
            >
              👤 View Profile
            </button>
            
            {userRole === 'end_user' && (
              <button 
                className="auth-button secondary"
                onClick={() => navigate('/seller/apply')}
              >
                🛒 Become a Seller
              </button>
            )}
            
            {userRole === 'seller' && (
              <button 
                className="auth-button secondary"
                onClick={() => navigate('/seller/verification-required')}
              >
                ✅ Check Verification Status
              </button>
            )}
          </div>

          <div className="help-section">
            <h3>Need Help?</h3>
            <p>If you believe you should have access to this page:</p>
            <ul>
              <li>Contact support for role upgrades</li>
              <li>Check your account verification status</li>
              <li>Review your current permissions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage; 