/**
 * Environment File Setup Helper
 * 
 * This script helps SimplyAvi create the proper .env files
 * with the correct structure and placeholder values.
 * 
 * Author: Justin Linzan
 * Date: July 2025
 */

const fs = require('fs');
const path = require('path');

const setupEnvFiles = () => {
  console.log('🔧 ENVIRONMENT FILE SETUP HELPER\n');
  console.log('Creating .env files with proper structure...\n');

  try {
    // Get current directory
    const currentDir = process.cwd();
    const projectRoot = path.join(currentDir, '..');
    
    console.log('📁 Current directory:', currentDir);
    console.log('📁 Project root:', projectRoot);
    console.log('');

    // Create root .env file
    const rootEnvPath = path.join(projectRoot, '.env');
    const rootEnvContent = `# =============================================================================
# ROOT .env FILE - Frontend Configuration
# =============================================================================

# Development environment
NODE_ENV=development

# Frontend API URL (should point to your backend)
REACT_APP_API_URL=http://localhost:5001

# Supabase configuration for frontend
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google OAuth (if using Google login)
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# =============================================================================
# INSTRUCTIONS:
# 1. Replace 'your-project-id' with your actual Supabase project ID
# 2. Replace 'your_supabase_anon_key_here' with your actual anon key
# 3. Replace 'your_google_client_id_here' with your Google OAuth client ID
# =============================================================================
`;

    // Create server .env file
    const serverEnvPath = path.join(currentDir, '.env');
    const serverEnvContent = `# =============================================================================
# SERVER .env FILE - Backend Configuration
# =============================================================================

# Development environment
NODE_ENV=development

# Supabase database connection (CRITICAL - get this from Supabase dashboard)
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres

# Supabase configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# JWT secrets (can be any long random string)
SUPABASE_JWT_SECRET=your_jwt_secret_here_make_it_long_and_random
JWT_SECRET=your_jwt_secret_here_make_it_long_and_random

# Supabase identity linking
SUPABASE_IDENTITY_LINKING_ENABLED=true

# Google OAuth (if using Google login)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# =============================================================================
# INSTRUCTIONS:
# 1. Replace 'your-project-id' with your actual Supabase project ID
# 2. Replace 'your_supabase_anon_key_here' with your actual anon key
# 3. Replace 'your_supabase_service_role_key_here' with your service role key
# 4. Replace '[YOUR-PASSWORD]' with your database password
# 5. Replace '[YOUR-PROJECT-ID]' with your project ID in the database URL
# 6. Replace JWT secrets with long random strings
# =============================================================================
`;

    // Write the files
    fs.writeFileSync(rootEnvPath, rootEnvContent);
    fs.writeFileSync(serverEnvPath, serverEnvContent);

    console.log('✅ Created root .env file:', rootEnvPath);
    console.log('✅ Created server .env file:', serverEnvPath);
    console.log('');

    console.log('📋 NEXT STEPS:');
    console.log('1. Open both .env files in a text editor');
    console.log('2. Replace the placeholder values with your actual Supabase credentials');
    console.log('3. Save the files');
    console.log('4. Restart your services');
    console.log('');

    console.log('🔍 WHERE TO GET YOUR SUPABASE CREDENTIALS:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Settings > API');
    console.log('4. Copy the values from there');
    console.log('');

    console.log('🚀 AFTER UPDATING .env FILES:');
    console.log('cd /Users/justinlinzan/dynable_new/server && npm run dev');
    console.log('# In new terminal:');
    console.log('cd /Users/justinlinzan/dynable_new && npm start');
    console.log('');

    console.log('✅ Environment files are ready for you to fill in!');

  } catch (error) {
    console.error('❌ Failed to create .env files:', error.message);
  }
};

// Run the setup
setupEnvFiles(); 