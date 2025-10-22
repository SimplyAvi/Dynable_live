require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin access
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

console.log('🚀 Phase 0 & Phase 1 Migration Script');
console.log('=====================================\n');
console.log('⚠️  IMPORTANT: This script requires direct database access\n');
console.log('📋 INSTRUCTIONS:\n');
console.log('1. Go to your Supabase Dashboard');
console.log('2. Navigate to: SQL Editor');
console.log('3. Create a new query');
console.log('4. Copy the contents of: database/migrations/phase0_phase1_backup_and_new_schema.sql');
console.log('5. Paste into the SQL Editor');
console.log('6. Click "Run" to execute\n');
console.log('The migration will:');
console.log('  ✅ Create backups of all critical tables');
console.log('  ✅ Create new schema alongside old tables');
console.log('  ✅ NOT affect your running website');
console.log('  ✅ Take approximately 5-10 minutes\n');
console.log('Alternative: Use psql command:');
console.log('  psql "postgresql://..." -f database/migrations/phase0_phase1_backup_and_new_schema.sql\n');
console.log('After running the migration, come back and I will verify it succeeded.\n');

