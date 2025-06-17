/**
 * Order Model Implementation
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * Database model for user orders:
 * - One-to-many relationship with User model (one user can have many orders)
 * - Stores order items as JSONB for flexibility
 * - Tracks order status, shipping details, and payment information
 * - Maintains order history with timestamps
 * 
 * Database Schema:
 * - id: Unique identifier for each order
 * - userId: Foreign key linking to User model
 * - items: JSONB array storing ordered items with details
 * - totalAmount: Total cost of the order
 * - status: Current status of the order (pending, processing, shipped, delivered)
 * - shippingAddress: JSONB object containing shipping details
 * - paymentMethod: Payment method used for the order
 * - timestamps: Automatically tracks created/updated times
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const User = require('./User');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        },
        allowNull: false
    },
    items: {
        type: DataTypes.JSONB,
        defaultValue: [],
        // JSONB structure for each item:
        // {
        //     id: number,
        //     name: string,
        //     brand: string,
        //     price: number,
        //     image: string,
        //     quantity: number
        // }
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'processing', 'shipped', 'delivered']]
        }
    },
    shippingAddress: {
        type: DataTypes.JSONB,
        allowNull: true, // Changed to allow null for existing records
        defaultValue: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zipCode: '12345',
            country: 'USA'
        }
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true, // Changed to allow null for existing records
        defaultValue: 'credit_card'
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Define one-to-many relationship with User model
// Each user can have multiple orders
User.hasMany(Order);
Order.belongsTo(User);

module.exports = Order; 