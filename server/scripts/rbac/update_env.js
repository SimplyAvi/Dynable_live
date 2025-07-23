import fs from 'fs';
import readline from 'readline';

console.log('🔧 Dynable RBAC Environment Setup Helper\n');

// Read existing .env file
let envContent = '';
try {
  envContent = fs.readFileSync('.env', 'utf8');
  console.log('✅ Found existing .env file');
} catch (error) {
  console.log('⚠️  No existing .env file found, creating new one');
}

// Parse existing variables
const existingVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      existingVars[key] = valueParts.join('=');
    }
  }
});

console.log('\n📋 Current .env variables:');
Object.keys(existingVars).forEach(key => {
  console.log(`  ${key}=${existingVars[key]}`);
});

// Define required variables
const requiredVars = {
  'JWT_SECRET': 'your_existing_jwt_secret_here',
  'REACT_APP_GOOGLE_CLIENT_ID': 'your_google_client_id_here',
  'SUPABASE_JWT_SECRET': 'your_supabase_jwt_secret_here',
  'SUPABASE_URL': 'https://fdojimqdhuqhimgjpdai.supabase.co',
  'SUPABASE_ANON_KEY': 'your_supabase_anon_key_here',
  'SUPABASE_SERVICE_ROLE_KEY': 'your_supabase_service_role_key_here',
  'SUPABASE_IDENTITY_LINKING_ENABLED': 'true'
};

console.log('\n🔧 Variables to add/update:');
const missingVars = [];
Object.keys(requiredVars).forEach(key => {
  if (!existingVars[key]) {
    missingVars.push(key);
    console.log(`  ❌ ${key}: MISSING`);
  } else {
    console.log(`  ✅ ${key}: Already set`);
  }
});

if (missingVars.length === 0) {
  console.log('\n🎉 All required variables are already set!');
  console.log('Run: node test_env_setup.js to verify configuration');
  process.exit(0);
}

console.log(`\n📝 You need to add ${missingVars.length} variables to your .env file.`);
console.log('\nPlease update your .env file with the following format:');
console.log('==========================================');

// Show the complete .env format
const allVars = { ...existingVars, ...requiredVars };
console.log('# =============================================================================');
console.log('# EXISTING CONFIGURATION (KEEP THESE)');
console.log('# =============================================================================');
Object.keys(existingVars).forEach(key => {
  console.log(`${key}=${existingVars[key]}`);
});

console.log('\n# =============================================================================');
console.log('# NEW RBAC VARIABLES (ADD THESE)');
console.log('# =============================================================================');
missingVars.forEach(key => {
  console.log(`${key}=${requiredVars[key]}`);
});

console.log('\n==========================================');
console.log('\n📋 Instructions:');
console.log('1. Open your .env file in a text editor');
console.log('2. Add the missing variables above');
console.log('3. Replace the placeholder values with your actual keys');
console.log('4. Save the file');
console.log('5. Run: node test_env_setup.js to verify');

console.log('\n🔑 Key Sources:');
console.log('- JWT_SECRET: Your existing secret (keep the same)');
console.log('- REACT_APP_GOOGLE_CLIENT_ID: From Google Cloud Console');
console.log('- SUPABASE_JWT_SECRET: From Supabase Settings → JWT Settings');
console.log('- SUPABASE_URL: From Supabase Settings → API');
console.log('- SUPABASE_ANON_KEY: From Supabase Settings → API (anon public)');
console.log('- SUPABASE_SERVICE_ROLE_KEY: From Supabase Settings → API (service_role secret)');

process.exit(0); 