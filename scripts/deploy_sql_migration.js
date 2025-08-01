/**
 * Deploy SQL Migration to Supabase
 * Author: Justin Linzan
 * Date: January 2025
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Deploy SQL migration using Supabase
 */
async function deploySQLMigration() {
    console.log('🚀 Deploying SQL Migration to Supabase');
    console.log('=======================================\n');
    
    try {
        // Read the SQL file
        const sqlFilePath = path.join(__dirname, '..', 'database', 'migrations', 'create_simple_mapping_tables.sql');
        
        if (!fs.existsSync(sqlFilePath)) {
            console.error('❌ SQL migration file not found:', sqlFilePath);
            return false;
        }
        
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        console.log('📄 SQL migration file loaded');
        
        // Split SQL into individual statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📊 Found ${statements.length} SQL statements to execute`);
        
        let successCount = 0;
        let errorCount = 0;
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            if (!statement.trim()) continue;
            
            try {
                console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`);
                
                // Use Supabase's rpc to execute SQL (if available)
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql_query: statement
                });
                
                if (error) {
                    // Fallback: try direct SQL execution
                    console.log('⚠️ RPC method failed, trying alternative approach...');
                    
                    // For now, we'll just log the statement and ask user to run manually
                    console.log('📝 Please run this SQL statement manually in your Supabase SQL editor:');
                    console.log('---');
                    console.log(statement);
                    console.log('---');
                    
                    errorCount++;
                } else {
                    console.log('✅ Statement executed successfully');
                    successCount++;
                }
                
            } catch (error) {
                console.error(`❌ Error executing statement ${i + 1}:`, error.message);
                errorCount++;
            }
        }
        
        console.log('\n📊 DEPLOYMENT SUMMARY');
        console.log('=====================');
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        
        if (errorCount > 0) {
            console.log('\n⚠️ Some statements failed. Please run them manually in your Supabase SQL editor.');
            console.log('You can copy the SQL from: database/migrations/create_simple_mapping_tables.sql');
        } else {
            console.log('\n🎉 SQL migration deployed successfully!');
        }
        
        return errorCount === 0;
        
    } catch (error) {
        console.error('❌ Error deploying SQL migration:', error);
        return false;
    }
}

/**
 * Alternative: Provide manual instructions
 */
function showManualInstructions() {
    console.log('\n📋 MANUAL DEPLOYMENT INSTRUCTIONS');
    console.log('==================================');
    console.log('Since automatic deployment may not work, please follow these steps:');
    console.log('');
    console.log('1. Open your Supabase dashboard');
    console.log('2. Go to the SQL Editor');
    console.log('3. Copy the contents of: database/migrations/create_simple_mapping_tables.sql');
    console.log('4. Paste and execute the SQL');
    console.log('5. Verify the tables were created');
    console.log('');
    console.log('After running the SQL, you can test with:');
    console.log('node scripts/product_canonical_mapping.js');
}

// Run if called directly
if (require.main === module) {
    deploySQLMigration().then(success => {
        if (!success) {
            showManualInstructions();
        }
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Script failed:', error);
        showManualInstructions();
        process.exit(1);
    });
}

module.exports = {
    deploySQLMigration,
    showManualInstructions
}; 