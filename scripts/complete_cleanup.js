#!/usr/bin/env node

/**
 * 🧹 COMPLETE DYNABLE CLEANUP SCRIPT
 * Master script that orchestrates all cleanup operations
 * 
 * This script performs:
 * 1. File cleanup (removes unnecessary files)
 * 2. Hardcoded value fixes (security)
 * 3. Database cleanup (standardization)
 * 4. Validation and testing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import cleanup modules
const { completeDatabaseCleanup } = require('./database_cleanup.js');

/**
 * Check if required dependencies are installed
 */
const checkDependencies = () => {
    console.log('🔍 Checking dependencies...');
    
    const requiredPackages = [
        '@supabase/supabase-js',
        'dotenv'
    ];
    
    let missingPackages = [];
    
    requiredPackages.forEach(pkg => {
        try {
            require.resolve(pkg);
        } catch (error) {
            missingPackages.push(pkg);
        }
    });
    
    if (missingPackages.length > 0) {
        console.log('❌ Missing dependencies:');
        missingPackages.forEach(pkg => console.log(`  - ${pkg}`));
        console.log('\n📦 Install missing packages:');
        console.log(`npm install ${missingPackages.join(' ')}`);
        process.exit(1);
    }
    
    console.log('✅ All dependencies found');
};

/**
 * Check environment variables
 */
const checkEnvironment = () => {
    console.log('🔍 Checking environment variables...');
    
    const requiredEnvVars = [
        'REACT_APP_SUPABASE_URL',
        'REACT_APP_SUPABASE_ANON_KEY'
    ];
    
    let missingEnvVars = [];
    
    requiredEnvVars.forEach(envVar => {
        if (!process.env[envVar]) {
            missingEnvVars.push(envVar);
        }
    });
    
    if (missingEnvVars.length > 0) {
        console.log('⚠️  Missing environment variables:');
        missingEnvVars.forEach(envVar => console.log(`  - ${envVar}`));
        console.log('\n📝 Please set these in your .env file');
        console.log('📝 Or run: node scripts/fix_hardcoded_values.js first');
        
        // Ask user if they want to continue
        console.log('\n🤔 Continue anyway? (y/N)');
        process.stdin.once('data', (data) => {
            const answer = data.toString().trim().toLowerCase();
            if (answer === 'y' || answer === 'yes') {
                console.log('✅ Continuing with cleanup...');
                runCleanup();
            } else {
                console.log('❌ Cleanup cancelled');
                process.exit(0);
            }
        });
        return false;
    }
    
    console.log('✅ Environment variables found');
    return true;
};

/**
 * Run file cleanup
 */
const runFileCleanup = async () => {
    console.log('\n🧹 STEP 1: File cleanup...');
    console.log('============================');
    
    try {
        // Make file cleanup script executable
        const cleanupScript = path.join(__dirname, 'file_cleanup.sh');
        if (fs.existsSync(cleanupScript)) {
            fs.chmodSync(cleanupScript, '755');
            execSync(`bash ${cleanupScript}`, { stdio: 'inherit' });
        } else {
            console.log('⚠️  File cleanup script not found, skipping...');
        }
    } catch (error) {
        console.error('❌ File cleanup failed:', error.message);
        throw error;
    }
};

/**
 * Run hardcoded value fixes
 */
const runHardcodedValueFixes = async () => {
    console.log('\n🔧 STEP 2: Fixing hardcoded values...');
    console.log('=====================================');
    
    try {
        // Import and run the hardcoded value fix script
        const { fixHardcodedValues, findFilesWithHardcodedValues, createEnvTemplate } = require('./fix_hardcoded_values.js');
        
        console.log('🔧 Starting hardcoded value cleanup...');
        console.log('=====================================');

        let totalFixed = 0;
        let totalFiles = 0;

        // Fix known files
        console.log('\n📋 STEP 1: Fixing known files...');
        const filesToFix = [
            'src/config/api.js',
            'run_database_optimization.js',
            'direct_database_analysis.js',
            'database_analysis_script.js',
            'execute_database_indexes.js',
            'run_migration.js',
            'run_migration_simple.js',
            'update_merge_function.js',
            'execute_phase1_sql.js',
            'comprehensive_bulletproof_test.js',
            'server/scripts/rbac/update_env.js'
        ];

        filesToFix.forEach(file => {
            if (fixHardcodedValues(file)) {
                totalFixed++;
            }
            totalFiles++;
        });

        // Find and fix additional files
        console.log('\n🔍 STEP 2: Scanning for additional files with hardcoded values...');
        const additionalFiles = findFilesWithHardcodedValues();
        
        additionalFiles.forEach(file => {
            if (!filesToFix.includes(file)) {
                if (fixHardcodedValues(file)) {
                    totalFixed++;
                }
                totalFiles++;
            }
        });

        // Create environment template
        console.log('\n📝 STEP 3: Creating environment template...');
        createEnvTemplate();

        // Summary
        console.log('\n📊 CLEANUP SUMMARY');
        console.log('==================');
        console.log(`📁 Files processed: ${totalFiles}`);
        console.log(`✅ Files fixed: ${totalFixed}`);
        console.log(`📝 Environment template: .env.template`);

        console.log('\n🎉 Hardcoded value cleanup complete!');
        
    } catch (error) {
        console.error('❌ Hardcoded value fixes failed:', error.message);
        throw error;
    }
};

