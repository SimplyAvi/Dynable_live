/**
 * Google Authentication Implementation with RBAC and Identity Linking
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * This file contains all authentication routes:
 * - Google OAuth callback handling with People API integration
 * - User registration and login with role-based access control
 * - Profile management with role-based permissions
 * - JWT token generation with role claims
 * - Identity linking for anonymous to authenticated conversion
 * - Admin and seller management endpoints
 * 
 * Recent Changes:
 * - Added RBAC support with role-based JWT tokens
 * - Integrated identity linking for anonymous user conversion
 * - Added admin endpoints for user management
 * - Added seller application and management
 * - Enhanced error handling and logging
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../db/models/User');

// Import RBAC utilities
const { 
    generateToken, 
    generateSupabaseToken, 
    extractUserFromToken,
    hasRole,
    isAdmin,
    isSeller 
} = require('../utils/jwt');

const { 
    requireAdmin, 
    requireSeller, 
    requireAuthenticated,
    requireVerifiedSeller,
    authenticateToken 
} = require('../middleware/roleAuth');

const {
    linkAnonymousToAuthenticated,
    isConvertedFromAnonymous,
    getAnonymousCartData,
    cleanupAnonymousData
} = require('../utils/identityLinking');

// Debug log to verify environment variables
console.log('OAuth Configuration:', {
    clientId: process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: 'http://localhost:5001/api/auth/google/callback',
    envKeys: Object.keys(process.env).filter(key => key.includes('GOOGLE'))
});

// Google OAuth client
const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:5001/api/auth/google/callback'
);

// Register new user with role assignment
router.post('/auth/signup', async (req, res) => {
    try {
        const { email, password, anonymousUserId, cartData } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user with default role
        const user = await User.create({
            email,
            password: hashedPassword,
            role: 'end_user', // Default role
        });

        // Handle identity linking if anonymous user is converting
        if (anonymousUserId && cartData) {
            const linkResult = await linkAnonymousToAuthenticated(anonymousUserId, user.id, cartData);
            if (linkResult.success) {
                console.log('Successfully linked anonymous user to authenticated account');
            } else {
                console.error('Identity linking failed:', linkResult.error);
                // Continue with user creation even if linking fails
            }
        }

        // Generate enhanced JWT tokens
        const token = generateToken(user);
        const supabaseToken = generateSupabaseToken(user);

        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                is_verified_seller: user.is_verified_seller,
                converted_from_anonymous: user.converted_from_anonymous,
            },
            token,
            supabaseToken,
            message: anonymousUserId ? 'Account created and cart transferred successfully' : 'Account created successfully'
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Login user with role-based response
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate enhanced JWT tokens
        const token = generateToken(user);
        const supabaseToken = generateSupabaseToken(user);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                is_verified_seller: user.is_verified_seller,
                converted_from_anonymous: user.converted_from_anonymous,
            },
            token,
            supabaseToken,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Google OAuth callback route with RBAC
router.get('/auth/google/callback', async (req, res) => {
    try {
        const { code, state, anonymousUserId, cartData } = req.query;
        if (!code) {
            return res.status(400).json({ error: 'No code provided' });
        }

        console.log('Step 1: Received authorization code from Google');

        // Exchange the code for tokens
        let tokens;
        try {
            const tokenResponse = await client.getToken(code);
            tokens = tokenResponse.tokens;
            console.log('Step 2: Successfully exchanged code for tokens');
        } catch (tokenError) {
            console.error('Token exchange error:', tokenError);
            
            // Enhanced error handling for token exchange failures
            if (tokenError.message.includes('invalid_request')) {
                console.error('Invalid request error - possible causes:');
                console.error('- Expired authorization code');
                console.error('- Incorrect redirect URI');
                console.error('- Invalid client configuration');
                
                return res.status(400).json({ 
                    error: 'Authentication failed',
                    details: 'Token exchange failed: invalid_request - Please try logging in again',
                    code: 'INVALID_REQUEST'
                });
            }
            
            throw new Error(`Token exchange failed: ${tokenError.message}`);
        }

        // Get user info from Google People API
        try {
            console.log('Step 3: Fetching user info from People API');
            const userInfoResponse = await fetch('https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos', {
                headers: { 
                    'Authorization': `Bearer ${tokens.access_token}`,
                    'Accept': 'application/json'
                }
            });

            if (!userInfoResponse.ok) {
                throw new Error(`People API error: ${userInfoResponse.statusText}`);
            }

            const userInfo = await userInfoResponse.json();
            console.log('Step 4: Successfully fetched user info from People API');
            
            // Extract user information
            const email = userInfo.emailAddresses?.[0]?.value;
            const name = userInfo.names?.[0]?.displayName;
            const picture = userInfo.photos?.[0]?.url;
            const googleId = userInfo.resourceName?.split('/')?.[1];

            if (!email) {
                throw new Error('Invalid Google token or missing email');
            }

            // Check if user exists
            let user = await User.findOne({ where: { email } });

            // If user doesn't exist, create new user
            if (!user) {
                user = await User.create({
                    email,
                    name,
                    picture,
                    googleId,
                    role: 'end_user', // Default role
                });
                console.log('Step 5: Created new user:', email);
            } else {
                // Update user's Google info if it's not already set
                if (!user.googleId) {
                    await user.update({
                        name: name || user.name,
                        picture: picture || user.picture,
                        googleId,
                    });
                    console.log('Step 5: Updated existing user with Google info:', email);
                }
            }

            // Handle identity linking if anonymous user is converting
            if (anonymousUserId && cartData) {
                const parsedCartData = JSON.parse(decodeURIComponent(cartData));
                const linkResult = await linkAnonymousToAuthenticated(anonymousUserId, user.id, parsedCartData);
                if (linkResult.success) {
                    console.log('Successfully linked anonymous user to authenticated account');
                } else {
                    console.error('Identity linking failed:', linkResult.error);
                }
            }

            // Generate enhanced JWT tokens
            const token = generateToken(user);
            const supabaseToken = generateSupabaseToken(user);
            console.log('Step 6: Generated enhanced JWT tokens with role claims');

            // Redirect to frontend with tokens
            console.log('Step 7: Redirecting to frontend with tokens');
            const redirectUrl = `http://localhost:3000/auth/callback?token=${token}&supabaseToken=${supabaseToken}&role=${user.role}`;
            res.redirect(redirectUrl);
        } catch (userInfoError) {
            console.error('User info fetch error:', userInfoError);
            throw new Error(`Failed to fetch user info: ${userInfoError.message}`);
        }
    } catch (error) {
        console.error('Detailed Google callback error:', error);
        res.status(500).json({ 
            error: 'Authentication failed',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get user profile with role information
router.get('/auth/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user was converted from anonymous
        const wasConverted = await isConvertedFromAnonymous(user.id);
        const anonymousCartData = wasConverted ? await getAnonymousCartData(user.id) : null;

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            role: user.role,
            is_verified_seller: user.is_verified_seller,
            store_name: user.store_name,
            store_description: user.store_description,
            converted_from_anonymous: user.converted_from_anonymous,
            anonymous_cart_data: anonymousCartData,
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Update user profile (role-protected)
router.put('/auth/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { name, email, store_name, store_description } = req.body;
        
        // Only allow users to update their own profile (except role)
        const updateData = { name, email };
        
        // Allow sellers to update store information
        if (hasRole(user, ['seller', 'admin'])) {
            updateData.store_name = store_name;
            updateData.store_description = store_description;
        }

        await user.update(updateData);

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            role: user.role,
            is_verified_seller: user.is_verified_seller,
            store_name: user.store_name,
            store_description: user.store_description,
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Apply to become a seller
router.post('/auth/apply-seller', requireAuthenticated, async (req, res) => {
    try {
        const { store_name, store_description } = req.body;
        
        if (!store_name) {
            return res.status(400).json({ error: 'Store name is required' });
        }

        const user = await User.findByPk(req.user.id);
        
        // Update user with seller information
        await user.update({
            store_name,
            store_description,
            role: 'seller', // Auto-approve for now, or keep as end_user pending admin approval
            is_verified_seller: false, // Requires admin verification
        });

        res.json({
            message: 'Seller application submitted successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                store_name: user.store_name,
                store_description: user.store_description,
                is_verified_seller: user.is_verified_seller,
            }
        });
    } catch (error) {
        console.error('Seller application error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Admin: Get all users
router.get('/auth/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            users,
            total: users.length,
            roles: {
                admin: users.filter(u => u.role === 'admin').length,
                seller: users.filter(u => u.role === 'seller').length,
                end_user: users.filter(u => u.role === 'end_user').length,
            }
        });
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Admin: Update user role
router.put('/auth/admin/users/:id/role', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role, is_verified_seller } = req.body;
        
        if (!['admin', 'end_user', 'seller'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user role and seller verification
        await user.update({ 
            role,
            is_verified_seller: role === 'seller' ? (is_verified_seller || false) : false
        });

        res.json({
            message: 'User role updated successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                is_verified_seller: user.is_verified_seller,
                store_name: user.store_name,
                store_description: user.store_description,
            }
        });
    } catch (error) {
        console.error('Admin role update error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Admin: Verify seller
router.put('/auth/admin/sellers/:id/verify', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { is_verified_seller } = req.body;
        
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role !== 'seller') {
            return res.status(400).json({ error: 'User is not a seller' });
        }

        await user.update({ is_verified_seller });

        res.json({
            message: `Seller ${is_verified_seller ? 'verified' : 'unverified'} successfully`,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                is_verified_seller: user.is_verified_seller,
                store_name: user.store_name,
                store_description: user.store_description,
            }
        });
    } catch (error) {
        console.error('Seller verification error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Clean up anonymous data after successful conversion
router.post('/auth/cleanup-anonymous', requireAuthenticated, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        
        if (!user.converted_from_anonymous) {
            return res.status(400).json({ error: 'User was not converted from anonymous' });
        }

        const cleanupResult = await cleanupAnonymousData(user.id);
        
        if (cleanupResult.success) {
            res.json({ message: 'Anonymous data cleaned up successfully' });
        } else {
            res.status(500).json({ error: 'Cleanup failed', details: cleanupResult.error });
        }
    } catch (error) {
        console.error('Anonymous cleanup error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Logout
router.post('/auth/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router; 