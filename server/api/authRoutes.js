/**
 * Google Authentication Implementation
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * This file contains all authentication routes:
 * - Google OAuth callback handling with People API integration
 * - User registration and login
 * - Profile management
 * - JWT token generation
 * 
 * Recent Changes:
 * - Updated Google OAuth to use People API v1
 * - Enhanced user info extraction from People API response
 * - Added detailed error handling and logging
 * - Improved JWT token payload with user details
 * - Added proper error responses with details
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../db/models/User');

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

// Register new user
router.post('/auth/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = await User.create({
            email,
            password: hashedPassword,
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
            },
            token,
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login user
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

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            user: {
                id: user.id,
                email: user.email,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Google OAuth callback route
router.get('/auth/google/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
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

            // Generate JWT token
            const jwtToken = jwt.sign(
                { 
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            console.log('Step 6: Generated JWT token');

            // Redirect to frontend with token
            console.log('Step 7: Redirecting to frontend with token');
            res.redirect(`http://localhost:3000/auth/callback?token=${jwtToken}`);
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

// Get user profile
router.get('/auth/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
router.put('/auth/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { name, email } = req.body;
        await user.update({ name, email });

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout
router.post('/auth/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router; 