# 🔧 MANUAL SCHEMA DEPLOYMENT GUIDE

## 🚨 **CRITICAL ISSUE RESOLUTION**

The automatic deployment failed because Supabase doesn't have an `exec_sql` RPC function. We need to deploy the database schema manually first, then run the batch processing.

## 📋 **STEP 1: DEPLOY DATABASE SCHEMA MANUALLY**

### **Option A: Using Supabase Dashboard (Recommended)**

1. **Go to your Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/fdojimqdhuqhimgjpdai
   - Navigate to **SQL Editor**

2. **Deploy Categories**
   ```sql
   -- Copy and paste the contents of database/rules/categories.sql
   -- Execute the SQL in the Supabase SQL Editor
   ```

3. **Deploy Functions**
   ```sql
   -- Copy and paste the contents of database/rules/functions.sql
   -- Execute the SQL in the Supabase SQL Editor
   ```

4. **Deploy Constraints**
   ```sql
   -- Copy and paste the contents of database/rules/constraints.sql
   -- Execute the SQL in the Supabase SQL Editor
   ```

5. **Deploy Triggers**
   ```sql
   -- Copy and paste the contents of database/rules/triggers.sql
   -- Execute the SQL in the Supabase SQL Editor
   ```

### **Option B: Using psql (Alternative)**

```bash
# Connect to your Supabase database
psql "postgresql://postgres:JustinAndAvi123!@db.fdojimqdhuqhimgjpdai.supabase.co:6543/postgres"

# Execute the SQL files
\i database/rules/categories.sql
\i database/rules/functions.sql
\i database/rules/constraints.sql
\i database/rules/triggers.sql
```

## 🧪 **STEP 2: VERIFY SCHEMA DEPLOYMENT**

After deploying the schema, test if the functions work:

```sql
-- Test the camelCase conversion function
SELECT standardize_allergen_name('tree nuts');

-- Should return: 'treeNuts'

-- Test the array conversion function
SELECT standardize_allergen_array(ARRAY['tree nuts', 'gluten free']);

-- Should return: ['treeNuts', 'glutenFree']
```

## 🚀 **STEP 3: RUN BATCH PROCESSING**

Once the schema is deployed, run the batch processing:

```bash
# Run the batch processing (schema deployment will be skipped)
./scripts/deploy_camelcase.sh
```

## 📊 **STEP 4: MONITOR PROGRESS**

```bash
# Monitor the deployment
./scripts/monitor_deployment.sh watch
```

## 🔄 **ALTERNATIVE: QUICK FIX SCRIPT**

If you want to try a different approach, I can create a script that:

1. **Uses JavaScript to convert allergens** instead of database functions
2. **Processes batches without database functions**
3. **Still provides all the safety features**

Would you like me to create this alternative approach?

## 📋 **NEXT STEPS**

1. **Deploy the schema manually** using the Supabase dashboard
2. **Test the functions** to ensure they work
3. **Run the batch processing** again
4. **Monitor the progress** with the monitoring script

The batch processing script will work perfectly once the database functions are properly deployed! 