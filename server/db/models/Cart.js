/**
 * Cart Model Implementation
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * Database model for user shopping carts:
 * - One-to-one relationship with User model
 * - Stores cart items as JSONB for flexibility
 * - Tracks cart creation and updates with timestamps
 * - Supports multiple items with quantities
 * 
 * Database Schema:
 * - id: Unique identifier for each cart
 * - userId: Foreign key linking to User model
 * - items: JSONB array storing cart items with details
 * - timestamps: Automatically tracks created/updated times
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const User = require('./User');

const Cart = sequelize.define('Cart', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users',
            key: 'id'
        },
        allowNull: false,
        field: 'userId' // Explicitly set the field name
    },
    items: {
        type: DataTypes.JSONB,
        defaultValue: [],
        get() {
            const rawValue = this.getDataValue('items');
            return rawValue ? rawValue : [];
        },
        set(value) {
            this.setDataValue('items', value || []);
        }
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    tableName: 'Carts' // Explicitly set the table name
});

// Define one-to-one relationship with User model
// Each user can have one cart
User.hasOne(Cart, { foreignKey: 'userId' });
Cart.belongsTo(User, { foreignKey: 'userId' });

module.exports = Cart; 