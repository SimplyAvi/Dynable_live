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
import { supabase } from '../../utils/supabaseClient';
import './Auth.css';

const Profile = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isStoreEditing, setIsStoreEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userProfile, setUserProfile] = useState({
        name: '',
        email: '',
        role: 'authenticated'
    });
    const [storeName, setStoreName] = useState('');
    const [storeDescription, setStoreDescription] = useState('');
    const [userRole, setUserRole] = useState('authenticated');
    const [isVerifiedSeller, setIsVerifiedSeller] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user && user.email) {
                try {
                    // Fetch user data from Users table
                    const { data: userData, error } = await supabase
                        .from('Users')
                        .select('*')
                        .eq('email', user.email)
                        .single();

                    if (error) {
                        console.error('Error fetching user data:', error);
                        // If user doesn't exist in Users table, create them
                        if (error.code === 'PGRST116') {
                            console.log('User not found in Users table, creating user...');
                            const { data: newUser, error: createError } = await supabase
                                .from('Users')
                                .insert({
                                    supabase_user_id: user.id, // Use Supabase UUID for secure RLS
                                    email: user.email,
                                    name: user.user_metadata?.name || '',
                                    role: 'end_user',
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString()
                                })
                                .select()
                                .single();

                            if (createError) {
                                console.error('Error creating user:', createError);
                                // Fallback to Supabase auth user data
                                setUserProfile({
                                    name: user.user_metadata?.name || '',
                                    email: user.email || '',
                                    role: user.user_metadata?.role || 'end_user'
                                });
                                setUserRole(user.user_metadata?.role || 'end_user');
                            } else {
                                // Use newly created user data
                                setUserProfile({
                                    name: newUser.name || '',
                                    email: newUser.email || '',
                                    role: newUser.role || 'end_user'
                                });
                                setUserRole(newUser.role || 'end_user');
                                setStoreName(newUser.store_name || '');
                                setStoreDescription(newUser.store_description || '');
                                setIsVerifiedSeller(newUser.is_verified_seller || false);
                            }
                        } else {
                            // Fallback to Supabase auth user data
                            setUserProfile({
                                name: user.user_metadata?.name || '',
                                email: user.email || '',
                                role: user.user_metadata?.role || 'end_user'
                            });
                            setUserRole(user.user_metadata?.role || 'end_user');
                        }
                    } else {
                        // Use data from Users table
                        setUserProfile({
                            name: userData.name || '',
                            email: userData.email || '',
                            role: userData.role || 'end_user'
                        });
                        setUserRole(userData.role || 'end_user');
                        setStoreName(userData.store_name || '');
                        setStoreDescription(userData.store_description || '');
                        setIsVerifiedSeller(userData.is_verified_seller || false);
                    }
                } catch (error) {
                    console.error('Error in fetchUserData:', error);
                    // Fallback to Supabase auth user data
                    setUserProfile({
                        name: user.user_metadata?.name || '',
                        email: user.email || '',
                        role: user.user_metadata?.role || 'end_user'
                    });
                    setUserRole(user.user_metadata?.role || 'end_user');
                }
            } else if (user && !user.email) {
                console.log('User has no email, using auth metadata only');
                // User is authenticated but has no email (Google OAuth issue)
                setUserProfile({
                    name: user.user_metadata?.name || '',
                    email: user.user_metadata?.email || '',
                    role: user.user_metadata?.role || 'end_user'
                });
                setUserRole(user.user_metadata?.role || 'end_user');
            }
        };

        fetchUserData();
    }, [user]);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            dispatch(logout());
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            
            // Update user data in Users table
            const { error } = await supabase
                .from('Users')
                .update({
                    name: userProfile.name,
                    role: userProfile.role
                })
                .eq('email', user.email);

            if (error) {
                throw error;
            }

            // Also update Supabase auth user metadata
            await supabase.auth.updateUser({
                data: {
                    name: userProfile.name,
                    role: userProfile.role
                }
            });

            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Profile update error:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStore = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            
            // Update store information in Users table
            const { error } = await supabase
                .from('Users')
                .update({
                    store_name: storeName,
                    store_description: storeDescription
                })
                .eq('email', user.email);

            if (error) {
                throw error;
            }

            setIsStoreEditing(false);
            alert('Store information updated successfully!');
        } catch (error) {
            console.error('Store update error:', error);
            alert('Failed to update store information. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyForSeller = async () => {
        try {
            setIsLoading(true);
            
            // Update user role to seller in Users table
            const { error } = await supabase
                .from('Users')
                .update({
                    role: 'seller'
                })
                .eq('email', user.email);

            if (error) {
                throw error;
            }

            setUserRole('seller');
            alert('Seller application submitted successfully! You can now manage products.');
        } catch (error) {
            console.error('Seller application error:', error);
            alert('Failed to submit seller application. Please try again.');
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
                                <div className="profile-form-group">
                                    <label>Store Name:</label>
                                    <input
                                        type="text"
                                        value={storeName}
                                        onChange={(e) => setStoreName(e.target.value)}
                                        className="profile-input"
                                    />
                                </div>
                                <div className="profile-form-group">
                                    <label>Store Description:</label>
                                    <textarea
                                        value={storeDescription}
                                        onChange={(e) => setStoreDescription(e.target.value)}
                                        className="profile-input"
                                    />
                                </div>
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
                                <p><strong>Store Name:</strong> {storeName || 'Not set'}</p>
                                <p><strong>Store Description:</strong> {storeDescription || 'Not set'}</p>
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

    const renderRolePrivileges = () => {
        const getPrivilegeIcon = (privilege) => {
            const icons = {
                'manage_users': '👥',
                'manage_sellers': '🛒',
                'view_analytics': '📊',
                'manage_products': '📦',
                'sell_products': '💰',
                'view_orders': '📋',
                'edit_profile': '✏️',
                'basic_access': '👤'
            };
            return icons[privilege] || '✅';
        };

        const getPrivilegeDescription = (privilege) => {
            const descriptions = {
                'manage_users': 'Manage all user accounts',
                'manage_sellers': 'Approve and manage seller accounts',
                'view_analytics': 'View system-wide analytics',
                'manage_products': 'Add and edit your products',
                'sell_products': 'Sell products on the platform',
                'view_orders': 'View your order history',
                'edit_profile': 'Edit your profile information',
                'basic_access': 'Browse and purchase products'
            };
            return descriptions[privilege] || privilege;
        };

        const getRolePrivileges = () => {
            const basePrivileges = ['edit_profile', 'basic_access'];
            
            switch (userRole) {
                case 'admin':
                    return [
                        ...basePrivileges,
                        'manage_users',
                        'manage_sellers', 
                        'view_analytics'
                    ];
                case 'seller':
                    return [
                        ...basePrivileges,
                        'manage_products',
                        'sell_products',
                        'view_orders'
                    ];
                case 'end_user':
                default:
                    return [
                        ...basePrivileges,
                        'view_orders'
                    ];
            }
        };

        const privileges = getRolePrivileges();

        return (
            <div className="role-privileges-section">
                <h3>🎯 Role Privileges</h3>
                <div className="privileges-grid">
                    {privileges.map((privilege, index) => (
                        <div key={index} className="privilege-item">
                            <div className="privilege-icon">
                                {getPrivilegeIcon(privilege)}
                            </div>
                            <div className="privilege-info">
                                <div className="privilege-name">
                                    {privilege.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                                <div className="privilege-description">
                                    {getPrivilegeDescription(privilege)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Role-specific status */}
                {userRole === 'seller' && (
                    <div className="seller-status-info">
                        <div className="status-item">
                            <span className="status-label">Verification Status:</span>
                            <span className={`status-value ${isVerifiedSeller ? 'verified' : 'pending'}`}>
                                {isVerifiedSeller ? '✅ Verified Seller' : '⏳ Pending Verification'}
                            </span>
                        </div>
                        {storeName && (
                            <div className="status-item">
                                <span className="status-label">Store Name:</span>
                                <span className="status-value">{storeName}</span>
                            </div>
                        )}
                    </div>
                )}
                
                {userRole === 'admin' && (
                    <div className="admin-status-info">
                        <div className="status-item">
                            <span className="status-label">Admin Level:</span>
                            <span className="status-value admin">👑 Full System Access</span>
                        </div>
                    </div>
                )}
            </div>
        );
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
                    {/* convertedFromAnonymous is removed as per new_code */}
                </div>

                {isEditing ? (
                    <form onSubmit={handleUpdateProfile} className="profile-form">
                        <div className="profile-form-group">
                            <label>Name:</label>
                            <input
                                type="text"
                                value={userProfile.name}
                                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                                className="profile-input"
                            />
                        </div>
                        <div className="profile-form-group">
                            <label>Email:</label>
                            <input
                                type="email"
                                value={userProfile.email}
                                onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                                className="profile-input"
                            />
                        </div>
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
                            <p><strong>Name:</strong> {userProfile.name}</p>
                            <p><strong>Email:</strong> {userProfile.email}</p>
                            <p><strong>Role:</strong> {userRole}</p>
                            {userRole === 'seller' && (
                                <>
                                    <p><strong>Store Name:</strong> {storeName || 'Not set'}</p>
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
                
                {/* Role Privileges Section */}
                {renderRolePrivileges()}
            </div>
        </div>
    );
};

export default Profile; 