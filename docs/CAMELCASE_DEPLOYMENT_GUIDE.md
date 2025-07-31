# 🚀 CAMELCASE BATCH DEPLOYMENT GUIDE

## Overview

This guide covers the comprehensive deployment of the camelCase allergen system to your Dynable database. The deployment processes **243,114+ products** in batches of 1000 to avoid Supabase timeouts.

## 📋 Prerequisites

### Environment Setup
Ensure your `.env` file contains:
```bash
SUPABASE_URL=https://fdojimqdhuqhimgjpdai.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DB_URL=postgresql://postgres:password@db.fdojimqdhuqhimgjpdai.supabase.co:6543/postgres
```

### Required Files
The deployment requires these files to be present:
- `database/rules/categories.sql`
- `database/rules/functions.sql`
- `database/rules/constraints.sql`
- `database/rules/triggers.sql`
- `scripts/deploy_camelcase_batch_processing.js`
- `scripts/deploy_camelcase.sh`

## 🚀 Deployment Process

### Step 1: Quick Deployment (Recommended)
```bash
./scripts/deploy_camelcase.sh
```

This script will:
- ✅ Check all prerequisites
- ✅ Load environment variables
- ✅ Verify required files exist
- ✅ Show deployment information
- ✅ Ask for confirmation
- ✅ Run the full deployment

### Step 2: Manual Deployment (Advanced)
```bash
# Set environment variables
export SUPABASE_URL="https://fdojimqdhuqhimgjpdai.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Run deployment
node scripts/deploy_camelcase_batch_processing.js
```

## 📊 Deployment Details

### Batch Processing
- **Batch Size**: 1000 products per batch
- **Total Batches**: ~244 batches (for 243,114+ products)
- **Estimated Time**: 30-60 minutes
- **Delay Between Batches**: 2 seconds (to avoid overwhelming Supabase)

### Progress Tracking
The deployment shows real-time progress:
```
🔄 Processing batch 15/244 (records 14001-15000)
Batch Progress: 15/244 (6%) [██████████████████████████████████████████████████]
Batch 15/244 complete: 1000 processed, 0 errors
```

### What Gets Deployed

#### 1. Database Schema
- **Categories**: 40+ allergen categories with camelCase names
- **Functions**: Universal camelCase conversion and validation
- **Constraints**: Data quality enforcement rules
- **Triggers**: Automatic data standardization

#### 2. Data Processing
- **Existing Products**: All 243,114+ products processed
- **Allergen Conversion**: `"tree nuts"` → `"treeNuts"`
- **Free-from Cleaning**: Removes contradictions automatically
- **Validation**: Ensures all allergens are camelCase

## 🔄 Rollback Capability

### Automatic Rollback
If the deployment fails, it automatically:
- ✅ Creates a backup before starting
- ✅ Rolls back all changes on failure
- ✅ Restores original allergen data

### Manual Rollback
```bash
# Rollback to previous state
node scripts/deploy_camelcase_batch_processing.js --rollback
```

### Backup Files
Rollback backups are saved to:
```
database/backups/camelcase_rollback_[timestamp].json
```

## 🧪 Testing

### Pre-Deployment Test
```bash
# Test the JavaScript implementation
node scripts/test_camelcase_implementation.js
```

### Post-Deployment Verification
```sql
-- Check if functions are deployed
SELECT standardize_allergen_name('tree nuts');

-- Check if categories are populated
SELECT * FROM "AllergenCategories" LIMIT 10;

-- Check sample products
SELECT id, allergens FROM "IngredientCategorized" 
WHERE allergens IS NOT NULL 
LIMIT 5;
```

## 📈 Expected Results

### Before Deployment
```json
{
  "allergens": ["tree nuts", "gluten free", "bell pepper"]
}
```

### After Deployment
```json
{
  "allergens": ["treeNuts", "glutenFree", "bellPepper"]
}
```

## ⚠️ Important Notes

### Safety Features
- ✅ **Backup Creation**: Automatic backup before processing
- ✅ **Batch Processing**: 1000 products per batch (no timeouts)
- ✅ **Error Handling**: Continues processing even if individual products fail
- ✅ **Progress Tracking**: Real-time progress with percentage
- ✅ **Rollback Capability**: Can restore original state if needed

### Monitoring
- **Watch Progress**: Monitor the progress bar during deployment
- **Check Logs**: Review any error messages
- **Verify Results**: Test a few products after deployment
- **Monitor Performance**: Check if the app works correctly

### Troubleshooting

#### Common Issues

**1. Environment Variables Missing**
```bash
❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required
```
**Solution**: Check your `.env` file and ensure variables are set.

**2. Database Connection Failed**
```bash
❌ Error: Could not connect to database
```
**Solution**: Verify your Supabase credentials and network connection.

**3. Batch Processing Errors**
```bash
⚠️ Error processing product 12345: function not found
```
**Solution**: The database functions may not be deployed. Check the schema deployment step.

#### Recovery Steps

**1. If Deployment Fails Midway**
```bash
# Check the error logs
# Run rollback if needed
node scripts/deploy_camelcase_batch_processing.js --rollback
```

**2. If Some Products Have Errors**
- The deployment continues processing other products
- Check the error log for specific product IDs
- Manually fix problematic products if needed

**3. If Database Functions Are Missing**
```bash
# Manually deploy schema first
psql $DATABASE_URL -f database/rules/functions.sql
```

## 🎯 Success Criteria

The deployment is successful when:

1. ✅ **All 244 batches complete** without critical errors
2. ✅ **Database functions are deployed** and working
3. ✅ **Allergen data is converted** to camelCase format
4. ✅ **Free-from contradictions are cleaned** automatically
5. ✅ **Application works correctly** after deployment

## 📞 Support

If you encounter issues:

1. **Check the logs** for specific error messages
2. **Verify environment variables** are set correctly
3. **Test database connection** manually
4. **Review the backup files** if rollback is needed

## 🚀 Ready to Deploy?

Run the deployment:
```bash
./scripts/deploy_camelcase.sh
```

The script will guide you through the entire process safely! 