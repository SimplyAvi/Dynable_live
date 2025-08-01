#!/bin/bash

# Recipe-to-Product Mapping System Deployment
# Author: Justin Linzan
# Date: January 2025

set -e  # Exit on any error

echo "🚀 DEPLOYING RECIPE-TO-PRODUCT MAPPING SYSTEM"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create one with your Supabase credentials."
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Deploy database schema
print_status "Step 1: Deploying database schema..."
if [ -f "database/migrations/create_simple_mapping_tables.sql" ]; then
    print_status "Found mapping tables SQL file"
else
    print_error "Mapping tables SQL file not found"
    exit 1
fi

print_warning "You need to manually run the SQL migration:"
echo "psql -d your_database -f database/migrations/create_simple_mapping_tables.sql"
echo ""
read -p "Press Enter after you've run the SQL migration..."

# Step 2: Run Phase 1 - Product Canonical Mapping
print_status "Step 2: Starting Phase 1 - Product Canonical Mapping"
print_warning "This will process all 243K+ products and may take several hours"
print_warning "The script will run in the background and save progress automatically"
echo ""

read -p "Do you want to start Phase 1 now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting product canonical mapping in background..."
    nohup node scripts/product_canonical_mapping.js > logs/product_mapping.log 2>&1 &
    PRODUCT_PID=$!
    echo $PRODUCT_PID > logs/product_mapping.pid
    print_success "Product mapping started with PID: $PRODUCT_PID"
    print_status "Check progress with: tail -f logs/product_mapping.log"
    print_status "Check status with: ps aux | grep product_canonical_mapping"
else
    print_warning "Skipping Phase 1. You can run it manually later with:"
    echo "nohup node scripts/product_canonical_mapping.js > logs/product_mapping.log 2>&1 &"
fi

# Step 3: Wait for Phase 1 completion (optional)
echo ""
read -p "Do you want to wait for Phase 1 to complete before starting Phase 2? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "logs/product_mapping.pid" ]; then
        PRODUCT_PID=$(cat logs/product_mapping.pid)
        print_status "Waiting for Phase 1 to complete (PID: $PRODUCT_PID)..."
        while kill -0 $PRODUCT_PID 2>/dev/null; do
            echo -n "."
            sleep 30
        done
        print_success "Phase 1 completed!"
    else
        print_warning "No PID file found. Please check if Phase 1 is running."
    fi
fi

# Step 4: Run Phase 2 - Ingredient Canonical Mapping
print_status "Step 3: Starting Phase 2 - Ingredient Canonical Mapping"
print_warning "This requires Phase 1 to be completed first"
echo ""

read -p "Do you want to start Phase 2 now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting ingredient canonical mapping in background..."
    nohup node scripts/ingredient_canonical_mapping.js > logs/ingredient_mapping.log 2>&1 &
    INGREDIENT_PID=$!
    echo $INGREDIENT_PID > logs/ingredient_mapping.pid
    print_success "Ingredient mapping started with PID: $INGREDIENT_PID"
    print_status "Check progress with: tail -f logs/ingredient_mapping.log"
    print_status "Check status with: ps aux | grep ingredient_canonical_mapping"
else
    print_warning "Skipping Phase 2. You can run it manually later with:"
    echo "nohup node scripts/ingredient_canonical_mapping.js > logs/ingredient_mapping.log 2>&1 &"
fi

# Step 5: Test the system
echo ""
read -p "Do you want to test the mapping system performance? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Testing mapping system performance..."
    node scripts/test_recipe_performance.js
else
    print_warning "You can test the system later with:"
    echo "node scripts/test_recipe_performance.js"
fi

# Step 6: Show monitoring commands
echo ""
print_status "DEPLOYMENT COMPLETE!"
echo ""
print_status "Monitoring Commands:"
echo "========================"
echo "Check Phase 1 progress: tail -f logs/product_mapping.log"
echo "Check Phase 2 progress: tail -f logs/ingredient_mapping.log"
echo "Check running processes: ps aux | grep mapping"
echo "Test performance: node scripts/test_recipe_performance.js"
echo ""
print_status "Background Process Management:"
echo "==================================="
echo "Stop Phase 1: kill \$(cat logs/product_mapping.pid)"
echo "Stop Phase 2: kill \$(cat logs/ingredient_mapping.pid)"
echo "Check if running: ps aux | grep -E '(product|ingredient)_canonical_mapping'"
echo ""
print_status "Resume Commands (if interrupted):"
echo "======================================="
echo "Resume Phase 1: node scripts/product_canonical_mapping.js"
echo "Resume Phase 2: node scripts/ingredient_canonical_mapping.js"
echo ""
print_success "Mapping system deployment completed!" 