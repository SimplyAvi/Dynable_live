const fs = require('fs');
const path = require('path');

// Define file categories
const categories = {
    // KEEP - Core application files
    keep: {
        description: 'Core application files to keep',
        patterns: [
            'server.js',
            'package.json',
            'package-lock.json',
            'cypress.config.js',
            'README.md',
            '.env',
            '.gitignore'
        ]
    },
    
    // KEEP - API and database files
    api: {
        description: 'API routes and database files',
        patterns: [
            'server/api/',
            'server/db/',
            'server/migrations/',
            'server/seed/'
        ]
    },
    
    // KEEP - Phase scripts (important for ongoing development)
    phases: {
        description: 'Phase development scripts to keep',
        patterns: [
            'phase1_',
            'phase2_',
            'phase3_',
            'phase4_',
            'comprehensive_phase',
            'final_',
            'proactive_',
            'smart_'
        ]
    },
    
    // KEEP - Essential test files
    essentialTests: {
        description: 'Essential test files to keep',
        patterns: [
            'test_comprehensive_coverage.js',
            'test_frontend_integration',
            'test_frontend_recipe_display.js',
            'cypress/'
        ]
    },
    
    // DELETE - Debug and temporary files
    debug: {
        description: 'Debug files to delete',
        patterns: [
            'debug_',
            'check_',
            'analyze_',
            'audit_',
            'fix_',
            'add_',
            'map_',
            'cleanup_',
            'quick_',
            'optimize_',
            'investigate_',
            'assess_',
            'continue_',
            'extract_',
            'find_',
            'finish_',
            'force_',
            'implement_',
            'improve_',
            'tag_',
            'update_',
            'verify_',
            'test_',
            'checkWhaler',
            'fixWhaler',
            'test_aaron',
            'test_oat',
            'test_wheat',
            'test_almond',
            'test_specific',
            'test_recipe',
            'test_sugar',
            'test_filtering',
            'test_substitute',
            'test_real',
            'test_whaler',
            'test_pizza',
            'test_cleaning',
            'test_basic',
            'test_canonical',
            'test_batch',
            'test_remaining',
            'test_mapping',
            'test_product',
            'test_ingredient',
            'test_coverage',
            'test_benchmarks',
            'test_olive',
            'test_flour',
            'test_enhanced',
            'test_precise',
            'test_improved'
        ]
    },
    
    // DELETE - Temporary and backup files
    temp: {
        description: 'Temporary and backup files to delete',
        patterns: [
            '.copy',
            '.bak',
            '.tmp',
            '.old',
            '.backup',
            'NO',
            'TODO_',
            'skipped_',
            'unmapped_',
            'confident_',
            'cleanup_report'
        ]
    }
};

function shouldKeepFile(filePath) {
    const fileName = path.basename(filePath);
    const relativePath = filePath.replace('./', '');
    
    // Always keep core files
    for (const pattern of categories.keep.patterns) {
        if (relativePath.includes(pattern) || fileName.includes(pattern)) {
            return { keep: true, category: 'keep', reason: 'Core application file' };
        }
    }
    
    // Keep API and database files
    for (const pattern of categories.api.patterns) {
        if (relativePath.includes(pattern)) {
            return { keep: true, category: 'api', reason: 'API/database file' };
        }
    }
    
    // Keep phase scripts
    for (const pattern of categories.phases.patterns) {
        if (fileName.includes(pattern)) {
            return { keep: true, category: 'phases', reason: 'Phase development script' };
        }
    }
    
    // Keep essential tests
    for (const pattern of categories.essentialTests.patterns) {
        if (fileName.includes(pattern) || relativePath.includes(pattern)) {
            return { keep: true, category: 'essentialTests', reason: 'Essential test file' };
        }
    }
    
    // Delete debug and temporary files
    for (const pattern of categories.debug.patterns) {
        if (fileName.includes(pattern)) {
            return { keep: false, category: 'debug', reason: 'Debug/temporary file' };
        }
    }
    
    for (const pattern of categories.temp.patterns) {
        if (fileName.includes(pattern)) {
            return { keep: false, category: 'temp', reason: 'Temporary/backup file' };
        }
    }
    
    // Default: keep if we're not sure
    return { keep: true, category: 'unknown', reason: 'Uncategorized - keeping for safety' };
}

function scanFiles() {
    const files = [];
    
    function scanDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Skip node_modules and .git
                if (item !== 'node_modules' && item !== '.git' && item !== 'src') {
                    scanDirectory(fullPath);
                }
            } else if (item.endsWith('.js') || item.endsWith('.json') || item.endsWith('.md') || item.endsWith('.txt')) {
                files.push(fullPath);
            }
        }
    }
    
    scanDirectory('.');
    return files;
}

function organizeFiles() {
    console.log('🧹 Project Organization Script\n');
    
    const files = scanFiles();
    console.log(`📁 Found ${files.length} files to analyze\n`);
    
    const results = {
        keep: [],
        delete: [],
        categories: {
            keep: [],
            api: [],
            phases: [],
            essentialTests: [],
            debug: [],
            temp: [],
            unknown: []
        }
    };
    
    for (const file of files) {
        const decision = shouldKeepFile(file);
        const relativePath = file.replace('./', '');
        
        if (decision.keep) {
            results.keep.push({ file: relativePath, category: decision.category, reason: decision.reason });
            if (results.categories[decision.category]) {
                results.categories[decision.category].push(relativePath);
            }
        } else {
            results.delete.push({ file: relativePath, category: decision.category, reason: decision.reason });
        }
    }
    
    // Display results
    console.log('📊 File Analysis Results:\n');
    
    for (const [category, files] of Object.entries(results.categories)) {
        if (files.length > 0) {
            const description = categories[category]?.description || 'Uncategorized files';
            console.log(`${category.toUpperCase()}: ${files.length} files - ${description}`);
        }
    }
    
    console.log(`\n✅ KEEP: ${results.keep.length} files`);
    console.log(`🗑️  DELETE: ${results.delete.length} files`);
    
    // Show files to delete (limit to first 20)
    if (results.delete.length > 0) {
        console.log('\n🗑️  Files to delete (showing first 20):');
        results.delete.slice(0, 20).forEach(({ file, reason }) => {
            console.log(`   - ${file} (${reason})`);
        });
        if (results.delete.length > 20) {
            console.log(`   ... and ${results.delete.length - 20} more files`);
        }
    }
    
    return results;
}

// Run the organization
const results = organizeFiles();

console.log('\n💡 Recommendations:');
console.log('1. Review the files to delete before actually deleting them');
console.log('2. Consider moving phase scripts to a "scripts/" directory');
console.log('3. Keep essential test files for ongoing development');
console.log('4. Archive old debug files if you might need them later');
console.log('5. Consider creating a "docs/" directory for documentation');

module.exports = { results, categories }; 