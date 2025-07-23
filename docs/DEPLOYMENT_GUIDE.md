# 🚀 DEPLOYMENT GUIDE - DATA QUALITY FIXES

## ⚠️ **CRITICAL: SHARED SUPABASE DATABASE**

This deployment affects the **shared Supabase database** used by multiple developers. **EXTREME CAUTION** required.

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### **1. Environment Verification**
```bash
# Verify you're on the correct environment
echo "Current environment: $NODE_ENV"
echo "Database URL: $SUPABASE_DB_URL"

# Confirm this is the intended database
node -e "
const db = require('./server/db/database');
db.query('SELECT current_database() as db_name', {type: require('sequelize').QueryTypes.SELECT})
.then(result => {
  console.log('Connected to database:', result[0].db_name);
  process.exit(0);
}).catch(console.error);
"
```

### **2. Database Backup (REQUIRED)**
```bash
# Create backup before any changes
pg_dump $SUPABASE_DB_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use Supabase dashboard backup
# Go to Supabase Dashboard → Database → Backups → Create backup
```

### **3. Dry Run Testing**
```bash
# Test all scripts in dry-run mode
NODE_ENV=development DRY_RUN=true node server/scripts/migrations/001_cleanup_invalid_canonicals.js
NODE_ENV=development DRY_RUN=true node server/scripts/migrations/002_fix_canonical_tags.js
```

---

## 🗂️ **SCRIPT ORGANIZATION**

### **New Structure:**
```
server/scripts/
├── migrations/          # One-time scripts (numbered)
│   ├── 001_cleanup_invalid_canonicals.js
│   ├── 002_fix_canonical_tags.js
│   └── README.md
├── utilities/          # Shared utilities
│   ├── largeDatasetUtils.js
│   ├── dataProcessingTemplate.js
│   └── migrationTracker.js
├── monitoring/         # Recurring scripts
│   ├── automatedMonitoring.js
│   ├── validate_canonical_ingredients.js
│   └── README.md
└── README.md          # Main documentation
```

---

## 🔄 **MIGRATION TRACKING SYSTEM**

### **Database Migration Table:**
```sql
CREATE TABLE IF NOT EXISTS "DataMigrations" (
  id SERIAL PRIMARY KEY,
  script_name VARCHAR(255) UNIQUE,
  executed_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'completed',
  details JSONB,
  dry_run BOOLEAN DEFAULT false,
  environment VARCHAR(50),
  backup_created BOOLEAN DEFAULT false
);
```

### **Migration Tracker Utility:**
```javascript
// server/scripts/utilities/migrationTracker.js
class MigrationTracker {
  async hasRun(scriptName) {
    const result = await db.query(
      'SELECT id FROM "DataMigrations" WHERE script_name = :scriptName',
      { replacements: { scriptName }, type: Sequelize.QueryTypes.SELECT }
    );
    return result.length > 0;
  }
  
  async markAsRun(scriptName, details = {}) {
    await db.query(
      'INSERT INTO "DataMigrations" (script_name, details, environment) VALUES (:scriptName, :details, :env)',
      { 
        replacements: { 
          scriptName, 
          details: JSON.stringify(details),
          env: process.env.NODE_ENV || 'development'
        },
        type: Sequelize.QueryTypes.INSERT
      }
    );
  }
}
```

---

## 🚀 **DEPLOYMENT SCRIPT**

### **Master Deployment Script:**
```javascript
// deploy_data_fixes.js
const { MigrationTracker } = require('./server/scripts/utilities/migrationTracker');
const { withPerformanceMonitoring } = require('./server/scripts/utilities/largeDatasetUtils');

const MIGRATIONS = [
  {
    name: '001_cleanup_invalid_canonicals.js',
    description: 'Clean up invalid canonical ingredients',
    critical: true,
    requiresBackup: true
  },
  {
    name: '002_fix_canonical_tags.js',
    description: 'Fix canonical tags with word boundary matching',
    critical: true,
    requiresBackup: true
  }
];

async function deployDataFixes(options = {}) {
  const { dryRun = false, force = false, skipBackup = false } = options;
  const tracker = new MigrationTracker();
  
  console.log('🚀 Starting data fixes deployment...');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Force: ${force}`);
  console.log(`Skip Backup: ${skipBackup}`);
  
  // Environment checks
  if (!process.env.SUPABASE_DB_URL) {
    throw new Error('SUPABASE_DB_URL environment variable required');
  }
  
  if (!dryRun && !skipBackup) {
    console.log('⚠️  BACKUP REQUIRED: Create database backup before proceeding');
    console.log('   Run: pg_dump $SUPABASE_DB_URL > backup_$(date +%Y%m%d_%H%M%S).sql');
    console.log('   Or use Supabase dashboard backup');
    process.exit(1);
  }
  
  for (const migration of MIGRATIONS) {
    const hasRun = await tracker.hasRun(migration.name);
    
    if (hasRun && !force) {
      console.log(`⏭️  Skipping ${migration.name} (already executed)`);
      continue;
    }
    
    console.log(`\n🔄 Executing: ${migration.name}`);
    console.log(`   Description: ${migration.description}`);
    console.log(`   Critical: ${migration.critical}`);
    
    try {
      await withPerformanceMonitoring(migration.name, async () => {
        const script = require(`./server/scripts/migrations/${migration.name}`);
        await script.run({ dryRun, force });
        
        if (!dryRun) {
          await tracker.markAsRun(migration.name, {
            description: migration.description,
            critical: migration.critical,
            dryRun: false
          });
        }
      });
      
      console.log(`✅ ${migration.name} completed successfully`);
    } catch (error) {
      console.error(`❌ ${migration.name} failed:`, error.message);
      if (migration.critical) {
        console.error('🚨 Critical migration failed. Deployment stopped.');
        process.exit(1);
      }
    }
  }
  
  console.log('\n🎉 Deployment completed successfully!');
}
```

---

## 📋 **EXECUTION ORDER**

### **1. Pre-Deployment (REQUIRED)**
```bash
# 1. Verify environment
echo $NODE_ENV
echo $SUPABASE_DB_URL

