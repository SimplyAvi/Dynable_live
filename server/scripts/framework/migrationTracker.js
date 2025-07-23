const { Sequelize } = require('sequelize');
const db = require('../../db/database');

class MigrationTracker {
  constructor() {
    this.ensureMigrationTable();
  }

  /**
   * Ensure the DataMigrations table exists
   */
  async ensureMigrationTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS "DataMigrations" (
          id SERIAL PRIMARY KEY,
          script_name VARCHAR(255) UNIQUE,
          executed_at TIMESTAMP DEFAULT NOW(),
          status VARCHAR(50) DEFAULT 'completed',
          details JSONB,
          dry_run BOOLEAN DEFAULT false,
          environment VARCHAR(50),
          backup_created BOOLEAN DEFAULT false,
          execution_time_ms INTEGER,
          records_affected INTEGER
        );
      `, { type: Sequelize.QueryTypes.RAW });
    } catch (error) {
      console.error('❌ Failed to create migration table:', error.message);
      throw error;
    }
  }

  /**
   * Check if a script has already been run
   */
  async hasRun(scriptName) {
    try {
      const result = await db.query(
        'SELECT id, executed_at, status, details FROM "DataMigrations" WHERE script_name = :scriptName',
        { 
          replacements: { scriptName }, 
          type: Sequelize.QueryTypes.SELECT 
        }
      );
      
      if (result.length > 0) {
        const migration = result[0];
        console.log(`📋 Migration ${scriptName} already executed:`);
        console.log(`   Date: ${migration.executed_at}`);
        console.log(`   Status: ${migration.status}`);
        if (migration.details) {
          const details = JSON.parse(migration.details);
          console.log(`   Records affected: ${details.recordsAffected || 'unknown'}`);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error checking migration status:', error.message);
      return false;
    }
  }

  /**
   * Mark a script as executed
   */
  async markAsRun(scriptName, details = {}) {
    try {
      const executionTime = details.executionTime || 0;
      const recordsAffected = details.recordsAffected || 0;
      
      await db.query(
        `INSERT INTO "DataMigrations" (
          script_name, 
          details, 
          environment, 
          dry_run, 
          execution_time_ms, 
          records_affected
        ) VALUES (
          :scriptName, 
          :details, 
          :env, 
          :dryRun, 
          :executionTime, 
          :recordsAffected
        )`,
        { 
          replacements: { 
            scriptName, 
            details: JSON.stringify(details),
            env: process.env.NODE_ENV || 'development',
            dryRun: details.dryRun || false,
            executionTime,
            recordsAffected
          },
          type: Sequelize.QueryTypes.INSERT
        }
      );
      
      console.log(`✅ Migration ${scriptName} marked as executed`);
    } catch (error) {
      console.error('❌ Error marking migration as executed:', error.message);
      throw error;
    }
  }

  /**
   * Get migration history
   */
  async getMigrationHistory() {
    try {
      const result = await db.query(
        'SELECT script_name, executed_at, status, environment, dry_run, execution_time_ms, records_affected FROM "DataMigrations" ORDER BY executed_at DESC',
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      console.log('\n📋 Migration History:');
      console.log('=' .repeat(80));
      
      if (result.length === 0) {
        console.log('No migrations have been executed yet.');
        return [];
      }
      
      result.forEach((migration, index) => {
        console.log(`${index + 1}. ${migration.script_name}`);
        console.log(`   Date: ${migration.executed_at}`);
        console.log(`   Status: ${migration.status}`);
        console.log(`   Environment: ${migration.environment}`);
        console.log(`   Dry Run: ${migration.dry_run ? 'Yes' : 'No'}`);
        if (migration.execution_time_ms) {
          console.log(`   Execution Time: ${migration.execution_time_ms}ms`);
        }
        if (migration.records_affected) {
          console.log(`   Records Affected: ${migration.records_affected}`);
        }
        console.log('');
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error getting migration history:', error.message);
      return [];
    }
  }

  /**
   * Get pending migrations (scripts that haven't been run)
   */
  async getPendingMigrations(availableScripts) {
    const pending = [];
    
    for (const script of availableScripts) {
      const hasRun = await this.hasRun(script.name);
      if (!hasRun) {
        pending.push(script);
      }
    }
    
    return pending;
  }

  /**
   * Validate migration readiness
   */
  async validateMigrationReadiness(scriptName, options = {}) {
    const { force = false, dryRun = false } = options;
    
    // Check if already run
    const hasRun = await this.hasRun(scriptName);
    
    if (hasRun && !force) {
      console.log(`⏭️  Migration ${scriptName} already executed. Use --force to run again.`);
      return false;
    }
    
    if (hasRun && force) {
      console.log(`⚠️  Force running ${scriptName} (already executed before)`);
    }
    
    // Environment checks
    if (!process.env.SUPABASE_DB_URL) {
      console.error('❌ SUPABASE_DB_URL environment variable required');
      return false;
    }
    
    if (!dryRun && !process.env.SKIP_BACKUP) {
      console.log('⚠️  BACKUP REQUIRED: Create database backup before proceeding');
      console.log('   Run: pg_dump $SUPABASE_DB_URL > backup_$(date +%Y%m%d_%H%M%S).sql');
      console.log('   Or set SKIP_BACKUP=true to bypass (not recommended)');
      return false;
    }
    
    return true;
  }

  /**
   * Rollback a migration (mark as not executed)
   */
  async rollbackMigration(scriptName) {
    try {
      const result = await db.query(
        'DELETE FROM "DataMigrations" WHERE script_name = :scriptName',
        { 
          replacements: { scriptName }, 
          type: Sequelize.QueryTypes.DELETE 
        }
      );
      
      if (result[1] > 0) {
        console.log(`✅ Migration ${scriptName} rolled back (removed from tracking)`);
        return true;
      } else {
        console.log(`⚠️  Migration ${scriptName} not found in tracking table`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error rolling back migration:', error.message);
      return false;
    }
  }

  /**
   * Get migration statistics
   */
  async getMigrationStats() {
    try {
      const stats = await db.query(`
        SELECT 
          COUNT(*) as total_migrations,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          COUNT(CASE WHEN dry_run = true THEN 1 END) as dry_runs,
          SUM(execution_time_ms) as total_execution_time,
          SUM(records_affected) as total_records_affected
        FROM "DataMigrations"
      `, { type: Sequelize.QueryTypes.SELECT });
      
      const stat = stats[0];
      
      console.log('\n📊 Migration Statistics:');
      console.log('=' .repeat(40));
      console.log(`Total Migrations: ${stat.total_migrations}`);
      console.log(`Completed: ${stat.completed}`);
      console.log(`Failed: ${stat.failed}`);
      console.log(`Dry Runs: ${stat.dry_runs}`);
      console.log(`Total Execution Time: ${stat.total_execution_time || 0}ms`);
      console.log(`Total Records Affected: ${stat.total_records_affected || 0}`);
      
      return stat;
    } catch (error) {
      console.error('❌ Error getting migration stats:', error.message);
      return null;
    }
  }
}

// Export singleton instance and class
const tracker = new MigrationTracker();
module.exports = { MigrationTracker, tracker };

// Export convenience functions
module.exports.hasRun = (scriptName) => tracker.hasRun(scriptName);
module.exports.markAsRun = (scriptName, details) => tracker.markAsRun(scriptName, details);
module.exports.getMigrationHistory = () => tracker.getMigrationHistory();
module.exports.getPendingMigrations = (scripts) => tracker.getPendingMigrations(scripts);
module.exports.validateMigrationReadiness = (scriptName, options) => tracker.validateMigrationReadiness(scriptName, options);
module.exports.rollbackMigration = (scriptName) => tracker.rollbackMigration(scriptName);
module.exports.getMigrationStats = () => tracker.getMigrationStats(); 