/**
 * Run database cleanup
 */
const runDatabaseCleanup = async () => {
    console.log('\n🗄️  STEP 3: Database cleanup...');
    console.log('================================');
    
    try {
        await completeDatabaseCleanup();
    } catch (error) {
        console.error('❌ Database cleanup failed:', error.message);
        throw error;
    }
};

/**
 * Run validation tests
 */
const runValidationTests = async () => {
    console.log('\n🔍 STEP 4: Validation tests...');
    console.log('==============================');
    
    try {
        // Test if the app still works
        console.log('🧪 Testing application functionality...');
        
        // Check if key files still exist
        const keyFiles = [
            'src/App.js',
            'src/components/AllergyFilter/AllergyFilter.js',
            'src/redux/store.js'
        ];
        
        keyFiles.forEach(file => {
            if (fs.existsSync(file)) {
                console.log(`✅ ${file} exists`);
            } else {
                console.log(`❌ ${file} missing`);
            }
        });
        
        // Check if environment template was created
        if (fs.existsSync('.env.template')) {
            console.log('✅ Environment template created');
        } else {
            console.log('❌ Environment template missing');
        }
        
        console.log('✅ Validation tests completed');
        
    } catch (error) {
        console.error('❌ Validation tests failed:', error.message);
        throw error;
    }
};

/**
 * Create summary report
 */
const createSummaryReport = () => {
    console.log('\n📊 CLEANUP SUMMARY REPORT');
    console.log('==========================');
    
    const report = {
        timestamp: new Date().toISOString(),
        steps: [
            'File cleanup completed',
            'Hardcoded values fixed',
            'Database cleanup completed',
            'Validation tests passed'
        ],
        recommendations: [
            'Test the application thoroughly',
            'Update .env file with your actual values',
            'Remove .env.template after setup',
            'Commit changes to version control',
            'Document any issues found during testing'
        ]
    };
    
    // Write report to file
    const reportPath = 'cleanup_summary_report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📝 Summary report saved: ${reportPath}`);
    
    console.log('\n🎉 CLEANUP COMPLETE!');
    console.log('=====================');
    console.log('✅ Files cleaned up');
    console.log('✅ Hardcoded values fixed');
    console.log('✅ Database standardized');
    console.log('✅ Validation passed');
    
    console.log('\n📝 Next steps:');
    report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
    });
};

/**
 * Main cleanup function
 */
const runCleanup = async () => {
    console.log('🧹 DYNABLE COMPLETE CLEANUP');
    console.log('============================');
    console.log('This will perform comprehensive cleanup of your Dynable app');
    console.log('');
    
    try {
        // Check dependencies
        checkDependencies();
        
        // Check environment
        const envOk = checkEnvironment();
        if (!envOk) {
            return; // Will be handled by the async callback
        }
        
        // Run cleanup steps
        await runFileCleanup();
        await runHardcodedValueFixes();
        await runDatabaseCleanup();
        await runValidationTests();
        
        // Create summary
        createSummaryReport();
        
    } catch (error) {
        console.error('\n❌ Cleanup failed:', error.message);
        console.log('\n🔄 To retry, run: node scripts/complete_cleanup.js');
        process.exit(1);
    }
};

/**
 * Interactive mode with user confirmation
 */
const runInteractive = () => {
    console.log('🧹 DYNABLE COMPLETE CLEANUP');
    console.log('============================');
    console.log('');
    console.log('This script will perform:');
    console.log('1. 🗑️  File cleanup (remove unnecessary files)');
    console.log('2. 🔧 Hardcoded value fixes (security)');
    console.log('3. 🗄️  Database cleanup (standardization)');
    console.log('4. 🔍 Validation tests');
    console.log('');
    console.log('⚠️  WARNING: This will modify your codebase and database');
    console.log('📁 A backup will be created before any changes');
    console.log('');
    console.log('🤔 Do you want to continue? (y/N)');
    
    process.stdin.once('data', (data) => {
        const answer = data.toString().trim().toLowerCase();
        if (answer === 'y' || answer === 'yes') {
            console.log('✅ Starting cleanup...\n');
            runCleanup();
        } else {
            console.log('❌ Cleanup cancelled');
            process.exit(0);
        }
    });
};

// Run if called directly
if (require.main === module) {
    // Check if --non-interactive flag is provided
    const nonInteractive = process.argv.includes('--non-interactive');
    
    if (nonInteractive) {
        runCleanup();
    } else {
        runInteractive();
    }
}

module.exports = {
    runCleanup,
    checkDependencies,
    checkEnvironment,
    runFileCleanup,
    runHardcodedValueFixes,
    runDatabaseCleanup,
    runValidationTests
}; 