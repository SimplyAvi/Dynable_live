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
 * Sanitize cart item data
 * @param {Object} item - Cart item to sanitize
 * @returns {Object} - Sanitized cart item
 */
export const sanitizeCartItem = (item) => {
    if (!item || typeof item !== 'object') {
        return null;
    }
    
    const sanitized = {};
    
    // Sanitize ID
    if (item.id !== undefined) {
        sanitized.id = String(item.id).trim();
    }
    
    // Sanitize name
    if (item.name !== undefined) {
        sanitized.name = String(item.name).trim();
    }
    
    // Sanitize price
    if (item.price !== undefined) {
        const price = parseFloat(item.price);
        sanitized.price = isNaN(price) ? 0 : Math.max(0, price);
    }
    
    // Sanitize quantity
    if (item.quantity !== undefined) {
        const quantity = parseInt(item.quantity);
        sanitized.quantity = isNaN(quantity) ? 1 : Math.max(1, Math.min(1000, quantity));
    }
    
    // Sanitize brand
    if (item.brand !== undefined) {
        sanitized.brand = String(item.brand).trim();
    }
    
    // Sanitize brandName
    if (item.brandName !== undefined) {
        sanitized.brandName = String(item.brandName).trim();
    }
    
    // Sanitize image
    if (item.image !== undefined) {
        sanitized.image = String(item.image).trim();
    }
    
    return sanitized;
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