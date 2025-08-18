/**
 * Debug Logger for State Merge Functionality
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Centralized debugging utility for tracking state merge operations
 */

// Debug state tracking
let debugState = {
    mergeAttempts: 0,
    lastMergeTime: null,
    mergeResults: []
};

/**
 * Log authentication event with minimal impact
 */
export const logAuthEvent = (event, session) => {
    console.log('🔍 [AUTH] Event:', event, 'User:', session?.user?.id);
};

/**
 * Log merge attempt with key details
 */
export const logMergeAttempt = (anonymousUserId, authenticatedUserId) => {
    debugState.mergeAttempts++;
    debugState.lastMergeTime = new Date().toISOString();
    
    console.log('🔄 [MERGE] Attempt #', debugState.mergeAttempts);
    console.log('🔄 [MERGE] Anonymous ID:', anonymousUserId);
    console.log('🔄 [MERGE] Authenticated ID:', authenticatedUserId);
};

/**
 * Log merge result
 */
export const logMergeResult = (type, success, result, error) => {
    const logEntry = {
        type,
        success,
        timestamp: new Date().toISOString(),
        result,
        error: error?.message
    };
    
    debugState.mergeResults.push(logEntry);
    
    if (success) {
        console.log('✅ [MERGE]', type, 'completed:', result);
    } else {
        console.error('❌ [MERGE]', type, 'failed:', error);
    }
};

/**
 * Get debug state summary
 */
export const getDebugSummary = () => {
    return {
        ...debugState,
        successfulMerges: debugState.mergeResults.filter(r => r.success).length,
        failedMerges: debugState.mergeResults.filter(r => !r.success).length
    };
};

/**
 * Clear debug state
 */
export const clearDebugState = () => {
    debugState = {
        mergeAttempts: 0,
        lastMergeTime: null,
        mergeResults: []
    };
};

// Export for global access
if (typeof window !== 'undefined') {
    window.debugLogger = {
        logAuthEvent,
        logMergeAttempt,
        logMergeResult,
        getDebugSummary,
        clearDebugState
    };
} 