#!/bin/bash

# 🚀 Dynable RBAC System Deployment Script
# Author: Justin Linzan
# Date: June 2025

set -e  # Exit on any error

echo "🎉 Welcome to Dynable RBAC System Deployment!"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if file exists
file_exists() {
    [ -f "$1" ]
}

echo ""
print_info "Starting RBAC system deployment..."

# Step 1: Check prerequisites
echo ""
print_info "Step 1: Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

if ! command_exists psql; then
    print_warning "PostgreSQL client (psql) not found. Database migrations will need to be run manually."
fi

print_status "Prerequisites check completed"

# Step 2: Install dependencies
echo ""
print_info "Step 2: Installing dependencies..."

if [ -d "server" ]; then
    cd server
    print_info "Installing server dependencies..."
    npm install @supabase/supabase-js
    npm install
    cd ..
    print_status "Server dependencies installed"
else
    print_error "Server directory not found"
    exit 1
fi

if file_exists "package.json"; then
    print_info "Installing frontend dependencies..."
    npm install
    print_status "Frontend dependencies installed"
else
    print_error "package.json not found in project root"
    exit 1
fi

# Step 3: Check environment variables
echo ""
print_info "Step 3: Checking environment variables..."

if ! file_exists ".env"; then
    print_warning ".env file not found. Creating template..."
    cat > .env << 'EOF'
# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
SUPABASE_DB_URL=postgresql://postgres:JustinAndAvi123!@db.fdojimqdhuqhimgjpdai.supabase.co:6543/postgres
NODE_ENV=development

# =============================================================================
# JWT SECURITY (REQUIRED FOR RBAC)
# =============================================================================
# Generate a secure random string for JWT_SECRET
JWT_SECRET=your_very_secure_jwt_secret_key_here_minimum_32_characters
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here

# =============================================================================
# SUPABASE CONFIGURATION (REQUIRED FOR IDENTITY LINKING)
# =============================================================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_IDENTITY_LINKING_ENABLED=true

# =============================================================================
# GOOGLE OAUTH (EXISTING)
# =============================================================================
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
EOF
    print_warning "Created .env template. Please update with your actual values."
    print_info "See ENVIRONMENT_SETUP.md for detailed instructions."
else
    print_status ".env file found"
fi

# Step 4: Check database migration files
echo ""
print_info "Step 4: Checking database migration files..."

if file_exists "phase1_database_migration.sql"; then
    print_status "Phase 1 migration file found"
else
    print_error "phase1_database_migration.sql not found"
    exit 1
fi

if file_exists "phase2_supabase_rls_policies.sql"; then
    print_status "Phase 2 migration file found"
else
    print_error "phase2_supabase_rls_policies.sql not found"
    exit 1
fi

# Step 5: Run database migrations (if psql is available)
echo ""
print_info "Step 5: Running database migrations..."

if command_exists psql; then
    if [ -n "$SUPABASE_DB_URL" ]; then
        print_info "Running Phase 1 migration..."
        psql "$SUPABASE_DB_URL" -f phase1_database_migration.sql
        print_status "Phase 1 migration completed"
        
        print_info "Running Phase 2 migration..."
        psql "$SUPABASE_DB_URL" -f phase2_supabase_rls_policies.sql
        print_status "Phase 2 migration completed"
    else
        print_warning "SUPABASE_DB_URL not set. Please run migrations manually:"
        echo "  psql \$SUPABASE_DB_URL -f phase1_database_migration.sql"
        echo "  psql \$SUPABASE_DB_URL -f phase2_supabase_rls_policies.sql"
    fi
else
    print_warning "psql not available. Please run migrations manually:"
    echo "  psql \$SUPABASE_DB_URL -f phase1_database_migration.sql"
    echo "  psql \$SUPABASE_DB_URL -f phase2_supabase_rls_policies.sql"
fi

# Step 6: Test server startup
echo ""
print_info "Step 6: Testing server startup..."

# Check if server is already running
if curl -s http://localhost:5001/api/auth/profile >/dev/null 2>&1; then
    print_status "Server is already running on port 5001"
else
    print_info "Starting server..."
    cd server
    npm run dev &
    SERVER_PID=$!
    cd ..
    
    # Wait for server to start
    sleep 5
    
    if curl -s http://localhost:5001/api/auth/profile >/dev/null 2>&1; then
        print_status "Server started successfully"
    else
        print_error "Server failed to start. Check logs for errors."
        exit 1
    fi
fi

# Step 7: Create test environment script
echo ""
print_info "Step 7: Creating test environment script..."

cat > test_environment.js << 'EOF'
console.log('🔧 Testing RBAC Environment...\n');

const required = [
  'SUPABASE_DB_URL',
  'JWT_SECRET',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'REACT_APP_GOOGLE_CLIENT_ID'
];

const optional = [
  'SUPABASE_IDENTITY_LINKING_ENABLED',
  'NODE_ENV'
];

console.log('✅ Required Variables:');
let allRequiredSet = true;
required.forEach(varName => {
  const value = process.env[varName];
  if (value && value !== 'your_very_secure_jwt_secret_key_here_minimum_32_characters') {
    console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`  ❌ ${varName}: MISSING or DEFAULT`);
    allRequiredSet = false;
  }
});

console.log('\n📋 Optional Variables:');
optional.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`);
  } else {
    console.log(`  ⚠️  ${varName}: Not set (optional)`);
  }
});

console.log('\n🎯 Environment Status:');
if (allRequiredSet) {
  console.log('  ✅ All required variables are set!');
} else {
  console.log('  ❌ Some required variables are missing or have default values.');
  console.log('  📖 See ENVIRONMENT_SETUP.md for configuration instructions.');
}

console.log('\n🚀 RBAC System Status:');
console.log('  📋 Documentation: RBAC_DEPLOYMENT_GUIDE.md');
console.log('  ⚡ Quick Start: QUICK_START_DEPLOYMENT.md');
console.log('  🧪 Testing Plan: RBAC_TESTING_PLAN.md');
console.log('  👑 First User: FIRST_USER_SETUP.md');
EOF

print_status "Test environment script created"

# Step 8: Display next steps
echo ""
print_info "Step 8: Deployment Summary"

echo ""
echo "🎉 RBAC System Deployment Complete!"
echo "=================================="
echo ""
echo "✅ What's been completed:"
echo "  • Dependencies installed"
echo "  • Environment template created"
echo "  • Database migration files verified"
echo "  • Server startup tested"
echo "  • Test scripts created"
echo ""
echo "📋 Next Steps:"
echo "  1. Update .env file with your actual values"
echo "  2. Run database migrations (if not done automatically)"
echo "  3. Test the environment: node test_environment.js"
echo "  4. Create first admin user (see FIRST_USER_SETUP.md)"
echo "  5. Run comprehensive tests (see RBAC_TESTING_PLAN.md)"
echo ""
echo "📚 Documentation:"
echo "  • ENVIRONMENT_SETUP.md - Environment configuration"
echo "  • QUICK_START_DEPLOYMENT.md - Quick start guide"
echo "  • RBAC_TESTING_PLAN.md - Comprehensive testing"
echo "  • FIRST_USER_SETUP.md - First admin user setup"
echo "  • RBAC_DEPLOYMENT_GUIDE.md - Complete deployment guide"
echo ""
echo "🚀 Your RBAC system is ready for configuration!"
echo ""

# Run environment test
print_info "Running environment test..."
node test_environment.js

echo ""
print_status "Deployment script completed successfully!"
echo ""
echo "🎯 Ready to configure and test your RBAC system!" 