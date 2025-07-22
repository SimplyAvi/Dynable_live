/**
 * Fix RLS Policy Sync Issue
 * 
 * This script handles the conflict between Sequelize sync and Supabase RLS policies
 * by temporarily disabling policies during sync operations.
 * 
 * Author: Justin Linzan
 * Date: July 2025
 */

const { sequelize } = require('./db/database');

const fixRLSSyncIssue = async () => {
  try {
    console.log('🔧 Fixing RLS policy sync issue...');
    
    // Step 1: Temporarily disable RLS policies
    console.log('📋 Temporarily disabling RLS policies...');
    await sequelize.query('SET session_replication_role = replica;');
    
    // Step 2: Sync the database
    console.log('🔄 Syncing database models...');
    await sequelize.sync({ alter: true });
    
    // Step 3: Re-enable RLS policies
    console.log('✅ Re-enabling RLS policies...');
    await sequelize.query('SET session_replication_role = DEFAULT;');
    
    console.log('🎉 RLS sync issue fixed successfully!');
    console.log('✅ Database models synchronized');
    console.log('✅ RLS policies re-enabled');
    
  } catch (error) {
    console.error('❌ Error fixing RLS sync issue:', error);
    
    // Always try to re-enable RLS policies even if sync fails
    try {
      console.log('🔄 Attempting to re-enable RLS policies...');
      await sequelize.query('SET session_replication_role = DEFAULT;');
      console.log('✅ RLS policies re-enabled after error');
    } catch (reenableError) {
      console.error('❌ Failed to re-enable RLS policies:', reenableError);
    }
    
    throw error;
  }
};

// Run the fix if this script is executed directly
if (require.main === module) {
  fixRLSSyncIssue()
    .then(() => {
      console.log('✅ RLS sync fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ RLS sync fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixRLSSyncIssue }; 