const { Sequelize } = require('sequelize');
const db = require('../../db/database');

/*
 * DATASET CONTEXT:
 * - 243,108 products
 * - 61,382 canonical ingredients
 * - 683,784 recipe ingredients
 * - 73,322 recipes
 * 
 * ALWAYS: Use bulk operations, process in chunks, add progress tracking
 */

class LargeDatasetProcessor {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 1000;
    this.dryRun = options.dryRun || false;
    this.progressInterval = options.progressInterval || 100;
    this.logLevel = options.logLevel || 'info'; // 'debug', 'info', 'warn', 'error'
  }

  /**
   * Process data in chunks with progress tracking
   */
  async processInChunks(items, processor, options = {}) {
    const totalItems = items.length;
    const chunkSize = options.chunkSize || this.chunkSize;
    const progressInterval = options.progressInterval || this.progressInterval;
    
    console.log(`🔄 Processing ${totalItems.toLocaleString()} items in chunks of ${chunkSize}`);
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    const errors = [];
    
    for (let i = 0; i < totalItems; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      
      try {
        const result = await processor(chunk, i, totalItems);
        successful += result.successful || chunk.length;
        failed += result.failed || 0;
        
        if (result.errors) {
          errors.push(...result.errors);
        }
      } catch (error) {
        failed += chunk.length;
        errors.push({ chunk: i, error: error.message });
        this.log('error', `❌ Chunk ${i}-${i + chunkSize} failed: ${error.message}`);
      }
      
      processed += chunk.length;
      
      if (processed % progressInterval === 0 || processed === totalItems) {
        const percentage = ((processed / totalItems) * 100).toFixed(1);
        this.log('info', `📊 Progress: ${processed.toLocaleString()}/${totalItems.toLocaleString()} (${percentage}%) - ✅ ${successful} | ❌ ${failed}`);
      }
    }
    
    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`✅ Successful: ${successful.toLocaleString()}`);
    console.log(`❌ Failed: ${failed.toLocaleString()}`);
    console.log(`📈 Success Rate: ${((successful / totalItems) * 100).toFixed(1)}%`);
    
    if (errors.length > 0) {
      console.log(`⚠️ Errors: ${errors.length}`);
      if (this.logLevel === 'debug') {
        errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.chunk ? `Chunk ${error.chunk}: ` : ''}${error.error}`);
        });
      }
    }
    
    return { successful, failed, errors, total: totalItems };
  }

  /**
   * Bulk update wrapper with transaction support
   */
  async bulkUpdate(table, updates, options = {}) {
    const { where, set, transaction: existingTransaction } = options;
    
    if (this.dryRun) {
      console.log(`🔍 DRY RUN: Would update ${updates.length} records in ${table}`);
      updates.slice(0, 5).forEach(update => {
        console.log(`  - ${JSON.stringify(update)}`);
      });
      if (updates.length > 5) {
        console.log(`  ... and ${updates.length - 5} more`);
      }
      return { updated: updates.length, dryRun: true };
    }
    
    const dbTransaction = await db.transaction();
    
    try {
      let updated = 0;
      
      for (const update of updates) {
        const result = await db.query(
          `UPDATE "${table}" SET ${Object.keys(update.set).map(key => `"${key}" = :${key}`).join(', ')} WHERE ${where}`,
          {
            replacements: { ...update.set, ...update.where },
            type: Sequelize.QueryTypes.UPDATE,
            transaction: dbTransaction
          }
        );
        updated += result[1];
      }
      
      await dbTransaction.commit();
      return { updated, dryRun: false };
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  /**
   * Bulk insert wrapper with transaction support
   */
  async bulkInsert(table, records, options = {}) {
    if (this.dryRun) {
      console.log(`🔍 DRY RUN: Would insert ${records.length} records into ${table}`);
      records.slice(0, 3).forEach(record => {
        console.log(`  - ${JSON.stringify(record)}`);
      });
      if (records.length > 3) {
        console.log(`  ... and ${records.length - 3} more`);
      }
      return { inserted: records.length, dryRun: true };
    }
    
    const transaction = await db.transaction();
    
    try {
      const columns = Object.keys(records[0]);
      const values = records.map(record => 
        `(${columns.map(col => `'${record[col]}'`).join(', ')})`
      ).join(', ');
      
      const result = await db.query(
        `INSERT INTO "${table}" (${columns.map(col => `"${col}"`).join(', ')}) VALUES ${values}`,
        {
          type: Sequelize.QueryTypes.INSERT,
          transaction
        }
      );
      
      await transaction.commit();
      return { inserted: records.length, dryRun: false };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Query with pagination for large datasets
   */
  async queryWithPagination(query, options = {}) {
    const { pageSize = 1000, offset = 0, limit = null } = options;
    const results = [];
    let currentOffset = offset;
    let totalProcessed = 0;
    
    console.log(`🔍 Querying with pagination (page size: ${pageSize})`);
    
    while (true) {
      const paginatedQuery = `${query} LIMIT ${pageSize} OFFSET ${currentOffset}`;
      const page = await db.query(paginatedQuery, {
        type: Sequelize.QueryTypes.SELECT
      });
      
      if (page.length === 0) break;
      
      results.push(...page);
      totalProcessed += page.length;
      currentOffset += pageSize;
      
      this.log('debug', `📄 Fetched page: ${page.length} records (total: ${totalProcessed})`);
      
      if (limit && totalProcessed >= limit) {
        results.splice(limit);
        break;
      }
    }
    
    console.log(`📊 Query completed: ${totalProcessed.toLocaleString()} records`);
    return results;
  }

  /**
   * Memory-efficient stream processing for very large datasets
   */
  async streamProcess(query, processor, options = {}) {
    const { batchSize = 1000, concurrency = 1 } = options;
    
    console.log(`🌊 Stream processing with batch size: ${batchSize}, concurrency: ${concurrency}`);
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    const errors = [];
    
    // Get total count first
    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as count FROM');
    const countResult = await db.query(countQuery, { type: Sequelize.QueryTypes.SELECT });
    const totalCount = countResult[0].count;
    
    console.log(`📊 Total records to process: ${totalCount.toLocaleString()}`);
    
    for (let offset = 0; offset < totalCount; offset += batchSize) {
      const batchQuery = `${query} LIMIT ${batchSize} OFFSET ${offset}`;
      const batch = await db.query(batchQuery, { type: Sequelize.QueryTypes.SELECT });
      
      try {
        const result = await processor(batch, offset, totalCount);
        successful += result.successful || batch.length;
        failed += result.failed || 0;
        
        if (result.errors) {
          errors.push(...result.errors);
        }
      } catch (error) {
        failed += batch.length;
        errors.push({ offset, error: error.message });
        this.log('error', `❌ Batch ${offset}-${offset + batchSize} failed: ${error.message}`);
      }
      
      processed += batch.length;
      
      if (processed % (batchSize * 10) === 0 || processed === totalCount) {
        const percentage = ((processed / totalCount) * 100).toFixed(1);
        this.log('info', `📊 Progress: ${processed.toLocaleString()}/${totalCount.toLocaleString()} (${percentage}%)`);
      }
    }
    
    console.log(`\n📊 STREAM PROCESSING COMPLETE:`);
    console.log(`✅ Successful: ${successful.toLocaleString()}`);
    console.log(`❌ Failed: ${failed.toLocaleString()}`);
    console.log(`📈 Success Rate: ${((successful / totalCount) * 100).toFixed(1)}%`);
    
    return { successful, failed, errors, total: totalCount };
  }

  /**
   * Performance monitoring wrapper
   */
  async withPerformanceMonitoring(name, operation) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    console.log(`🚀 Starting: ${name}`);
    
    try {
      const result = await operation();
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      const duration = endTime - startTime;
      const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;
      
      console.log(`✅ Completed: ${name}`);
      console.log(`⏱️ Duration: ${duration}ms (${(duration / 1000).toFixed(1)}s)`);
      console.log(`💾 Memory: ${(memoryUsed / 1024 / 1024).toFixed(1)}MB`);
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`❌ Failed: ${name} after ${duration}ms`);
      throw error;
    }
  }

  /**
   * Logging utility with levels
   */
  log(level, message) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.logLevel] || 1;
    const messageLevel = levels[level] || 1;
    
    if (messageLevel >= currentLevel) {
      console.log(message);
    }
  }

  /**
   * Dataset statistics helper
   */
  async getDatasetStats() {
    const stats = {};
    
    // Get table counts
    const tables = ['IngredientCategorized', 'Ingredients', 'RecipeIngredients', 'Users', 'Carts'];
    
    for (const table of tables) {
      try {
        const result = await db.query(`SELECT COUNT(*) as count FROM "${table}"`, {
          type: Sequelize.QueryTypes.SELECT
        });
        stats[table] = result[0].count;
      } catch (error) {
        stats[table] = 'Error';
      }
    }
    
    return stats;
  }

  /**
   * Validation helper for large operations
   */
  async validateOperation(operation, validationRules) {
    console.log(`🔍 Validating operation: ${operation}`);
    
    const results = {};
    
    for (const [rule, query] of Object.entries(validationRules)) {
      try {
        const result = await db.query(query, { type: Sequelize.QueryTypes.SELECT });
        results[rule] = result[0]?.count || 0;
      } catch (error) {
        results[rule] = `Error: ${error.message}`;
      }
    }
    
    console.log('📊 Validation Results:');
    Object.entries(results).forEach(([rule, count]) => {
      console.log(`  ${rule}: ${count}`);
    });
    
    return results;
  }
}

// Export singleton instance and class
const processor = new LargeDatasetProcessor();
module.exports = { LargeDatasetProcessor, processor };

// Export convenience functions
module.exports.processInChunks = (items, processor, options) => 
  processor.processInChunks(items, processor, options);

module.exports.bulkUpdate = (table, updates, options) => 
  processor.bulkUpdate(table, updates, options);

module.exports.bulkInsert = (table, records, options) => 
  processor.bulkInsert(table, records, options);

module.exports.queryWithPagination = (query, options) => 
  processor.queryWithPagination(query, options);

module.exports.streamProcess = (query, processor, options) => 
  processor.streamProcess(query, processor, options);

module.exports.withPerformanceMonitoring = (name, operation) => 
  processor.withPerformanceMonitoring(name, operation);

module.exports.getDatasetStats = () => processor.getDatasetStats();
module.exports.validateOperation = (operation, validationRules) => 
  processor.validateOperation(operation, validationRules); 