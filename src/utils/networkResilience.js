/**
 * Network Resilience Utilities
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Comprehensive network resilience for cart operations:
 * - Retry logic with exponential backoff
 * - Timeout handling for all async operations
 * - Error classification (retryable vs non-retryable)
 * - Comprehensive error logging
 * - Circuit breaker pattern for critical operations
 */

/**
 * Retryable error types
 */
const RETRYABLE_ERRORS = [
    'network_error',
    'timeout',
    'connection_lost',
    'server_unavailable',
    'rate_limit_exceeded',
    'temporary_failure'
];

/**
 * Check if an error is retryable
 * @param {Error} error - Error to check
 * @returns {boolean} - Whether error is retryable
 */
export const isRetryableError = (error) => {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';
    
    // Check for retryable error types
    for (const retryableError of RETRYABLE_ERRORS) {
        if (errorMessage.includes(retryableError) || errorCode.includes(retryableError)) {
            return true;
        }
    }
    
    // Check for network-related errors
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        return true;
    }
    
    // Check for timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        return true;
    }
    
    // Check for server errors (5xx)
    if (error.status >= 500 && error.status < 600) {
        return true;
    }
    
    return false;
};

/**
 * Calculate delay for exponential backoff
 * @param {number} attempt - Current attempt number (1-based)
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @returns {number} - Delay in milliseconds
 */
export const calculateBackoffDelay = (attempt, baseDelay = 1000, maxDelay = 30000) => {
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
    return delay + jitter;
};

/**
 * Retry function with exponential backoff
 * @param {Function} operation - Operation to retry
 * @param {Object} options - Retry options
 * @returns {Promise} - Operation result
 */
export const retryWithBackoff = async (operation, options = {}) => {
    const {
        maxAttempts = 3,
        baseDelay = 1000,
        maxDelay = 30000,
        timeout = 30000,
        operationName = 'unknown'
    } = options;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`[RETRY - ${operationName.toUpperCase()}] Attempt ${attempt}/${maxAttempts}`);
            
            // Create timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Operation timed out after ${timeout}ms`));
                }, timeout);
            });
            
            // Race between operation and timeout
            const result = await Promise.race([
                operation(),
                timeoutPromise
            ]);
            
            console.log(`[RETRY - ${operationName.toUpperCase()}] ✅ Success on attempt ${attempt}`);
            return result;
            
        } catch (error) {
            lastError = error;
            console.error(`[RETRY - ${operationName.toUpperCase()}] ❌ Attempt ${attempt} failed:`, error.message);
            
            // Check if error is retryable
            if (!isRetryableError(error)) {
                console.log(`[RETRY - ${operationName.toUpperCase()}] ⚠️  Non-retryable error, stopping`);
                throw error;
            }
            
            // Check if we've reached max attempts
            if (attempt >= maxAttempts) {
                console.error(`[RETRY - ${operationName.toUpperCase()}] ❌ Max attempts (${maxAttempts}) reached`);
                throw new Error(`Operation failed after ${maxAttempts} attempts: ${error.message}`);
            }
            
            // Calculate delay for next attempt
            const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay);
            console.log(`[RETRY - ${operationName.toUpperCase()}] ⏳ Waiting ${delay}ms before retry`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
};

/**
 * Wrapper for Supabase operations with retry logic
 * @param {Function} supabaseOperation - Supabase operation to execute
 * @param {Object} options - Retry options
 * @returns {Promise} - Operation result
 */
export const retryableSupabaseOperation = async (supabaseOperation, options = {}) => {
    const operationName = options.operationName || 'supabase_operation';
    
    return retryWithBackoff(async () => {
        const result = await supabaseOperation();
        
        // Check for Supabase-specific errors
        if (result.error) {
            const error = new Error(result.error.message || 'Supabase operation failed');
            error.code = result.error.code;
            error.status = result.error.status;
            throw error;
        }
        
        return result;
    }, {
        ...options,
        operationName
    });
};

/**
 * Wrapper for cart operations with comprehensive error handling
 * @param {Function} cartOperation - Cart operation to execute
 * @param {Object} options - Operation options
 * @returns {Promise} - Operation result
 */
