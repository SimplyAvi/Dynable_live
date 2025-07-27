/**
 * Cart Validation Utilities
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Comprehensive validation for all cart operations:
 * - Cart item structure validation
 * - User ID validation (UUID format)
 * - Cart data limits and constraints
 * - Product data validation
 * - Input sanitization
 */

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} - Whether UUID is valid
 */
export const isValidUUID = (uuid) => {
    if (!uuid || typeof uuid !== 'string') {
        return false;
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

/**
 * Validate cart item structure
 * @param {Object} item - Cart item to validate
 * @returns {Object} - Validation result with success/error information
 */
export const validateCartItem = (item) => {
    const errors = [];
    
    // Check if item exists
    if (!item || typeof item !== 'object') {
        return {
            success: false,
            error: 'Cart item must be an object',
            field: 'item'
        };
    }
    
    // Required fields validation
    const requiredFields = ['id', 'name'];
    for (const field of requiredFields) {
        if (!item[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    }
    
    // ID validation
    if (item.id && typeof item.id !== 'string' && typeof item.id !== 'number') {
        errors.push('Item ID must be a string or number');
    }
    
    // Name validation
    if (item.name && typeof item.name !== 'string') {
        errors.push('Item name must be a string');
    }
    
    if (item.name && item.name.trim().length === 0) {
        errors.push('Item name cannot be empty');
    }
    
    // Price validation - allow zero prices
    if (item.price !== undefined) {
        if (typeof item.price !== 'number' || isNaN(item.price)) {
            errors.push('Item price must be a valid number');
        } else if (item.price < 0) {
            errors.push('Item price cannot be negative');
        }
        // Allow zero prices (free items)
    }
    
    // Quantity validation
    if (item.quantity !== undefined) {
        if (typeof item.quantity !== 'number' || isNaN(item.quantity)) {
            errors.push('Item quantity must be a valid number');
        } else if (item.quantity <= 0) {
            errors.push('Item quantity must be greater than 0');
        } else if (item.quantity > 1000) {
            errors.push('Item quantity cannot exceed 1000');
        }
    }
    
    // Brand validation
    if (item.brand && typeof item.brand !== 'string') {
        errors.push('Item brand must be a string');
    }
    
    // Image validation
    if (item.image && typeof item.image !== 'string') {
        errors.push('Item image must be a string');
    }
    
    // Additional fields validation
    if (item.brandName && typeof item.brandName !== 'string') {
        errors.push('Item brandName must be a string');
    }
    
    if (errors.length > 0) {
        return {
            success: false,
            error: errors.join(', '),
            field: 'item',
            details: errors
        };
    }
    
    return {
        success: true,
        message: 'Cart item is valid'
    };
};

/**
 * Validate cart items array
 * @param {Array} items - Cart items array to validate
 * @returns {Object} - Validation result with success/error information
 */
export const validateCartItems = (items) => {
    const errors = [];
    const validationResults = [];
    
    // Check if items is an array
    if (!Array.isArray(items)) {
        return {
            success: false,
            error: 'Cart items must be an array',
            field: 'items'
        };
    }
    
    // Check cart size limit
    if (items.length > 100) {
        return {
            success: false,
            error: 'Cart cannot contain more than 100 items',
            field: 'items',
            limit: 100
        };
    }
    
    // Validate each item
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemValidation = validateCartItem(item);
        
        if (!itemValidation.success) {
            errors.push(`Item ${i + 1}: ${itemValidation.error}`);
            validationResults.push({
                index: i,
                item: item,
                error: itemValidation.error
            });
        } else {
            validationResults.push({
                index: i,
                item: item,
                success: true
            });
        }
    }
    
    if (errors.length > 0) {
        return {
            success: false,
            error: errors.join('; '),
            field: 'items',
            details: validationResults
        };
    }
    
    return {
        success: true,
        message: `All ${items.length} cart items are valid`,
        count: items.length
    };
};

/**
 * Validate user ID for cart operations
 * @param {string} userId - User ID to validate
 * @returns {Object} - Validation result with success/error information
 */
export const validateUserId = (userId) => {
    if (!userId) {
        return {
            success: false,
            error: 'User ID is required',
            field: 'userId'
        };
    }
    
    if (typeof userId !== 'string') {
        return {
            success: false,
            error: 'User ID must be a string',
            field: 'userId'
        };
    }
    
    if (!isValidUUID(userId)) {
        return {
            success: false,
            error: 'User ID must be a valid UUID',
            field: 'userId'
        };
    }
    
    return {
        success: true,
        message: 'User ID is valid'
    };
};

/**
 * Validate cart data structure
 * @param {Object} cartData - Cart data to validate
 * @returns {Object} - Validation result with success/error information
 */
export const validateCartData = (cartData) => {
    const errors = [];
    
    if (!cartData || typeof cartData !== 'object') {
        return {
            success: false,
            error: 'Cart data must be an object',
            field: 'cartData'
        };
    }
    
    // Validate items if present
    if (cartData.items !== undefined) {
        const itemsValidation = validateCartItems(cartData.items);
        if (!itemsValidation.success) {
            errors.push(itemsValidation.error);
        }
    }
    
    // Validate user ID if present
    if (cartData.supabase_user_id !== undefined) {
        const userIdValidation = validateUserId(cartData.supabase_user_id);
        if (!userIdValidation.success) {
            errors.push(userIdValidation.error);
        }
    }
    
    // Validate timestamps if present
    if (cartData.createdAt !== undefined) {
        if (typeof cartData.createdAt !== 'string' || isNaN(Date.parse(cartData.createdAt))) {
            errors.push('CreatedAt must be a valid ISO date string');
        }
    }
    
    if (cartData.updatedAt !== undefined) {
        if (typeof cartData.updatedAt !== 'string' || isNaN(Date.parse(cartData.updatedAt))) {
            errors.push('UpdatedAt must be a valid ISO date string');
        }
    }
    
    if (errors.length > 0) {
        return {
            success: false,
            error: errors.join(', '),
            field: 'cartData',
            details: errors
        };
    }
    
    return {
        success: true,
        message: 'Cart data is valid'
    };
};

/**
 * Cart Data Validation and Sanitization
 * Ensures cart items have proper data types before frontend processing
 */

/**
 * Sanitize cart item to ensure proper data types
 * @param {Object} item - Cart item object
 * @returns {Object} - Sanitized cart item
 */
export const sanitizeCartItem = (item) => {
    if (!item) return null;
    
    return {
        id: item.id || null,
        name: item.name || '',
        brand: item.brand || null,
        brandName: item.brandName || null,
        image: item.image || '/default_img.png',
        price: ensureNumericPrice(item.price),
        quantity: ensureIntegerQuantity(item.quantity)
    };
};

/**
 * Ensure price is a valid number
 * @param {any} price - Price value (could be string, number, or null)
 * @returns {number} - Valid numeric price
 */
export const ensureNumericPrice = (price) => {
    if (price === null || price === undefined || price === '') {
        return 0;
    }
    
    // Convert string to number
    const numericPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    
    // Check if conversion was successful
    if (isNaN(numericPrice)) {
        console.warn('Invalid price value:', price, 'defaulting to 0');
        return 0;
    }
    
    // Ensure non-negative
    return Math.max(0, numericPrice);
};

/**
 * Ensure quantity is a valid integer
 * @param {any} quantity - Quantity value (could be string, number, or null)
 * @returns {number} - Valid integer quantity
 */
export const ensureIntegerQuantity = (quantity) => {
    if (quantity === null || quantity === undefined || quantity === '') {
        return 1;
    }
    
    // Convert string to integer
    const integerQuantity = typeof quantity === 'string' ? parseInt(quantity, 10) : Math.floor(Number(quantity));
    
    // Check if conversion was successful
    if (isNaN(integerQuantity)) {
        console.warn('Invalid quantity value:', quantity, 'defaulting to 1');
        return 1;
    }
    
    // Ensure positive
    return Math.max(1, integerQuantity);
};

/**
 * Sanitize entire cart items array
 * @param {Array} items - Array of cart items
 * @returns {Array} - Array of sanitized cart items
 */
export const sanitizeCartItems = (items) => {
    if (!Array.isArray(items)) {
        console.warn('Cart items is not an array:', items);
        return [];
    }
    
    return items
        .map(item => sanitizeCartItem(item))
        .filter(item => item !== null);
};

/**
 * Validate cart item before adding to cart (enhanced version)
 * @param {Object} item - Item to validate
 * @returns {Object} - Validation result with success/error
 */
export const validateCartItemEnhanced = (item) => {
    const errors = [];
    
    if (!item) {
        return { success: false, error: 'Item is required' };
    }
    
    if (!item.id) {
        errors.push('Item ID is required');
    }
    
    if (!item.name) {
        errors.push('Item name is required');
    }
    
    // Validate price
    const price = ensureNumericPrice(item.price);
    if (price < 0) {
        errors.push('Price cannot be negative');
    }
    
    // Validate quantity
    const quantity = ensureIntegerQuantity(item.quantity);
    if (quantity < 1) {
        errors.push('Quantity must be at least 1');
    }
    
    if (errors.length > 0) {
        return { success: false, error: errors.join(', ') };
    }
    
    return { 
        success: true, 
        item: sanitizeCartItem(item)
    };
};

/**
 * Format price for display with proper error handling
 * @param {any} price - Price value
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price, decimals = 2) => {
    try {
        const numericPrice = ensureNumericPrice(price);
        return numericPrice.toFixed(decimals);
    } catch (error) {
        console.error('Error formatting price:', price, error);
        return '0.00';
    }
};

/**
 * Calculate cart total with proper error handling
 * @param {Array} items - Cart items array
 * @returns {number} - Total price
 */
export const calculateCartTotal = (items) => {
    if (!Array.isArray(items)) {
        console.warn('Invalid items array for total calculation:', items);
        return 0;
    }
    
    try {
        return items.reduce((total, item) => {
            const price = ensureNumericPrice(item.price);
            const quantity = ensureIntegerQuantity(item.quantity);
            return total + (price * quantity);
        }, 0);
    } catch (error) {
        console.error('Error calculating cart total:', error);
        return 0;
    }
};

/**
 * Check if cart item has valid data types
 * @param {Object} item - Cart item to check
 * @returns {boolean} - True if valid, false otherwise
 */
export const isCartItemValid = (item) => {
    if (!item) return false;
    
    try {
        // Check if price can be converted to number
        const price = ensureNumericPrice(item.price);
        if (isNaN(price)) return false;
        
        // Check if quantity can be converted to integer
        const quantity = ensureIntegerQuantity(item.quantity);
        if (isNaN(quantity)) return false;
        
        // Check required fields
        return !!(item.id && item.name);
    } catch (error) {
        console.error('Error validating cart item:', error);
        return false;
    }
};

export default {
    sanitizeCartItem,
    sanitizeCartItems,
    validateCartItem,
    ensureNumericPrice,
    ensureIntegerQuantity,
    formatPrice,
    calculateCartTotal,
    isCartItemValid
};

/**
 * Validate merge operation parameters
 * @param {string} anonymousUserId - Anonymous user ID
 * @param {string} authenticatedUserId - Authenticated user ID
 * @returns {Object} - Validation result with success/error information
 */
export const validateMergeParameters = (anonymousUserId, authenticatedUserId) => {
    const errors = [];
    
    // Validate anonymous user ID
    const anonymousValidation = validateUserId(anonymousUserId);
    if (!anonymousValidation.success) {
        errors.push(`Anonymous user ID: ${anonymousValidation.error}`);
    }
    
    // Validate authenticated user ID
    const authenticatedValidation = validateUserId(authenticatedUserId);
    if (!authenticatedValidation.success) {
        errors.push(`Authenticated user ID: ${authenticatedValidation.error}`);
    }
    
    // Check if user IDs are different
    if (anonymousUserId === authenticatedUserId) {
        errors.push('Anonymous and authenticated user IDs must be different');
    }
    
    if (errors.length > 0) {
        return {
            success: false,
            error: errors.join(', '),
            field: 'mergeParameters',
            details: errors
        };
    }
    
    return {
        success: true,
        message: 'Merge parameters are valid'
    };
};

/**
 * Comprehensive validation for cart save operation
 * @param {Array} cartItems - Cart items to validate
 * @param {string} userId - User ID to validate
 * @param {string} operation - Operation being performed
 * @returns {Object} - Validation result with success/error information
 */
export const validateCartSaveOperation = (cartItems, userId, operation = 'unknown') => {
    const errors = [];
    const validationResults = {};
    
    // Validate user ID
    const userIdValidation = validateUserId(userId);
    if (!userIdValidation.success) {
        errors.push(`User ID: ${userIdValidation.error}`);
    } else {
        validationResults.userId = userIdValidation;
    }
    
    // Validate cart items
    const itemsValidation = validateCartItems(cartItems);
    if (!itemsValidation.success) {
        errors.push(`Cart items: ${itemsValidation.error}`);
    } else {
        validationResults.items = itemsValidation;
    }
    
    // Validate operation type
    const validOperations = ['add', 'update', 'remove', 'clear', 'merge', 'checkout', 'save'];
    if (!validOperations.includes(operation)) {
        errors.push(`Invalid operation: ${operation}`);
    }
    
    if (errors.length > 0) {
        return {
            success: false,
            error: errors.join('; '),
            operation,
            details: validationResults
        };
    }
    
    return {
        success: true,
        message: `Cart save operation '${operation}' is valid`,
        operation,
        details: validationResults
    };
}; 