# 2. Create backup
pg_dump $SUPABASE_DB_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Dry run test
NODE_ENV=development DRY_RUN=true node deploy_data_fixes.js
```

### **2. Live Deployment**
```bash
# 1. Run deployment script
NODE_ENV=production node deploy_data_fixes.js

# 2. Verify results
node server/scripts/monitoring/validate_canonical_ingredients.js
node server/scripts/monitoring/automatedMonitoring.js
```

### **3. Post-Deployment**
```bash
# 1. Set up monitoring (optional)
# Add to crontab for daily monitoring
0 2 * * * cd /path/to/dynable_new && node server/scripts/monitoring/automatedMonitoring.js

# 2. Verify no issues
node server/scripts/monitoring/automatedMonitoring.js
```

---

## 🔄 **ROLLBACK PROCEDURES**

### **If Issues Occur:**
```bash
# 1. Stop any running scripts
# 2. Restore from backup
psql $SUPABASE_DB_URL < backup_YYYYMMDD_HHMMSS.sql

# 3. Clear migration tracking
psql $SUPABASE_DB_URL -c "DELETE FROM \"DataMigrations\" WHERE script_name LIKE '001_%' OR script_name LIKE '002_%';"

# 4. Verify rollback
node server/scripts/monitoring/validate_canonical_ingredients.js
```

---

## 📊 **WHAT EACH SCRIPT DOES**

### **001_cleanup_invalid_canonicals.js**
- **Purpose:** Remove invalid canonical ingredients
- **Changes:** Deletes 10 invalid canonicals, remaps 4 aliases
- **Risk:** Medium (deletes data)
- **Rollback:** Restore from backup

### **002_fix_canonical_tags.js**
- **Purpose:** Fix substring matching bug
- **Changes:** Updates 511 products with proper tags
- **Risk:** Low (updates only)
- **Rollback:** Restore from backup

### **automatedMonitoring.js**
- **Purpose:** Ongoing data quality monitoring
- **Changes:** None (read-only)
- **Risk:** None
- **Rollback:** Not needed

---

## ⚠️ **SAFETY MEASURES**

### **1. Environment Checks**
- Verify correct database connection
- Confirm environment variables
- Check for existing backups

### **2. Dry Run Mode**
- All scripts support `--dry-run` flag
- Shows what would be changed without making changes
- Required before live deployment

### **3. Migration Tracking**
- Prevents duplicate execution
- Tracks what has been run
- Provides audit trail

### **4. Backup Requirements**
- Database backup required before deployment
- Backup verification step
- Rollback procedures documented

---

## 🎯 **DEPLOYMENT COMMANDS**

### **Safe Deployment:**
```bash
# 1. Pre-deployment checks
node -e "console.log('Environment:', process.env.NODE_ENV); console.log('Database:', process.env.SUPABASE_DB_URL ? 'Set' : 'Missing');"

# 2. Create backup
pg_dump $SUPABASE_DB_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Dry run
NODE_ENV=development DRY_RUN=true node deploy_data_fixes.js

# 4. Live deployment
NODE_ENV=production node deploy_data_fixes.js

# 5. Verify
node server/scripts/monitoring/automatedMonitoring.js
```

### **Emergency Rollback:**
```bash
# Restore from backup
psql $SUPABASE_DB_URL < backup_YYYYMMDD_HHMMSS.sql

# Clear migration tracking
psql $SUPABASE_DB_URL -c "DELETE FROM \"DataMigrations\" WHERE script_name LIKE '001_%' OR script_name LIKE '002_%';"
```

---

## 📞 **SUPPORT**

If issues occur during deployment:
1. **Stop all scripts immediately**
2. **Restore from backup**
3. **Check logs for errors**
4. **Contact the development team**

**Remember: This affects a shared database. Proceed with extreme caution!** 