export const resilientCartOperation = async (cartOperation, options = {}) => {
    const {
        operationName = 'cart_operation',
        maxAttempts = 3,
        timeout = 15000,
        validateInput = true,
        inputData = null
    } = options;
    
    const startTime = Date.now();
    
    try {
        console.log(`[RESILIENT - ${operationName.toUpperCase()}] 🚀 Starting resilient operation`);
        
        // Input validation (if enabled)
        if (validateInput && inputData) {
            console.log(`[RESILIENT - ${operationName.toUpperCase()}] 🔍 Validating input data`);
            // This would integrate with cartValidation.js
        }
        
        // Execute operation with retry logic
        const result = await retryWithBackoff(async () => {
            return await cartOperation();
        }, {
            maxAttempts,
            timeout,
            operationName
        });
        
        const duration = Date.now() - startTime;
        console.log(`[RESILIENT - ${operationName.toUpperCase()}] ✅ Operation completed successfully in ${duration}ms`);
        
        return {
            success: true,
            result,
            duration,
            operationName
        };
        
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[RESILIENT - ${operationName.toUpperCase()}] ❌ Operation failed after ${duration}ms:`, error);
        
        return {
            success: false,
            error: error.message,
            duration,
            operationName,
            isRetryable: isRetryableError(error)
        };
    }
};

/**
 * Circuit breaker for critical operations
 */
export class CircuitBreaker {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 5;
        this.resetTimeout = options.resetTimeout || 60000; // 1 minute
        this.failures = 0;
        this.lastFailureTime = null;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    }
    
    async execute(operation, operationName = 'unknown') {
        console.log(`[CIRCUIT - ${operationName.toUpperCase()}] State: ${this.state}`);
        
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                console.log(`[CIRCUIT - ${operationName.toUpperCase()}] 🔄 Moving to HALF_OPEN state`);
                this.state = 'HALF_OPEN';
            } else {
                throw new Error(`Circuit breaker is OPEN for ${operationName}`);
            }
        }
        
        try {
            const result = await operation();
            this.onSuccess(operationName);
            return result;
        } catch (error) {
            this.onFailure(operationName);
            throw error;
        }
    }
    
    onSuccess(operationName) {
        console.log(`[CIRCUIT - ${operationName.toUpperCase()}] ✅ Operation succeeded`);
        this.failures = 0;
        this.state = 'CLOSED';
    }
    
    onFailure(operationName) {
        console.log(`[CIRCUIT - ${operationName.toUpperCase()}] ❌ Operation failed`);
        this.failures++;
        this.lastFailureTime = Date.now();
        
        if (this.failures >= this.failureThreshold) {
            console.log(`[CIRCUIT - ${operationName.toUpperCase()}] 🚨 Moving to OPEN state`);
            this.state = 'OPEN';
        }
    }
}

/**
 * Network health checker
 * @returns {Promise<Object>} - Network health status
 */
export const checkNetworkHealth = async () => {
    const startTime = Date.now();
    
    try {
        // Simple network check - could be enhanced with actual health endpoints
        const response = await fetch('/api/health', { 
            method: 'HEAD',
            timeout: 5000 
        });
        
        const duration = Date.now() - startTime;
        
        return {
            healthy: response.ok,
            duration,
            status: response.status,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        
        return {
            healthy: false,
            duration,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Enhanced error logger with context
 * @param {Error} error - Error to log
 * @param {Object} context - Additional context
 */
export const logErrorWithContext = (error, context = {}) => {
    const errorInfo = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        ...context
    };
    
    console.error('[NETWORK ERROR]', errorInfo);
    
    // In production, this could send to error tracking service
    // Sentry.captureException(error, { extra: context });
};

/**
 * Create a resilient operation wrapper
 * @param {Function} operation - Operation to wrap
 * @param {Object} options - Resilience options
 * @returns {Function} - Wrapped operation
 */
export const createResilientOperation = (operation, options = {}) => {
    const circuitBreaker = new CircuitBreaker(options.circuitBreaker);
    
    return async (...args) => {
        return circuitBreaker.execute(
            () => resilientCartOperation(
                () => operation(...args),
                {
                    operationName: options.operationName || 'resilient_operation',
                    maxAttempts: options.maxAttempts || 3,
                    timeout: options.timeout || 15000
                }
            ),
            options.operationName || 'resilient_operation'
        );
    };
}; 