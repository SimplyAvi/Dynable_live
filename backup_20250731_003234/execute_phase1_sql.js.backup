// Script to execute Phase 1 SQL for bulletproof allergen system
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://fdojimqdhuqhimgjpdai.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkb2ppbXFkaHVxaGltZ2pwZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzE5NzAsImV4cCI6MjA1MjU0Nzk3MH0.1SkTqkVwaq-NxWsSd6XsxVB44p3vKud4vDAuTjC99-0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executePhase1SQL() {
  console.log('🚀 EXECUTING PHASE 1: BULLETPROOF ALLERGEN DATABASE FOUNDATION');
  console.log('================================================================');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('phase1_allergen_database_foundation_fixed_v2.sql', 'utf8');
    
    // Split into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;
      
      try {
        console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`);
        console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
        
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ Exception: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 EXECUTION SUMMARY:');
    console.log('======================');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📊 Total statements: ${statements.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 PHASE 1 COMPLETED SUCCESSFULLY!');
      console.log('✅ All bulletproof allergen tables and functions created');
    } else {
      console.log('\n⚠️ PHASE 1 COMPLETED WITH ERRORS');
      console.log('Some statements failed - check the logs above');
    }
    
  } catch (error) {
    console.error('❌ Failed to execute Phase 1 SQL:', error);
  }
}

executePhase1SQL(); 