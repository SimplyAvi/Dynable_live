/**
 * Performance Monitoring Utility
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Monitors query performance and detects timeouts
 * Provides alerts and metrics for optimization
 */

// Performance metrics storage
const performanceMetrics = {
  queries: new Map(),
  timeouts: [],
  slowQueries: [],
  startTime: Date.now()
};

/**
 * Monitor query performance with timeout detection
 * @param {string} queryName - Name of the query being monitored
 * @param {Function} queryFunction - The query function to execute
 * @param {Object} options - Monitoring options
 * @returns {Promise} - Query result with performance data
 */
export const monitorQueryPerformance = async (queryName, queryFunction, options = {}) => {
  const {
    timeout = 15000,
    slowThreshold = 2000,
    maxRetries = 3,
    fallback = null
  } = options;

  const startTime = Date.now();
  const queryId = `${queryName}_${Date.now()}`;

  console.log(`[PERFORMANCE] 🚀 Starting query: ${queryName}`);

  try {
    // Execute query with timeout
    const result = await Promise.race([
      queryFunction(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      )
    ]);

    const duration = Date.now() - startTime;
    
    // Record performance metrics
    performanceMetrics.queries.set(queryId, {
      name: queryName,
      duration,
      success: true,
      timestamp: new Date().toISOString(),
      timeout: false
    });

    // Log performance
    console.log(`[PERFORMANCE] ✅ ${queryName}: ${duration}ms`);

    // Alert for slow queries
    if (duration > slowThreshold) {
      console.warn(`[PERFORMANCE] ⚠️ Slow query: ${queryName} took ${duration}ms`);
      performanceMetrics.slowQueries.push({
        name: queryName,
        duration,
        timestamp: new Date().toISOString()
      });
    }

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Record timeout metrics
    performanceMetrics.queries.set(queryId, {
      name: queryName,
      duration,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      timeout: error.message.includes('timeout')
    });

    if (error.message.includes('timeout')) {
      console.error(`[PERFORMANCE] 🚨 Timeout: ${queryName} after ${duration}ms`);
      performanceMetrics.timeouts.push({
        name: queryName,
        duration,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error(`[PERFORMANCE] ❌ Error: ${queryName} failed after ${duration}ms:`, error.message);
    }

    // Retry logic for non-timeout errors
    if (!error.message.includes('timeout') && maxRetries > 1) {
      console.log(`[PERFORMANCE] 🔄 Retrying ${queryName} (${maxRetries - 1} attempts left)`);
      return monitorQueryPerformance(queryName, queryFunction, {
        ...options,
        maxRetries: maxRetries - 1
      });
    }

    // Return fallback if available
    if (fallback) {
      console.log(`[PERFORMANCE] 🔄 Using fallback for ${queryName}`);
      return fallback;
    }

    throw error;
  }
};

/**
 * Get performance statistics
 * @returns {Object} - Performance statistics
 */
export const getPerformanceStats = () => {
  const queries = Array.from(performanceMetrics.queries.values());
  const totalQueries = queries.length;
  const successfulQueries = queries.filter(q => q.success).length;
  const failedQueries = totalQueries - successfulQueries;
  const timeoutQueries = queries.filter(q => q.timeout).length;
  const slowQueries = performanceMetrics.slowQueries.length;

  const avgDuration = queries.length > 0 
    ? queries.reduce((sum, q) => sum + q.duration, 0) / queries.length 
    : 0;

  const maxDuration = queries.length > 0 
    ? Math.max(...queries.map(q => q.duration))
    : 0;

  return {
    totalQueries,
    successfulQueries,
    failedQueries,
    timeoutQueries,
    slowQueries,
    avgDuration: Math.round(avgDuration),
    maxDuration,
    uptime: Date.now() - performanceMetrics.startTime,
    timeouts: performanceMetrics.timeouts,
    slowQueries: performanceMetrics.slowQueries
  };
};

/**
 * Clear performance metrics
 */
export const clearPerformanceMetrics = () => {
  performanceMetrics.queries.clear();
  performanceMetrics.timeouts = [];
  performanceMetrics.slowQueries = [];
  performanceMetrics.startTime = Date.now();
  console.log('[PERFORMANCE] 📊 Performance metrics cleared');
};

/**
 * Generate performance report
 * @returns {string} - Formatted performance report
 */
export const generatePerformanceReport = () => {
  const stats = getPerformanceStats();
  const uptimeMinutes = Math.round(stats.uptime / 60000);
  
  let report = `
🚀 PERFORMANCE REPORT
====================
📊 Query Statistics:
   • Total Queries: ${stats.totalQueries}
   • Successful: ${stats.successfulQueries}
   • Failed: ${stats.failedQueries}
   • Timeouts: ${stats.timeoutQueries}
   • Slow Queries: ${stats.slowQueries}

⏱️ Performance Metrics:
   • Average Duration: ${stats.avgDuration}ms
   • Max Duration: ${stats.maxDuration}ms
   • Uptime: ${uptimeMinutes} minutes

📈 Success Rate: ${stats.totalQueries > 0 ? Math.round((stats.successfulQueries / stats.totalQueries) * 100) : 0}%
`;

  if (stats.timeouts.length > 0) {
    report += `
🚨 Recent Timeouts:
`;
    stats.timeouts.slice(-5).forEach(timeout => {
      report += `   • ${timeout.name}: ${timeout.duration}ms (${timeout.timestamp})\n`;
    });
  }

  if (stats.slowQueries.length > 0) {
    report += `
⚠️ Recent Slow Queries:
`;
    stats.slowQueries.slice(-5).forEach(query => {
      report += `   • ${query.name}: ${query.duration}ms (${query.timestamp})\n`;
    });
  }

  return report;
};

/**
 * Monitor homepage loading performance
 * @param {Function} loadFunction - Homepage loading function
 * @returns {Promise} - Loading result with performance data
 */
export const monitorHomepageLoading = async (loadFunction) => {
  return monitorQueryPerformance('homepage_loading', loadFunction, {
    timeout: 20000,
    slowThreshold: 3000,
    maxRetries: 2
  });
};

/**
 * Monitor allergen filtering performance
 * @param {Function} filterFunction - Allergen filtering function
 * @returns {Promise} - Filtering result with performance data
 */
export const monitorAllergenFiltering = async (filterFunction) => {
  return monitorQueryPerformance('allergen_filtering', filterFunction, {
    timeout: 15000,
    slowThreshold: 1000,
    maxRetries: 3
  });
};

/**
 * Monitor authentication performance
 * @param {Function} authFunction - Authentication function
 * @returns {Promise} - Auth result with performance data
 */
export const monitorAuthentication = async (authFunction) => {
  return monitorQueryPerformance('authentication', authFunction, {
    timeout: 10000,
    slowThreshold: 2000,
    maxRetries: 2
  });
};

/**
 * Set up performance monitoring for the app
 */
export const setupPerformanceMonitoring = () => {
  // Log performance stats every 5 minutes
  setInterval(() => {
    const stats = getPerformanceStats();
    if (stats.totalQueries > 0) {
      console.log('[PERFORMANCE] 📊 Stats:', {
        total: stats.totalQueries,
        success: stats.successfulQueries,
        timeouts: stats.timeoutQueries,
        avgDuration: stats.avgDuration
      });
    }
  }, 300000); // 5 minutes

  // Log detailed report every 15 minutes
  setInterval(() => {
    const stats = getPerformanceStats();
    if (stats.totalQueries > 0) {
      console.log(generatePerformanceReport());
    }
  }, 900000); // 15 minutes

  console.log('[PERFORMANCE] 🚀 Performance monitoring initialized');
};

// Make performance stats available globally for debugging
if (typeof window !== 'undefined') {
  window.getPerformanceStats = getPerformanceStats;
  window.generatePerformanceReport = generatePerformanceReport;
  window.clearPerformanceMetrics = clearPerformanceMetrics;
  console.log('[PERFORMANCE] 🔍 Performance monitoring available globally: window.getPerformanceStats()');
} 