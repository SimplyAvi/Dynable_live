/**
 * Cart Routes Implementation
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * API endpoints for cart management:
 * - Protected routes requiring JWT authentication
 * - CRUD operations for user shopping carts
 * - Cart synchronization between frontend and database
 * - Error handling and validation
 * 
 * Routes:
 * - GET /api/cart: Fetch user's cart
 * - POST /api/cart: Add item to cart
 * - PUT /api/cart: Update cart item quantity
 * - DELETE /api/cart/:itemId: Remove item from cart
 * - DELETE /api/cart: Clear entire cart
 * - POST /api/cart/checkout: Create order and clear cart
 */

const express = require('express');
const router = express.Router();
const { Cart, User } = require('../db/models');
const jwt = require('jsonwebtoken');
const Order = require('../db/models/Order');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware to ensure user is authenticated
router.use(authenticateToken);

/**
 * GET /api/cart
 * Fetches the current user's cart
 * Returns cart items or empty array if no cart exists
 */
router.get('/', async (req, res, next) => {
    try {
        console.log('Fetching cart for user:', req.user.id);
        const cart = await Cart.findOne({
            where: { userId: req.user.id }
        });
        console.log('Found cart:', cart ? 'Yes' : 'No');
        if (cart) {
            console.log('Cart items:', JSON.stringify(cart.items, null, 2));
        }
        res.json(cart ? cart.items : []);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

/**
 * POST /api/cart
 * Adds a new item to the user's cart
 * Creates cart if it doesn't exist
 * Updates quantity if item already exists
 */
router.post('/', async (req, res, next) => {
    try {
        const { item } = req.body;
        if (!item) {
            return res.status(400).json({ error: 'Item is required' });
        }

        console.log('Adding item to cart for user:', req.user.id);
        console.log('Item:', JSON.stringify(item, null, 2));

        let cart = await Cart.findOne({
            where: { userId: req.user.id }
        });

        console.log('Existing cart found:', cart ? 'Yes' : 'No');

        if (!cart) {
            console.log('Creating new cart for user:', req.user.id);
            cart = await Cart.create({
                userId: req.user.id,
                items: [item]
            });
            console.log('New cart created:', cart.id);
        } else {
            const existingItemIndex = cart.items.findIndex(
                cartItem => cartItem.id === item.id
            );

            if (existingItemIndex > -1) {
                console.log('Updating existing item quantity');
                cart.items[existingItemIndex].quantity += item.quantity;
            } else {
                console.log('Adding new item to cart');
                cart.items = [...cart.items, item];
            }

            await cart.save();
            console.log('Cart updated successfully');
        }

        // Fetch the updated cart to ensure we're returning the latest state
        cart = await Cart.findOne({
            where: { userId: req.user.id }
        });

        console.log('Returning cart items:', JSON.stringify(cart.items, null, 2));
        res.json(cart.items);
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
});

/**
 * PUT /api/cart
 * Updates the entire cart with new items
 * Returns updated cart items
 */
router.put('/', async (req, res, next) => {
    try {
        const { items } = req.body;
        if (!items) {
            return res.status(400).json({ error: 'Items are required' });
        }

        let cart = await Cart.findOne({
            where: { userId: req.user.id }
        });

        if (!cart) {
            cart = await Cart.create({
                userId: req.user.id,
                items: items
            });
        } else {
            cart.items = items;
            await cart.save();
        }

        // Fetch the updated cart to ensure we're returning the latest state
        cart = await Cart.findOne({
            where: { userId: req.user.id }
        });

        res.json(cart.items);
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

/**
 * DELETE /api/cart/:itemId
 * Removes a specific item from the cart
 * Returns updated cart items
 */
router.delete('/:itemId', async (req, res, next) => {
    try {
        const cart = await Cart.findOne({
            where: { userId: req.user.id }
        });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.id !== parseInt(req.params.itemId));
        await cart.save();

        // Fetch the updated cart to ensure we're returning the latest state
        const updatedCart = await Cart.findOne({
            where: { userId: req.user.id }
        });

        res.json(updatedCart.items);
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/cart
 * Clears the entire cart
 * Returns empty array
 */
router.delete('/', async (req, res, next) => {
    try {
        const cart = await Cart.findOne({
            where: { userId: req.user.id }
        });

        if (cart) {
            cart.items = [];
            await cart.save();
        }

        res.json([]);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/cart/checkout
 * Creates an order from cart items and clears the cart
 * Returns the created order
 */
router.post('/checkout', authenticateToken, async (req, res, next) => {
    try {
        console.log('Processing checkout for user:', req.user.id);
        
        const cart = await Cart.findOne({
            where: { userId: req.user.id }
        });

        console.log('Found cart:', cart ? 'Yes' : 'No');
        if (cart) {
            console.log('Cart items:', JSON.stringify(cart.items, null, 2));
        }

        if (!cart || !cart.items || cart.items.length === 0) {
            console.log('Cart is empty or not found');
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Calculate total amount
        const totalAmount = cart.items.reduce(
            (sum, item) => sum + (item.price * item.quantity),
            0
        );

        console.log('Creating order with total amount:', totalAmount);

        // Create order with default payment method
        const order = await Order.create({
            userId: req.user.id,
            items: cart.items,
            totalAmount,
            status: 'pending',
            shippingAddress: {
                street: '123 Main St',
                city: 'Anytown',
                state: 'CA',
                zipCode: '12345',
                country: 'USA'
            },
            paymentMethod: 'credit_card'
        });

        console.log('Order created:', order.id);

        // Clear cart
        cart.items = [];
        await cart.save();
        console.log('Cart cleared after checkout');

        res.json(order);
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).json({ error: 'Checkout failed: ' + error.message });
    }
});

// Get user's order history
router.get('/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 