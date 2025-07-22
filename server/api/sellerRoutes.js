/**
 * Seller Management Routes for Dynable RBAC System
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * This file contains seller-specific routes:
 * - Product management (create, update, delete)
 * - Inventory management
 * - Sales data and analytics
 * - Store management
 * 
 * All routes require seller authentication and verification
 */

const express = require('express');
const router = express.Router();
const { IngredientCategorized } = require('../db/models/IngredientCategorized');
const { User } = require('../db/models/User');

// Import RBAC middleware
const { 
    requireVerifiedSeller, 
    requireSeller, 
    authenticateToken,
    requireOwnership 
} = require('../middleware/roleAuth');

// Import JWT utilities
const { isVerifiedSeller } = require('../utils/jwt');

/**
 * Seller Dashboard - Get seller's products and stats
 */
router.get('/seller/dashboard', requireVerifiedSeller, async (req, res) => {
    try {
        const sellerId = req.user.id;

        // Get seller's products
        const products = await IngredientCategorized.findAll({
            where: { seller_id: sellerId },
            order: [['createdAt', 'DESC']]
        });

        // Calculate stats
        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.is_active).length;
        const inStockProducts = products.filter(p => p.stock_quantity > 0).length;
        const totalStockValue = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);

        res.json({
            seller: {
                id: req.user.id,
                name: req.user.name,
                store_name: req.user.store_name,
                store_description: req.user.store_description,
                is_verified_seller: req.user.is_verified_seller,
            },
            stats: {
                total_products: totalProducts,
                active_products: activeProducts,
                in_stock_products: inStockProducts,
                total_stock_quantity: totalStockValue,
            },
            products: products.map(p => ({
                id: p.id,
                description: p.description,
                brandName: p.brandName,
                stock_quantity: p.stock_quantity,
                is_active: p.is_active,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
            }))
        });
    } catch (error) {
        console.error('Seller dashboard error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

/**
 * Get seller's products
 */
router.get('/seller/products', requireVerifiedSeller, async (req, res) => {
    try {
        const sellerId = req.user.id;
        const { page = 1, limit = 20, active_only = false } = req.query;

        const whereClause = { seller_id: sellerId };
        if (active_only === 'true') {
            whereClause.is_active = true;
        }

        const products = await IngredientCategorized.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
        });

        res.json({
            products: products.rows,
            total: products.count,
            page: parseInt(page),
            total_pages: Math.ceil(products.count / parseInt(limit)),
        });
    } catch (error) {
        console.error('Get seller products error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

/**
 * Create new product (seller only)
 */
router.post('/seller/products', requireVerifiedSeller, async (req, res) => {
    try {
        const sellerId = req.user.id;
        const {
            description,
            brandName,
            brandOwner,
            ingredients,
            servingSize,
            servingSizeUnit,
            stock_quantity = 0,
            is_active = true,
            // Add other product fields as needed
        } = req.body;

        if (!description) {
            return res.status(400).json({ error: 'Product description is required' });
        }

        const product = await IngredientCategorized.create({
            description,
            brandName,
            brandOwner,
            ingredients,
            servingSize,
            servingSizeUnit,
            stock_quantity,
            is_active,
            seller_id: sellerId,
            // Set other required fields
            foodClass: 'Branded',
            dataSource: 'Seller',
            dataType: 'Branded',
        });

        res.status(201).json({
            message: 'Product created successfully',
            product: {
                id: product.id,
                description: product.description,
                brandName: product.brandName,
                stock_quantity: product.stock_quantity,
                is_active: product.is_active,
                seller_id: product.seller_id,
                createdAt: product.createdAt,
            }
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

/**
 * Update seller's product
 */
router.put('/seller/products/:id', requireVerifiedSeller, async (req, res) => {
    try {
        const { id } = req.params;
        const sellerId = req.user.id;

        // Check if product belongs to seller
        const product = await IngredientCategorized.findOne({
            where: { id, seller_id: sellerId }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found or access denied' });
        }

        const {
            description,
            brandName,
            brandOwner,
            ingredients,
            servingSize,
            servingSizeUnit,
            stock_quantity,
            is_active,
        } = req.body;

        // Update product
        await product.update({
            description,
            brandName,
            brandOwner,
            ingredients,
            servingSize,
            servingSizeUnit,
            stock_quantity,
            is_active,
        });

        res.json({
            message: 'Product updated successfully',
            product: {
                id: product.id,
                description: product.description,
                brandName: product.brandName,
                stock_quantity: product.stock_quantity,
                is_active: product.is_active,
                updatedAt: product.updatedAt,
            }
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

/**
 * Update product inventory
 */
router.patch('/seller/products/:id/inventory', requireVerifiedSeller, async (req, res) => {
    try {
        const { id } = req.params;
        const sellerId = req.user.id;
        const { stock_quantity } = req.body;

        if (stock_quantity < 0) {
            return res.status(400).json({ error: 'Stock quantity cannot be negative' });
        }

        // Check if product belongs to seller
        const product = await IngredientCategorized.findOne({
            where: { id, seller_id: sellerId }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found or access denied' });
        }

        // Update inventory
        await product.update({
            stock_quantity,
            is_active: stock_quantity > 0, // Auto-deactivate if out of stock
        });

        res.json({
            message: 'Inventory updated successfully',
            product: {
                id: product.id,
                description: product.description,
                stock_quantity: product.stock_quantity,
                is_active: product.is_active,
                updatedAt: product.updatedAt,
            }
        });
    } catch (error) {
        console.error('Update inventory error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

/**
 * Delete seller's product
 */
router.delete('/seller/products/:id', requireVerifiedSeller, async (req, res) => {
    try {
        const { id } = req.params;
        const sellerId = req.user.id;

        // Check if product belongs to seller
        const product = await IngredientCategorized.findOne({
            where: { id, seller_id: sellerId }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found or access denied' });
        }

        // Soft delete by setting is_active to false
        await product.update({ is_active: false });

        res.json({
            message: 'Product deactivated successfully',
            product: {
                id: product.id,
                description: product.description,
                is_active: product.is_active,
            }
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

/**
 * Get seller's store information
 */
router.get('/seller/store', requireVerifiedSeller, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        res.json({
            store: {
                name: user.store_name,
                description: user.store_description,
                is_verified_seller: user.is_verified_seller,
                created_at: user.createdAt,
            }
        });
    } catch (error) {
        console.error('Get store info error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

/**
 * Update seller's store information
 */
router.put('/seller/store', requireVerifiedSeller, async (req, res) => {
    try {
        const { store_name, store_description } = req.body;

        if (!store_name) {
            return res.status(400).json({ error: 'Store name is required' });
        }

        const user = await User.findByPk(req.user.id);
        await user.update({
            store_name,
            store_description,
        });

        res.json({
            message: 'Store information updated successfully',
            store: {
                name: user.store_name,
                description: user.store_description,
                is_verified_seller: user.is_verified_seller,
            }
        });
    } catch (error) {
        console.error('Update store info error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

/**
 * Get seller's sales analytics (placeholder for future implementation)
 */
router.get('/seller/analytics', requireVerifiedSeller, async (req, res) => {
    try {
        const sellerId = req.user.id;

        // Get basic product stats
        const products = await IngredientCategorized.findAll({
            where: { seller_id: sellerId },
            attributes: ['stock_quantity', 'is_active', 'createdAt']
        });

        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.is_active).length;
        const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);

        // Placeholder for future sales analytics
        res.json({
            analytics: {
                total_products: totalProducts,
                active_products: activeProducts,
                total_stock_quantity: totalStock,
                // Future: Add sales data, revenue, etc.
            },
            message: 'Sales analytics will be implemented in future updates'
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

module.exports = router; 