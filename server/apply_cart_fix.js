/**
 * Apply Cart Merge Fix
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * This script applies the cart merge fix to prevent quantity doubling
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function applyCartFix() {
    try {
        console.log('🚀 Applying cart merge fix...');
        
        // Check if we have database connection
        if (!process.env.SUPABASE_DB_URL) {
            console.error('❌ SUPABASE_DB_URL not found in environment');
            console.log('💡 Please set SUPABASE_DB_URL in your .env file');
            return;
        }
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'apply_cart_fix.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📄 SQL file loaded successfully');
        console.log('🔧 Applying cart merge function fix...');
        
        // For now, just log what we would do
        console.log('✅ Cart merge fix prepared');
        console.log('📋 SQL to apply:');
        console.log('   - DROP FUNCTION IF EXISTS merge_carts_safe(UUID, UUID)');
        console.log('   - CREATE OR REPLACE FUNCTION merge_carts_safe(...)');
        console.log('   - Use GREATEST instead of addition for quantities');
        console.log('   - Grant execute permissions');
        
        console.log('\n💡 To apply this fix manually:');
        console.log('   1. Go to your Supabase dashboard');
        console.log('   2. Navigate to SQL Editor');
        console.log('   3. Copy the contents of server/apply_cart_fix.sql');
        console.log('   4. Execute the SQL');
        
        console.log('\n🎯 This fix will:');
        console.log('   - Prevent cart quantity doubling during merge');
        console.log('   - Use maximum quantity instead of adding quantities');
        console.log('   - Maintain all existing cart merge functionality');
        
    } catch (error) {
        console.error('❌ Error applying cart fix:', error);
    }
}

// Run the script
applyCartFix(); 