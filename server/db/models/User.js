/**
 * Google Authentication Implementation with Role-Based Access Control
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * User model definition for authentication:
 * - Email and password fields for traditional auth
 * - Google OAuth fields (googleId, picture)
 * - User profile fields (name, picture)
 * - Role-based access control fields (role, seller fields)
 * - Anonymous user conversion tracking
 * - Timestamps for user creation/updates
 * - Email validation and uniqueness constraints
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true, // Allow null for Google OAuth users
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    picture: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    // Role-based access control fields
    role: {
        type: DataTypes.ENUM('admin', 'end_user', 'seller'),
        defaultValue: 'end_user',
        allowNull: false,
        validate: {
            isIn: [['admin', 'end_user', 'seller']],
        },
    },
    // Seller-specific fields
    store_name: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 255],
        },
    },
    store_description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    is_verified_seller: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    // Anonymous user conversion tracking
    converted_from_anonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    anonymous_cart_data: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Stores cart data from anonymous user before conversion',
    },
}, {
    timestamps: true,
    // Add model-level validations
    validate: {
        // Ensure seller fields are present if role is seller
        sellerFieldsRequired() {
            if (this.role === 'seller' && !this.store_name) {
                throw new Error('Store name is required for seller accounts');
            }
        },
    },
});

// Instance methods for role checking
User.prototype.isAdmin = function() {
    return this.role === 'admin';
};

User.prototype.isSeller = function() {
    return this.role === 'seller' || this.role === 'admin';
};

User.prototype.isVerifiedSeller = function() {
    return this.is_verified_seller === true;
};

User.prototype.canManageProducts = function() {
    return this.isSeller() && this.isVerifiedSeller();
};

User.prototype.isAnonymous = function() {
    return this.converted_from_anonymous === true;
};

// Class methods for role-based queries
User.findByRole = function(role) {
    return this.findAll({ where: { role } });
};

User.findSellers = function() {
    return this.findAll({ 
        where: { 
            role: ['seller', 'admin'],
            is_verified_seller: true 
        } 
    });
};

User.findUnverifiedSellers = function() {
    return this.findAll({ 
        where: { 
            role: 'seller',
            is_verified_seller: false 
        } 
    });
};

module.exports = User; 