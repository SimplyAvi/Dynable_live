#!/usr/bin/env node

/**
 * 🔧 HARDCODED VALUE FIX SCRIPT
 * Dynable App - Security & Configuration Cleanup
 * 
 * This script replaces hardcoded values with environment variables:
 * 1. Supabase URLs and keys
 * 2. Port numbers
 * 3. API endpoints
 * 4. Database connection strings
 */

const fs = require('fs');
const path = require('path');

// Files that need hardcoded value fixes
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

// Hardcoded values to replace
const replacements = [
    {
        pattern: /https:\/\/fdojimqdhuqhimgjpdai\.supabase\.co/g,
        replacement: 'process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL',
        description: 'Supabase URL'
    },
    {
        pattern: /process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY'"]*/g,
        replacement: 'process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY',
        description: 'Supabase Anon Key'
    },
    {
        pattern: /const PORT = process.env.PORT || 5001/g,
        replacement: 'const PORT = process.env.PORT || 5001',
        description: 'Port number'
    },
    {
        pattern: /const PORT = process.env.PORT || 3000/g,
        replacement: 'const PORT = process.env.PORT || 3000',
        description: 'Port number (3000)'
    },
    {
        pattern: /process.env.API_URL || 'process.env.API_URL || 'localhost:5001''/g,
        replacement: 'process.env.API_URL || \'process.env.API_URL || 'process.env.API_URL || 'localhost:5001''\'',
        description: 'API URL'
    },
    {
        pattern: /process.env.FRONTEND_URL || 'process.env.FRONTEND_URL || 'localhost:3000''/g,
        replacement: 'process.env.FRONTEND_URL || \'process.env.FRONTEND_URL || 'process.env.FRONTEND_URL || 'localhost:3000''\'',
        description: 'Frontend URL'
    }
];

/**
 * Fix hardcoded values in a file
 */
const fixHardcodedValues = (filePath) => {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return false;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        console.log(`🔧 Fixing hardcoded values in: ${filePath}`);

        replacements.forEach(({ pattern, replacement, description }) => {
            if (pattern.test(content)) {
                const matches = content.match(pattern);
                if (matches) {
                    console.log(`  ✅ Replacing ${description}: ${matches.length} occurrences`);
                    content = content.replace(pattern, replacement);
                    modified = true;
                }
            }
        });

        if (modified) {
            // Create backup
            const backupPath = `${filePath}.backup`;
            fs.writeFileSync(backupPath, fs.readFileSync(filePath));
            console.log(`  📁 Backup created: ${backupPath}`);

            // Write updated content
            fs.writeFileSync(filePath, content);
            console.log(`  ✅ File updated: ${filePath}`);
            return true;
        } else {
            console.log(`  ℹ️  No hardcoded values found in: ${filePath}`);
            return false;
        }

    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
};

/**
 * Find all JavaScript files with hardcoded values
 */
const findFilesWithHardcodedValues = () => {
    const files = [];
    
    const searchDirectories = [
        'src',
        'server',
        'scripts',
        '.'
    ];

    searchDirectories.forEach(dir => {
        if (fs.existsSync(dir)) {
            const jsFiles = findJsFiles(dir);
            jsFiles.forEach(file => {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    const hasHardcodedValues = replacements.some(({ pattern }) => pattern.test(content));
                    if (hasHardcodedValues) {
                        files.push(file);
                    }
                } catch (error) {
                    // Skip files that can't be read
                }
            });
        }
    });

    return files;
};

/**
 * Recursively find JavaScript files
 */
const findJsFiles = (dir) => {
    const files = [];
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            files.push(...findJsFiles(fullPath));
        } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
            files.push(fullPath);
        }
    });
    
    return files;
};

/**
 * Create .env template
 */
const createEnvTemplate = () => {
    const envTemplate = `# Dynable App Environment Variables
# Copy this file to .env and fill in your values

# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Server Configuration
PORT=5001
NODE_ENV=development

# API Configuration
API_URL=http://process.env.API_URL || 'process.env.API_URL || 'localhost:5001''
FRONTEND_URL=http://process.env.FRONTEND_URL || 'process.env.FRONTEND_URL || 'localhost:3000''

# Database Configuration (if needed)
DATABASE_URL=your_database_url_here

# Optional: Additional configuration
LOG_LEVEL=info
ENABLE_DEBUG=false
`;

    fs.writeFileSync('.env.template', envTemplate);
    console.log('📝 Created .env.template file');
};

/**
 * Main function
 */
const main = () => {
    console.log('🔧 Starting hardcoded value cleanup...');
    console.log('=====================================');

    let totalFixed = 0;
    let totalFiles = 0;

    // Fix known files
    console.log('\n📋 STEP 1: Fixing known files...');
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
    console.log('====================================');
    console.log('📝 Next steps:');
    console.log('1. Copy .env.template to .env');
    console.log('2. Fill in your actual values in .env');
    console.log('3. Test the application');
    console.log('4. Delete .env.template after setup');
    console.log('5. Add .env to .gitignore if not already there');
};

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    fixHardcodedValues,
    findFilesWithHardcodedValues,
    createEnvTemplate
}; 