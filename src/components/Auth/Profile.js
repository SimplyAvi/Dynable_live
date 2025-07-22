/**
 * Enhanced Profile Component with Role-Based Features
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * This component provides a role-aware user profile experience:
 * - Displays user role and role-specific information
 * - Shows seller store details for sellers
 * - Provides admin controls for admin users
 * - Offers role upgrade options for eligible users
 * - Maintains backward compatibility with existing functionality
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/authSlice';
import { 
    selectUserRole,
    selectIsAdmin,
    selectIsSeller,
    selectIsVerifiedSeller,
    selectUserStoreInfo,
    selectConvertedFromAnonymous
} from '../../redux/authSlice';
import FormInput from '../FormInput';
import './Auth.css';

const Profile = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isStoreEditing, setIsStoreEditing] = useState(false);
    const [storeName, setStoreName] = useState('');
    const [storeDescription, setStoreDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Enhanced selectors for role-based features
    const user = useSelector((state) => state.auth.user);
    const userRole = useSelector(selectUserRole);
    const isAdmin = useSelector(selectIsAdmin);
    const isSeller = useSelector(selectIsSeller);
    const isVerifiedSeller = useSelector(selectIsVerifiedSeller);
    const storeInfo = useSelector(selectUserStoreInfo);
    const convertedFromAnonymous = useSelector(selectConvertedFromAnonymous);

    useEffect(() => {
        if (user) {
            setEmail(user.email);
            setName(user.name || '');
            setStoreName(user.store_name || '');
            setStoreDescription(user.store_description || '');
        }
    }, [user]);

    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await fetch('http://localhost:5001/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
            dispatch(logout());
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            alert('An error occurred during logout.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5001/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ name, email }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                // TODO: Update user in Redux store
                setIsEditing(false);
                alert('Profile updated successfully!');
            } else {
                alert('Failed to update profile. Please try again.');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            alert('An error occurred while updating profile.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStore = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5001/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ 
                    store_name: storeName, 
                    store_description: storeDescription 
                }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                // TODO: Update user in Redux store
                setIsStoreEditing(false);
                alert('Store information updated successfully!');
            } else {
                alert('Failed to update store information. Please try again.');
            }
        } catch (error) {
            console.error('Store update error:', error);
            alert('An error occurred while updating store information.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyForSeller = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5001/api/auth/apply-seller', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                alert('Seller application submitted successfully! You can now manage products.');
                // Refresh the page to update role information
                window.location.reload();
            } else {
                alert('Failed to submit seller application. Please try again.');
            }
        } catch (error) {
            console.error('Seller application error:', error);
            alert('An error occurred while submitting seller application.');
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleBadge = () => {
        const roleConfig = {
            admin: { label: '👑 Admin', color: '#ff6b6b', bgColor: '#ffe6e6' },
            seller: { label: '🛒 Seller', color: '#4ecdc4', bgColor: '#e6f7f6' },
            end_user: { label: '👤 User', color: '#45b7d1', bgColor: '#e6f4f8' }
        };
        
        const config = roleConfig[userRole] || roleConfig.end_user;
        return (
            <div 
                className="role-badge"
                style={{ 
                    backgroundColor: config.bgColor, 
                    color: config.color,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'inline-block',
                    marginBottom: '10px'
                }}
            >
                {config.label}
                {isVerifiedSeller && userRole === 'seller' && (
                    <span style={{ marginLeft: '5px' }}>✅</span>
                )}
            </div>
        );
    };

    const renderRoleSpecificSection = () => {
        switch (userRole) {
            case 'admin':
                return (
                    <div className="role-section admin-section">
                        <h3>👑 Admin Controls</h3>
                        <div className="admin-actions">
                            <button 
                                className="auth-button primary"
                                onClick={() => navigate('/admin/users')}
                            >
                                👥 Manage Users
                            </button>
                            <button 
                                className="auth-button primary"
                                onClick={() => navigate('/admin/sellers')}
                            >
                                🛒 Manage Sellers
                            </button>
                            <button 
                                className="auth-button primary"
                                onClick={() => navigate('/admin/analytics')}
                            >
                                📊 System Analytics
                            </button>
                        </div>
                    </div>
                );

            case 'seller':
                return (
                    <div className="role-section seller-section">
                        <h3>🛒 Seller Dashboard</h3>
                        <div className="seller-status">
                            <p><strong>Verification Status:</strong> 
                                {isVerifiedSeller ? ' ✅ Verified' : ' ⏳ Pending'}
                            </p>
                        </div>
                        
                        {isStoreEditing ? (
                            <form onSubmit={handleUpdateStore} className="store-form">
                                <FormInput
                                    type="text"
                                    value={storeName}
                                    handleChange={(e) => setStoreName(e.target.value)}
                                    label="Store Name"
                                />
                                <FormInput
                                    type="textarea"
                                    value={storeDescription}
                                    handleChange={(e) => setStoreDescription(e.target.value)}
                                    label="Store Description"
                                />
                                <div className="profile-buttons">
                                    <button type="submit" className="auth-button" disabled={isLoading}>
                                        {isLoading ? 'Saving...' : 'Save Store Info'}
                                    </button>
                                    <button
                                        type="button"
                                        className="auth-button secondary"
                                        onClick={() => setIsStoreEditing(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="store-info">
                                <p><strong>Store Name:</strong> {storeInfo.store_name || 'Not set'}</p>
                                <p><strong>Store Description:</strong> {storeInfo.store_description || 'Not set'}</p>
                                <div className="seller-actions">
                                    <button 
                                        className="auth-button"
                                        onClick={() => setIsStoreEditing(true)}
                                    >
                                        Edit Store Info
                                    </button>
                                    <button 
                                        className="auth-button primary"
                                        onClick={() => navigate('/seller/products')}
                                    >
                                        Manage Products
                                    </button>
                                    <button 
                                        className="auth-button primary"
                                        onClick={() => navigate('/seller/analytics')}
                                    >
                                        View Analytics
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'end_user':
                return (
                    <div className="role-section user-section">
                        <h3>👤 User Options</h3>
                        <div className="user-actions">
                            <button 
                                className="auth-button primary"
                                onClick={handleApplyForSeller}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Applying...' : '🛒 Become a Seller'}
                            </button>
                            <button 
                                className="auth-button secondary"
                                onClick={() => navigate('/orders')}
                            >
                                📦 View Orders
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (!user) {
        return <div className="auth-container">Loading...</div>;
    }

    return (
        <div className="auth-container">
            <div className="auth-box profile-enhanced">
                <div className="profile-header">
                    <h2>Profile</h2>
                    {getRoleBadge()}
                    {convertedFromAnonymous && (
                        <div className="conversion-notice">
                            <p>🔄 Converted from anonymous user</p>
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <form onSubmit={handleUpdateProfile} className="profile-form">
                        <FormInput
                            type="text"
                            value={name}
                            handleChange={(e) => setName(e.target.value)}
                            label="Name"
                        />
                        <FormInput
                            type="email"
                            value={email}
                            handleChange={(e) => setEmail(e.target.value)}
                            label="Email"
                        />
                        <div className="profile-buttons">
                            <button type="submit" className="auth-button" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                className="auth-button secondary"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-content">
                        <div className="profile-info">
                            <p><strong>Name:</strong> {name}</p>
                            <p><strong>Email:</strong> {email}</p>
                            <p><strong>Role:</strong> {userRole}</p>
                            {userRole === 'seller' && (
                                <>
                                    <p><strong>Store Name:</strong> {storeInfo.store_name || 'Not set'}</p>
                                    <p><strong>Verification:</strong> {isVerifiedSeller ? '✅ Verified' : '⏳ Pending'}</p>
                                </>
                            )}
                        </div>

                        <div className="profile-actions">
                            <button
                                className="auth-button"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Profile
                            </button>
                            <button
                                className="auth-button secondary"
                                onClick={handleLogout}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Logging out...' : 'Logout'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Role-specific sections */}
                {renderRoleSpecificSection()}
            </div>
        </div>
    );
};

export default Profile; 