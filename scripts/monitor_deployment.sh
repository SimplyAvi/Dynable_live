#!/bin/bash

# 📊 CAMELCASE DEPLOYMENT MONITOR
# Dynable App - Remote Progress Monitoring

set -e

PROGRESS_FILE="database/backups/deployment_progress.json"
LOG_FILE="database/backups/deployment.log"

echo "📊 CAMELCASE DEPLOYMENT MONITOR"
echo "================================"
echo ""

# Function to display progress
show_progress() {
    if [ -f "$PROGRESS_FILE" ]; then
        echo "🔄 DEPLOYMENT IN PROGRESS"
        echo "========================"
        
        # Parse progress data
        local last_batch=$(jq -r '.lastCompletedBatch // 0' "$PROGRESS_FILE" 2>/dev/null || echo "0")
        local total_processed=$(jq -r '.totalProcessed // 0' "$PROGRESS_FILE" 2>/dev/null || echo "0")
        local total_errors=$(jq -r '.totalErrors // 0' "$PROGRESS_FILE" 2>/dev/null || echo "0")
        local timestamp=$(jq -r '.timestamp // "unknown"' "$PROGRESS_FILE" 2>/dev/null || echo "unknown")
        
        # Calculate progress
        local estimated_total=243114
        local current_batch=$((last_batch + 1))
        local estimated_batches=244
        local percentage=$((current_batch * 100 / estimated_batches))
        
        echo "📈 Progress: Batch $current_batch/$estimated_batches ($percentage%)"
        echo "📊 Products processed: $total_processed"
        echo "❌ Total errors: $total_errors"
        echo "🕐 Last update: $timestamp"
        echo ""
        
        # Progress bar
        local filled=$((percentage / 2))
        local empty=$((50 - filled))
        printf "Progress: ["
        printf "%${filled}s" | tr ' ' '█'
        printf "%${empty}s" | tr ' ' '░'
        printf "] $percentage%%\n"
        echo ""
        
        # Show recent errors if any
        if [ "$total_errors" -gt 0 ]; then
            echo "⚠️  Recent errors:"
            jq -r '.errors[-3:] | .[] | "  - Product \(.productId): \(.error)"' "$PROGRESS_FILE" 2>/dev/null || echo "  (Error details not available)"
            echo ""
        fi
        
        # Estimated time remaining
        if [ "$current_batch" -gt 0 ]; then
            local batches_remaining=$((estimated_batches - current_batch))
            local minutes_remaining=$((batches_remaining * 2 / 60))  # 2 seconds per batch
            echo "⏱️  Estimated time remaining: ~${minutes_remaining} minutes"
            echo ""
        fi
        
    else
        echo "ℹ️  No deployment in progress"
        echo "   (No progress file found)"
        echo ""
    fi
}

# Function to show recent logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo "📋 RECENT LOGS"
        echo "=============="
        tail -20 "$LOG_FILE" 2>/dev/null || echo "No log file found"
        echo ""
    else
        echo "📋 No log file found"
        echo ""
    fi
}

# Function to check deployment status
check_status() {
    echo "🔍 DEPLOYMENT STATUS"
    echo "==================="
    
    # Check if deployment is running
    if pgrep -f "deploy_camelcase_batch_processing.js" > /dev/null; then
        echo "✅ Deployment is RUNNING"
        echo ""
        show_progress
    else
        echo "❌ Deployment is NOT RUNNING"
        echo ""
        
        # Check if there's a progress file (interrupted)
        if [ -f "$PROGRESS_FILE" ]; then
            echo "🔄 Deployment was INTERRUPTED"
            echo "   You can resume with: ./scripts/deploy_camelcase.sh"
            echo ""
            show_progress
        else
            echo "ℹ️  No deployment detected"
            echo "   Start deployment with: ./scripts/deploy_camelcase.sh"
            echo ""
        fi
    fi
}

# Function to show help
show_help() {
    echo "📊 CAMELCASE DEPLOYMENT MONITOR"
    echo "================================"
    echo ""
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  status    Show current deployment status (default)"
    echo "  progress  Show detailed progress information"
    echo "  logs      Show recent deployment logs"
    echo "  watch     Continuously monitor deployment (refresh every 10s)"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Show status"
    echo "  $0 progress           # Show progress"
    echo "  $0 watch              # Watch deployment in real-time"
    echo ""
}

# Function to watch deployment continuously
watch_deployment() {
    echo "👀 WATCHING DEPLOYMENT (Press Ctrl+C to stop)"
    echo "============================================="
    echo ""
    
    while true; do
        clear
        echo "📊 CAMELCASE DEPLOYMENT MONITOR - $(date)"
        echo "================================================"
        echo ""
        
        check_status
        show_logs
        
        echo "🔄 Refreshing in 10 seconds... (Press Ctrl+C to stop)"
        sleep 10
    done
}

# Main script logic
case "${1:-status}" in
    "status")
        check_status
        ;;
    "progress")
        show_progress
        ;;
    "logs")
        show_logs
        ;;
    "watch")
        watch_deployment
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "❌ Unknown option: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 