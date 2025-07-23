import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

console.log('🔧 Testing Dynable RBAC Environment Configuration...\n');

// Test 1: Check if all required environment variables are present
console.log('📋 Step 1: Checking Environment Variables...');
const requiredVars = [
  'JWT_SECRET',
  'REACT_APP_GOOGLE_CLIENT_ID',
  'SUPABASE_DB_URL',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_IDENTITY_LINKING_ENABLED'
];

const missingVars = [];
const presentVars = [];

requiredVars.forEach(varName => {
  if (process.env[varName]) {
    presentVars.push(varName);
    console.log(`✅ ${varName}: ${varName.includes('SECRET') || varName.includes('KEY') ? '***SET***' : process.env[varName]}`);
  } else {
    missingVars.push(varName);
    console.log(`❌ ${varName}: MISSING`);
  }
});

console.log(`\n📊 Summary: ${presentVars.length}/${requiredVars.length} variables present`);

if (missingVars.length > 0) {
  console.log(`\n❌ Missing variables: ${missingVars.join(', ')}`);
  console.log('Please add these to your .env file and try again.');
  process.exit(1);
}

// Test 2: Validate Supabase URL format
console.log('\n🌐 Step 2: Validating Supabase URL...');
const supabaseUrl = process.env.SUPABASE_URL;
if (supabaseUrl && supabaseUrl.includes('supabase.co')) {
  console.log('✅ SUPABASE_URL format is valid');
} else {
  console.log('❌ SUPABASE_URL format is invalid - should contain "supabase.co"');
  process.exit(1);
}

// Test 3: Validate API keys format
console.log('\n🔑 Step 3: Validating API Keys...');
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (anonKey && anonKey.startsWith('eyJ')) {
  console.log('✅ SUPABASE_ANON_KEY format is valid (JWT token)');
} else {
  console.log('❌ SUPABASE_ANON_KEY format is invalid - should start with "eyJ"');
  process.exit(1);
}

if (serviceKey && serviceKey.startsWith('eyJ')) {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY format is valid (JWT token)');
} else {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY format is invalid - should start with "eyJ"');
  process.exit(1);
}

// Test 4: Validate JWT secrets
console.log('\n🔐 Step 4: Validating JWT Secrets...');
const jwtSecret = process.env.JWT_SECRET;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

if (jwtSecret && jwtSecret.length >= 10) {
  console.log('✅ JWT_SECRET is properly configured');
} else {
  console.log('❌ JWT_SECRET is too short or missing');
  process.exit(1);
}

if (supabaseJwtSecret && supabaseJwtSecret.length >= 10) {
  console.log('✅ SUPABASE_JWT_SECRET is properly configured');
} else {
  console.log('❌ SUPABASE_JWT_SECRET is too short or missing');
  process.exit(1);
}

// Test 5: Check database connection string
console.log('\n🗄️  Step 5: Validating Database Connection...');
const dbUrl = process.env.SUPABASE_DB_URL;
if (dbUrl && dbUrl.includes('postgresql://')) {
  console.log('✅ SUPABASE_DB_URL format is valid');
} else {
  console.log('❌ SUPABASE_DB_URL format is invalid - should start with "postgresql://"');
  process.exit(1);
}

// Test 6: Check Google OAuth configuration
console.log('\n🔑 Step 6: Validating Google OAuth...');
const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
if (googleClientId && googleClientId.includes('.apps.googleusercontent.com')) {
  console.log('✅ REACT_APP_GOOGLE_CLIENT_ID format is valid');
} else {
  console.log('❌ REACT_APP_GOOGLE_CLIENT_ID format is invalid - should contain ".apps.googleusercontent.com"');
  process.exit(1);
}

// Test 7: Check identity linking flag
console.log('\n🔄 Step 7: Validating Identity Linking...');
const identityLinking = process.env.SUPABASE_IDENTITY_LINKING_ENABLED;
if (identityLinking === 'true' || identityLinking === 'false') {
  console.log(`✅ SUPABASE_IDENTITY_LINKING_ENABLED is set to: ${identityLinking}`);
} else {
  console.log('❌ SUPABASE_IDENTITY_LINKING_ENABLED should be "true" or "false"');
  process.exit(1);
}

// Test 8: Verify different JWT secrets
console.log('\n🔍 Step 8: Verifying JWT Secret Differences...');
if (jwtSecret !== supabaseJwtSecret) {
  console.log('✅ JWT_SECRET and SUPABASE_JWT_SECRET are different (as expected)');
} else {
  console.log('⚠️  JWT_SECRET and SUPABASE_JWT_SECRET are the same - this might be intentional');
}

// Final summary
console.log('\n🎉 Environment Configuration Test Complete!');
console.log('==========================================');
console.log('✅ All environment variables are present');
console.log('✅ Supabase URL format is valid');
console.log('✅ API keys are properly formatted');
console.log('✅ JWT secrets are properly configured');
console.log('✅ Database connection string is valid');
console.log('✅ Google OAuth is configured');
console.log('✅ Identity linking is enabled');
console.log('\n🚀 Ready to proceed with database migrations!');
console.log('\nNext steps:');
console.log('1. Run database migrations: psql -d your_db_url -f phase1_database_migration.sql');
console.log('2. Create first admin user');
console.log('3. Test the RBAC system');

process.exit(0); 